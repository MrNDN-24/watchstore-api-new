const Activity = require("../models/Activity");

// Lấy danh sách toàn bộ activity
const getActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const filter = { isDelete: false };

    // Map dịch ngược từ tiếng Việt về tiếng Anh (để backend hiểu)
    const activityTypeMap = {
      "Xem chi tiết sản phẩm": "view_product_details",
      "Thêm vào giỏ hàng": "add_to_cart",
      "Xóa khỏi giỏ hàng": "remove_from_cart",
      "Xem chương trình giảm giá": "view_discount_program",
      "Xem bài viết": "view_blog",
      "Xem lịch sử đơn hàng": "view_order_history",
      "Đăng nhập": "login",
      "Đăng xuất": "logout",
      "Đánh dấu đã đọc hết tất cả thông báo": "mark_all_notify_read",
      "Đánh dấu đã đọc thông báo": "mark_notify_read",
      "Tạo đơn hàng mua": "create_order",
      "Hủy đơn hàng": "cancel_order",
      "Tạo cuộc trò chuyện với nhân viên": "create_conversation",
    };

    const targetModelMap = {
      "Sản phẩm": "Product",
      "Giỏ hàng": "Cart",
      "Khuyến mãi": "Discount",
      "Bài viết": "Blog",
      "Đơn hàng": "Order",
      "Người dùng": "User",
      "Thông báo": "Notify",
    };

    if (search) {
      const activityTypeKeys = Object.entries(activityTypeMap)
        .filter(([vi]) => vi.toLowerCase().includes(search.toLowerCase()))
        .map(([, en]) => en);

      const targetModelKeys = Object.entries(targetModelMap)
        .filter(([vi]) => vi.toLowerCase().includes(search.toLowerCase()))
        .map(([, en]) => en);

      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { activityType: { $in: activityTypeKeys } },
        { targetModel: { $in: targetModelKeys } },
        { "userId.name": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate("userId", "name")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ timestamp: -1 }),
      Activity.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      activities,
    });
  } catch (error) {
    console.error("Error in getActivities:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách activity." });
  }
};


// xem chi tiết activity theo Id
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findOne({
      _id: id,
      isDelete: false,
    }).populate("userId", "name");

    if (!activity) {
      return res.status(404).json({ message: "Activity không tồn tại." });
    }

    res.status(200).json({ success: true, activity });
  } catch (error) {
    console.error("Error in getActivityById:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết activity." });
  }
};
// xóa Activity
const softDeleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findOne({ _id: id, isDelete: false });
    if (!activity) {
      return res
        .status(404)
        .json({ message: "Activity không tồn tại hoặc đã bị xóa." });
    }

    activity.isDelete = true;
    await activity.save();

    res
      .status(200)
      .json({ success: true, message: "Xóa mềm activity thành công." });
  } catch (error) {
    console.error("Error in softDeleteActivity:", error);
    res.status(500).json({ message: "Lỗi khi xóa mềm activity." });
  }
};

module.exports = {
  getActivities,
  getActivityById,
  softDeleteActivity,
};
