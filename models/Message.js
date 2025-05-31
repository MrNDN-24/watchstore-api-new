  const mongoose = require("mongoose");

  const messageSchema = new mongoose.Schema(
    {
      conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      senderRole: { type: String, enum: ["customer", "staff", "bot"] },
      message: String,
      isBot: { type: Boolean, default: false }
    },
    { timestamps: true }
  );


  module.exports = mongoose.model("Message", messageSchema);
