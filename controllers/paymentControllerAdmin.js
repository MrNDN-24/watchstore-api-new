const Payment = require("../models/Payment");
const Order = require("../models/Order");

const getPayments = async (req, res) => {
  try {
    const { status, method, page = 1, limit = 10 } = req.query;

    const query = { isDelete: false };
    if (status) query.status = status;
    if (method) query.method = method;

    const skip = (page - 1) * limit;
    const totalPayments = await Payment.countDocuments(query);
    const totalPages = Math.ceil(totalPayments / limit);

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Gắn thêm thông tin người mua từ Order
    const paymentsWithUser = await Promise.all(
      payments.map(async (payment) => {
        const order = await Order.findOne({
          payment_id: payment._id,
          isDelete: false,
        }).populate("user_id", "name email");

        return {
          ...payment.toObject(),
          buyer: order
            ? {
                name: order.user_id?.name || "-",
                email: order.user_id?.email || "-",
                orderId: order._id,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      payments: paymentsWithUser,
      totalPayments,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách thanh toán",
      error,
    });
  }
};

const getPaymentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy thanh toán" });
    }

    const relatedOrders = await Order.find({ payment_id: id, isDelete: false })
      .populate("user_id", "name email") // nếu muốn show thêm user
      .populate("products.product_id", "name price") // nếu muốn show thêm sản phẩm
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payment, relatedOrders });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết thanh toán", error });
  }
};

module.exports = {
  getPayments,
  getPaymentDetail,
};
