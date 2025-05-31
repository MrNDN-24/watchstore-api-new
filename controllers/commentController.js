const Comment = require("../models/Comment");

// Lấy comment theo blogId
const getCommentsByBlogId = async (req, res) => {
  try {
    const comments = await Comment.find({ blogId: req.params.blogId })
      .sort({ createdAt: -1 })
      .populate("userId", "username email avatar"); // chỉ lấy trường cần thiết từ User

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (err) {
    console.error("Lỗi khi lấy bình luận:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Tạo comment mới
const createComment = async (req, res) => {
  try {
    const { blogId, userId, content } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId là bắt buộc" });
    }

    if (!blogId || !content) {
      return res.status(400).json({ message: "blogId và content là bắt buộc" });
    }

    const newComment = new Comment({ blogId, userId, content });
    const saved = await newComment.save();

    res.status(201).json(saved);
  } catch (err) {
    console.error("Lỗi khi tạo bình luận:", err);
    res
      .status(400)
      .json({ message: "Dữ liệu không hợp lệ hoặc thiếu thông tin" });
  }
};

module.exports = {
  getCommentsByBlogId,
  createComment,
};
