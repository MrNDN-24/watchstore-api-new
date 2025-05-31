const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // tham chiếu đến model User
      required: [true, "User ID là bắt buộc"],
    },
    content: {
      type: String,
      required: [true, "Nội dung bình luận là bắt buộc"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
