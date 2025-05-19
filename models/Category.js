const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const categorySchema = new mongoose.Schema({
  categoryID: { type: Number, unique: true },
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  isDelete: { type: Boolean, default: false }, 
  isActive: { type: Boolean, default: true },   
}, { timestamps: true });

categorySchema.plugin(mongooseSequence, { inc_field: 'categoryID' });
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
