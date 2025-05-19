const Cart = require("../models/Cart"); // Đường dẫn có thể thay đổi tùy cấu trúc dự án
const Product = require("../models/Product");
const mongoose = require("mongoose");

const getCartById = async (req, res) => {
  try {
    const id = req.user.id;

    //Validate user_id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Bạn phải đăng nhập",
      });
    }

    // Sử dụng `find` để lấy tất cả các sản phẩm, có thể bổ sung thêm các tùy chọn phân trang hoặc sắp xếp nếu cần
    // const cart = await Cart.findById(id);
    const cart = await Cart.findOne({ user_id: id }).populate(
      "products.product_id"
    );
    // console.log("Cart", cart);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giỏ hàng",
      });
    }
    return res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm",
    });
  }
};

const addCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    // const product
    if (!product_id) {
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error,
    });
  }
};

const updateCart = async (req, res) => {
  try {
    const user_id = req.user.id; // Giả sử lấy user_id từ token đã xác thực
    // console.log("id", user_id);
    const { product_id, quantity } = req.body;

    // Validate input
    if (!product_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin sản phẩm hoặc số lượng",
      });
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }
    // console.log("Product", product);

    // Kiểm tra số lượng trong kho
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Số lượng sản phẩm trong kho không đủ",
      });
    }

    // Tìm giỏ hàng của user
    let cart = await Cart.findOne({ user_id, isActive: true });

    if (!cart) {
      // Nếu không có giỏ hàng, tạo mới
      cart = new Cart({
        user_id,
        products: [
          {
            product_id,
            quantity,
          },
        ],
      });
    } else {
      // Tìm sản phẩm trong giỏ hàng
      const productIndex = cart.products.findIndex(
        (item) => item.product_id.toString() === product_id
      );

      if (productIndex > -1) {
        // Nếu sản phẩm đã tồn tại trong giỏ hàng
        if (quantity <= 0) {
          // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ
          cart.products.splice(productIndex, 1);
        } else {
          // Cập nhật số lượng
          cart.products[productIndex].quantity = quantity;
        }
      } else if (quantity > 0) {
        // Thêm sản phẩm mới vào giỏ
        cart.products.push({
          product_id,
          quantity,
        });
      }
    }

    // Tính lại tổng giá
    let total = 0;
    for (const item of cart.products) {
      const product = await Product.findById(item.product_id);
      if (product) {
        // Sử dụng giá khuyến mãi nếu có
        const price = product.discount_price || product.price;
        total += price * item.quantity;
      }
    }
    cart.total_price = total;

    // Lưu giỏ hàng
    await cart.save();

    // Populate thông tin sản phẩm trước khi trả về
    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: "products.product_id",
        select: "name price discount_price image_ids stock",
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Cập nhật giỏ hàng thành công",
      data: populatedCart,
    });
  } catch (error) {
    console.error("Error in updateCart:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật giỏ hàng",
      error: error.message,
    });
  }
};

const removeProductFromCart = async (req, res) => {
  try {
    const user_id = req.user.id; // Đảm bảo middleware cung cấp đúng user_id
    const { product_id } = req.body;

    console.log("ID", user_id);
    console.log("product id", product_id);

    // Kiểm tra product_id hợp lệ
    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return res.status(400).json({
        success: false,
        message: "product_id không hợp lệ",
      });
    }

    // Tìm giỏ hàng của người dùng
    const cart = await Cart.findOne({ user_id, isActive: true });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart không tồn tại",
      });
    }

    // Tìm sản phẩm trong giỏ hàng
    const productIndex = cart.products.findIndex(
      (item) => item.product_id.toString() === product_id
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không có trong giỏ hàng",
      });
    }

    // Xóa sản phẩm
    cart.products.splice(productIndex, 1);

    // Lấy thông tin tất cả sản phẩm còn lại trong giỏ hàng
    const productIds = cart.products.map((item) => item.product_id);
    const products = await mongoose.model("Product").find({
      _id: { $in: productIds },
    });

    // Tính lại tổng giá
    let total = 0;
    for (const item of cart.products) {
      const product = products.find(
        (prod) => prod._id.toString() === item.product_id.toString()
      );
      if (product) {
        const price = product.discount_price || product.price;
        total += price * item.quantity;
      }
    }
    cart.total_price = total;

    // Lưu thay đổi
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Sản phẩm đã được xóa khỏi giỏ hàng",
      data: cart,
    });
  } catch (error) {
    console.error("Error in removeProductFromCart:", error.stack);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa sản phẩm khỏi giỏ hàng",
      error: error.message,
    });
  }
};

const validateQuantity = async (req, res) => {
  try {
    const { products } = req.body;

    for (const item of products) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity || quantity <= 0) {
        return res
          .status(400)
          .json({ error: "Sản phẩm hoặc số lượng không hợp lệ" });
      }

      const product = await Product.findById(product_id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Không tìm thấy sản phẩm: ${product_id}`,
        });
      }

      if (quantity > product.stock) {
        return res.status(400).json({
          success: false,
          error: `Số lượng sản phẩm ${product.name} không đủ`,
        });
      }
    }
    return res
      .status(201)
      .json({ success: true, message: "Số lượng sản phẩm hợp lệ" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Lỗi hệ thống" });
  }
};

module.exports = {
  getCartById,
  updateCart,
  removeProductFromCart,
  validateQuantity,
};
