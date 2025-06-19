const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const Review = require("./Review");

const productSchema = new mongoose.Schema(
  {
    productCode: { type: Number, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    discount_price: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    image_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProductImage" }],
    style_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Style" }],
    category_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    brand_id: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    gender: { type: String, enum: ["Nam", "Nữ", "Unisex"], required: true },
    strapType: { type: String },
    dialShape: { type: String },
    glassType: { type: String },
    dialPattern: { type: String },
    dialColor: { type: String },
    waterResistance: { type: String },
    origin: { type: String, required: true },
    product_rating: { type: Number, default: 0, min: 0, max: 5 },

    //Inventory
    sold: { type: Number, default: 0 },
    inventoryDate: { type: Date, default: Date.now }, 
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Tạo số tự động cho productCode
productSchema.plugin(AutoIncrement, {
  inc_field: "productCode",
  start_seq: 1,
  unique: true,
});

// Phương thức cập nhật kho hàng khi nhập thêm hoặc bán ra
productSchema.methods.updateStock = function (quantity) {
  if (quantity < 0 && this.stock + quantity < 0) {
    throw new Error("Not enough stock");
  }
  this.stock += quantity;
  return this.save();
};

productSchema.methods.updateRating = async function () {
  try {
    // Lấy tất cả các đánh giá chưa bị xóa và còn hoạt động của sản phẩm
    const reviews = await Review.find({
      product_id: this._id,
      isActive: true,
      isDelete: false,
    });

    if (reviews.length === 0) {
      // Nếu không có đánh giá, đặt rating sản phẩm về 0
      this.product_rating = 0;
    } else {
      // Tính toán tổng điểm rating
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      // Tính rating trung bình
      this.product_rating = totalRating / reviews.length;
    }

    // Lưu lại sản phẩm với rating đã được cập nhật
    return await this.save();
  } catch (err) {
    console.error("Error updating product rating:", err);
    throw new Error("Error updating product rating");
  }
};

productSchema.methods.incrementSold = function (quantity) {
  if (quantity < 0) {
    throw new Error("Sold quantity cannot be negative");
  }
  this.sold += quantity;
  return this.save();
};

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
