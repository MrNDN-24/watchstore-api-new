const Order = require("../models/Order");
const Payment = require("../models/Payment");

/**
 * Hủy những đơn hàng chưa thanh toán, không phải COD, quá 5 phút kể từ lúc tạo
 */
const cancelUnpaidOrders = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 2 * 60 * 1000); // 5 phút trước

    // 1. Tìm payment chưa thanh toán, không phải COD, và đã tạo hơn 5 phút
    const unpaidPayments = await Payment.find({
      status: "Chưa thanh toán",
      method: { $ne: "Cash on Delivery" },
      createdAt: { $lte: fiveMinutesAgo },
    });

    const paymentIds = unpaidPayments.map((p) => p._id);

    console.log("paymentIds:", paymentIds.length);

    if (paymentIds.length === 0) {
      console.log("Không có đơn hàng chưa thanh toán cần hủy.");
      return;
    }

    // 2. Tìm đơn hàng tương ứng chưa bị hủy
    const ordersToCancel = await Order.find({
      payment_id: { $in: paymentIds },
      deliveryStatus: { $ne: "Đã hủy" },
    });

    const ordersToCancelTest = await Order.find({
      payment_id: { $in: paymentIds },
    });
    console.log("ordersToCancel:", ordersToCancelTest.length);

    let count = 0;

    for (const order of ordersToCancel) {
      order.deliveryStatus = "Đã hủy";
      await order.save();

      // Đồng thời cập nhật status của Payment thành "Đã hủy" nếu muốn (tùy bạn)
      const payment = await Payment.findById(order.payment_id);
      if (payment) {
        payment.status = "Đã hủy";
        await payment.save();
      }

      count++;
    }

    console.log(`Đã hủy ${count} đơn hàng chưa thanh toán quá 2 phút.`);
  } catch (error) {
    console.log("Lỗi khi hủy đơn hàng chưa thanh toán:", error);
  }
};

module.exports = { cancelUnpaidOrders };
