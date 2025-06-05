const Notify = require("../models/Notify");
const Activity = require("../models/Activity");
const getNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    const notifications = await Notify.find({
      user_id: userId,
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createNotification = async (req, res) => {
  try {
    const notify = new Notify(req.body);
    await notify.save();

    // Gửi realtime qua Socket.IO
    const io = req.app.get("io");
    io.to(notify.user_id.toString()).emit("new-notification", notify);

    res.status(201).json(notify);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const updated = await Notify.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    // Ghi nhận hoạt động nếu cập nhật thành công và có thông tin userId trong notification (hoặc req.user)
    if (updated && updated.user_id) {
      await Activity.create({
        userId: updated.user_id,
        activityType: "mark_notify_read",
        targetModel: "Notify",
        description: `Người dùng đã đánh dấu thông báo (ID: ${updated._id}) là đã đọc.`,
      });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.params.userId;
    await Notify.updateMany(
      { user_id: userId, isRead: false },
      { isRead: true }
    );
    if (userId) {
      await Activity.create({
        userId: userId,
        activityType: "mark_all_notify_read",
        targetModel: "Notify",
        description: `Người dùng đánh dấu đã xem tất cả thông báo.`,
      });
    }
    res.json({ message: "Đã đánh dấu tất cả là đã đọc" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
};
