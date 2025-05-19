const Message = require("../models/Message");
const User = require("../models/User");

// // Gửi tin nhắn
// exports.sendMessage = async (req, res) => {
//   try {
//     const { receiverId, content } = req.body;
//     const senderId = req.user._id; // lấy từ middleware xác thực JWT

//     // Kiểm tra người nhận có tồn tại không
//     const receiver = await User.findById(receiverId);
//     if (!receiver) {
//       return res.status(404).json({ message: "Người nhận không tồn tại" });
//     }

//     const message = await Message.create({
//       sender: senderId,
//       receiver: receiverId,
//       content,
//     });

//     res.status(201).json(message);
//   } catch (error) {
//     console.error("Lỗi khi gửi tin nhắn:", error);
//     res.status(500).json({ message: "Lỗi máy chủ" });
//   }
// };

// // Lấy tất cả tin nhắn giữa 2 người
// exports.getMessagesBetweenUsers = async (req, res) => {
//   try {
//     const userId1 = req.user._id; // người đang đăng nhập
//     const { userId2 } = req.params; // người còn lại

//     const messages = await Message.find({
//       $or: [
//         { sender: userId1, receiver: userId2 },
//         { sender: userId2, receiver: userId1 },
//       ],
//     })
//       .sort({ createdAt: 1 }) // tăng dần theo thời gian
//       .populate("sender", "name avatar role")
//       .populate("receiver", "name avatar role");

//     res.status(200).json(messages);
//   } catch (error) {
//     console.error("Lỗi khi lấy tin nhắn:", error);
//     res.status(500).json({ message: "Lỗi máy chủ" });
//   }
// };

// Gửi tin nhắn (không cần authMiddleware)
exports.sendMessage = async (req, res) => {
    try {
      const { senderId, receiverId, content } = req.body;
  
      // Kiểm tra người nhận
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Người nhận không tồn tại" });
      }
  
      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
      });
  
      res.status(201).json(message);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      res.status(500).json({ message: "Lỗi máy chủ" });
    }
  };
  
// Lấy tất cả tin nhắn giữa 2 người
exports.getMessagesBetweenUsers = async (req, res) => {
    try {
      const { userId1, userId2 } = req.query; // truyền qua query thay vì req.user
  
      const messages = await Message.find({
        $or: [
          { sender: userId1, receiver: userId2 },
          { sender: userId2, receiver: userId1 },
        ],
      })
        .sort({ createdAt: 1 })
        .populate("sender", "name avatar role")
        .populate("receiver", "name avatar role");
  
      res.status(200).json(messages);
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
      res.status(500).json({ message: "Lỗi máy chủ" });
    }
  };
  
// (Tuỳ chọn) Đánh dấu đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true }
    );

    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });

    res.status(200).json(message);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái tin nhắn:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// (Tuỳ chọn) Xoá tin nhắn
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });

    // Chỉ cho phép người gửi xoá
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền xoá tin nhắn này" });
    }

    await message.deleteOne();

    res.status(200).json({ message: "Đã xoá tin nhắn" });
  } catch (error) {
    console.error("Lỗi khi xoá tin nhắn:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
