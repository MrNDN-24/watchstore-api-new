const Order = require("../models/Order"); // Đường dẫn tới model Order
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const Discount = require("../models/Discount");
const Cart = require("../models/Cart");

const createOrder = async (req, res) => {
  try {
    // Lấy dữ liệu từ body của request
    let {
      user_id,
      products,
      total_price,
      address_id,
      customAddress, // Lưu trực tiếp customAddress
      payment_id, // Nếu không có, sẽ tạo mới
      deliveryStatus,
      discountCode = null,
      isActive = true,
      isDelete = false,
      payment_method,
      isAddressDefault,
    } = req.body;

    console.log("Request body", req.body);

    // Kiểm tra dữ liệu bắt buộc (trừ payment_id và customAddress)
    if (!user_id || !products || !total_price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Kiểm tra danh sách sản phẩm
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products list cannot be empty" });
    }

    // Nếu không có `address_id`, kiểm tra và sử dụng `customAddress`
    if (!address_id && !customAddress) {
      return res.status(400).json({
        error: "Either address_id or customAddress must be provided.",
      });
    }

    if (!address_id) {
      const { addressLine, city, district, ward } = customAddress || {};

      // Kiểm tra các trường cần thiết trong `customAddress`
      if (!addressLine || !city || !district || !ward) {
        return res.status(400).json({
          error:
            "Custom address is incomplete. Please provide full address details.",
        });
      }
    }

    if (discountCode && discountCode.trim() !== "") {
      const discount = await Discount.findOne({ code: discountCode });
      // Kiểm tra xem mã giảm giá có hợp lệ với người dùng không
      if (!discount || !discount.isValidForUser(user_id)) {
        return res
          .status(400)
          .json({ error: "Mã giảm giá không hợp lệ với người dùng" });
      }
      // Thêm user_id vào trường usedBy của discount và lưu lại
      discount.usedBy.push(user_id);
      await discount.save();
      // Cập nhật lại discountCode bằng discount._id
      discountCode = discount._id;
    } else {
      // Nếu không có mã giảm giá, truyền null hoặc để mặc định là giá trị hợp lệ
      discountCode = null;
    }

    // Cập nhật stock và sold cho từng sản phẩm
    for (const item of products) {
      const { product_id, quantity } = item;

      // Kiểm tra giá trị hợp lệ
      if (!product_id || !quantity || quantity <= 0) {
        return res
          .status(400)
          .json({ error: "Sản phẩm hoặc số lượng không hợp lệ" });
      }

      // Lấy sản phẩm từ database
      const product = await Product.findById(product_id);

      if (!product) {
        return res
          .status(404)
          .json({ error: `Không tìm thấy sản phẩm: ${product_id}` });
      }

      if (quantity > product.stock) {
        return res.status(400).json({ error: "Số lượng sản phẩm không đủ" });
      }

      // Cập nhật stock và sold
      try {
        await product.updateStock(-quantity); // Giảm stock
        await product.incrementSold(quantity); // Tăng sold
      } catch (error) {
        return res.status(400).json({
          error: `Failed to update stock for product: ${product_id}`,
          details: error.message,
        });
      }
    }

    // console.log("Request body", req.body);

    let finalPaymentId = payment_id;

    // Nếu không truyền payment_id, tạo một payment mới
    if (!payment_id) {
      const newPayment = new Payment({
        method: payment_method, // Giá trị mặc định
        amount: total_price, // Sử dụng tổng giá đơn hàng
      });
      const savedPayment = await newPayment.save();
      finalPaymentId = savedPayment._id; // Lấy ID của payment mới tạo
    }

    // Tạo một đối tượng order mới
    const newOrder = new Order({
      user_id,
      products,
      total_price,
      address_id: isAddressDefault ? address_id : null, // Nếu là default, dùng address_id
      customAddress: isAddressDefault ? null : customAddress, // Nếu không phải default, dùng customAddress
      payment_id: finalPaymentId, // Lưu ID payment (dù là mới tạo hay truyền vào)
      deliveryStatus,
      discountCode,
      isActive,
      isDelete,
      isAddressDefault, // Sử dụng trực tiếp isAddressDefault
    });
    console.log("New Order:", newOrder);

    // Lưu đơn hàng vào cơ sở dữ liệu
    const savedOrder = await newOrder.save();

    // const cart = await Cart.findOne({ user_id: user_id });

    // if (cart) {
    //   // Xóa các sản phẩm đã mua trong đơn hàng khỏi giỏ hàng
    //   for (const item of products) {
    //     const productId = item.product_id;
    //     cart.products = cart.products.filter(
    //       (product) => product.product_id.toString() !== productId.toString()
    //     );
    //   }

    //   // Lưu lại giỏ hàng sau khi xóa các sản phẩm
    //   await cart.save();
    // }

    // Phản hồi thành công với thông tin đơn hàng
    return res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error while creating order:", error);
    return res.status(500).json({
      error: "Failed to create order",
      details: error.message,
    });
  }
};

