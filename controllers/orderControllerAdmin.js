const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Notify = require("../models/Notify");
const User = require("../models/User"); // hoặc đường dẫn đúng tới file model User của bạn

// Lọc đơn hàng theo trạng thái và thời gian
const getOrders = async (req, res) => {
  const { status, dateFilter, year, month, page = 1, limit = 4 } = req.query;

  try {
    let query = {
      isDelete: false,
    };

    if (status && status !== 'all') {
      query.deliveryStatus = status;
    }

    // Xử lý các trường hợp lọc thời gian
    if (dateFilter === "today") {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      // Nếu có cả năm/tháng thì kết hợp
      if (year && month) {
        const selectedDate = new Date(year, month - 1, today.getDate());
        query.createdAt = { 
          $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
          $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
        };
      } else {
        query.createdAt = { $gte: startOfDay, $lt: endOfDay };
      }
    } 
    // Lọc theo năm và tháng (không phải hôm nay)
    else if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }
    // Chỉ lọc theo năm
    else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(parseInt(year) + 1, 0, 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    // Tính toán phân trang
    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Lấy đơn hàng theo phân trang
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      orders,
      totalOrders,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lọc đơn hàng theo trạng thái và thời gian" });
  }
};

// Cập nhật trạng thái đơn hàng
// const updateOrderStatus = async (req, res) => {
//   const { id } = req.params;
//   const { deliveryStatus } = req.body;

//   if (!deliveryStatus) {
//     return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
//   }

//   try {
//     const order = await Order.findOneAndUpdate(
//       { _id: id, isDelete: false },
//       { deliveryStatus },
//       { new: true }
//     );

//     if (!order) {
//       return res.status(404).json({ message: 'Đơn hàng không tồn tại hoặc đã bị xóa' });
//     }

//     res.json(order);
//   } catch (error) {
//     res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng' });
//   }
// };
const updateUserRank = async (userId) => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const orders = await Order.find({
    user_id: userId,
    deliveryStatus: "Đã giao",
    createdAt: { $gte: threeMonthsAgo },
  });

  const total = orders.reduce((sum, order) => sum + order.total_price, 0);

  let newRank = "bronze";
  if (total >= 50000000) newRank = "diamond";
  else if (total >= 30000000) newRank = "platinum";
  else if (total >= 15000000) newRank = "gold";
  else if (total >= 5000000) newRank = "silver";

  const user = await User.findById(userId);
  const oldRank = user.rank || "bronze";

  if (oldRank !== newRank) {
    // 👉 Nếu tụt hạng hoặc lên hạng, có thể tạo thông báo
    const message =
      newRank === oldRank
        ? null
        : `Hạng của bạn đã được cập nhật từ ${oldRank.toUpperCase()} sang ${newRank.toUpperCase()}.`;

    await User.findByIdAndUpdate(userId, {
      rank: newRank,
      totalSpendingLast3Months: total,
    });

    if (message) {
      await Notify.create({
        user_id: userId,
        message,
        type: "system",
      });
    }
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { deliveryStatus } = req.body;

  if (!deliveryStatus) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }

  try {
    const order = await Order.findOne({ _id: id, isDelete: false }).populate(
      "payment_id"
    );

    if (!order) {
      return res
        .status(404)
        .json({ message: "Đơn hàng không tồn tại hoặc đã bị xóa" });
    }

    // Kiểm tra trạng thái đơn hàng và cập nhật trạng thái thanh toán nếu cần
    if (
      order.deliveryStatus === "Đang vận chuyển" &&
      deliveryStatus === "Đã giao" &&
      order.payment_id.method === "Cash on Delivery" &&
      order.payment_id.status === "Chưa thanh toán"
    ) {
      await Payment.findByIdAndUpdate(order.payment_id._id, {
        status: "Đã thanh toán",
      });
    }

    // Cập nhật trạng thái đơn hàng
    order.deliveryStatus = deliveryStatus;
    await order.save();
    // 👉 Nếu đơn hàng chuyển sang trạng thái "Đã giao", cập nhật rank cho user
    if (deliveryStatus === "Đã giao") {
      await updateUserRank(order.user_id);
    }

    // 👉 Tạo thông báo cho user
    const shortId = order._id.toString().slice(-6).toUpperCase(); // Mã đơn hàng ngắn
    const orderCode = `#ORD${shortId}`;

    const notifyMessage = `Đơn hàng ${orderCode} của bạn đã được cập nhật trạng thái thành "${deliveryStatus}".`;
    const notifyData = {
      user_id: order.user_id,
      order_id: order._id,
      message: notifyMessage,
      type: "order",
    };

    const newNotify = await Notify.create(notifyData);

    // Gửi realtime qua Socket.IO với notify đã được MongoDB tạo đầy đủ fields
    const io = req.app.get("io");
    io.to(newNotify.user_id.toString()).emit("new-notification", newNotify);

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái đơn hàng" });
  }
};

// Lấy chi tiết đơn hàng theo orderId
const getOrderDetails = async (req, res) => {
  const { orderId } = req.params; // Get the orderId from the URL

  try {
    const order = await Order.findOne({ _id: orderId, isDelete: false })
      .populate("user_id", "name email") // Populate user info if needed
      .populate("products.product_id", "name price") // Populate product details
      .populate("payment_id") // Populate payment details
      .populate("address_id"); // Populate address if needed

      console.log("Payment method:", order.payment_id.method);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tìm thấy" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng" });
  }
};

module.exports = {
  getOrders,
  updateOrderStatus,
  getOrderDetails,
};
