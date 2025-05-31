const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề bài viết là bắt buộc"],
      minlength: [5, "Tiêu đề phải có ít nhất 5 ký tự"],
    },
    image_url: {
      type: String,
    },
    content: {
      type: String,
      required: [true, "Nội dung bài viết là bắt buộc"],
    },
    type: {
      type: String,
      enum: [
        "news",
        "tips",
        "technology",
        "unique_features",
        "certifications",
        "material_crafting",
      ],
    },
    publishDate: {
      type: Date,
      required: true,
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
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
