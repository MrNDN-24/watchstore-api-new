const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  activityType: {
    type: String,
    required: true,
    enum: [
      "view_product_details",
      "add_to_cart",
      "remove_from_cart",
      "view_discount_program",
      "view_blog",
      "view_order_history",
      "create_order",
      "mark_all_notify_read",
      "mark_notify_read",
      "login",
      "logout",
      "cancel_order",
      "create_conversation",
    ],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  targetModel: {
    type: String,
    enum: ["Product", "Cart", "Discount", "Blog", "Order", "User", "Notify","Conversation"],
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  targetDetails: {
    type: Object,
    required: false,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