const getAllUserOrder = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Kiểm tra nếu không truyền userId
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Lấy danh sách đơn hàng từ cơ sở dữ liệu với điều kiện isDelete = false
    const userOrders = await Order.find({ user_id, isDelete: false })
      .populate("products.product_id")
      .sort({ createdAt: -1 });

    // Kiểm tra nếu không có đơn hàng nào
    if (!userOrders || userOrders.length === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    // Trả về danh sách đơn hàng
    return res.status(200).json({ orders: userOrders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({ message: "Failed to fetch user orders." });
  }
};

const getUserOrder = async (req, res) => {
  try {
    const user_id = req.user.id; // Lấy userId từ token
    const { deliveryStatus } = req.query; // Lấy deliveryStatus từ query string

    // Kiểm tra nếu không truyền userId
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Tạo bộ lọc với điều kiện isDelete = false
    const filter = { user_id: user_id, isDelete: false };
    if (deliveryStatus) {
      filter.deliveryStatus = deliveryStatus;
    }
    // console.log("Order Filter", filter);

    // Lấy danh sách đơn hàng từ cơ sở dữ liệu
    const userOrders = await Order.find(filter)
      .populate("products.product_id")
      .sort({ createdAt: -1 });

    // Kiểm tra nếu không có đơn hàng nào
    if (!userOrders || userOrders.length === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    // Trả về danh sách đơn hàng
    return res.status(200).json({ orders: userOrders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({ message: "Failed to fetch user orders." });
  }
};

const cancelOrder = async (req, res) => {
  const orderId = req.params.id; // Giả sử orderId được truyền qua URL
  console.log("OrderId:", orderId);
  try {
    // Tìm order cần hủy
    const order = await Order.findById(orderId).populate("products.product_id");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.deliveryStatus === "Đã hủy") {
      return res.status(400).json({ message: "Order already canceled" });
    }

    // Đặt deliveryStatus của Order thành "Đã hủy"
    order.deliveryStatus = "Đã hủy";
    await order.save();

    // Đặt isDelete của Payment liên quan thành true
    const payment = await Payment.findById(order.payment_id);
    if (payment) {
      payment.isDelete = true;
      await payment.save();
    }

    // Cập nhật lại stock và sold cho từng sản phẩm trong Order
    for (const item of order.products) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        console.warn(`Product with ID ${item.product_id} not found`);
        continue;
      }

      // Cập nhật stock và sold
      product.stock += item.quantity;
      product.sold -= item.quantity;

      // Đảm bảo giá trị sold không âm
      if (product.sold < 0) {
        product.sold = 0;
      }

      await product.save();
    }

    // Phản hồi thành công
    res.status(200).json({ message: "Order canceled successfully" });
  } catch (error) {
    console.error("Error canceling order:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { createOrder, getAllUserOrder, getUserOrder, cancelOrder };
