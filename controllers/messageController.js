const Message = require("../models/Message");

const sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, receiverId, senderRole, message, isBot } =
      req.body;

    const newMessage = await Message.create({
      conversationId,
      senderId,
      receiverId,
      senderRole,
      message,
      isBot: isBot || false,
    });
    const io = req.app.get("io");
    io.to(conversationId).emit("receive_message", newMessage);

    res.status(201).json({ message: "Message sent", newMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getMessagesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendMessage, getMessagesByConversation };
