const Activity = require("../models/Activity");

// Lấy danh sách toàn bộ activity
const getActivities = async (req, res) => {
  try {
    // Lấy userId ưu tiên params trước, sau đó mới query
    const userId = req.params.userId || req.query.userId;
    const { page = 1, limit = 10 } = req.query;

    const filter = { isDelete: false };
    if (userId) filter.userId = userId;

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
