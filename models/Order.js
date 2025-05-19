const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
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
        isReviewed: {
          // Thêm trường kiểm tra review
          type: Boolean,
          default: false, // Mặc định là chưa được đánh giá
        },
      },
    ],
    address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: false, // Không bắt buộc nếu có customAddress
    },
    customAddress: {
      type: Object, // Lưu địa chỉ nhập tay tạm thời
      required: false,
      validate: {
        validator: function (value) {
          // Kiểm tra nếu có customAddress mà không có address_id thì cần phải đầy đủ thông tin
          if (this.address_id) return true; // Nếu có address_id thì bỏ qua validation
          return (
            value &&
            value.addressLine &&
            value.city &&
            value.district &&
            value.ward
          );
        },
        message:
          "Địa chỉ nhập tay không hợp lệ. Vui lòng cung cấp đầy đủ thông tin.",
      },
    },
    isAddressDefault: {
      type: Boolean,
      default: true,
    },
    total_price: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: [
        "Chờ xử lý",
        "Đã xác nhận",
        "Đang vận chuyển",
        "Đã giao",
        "Đã hủy",
      ],
      default: "Chờ xử lý",
      required: true,
    },
    discountCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discount",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

orderSchema.methods.markProductAsReviewed = async function (productId) {
  const product = this.products.find(
    (prod) => prod.product_id.toString() === productId.toString()
  );

  if (product) {
    product.isReviewed = true; // Đánh dấu sản phẩm là đã đánh giá
    await this.save();
  } else {
    throw new Error("Product not found in the order");
  }
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
