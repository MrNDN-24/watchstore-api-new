const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
  programName: {
    // Tên chương trình giảm giá
    type: String,
    required: true,
  },
  programImage: {
    type: String,
    required: false,
  },
  description: { type: String, required: true },
  code: {
    // Mỗi chương trình chỉ có 1 mã
    type: String,
    required: true,
    unique: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  usedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  maxUsage: {
    // Số người dùng tối đa (nếu có giới hạn)
    type: Number,
  },
  applicableRanks: {
    type: String,
    enum: ["bronze", "silver", "gold", "platinum", "diamond"],
  },
  startDate: {
    type: Date,
    required: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
});

const rankPriority = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
};

// Kiểm tra mã có hợp lệ với user không
discountSchema.methods.isValidForUser = function (userId, userRank) {
  const currentDate = new Date();

  // Đảm bảo userRank không phải undefined, mặc định là "bronze"
  const normalizedUserRank = (userRank || "bronze").toLowerCase();
  const userRankPriority = rankPriority[normalizedUserRank] || 1;

  // Đảm bảo this.applicableRanks không phải undefined, mặc định là "bronze"
  const normalizedApplicableRank = (
    this.applicableRanks || "bronze"
  ).toLowerCase();
  const applicableRankPriority = rankPriority[normalizedApplicableRank] || 1;

  return (
    this.isActive &&
    !this.isDelete &&
    this.expirationDate > currentDate &&
    this.startDate <= currentDate &&
    userRankPriority >= applicableRankPriority &&
    (!this.maxUsage || this.usedBy.length < this.maxUsage) &&
    !this.usedBy.includes(userId)
  );
};

const Discount = mongoose.model("Discount", discountSchema);

module.exports = Discount;
