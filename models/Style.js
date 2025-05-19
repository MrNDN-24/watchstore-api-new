
const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const styleSchema = new mongoose.Schema({
  styleID: { type: Number, unique: true },  // Tự động tăng styleID
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isDelete: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Sử dụng mongoose-sequence để tự động tăng styleID
styleSchema.plugin(mongooseSequence, { inc_field: 'styleID' });

const Style = mongoose.model('Style', styleSchema);

module.exports = Style;
