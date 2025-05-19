const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const brandSchema = new mongoose.Schema({
  brandID: { type: Number, unique: true },  // Không cần thiết phải bắt buộc 'required: true' vì mongoose-sequence tự động xử lý
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  image_url: { type: String },
  isDelete: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Sử dụng mongoose-sequence để tự động tăng brandID
brandSchema.plugin(mongooseSequence, { inc_field: 'brandID' });

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
