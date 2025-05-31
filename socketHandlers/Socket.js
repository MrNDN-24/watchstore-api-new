module.exports = (socket, io) => {
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room!`);
  });

  socket.on("sendMessage", ({ senderId, receiverId, content }) => {
    io.to(receiverId).emit("receiveMessage", {
      senderId,
      content,
      timestamp: new Date(),
    });
    console.log(`Message from ${senderId} to ${receiverId}: ${content}`);
  });

  socket.on("sendNotification", (notification) => {
    const { user_id } = notification; // phải có user_id
    io.to(user_id.toString()).emit("new-notification", notification);
    console.log(`Gửi notification đến user ${user_id}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};
