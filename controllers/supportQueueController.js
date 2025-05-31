const SupportQueue = require("../models/SupportQueue");
const Conversation = require("../models/Conversation");

const getSupportQueue = async (req, res) => {
  try {
    // Lấy danh sách hàng chờ
       const queue = await SupportQueue.find()
      .populate({
        path: 'customerId',
        select: 'name email' // Chọn các trường bạn muốn lấy
      })
      .lean();

    // Với mỗi mục trong hàng chờ, tìm conversation tương ứng theo customerId đang ở trạng thái 'waiting' hoặc 'active'
    const queueWithConversation = await Promise.all(
      queue.map(async (item) => {
        const conversation = await Conversation.findOne({
          customerId: item.customerId,
          status: { $in: ["waiting", "active"] },
        }).lean();

        return {
          ...item,
          conversationId: conversation ? conversation._id.toString() : null,
        };
      })
    );

    res.json({ queue: queueWithConversation });
  } catch (error) {
    console.error("Error fetching support queue:", error);
    res.status(500).json({ error: error.message });
  }
};

const removeFromQueue = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Chỉ cho phép nếu là admin, salesperson, hoặc chính chủ
    const isAdminOrSalesperson = ["admin", "salesperson"].includes(
      req.user.role
    );
    const isOwner = req.user._id.toString() === customerId;

    if (!isAdminOrSalesperson && !isOwner) {
      return res
        .status(403)
        .json({
          message: "Bạn không có quyền xoá khách hàng này khỏi hàng chờ",
        });
    }

    const removed = await SupportQueue.findOneAndDelete({ customerId });

    if (!removed) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy khách trong hàng chờ" });
    }

    res.json({ message: "Đã xoá khách khỏi hàng chờ hỗ trợ" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSupportQueue,
  removeFromQueue,
};
