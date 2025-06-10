module.exports = (socket, io) => {
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room!`);
  });

  socket.on("send_message", async (messageData) => {
    try {
      io.to(messageData.conversationId).emit("receive_message", messageData);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });
  socket.on("sendNotification", (notification) => {
    const { user_id } = notification; // phải có user_id
    io.to(user_id.toString()).emit("new-notification", notification);
    console.log(`Gửi notification đến user ${user_id}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
  socket.on("newChatRequest", (data) => {
    // Gửi thông báo đến tất cả nhân viên sales
    io.to("sales_staff").emit("newChatRequest", data);
  });
};
