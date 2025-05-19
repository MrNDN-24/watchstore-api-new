const Blog = require("../models/Blog");

// 1. Tạo bài viết mới
const createBlog = async (req, res) => {
  try {
    const { title, content, type, publishDate } = req.body;

    let imageUrl = null;
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    }

    let types = type;
    if (typeof type === "string") {
      try {
        types = JSON.parse(type);
      } catch (err) {
        return res.status(400).json({ message: "type không hợp lệ" });
      }
    }

    const existingTitle = await Blog.findOne({ title });
    if (existingTitle) {
      return res.status(400).json({
        message: "Tiêu đề này đã tồn tại ở bài viết khác rồi.",
      });
    }
    const newBlog = new Blog({
      title,
      content,
      type: types,
      publishDate,
      image_url: imageUrl,
    });

    await newBlog.save();

    res.status(201).json({
      message: "Bài viết đã được tạo thành công!",
      blog: newBlog,
    });
  } catch (error) {
    console.error("Error in createBlog:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra khi tạo bài viết." });
  }
};

// 2. Lấy danh sách bài viết (hỗ trợ phân trang và tìm kiếm theo title hoặc type)
const getBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 5, search } = req.query;

    const query = { isDelete: false };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Blog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      blogs,
    });
  } catch (error) {
    console.error("Error in getBlogs:", error);
    res
      .status(500)
      .json({ message: "Đã có lỗi xảy ra khi lấy danh sách bài viết." });
  }
};

// 3. Cập nhật bài viết theo id
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, publishDate, isActive } = req.body;

    const existingBlog = await Blog.findOne({ _id: id, isDelete: false });
    if (!existingBlog) {
      return res.status(404).json({ message: "Bài viết không tồn tại." });
    }

    let imageUrl;
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    } else {
      imageUrl = existingBlog.image_url;
    }

  
    let types = type;
    if (type && typeof type === "string") {
      try {
        types = JSON.parse(type);
      } catch (err) {
        return res.status(400).json({ message: "type không hợp lệ" });
      }
    }
    const updatedFields = {
      title: title !== undefined ? title : existingBlog.title,
      content: content !== undefined ? content : existingBlog.content,
      type: types !== undefined ? types : existingBlog.type,
     publishDate:
        publishDate !== undefined ? publishDate : existingBlog.publishDate,
      isActive: isActive !== undefined ? isActive : existingBlog.isActive,
      image_url: imageUrl,
    };

    const updatedBlog = await Blog.findOneAndUpdate(
      { _id: id, isDelete: false },
      updatedFields,
      { new: true }
    );

    res.status(200).json({
      message: "Cập nhật bài viết thành công.",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error in updateBlog:", error);
    res
      .status(500)
      .json({ message: "Đã có lỗi xảy ra khi cập nhật bài viết." });
  }
};

// 4. Xóa bài viết (đánh dấu isDelete = true)
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findOne({ _id: id, isDelete: false });
    if (!blog) {
      return res.status(404).json({ message: "Bài viết không tồn tại." });
    }

    blog.isDelete = true;
    await blog.save();

    res.status(200).json({ message: "Bài viết đã được xóa thành công." });
  } catch (error) {
    console.error("Error in deleteBlog:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra khi xóa bài viết." });
  }
};

module.exports = {
  createBlog,
  getBlogs,
  updateBlog,
  deleteBlog,
};
