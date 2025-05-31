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
      //Đối với product
      "view_product_details",
      "add_to_cart",
      "remove_from_cart",
      // Đối với
      "purchase",
      "search",
      "like_product",
      "view_discount_program",
      "apply_discount_code",
      "view_blog",
      "start_chat",
      "view_order_history",
      "register",
      "login",
      "logout",
    ],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  targetModel: {
    type: String,
    enum: ["Product", "Cart", "Discount", "Blog", "Order", "User"],
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
