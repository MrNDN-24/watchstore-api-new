// const mongoose = require("mongoose");

// const discountSchema = new mongoose.Schema({
//   code: { 
//     type: String, 
//     required: true, 
//     unique: true // Mã giảm giá phải là duy nhất
//   },
//   description: { 
//     type: String, 
//     required: true 
//   },
//   discountValue: { 
//     type: Number, 
//     required: true, 
//     min: 0 
//   },
//   startDate: { 
//     type: Date, 
//     required: true 
//   },
//   expirationDate: { 
//     type: Date, 
//     required: true 
//   },
//   usedBy: [{ 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
//   }],
//   isActive: { 
//     type: Boolean, 
//     default: true 
//   },
//   isDelete: { 
//     type: Boolean, 
//     default: false 
//   }
// });

// // Kiểm tra mã giảm giá khi áp dụng
// discountSchema.methods.isValidForUser = function (userId) {
//   const currentDate = new Date();
//   // Đảm bảo mã giảm giá chưa hết hạn, chưa bị xóa và người dùng chưa sử dụng mã giảm giá này
//   return (
//     this.isActive &&
//     !this.isDelete &&
//     this.expirationDate > currentDate &&
//     !this.usedBy.includes(userId)
//   );
// };

// const Discount = mongoose.model("Discount", discountSchema);

// module.exports = Discount;
const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
  programName: { // Tên chương trình giảm giá
    type: String,
    required: true
  },
  programImage: { 
    type: String, 
    required: false
  },
  description: { type: String, required: true },

  code: { // Mỗi chương trình chỉ có 1 mã
    type: String,
    required: true,
    unique: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxUsage: { // Số người dùng tối đa (nếu có giới hạn)
    type: Number,
  },
  applicableRanks: { 
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  expirationDate: { 
    type: Date, 
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
});

// Kiểm tra mã có hợp lệ với user không
discountSchema.methods.isValidForUser = function (userId, userRank) {
  const currentDate = new Date();

  return (
    this.isActive &&
    !this.isDelete &&
    this.expirationDate > currentDate &&
    this.startDate <= currentDate &&
    this.applicableRanks.includes(userRank) &&
    !this.usedBy.includes(userId)
  );
};

const Discount = mongoose.model("Discount", discountSchema);

module.exports = Discount;
