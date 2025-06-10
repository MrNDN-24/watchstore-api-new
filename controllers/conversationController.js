const Conversation = require("../models/Conversation");
const SupportQueue = require("../models/SupportQueue");
const Activity = require("../models/Activity");
const User = require("../models/User");
const createConversation = async (req, res) => {
  try {
    const { customerId } = req.body;
    console.log("Received customerId:", customerId);

    // Tạo conversation mới với status = "waiting"
    const conversation = await Conversation.create({
      customerId,
      status: "waiting",
    });

    // Thêm khách hàng vào hàng chờ
    await SupportQueue.create({ customerId });

    // Lấy danh sách hàng chờ mới nhất
    const currentQueue = await SupportQueue.find();
    const io = req.app.get("io");
    io.emit("supportQueueUpdated", currentQueue);

    // Lấy tên khách hàng (nếu muốn hiển thị tên trong mô tả)
    let customerName = "Khách hàng";
    if (customerId) {
      const user = await User.findById(customerId);
      if (user) {
        customerName = user.name || user.username || "Khách hàng";
      }
    }

    // Tạo activity ghi nhận
    await Activity.create({
      userId: customerId,
      activityType: "create_conversation",
      targetModel: "Conversation",
      description: `${customerName} đã tạo cuộc trò chuyện và được thêm vào hàng chờ hỗ trợ.`,
    });

    // 👉 Log trước khi trả response
    console.log("🔄 Created conversation:", conversation);
    console.log("✅ conversationId:", conversation._id);

    res.status(201).json({
      message: "Conversation created, customer added to support queue",
      conversation,
      conversationId: conversation._id,
      status: conversation.status,
    });
  } catch (error) {
    console.error("Create conversation error detail:", error);
    res.status(500).json({ error: error.message });
  }
};
const assignStaff = async (req, res) => {
  try {
    const { conversationId, staffId } = req.body;

    // Cập nhật conversation: gán staffId, đổi status thành "active"
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { staffId, status: "active" },
      { new: true }
    )
      .populate("customerId", "name email") // Thêm dòng này
      .populate("staffId", "name"); // Thêm dòng này

    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    // Xóa khách hàng ra khỏi hàng chờ khi đã có nhân viên nhận
    await SupportQueue.deleteOne({ customerId: conversation.customerId });

    // === GỬI SOCKET TỚI KHÁCH HÀNG ===
    const io = req.app.get("io"); // Socket.IO instance
    if (!io) {
      console.error("Socket.IO instance not found!");
    }
    const customerId = conversation.customerId._id.toString();
    console.log(`Emit support:assigned to ${customerId}`);

    io.to(customerId).emit("support:assigned", {
      message: "Nhân viên đã vào phòng hỗ trợ!",
      conversation,
      staffId: staffId,
    });

    res.json({
      message: "Staff assigned, conversation is active",
      conversation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const removeFromQueue = async (req, res) => {
  try {
    const { customerId } = req.params;

    const isAdminOrSalesperson = ["admin", "salesperson"].includes(req.user.role);
    const isOwner = req.user._id.toString() === customerId;

    if (!isAdminOrSalesperson && !isOwner) {
      return res.status(403).json({
        message: "Bạn không có quyền xoá khách hàng này khỏi hàng chờ",
      });
    }

    const removed = await SupportQueue.findOneAndDelete({ customerId });

    if (!removed) {
      return res.status(404).json({ message: "Không tìm thấy khách trong hàng chờ" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("supportQueueUpdated"); // Gửi thông báo cập nhật hàng chờ
    }

    // Đóng cuộc trò chuyện nếu đang "waiting"
    const conversation = await Conversation.findOneAndUpdate(
      { customerId, status: "waiting" },
      { status: "closed", isResolved: false },
      { new: true }
    );

    if (conversation && io) {
      const customerSocketId = customerId.toString();
      console.log(`Emit conversation:closed:leftQueue to ${customerSocketId}`);
      io.to(customerSocketId).emit("conversation:closed:leftQueue", {
        message: "Cuộc trò chuyện đã bị đóng do bạn rời khỏi hàng chờ.",
        conversation,
      });
    }

    res.json({ message: "Đã xoá khách khỏi hàng chờ hỗ trợ" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const closeConversation = async (req, res) => {
  try {
    const { conversationId, isResolved } = req.body;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { status: "closed", isResolved: isResolved ?? false },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const io = req.app.get("io");
    if (!io) {
      console.error("Socket.IO instance not found!");
    }

    if (io) {
      const customerId = conversation.customerId._id.toString();
      console.log(`Emit conversation:closed:manual to ${customerId}`);
      io.to(customerId).emit("conversation:closed:manual", {
        message: "Cuộc trò chuyện đã được đóng.",
        conversation,
      });
    }

    res.json({ message: "Conversation closed", conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createConversation, assignStaff, closeConversation };
