const Notify = require("../models/Notify");

const getNotifications = async (req, res) => {
  try {
    console.log("Notify: ", req.body);
    const notifications = await Notify.find({
      user_id: req.params.userId,
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
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getNotifications, createNotification, markAsRead };
