  const mongoose = require("mongoose");

  const conversationSchema = new mongoose.Schema(
    {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Gán khi nhân viên nhận hỗ trợ
      status: { type: String, enum: ["waiting", "active", "closed"], default: "waiting" },
      isResolved: { type: Boolean, default: false }
    },
    { timestamps: true }
  );



  module.exports = mongoose.model("Conversation", conversationSchema);