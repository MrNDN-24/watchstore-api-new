const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema({

  image_url: { type: String},
  isActive: { type: Boolean, default: true },
  isDelete: { type: Boolean, default: false },
  isPrimary: { type: Boolean },
  description: { type: String, default: '' } 
}, { timestamps: true });

const ProductImage = mongoose.model('ProductImage', productImageSchema);

module.exports = ProductImage;
