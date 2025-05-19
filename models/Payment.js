const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['Chưa thanh toán', 'Đã thanh toán', 'Chờ xác nhận'], 
    default: 'Chưa thanh toán'
  },
  method: { 
    type: String,  
    enum: ['Cash on Delivery', 'Bank Transfer'],
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isDelete: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
