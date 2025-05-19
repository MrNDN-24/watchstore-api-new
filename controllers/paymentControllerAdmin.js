const Payment = require('../models/Payment'); // Đảm bảo đường dẫn đúng đến model của bạn

// Lấy danh sách tất cả payment
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ isDelete: false }); // Lọc các payment chưa bị xóa
    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách payment',
      error: error.message
    });
  }
};

module.exports = { getAllPayments };
