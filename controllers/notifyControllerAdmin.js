const Notify = require('../models/Notify');

// Lấy danh sách thông báo theo user_id (mặc định mới nhất trước)
const getNotifiesByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const notifies = await Notify.find({ user_id: userId })
      .sort({ createdAt: -1 }); // sắp xếp mới nhất trước

    res.json(notifies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi lấy thông báo của người dùng' });
  }
};

module.exports = {
  getNotifiesByUser,
};
