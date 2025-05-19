const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    total_price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Tính tổng giá trước khi lưu
cartSchema.pre("save", async function (next) {
  const cart = this;
  let total = 0;

  for (const item of cart.products) {
    const product = await mongoose.model("Product").findById(item.product_id);
    if (product) {
      if (product.discount_price == 0) {
        total += product.price * item.quantity;
      } else {
        total += product.discount_price * item.quantity;
      }
    }
  }

  cart.total_price = total;
  next();
});

cartSchema.methods.removeProductsFromCart = async function (productIds) {
  // Lọc ra các sản phẩm không có trong productIds
  this.products = this.products.filter(
    (item) => !productIds.includes(item.product_id.toString())
  );

  // Tính lại tổng giá sau khi xóa sản phẩm
  await this.calculateTotalPrice();

  // Lưu giỏ hàng đã cập nhật
  await this.save();
};

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
