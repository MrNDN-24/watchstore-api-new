const Blog = require("../models/Blog");
const Activity = require("../models/Activity");
// 2. Lấy danh sách bài viết (hỗ trợ phân trang và tìm kiếm theo title hoặc type)
const getBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 5, search } = req.query;
    console.log("Request query:", req.query);
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

const getBlogById = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const blog = await Blog.findById(req.params.id);
    if (!blog || blog.isDelete) {
      return res.status(404).json({ message: "Blog không tồn tại." });
    }
     // Tạo activity log khi xem chi tiết blog
    if (userId) {
      await Activity.create({
        userId,
        activityType: "view_blog",
        targetId: blog._id,
        targetModel: "Blog",
        description: `Người dùng xem bài viết: ${blog.title}`,
      });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy blog." });
  }
};

module.exports = { getBlogs, getBlogById };
