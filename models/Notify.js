const mongoose = require("mongoose");

const notifySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["order", "promotion", "system"],
      default: "order",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notify", notifySchema);
