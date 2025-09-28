let users = [];
let admins = [];

const SocketServer = (socket) => {
  //#region //!Connection
  socket.on("joinUser", (id) => {
    // Remove existing user if already connected
    users = users.filter(user => user.id !== id);
    users.push({ id, socketId: socket.id });
    console.log(`👤 User ${id} joined. Total users: ${users.length}`);
    console.log('Active users:', users.map(u => u.id));
    
    // Broadcast updated online users list to all connected users
    const onlineUserIds = users.map(u => u.id);
    users.forEach(user => {
      socket.to(user.socketId).emit('onlineUsersUpdate', onlineUserIds);
    });
    
    // Also send to the newly joined user
    socket.emit('onlineUsersUpdate', onlineUserIds);
  });

  socket.on("joinAdmin", (id) => {
    admins.push({ id, socketId: socket.id });
    const admin = admins.find((admin) => admin.id === id);
    let totalActiveUsers = users.length;

    socket.to(`${admin.socketId}`).emit("activeUsers", totalActiveUsers);
  });

  socket.on("disconnect", () => {
    const disconnectedUser = users.find(user => user.socketId === socket.id);
    users = users.filter((user) => user.socketId !== socket.id);
    admins = admins.filter((user) => user.socketId !== socket.id);
    
    if (disconnectedUser) {
      console.log(`👋 User ${disconnectedUser.id} disconnected. Total users: ${users.length}`);
      
      // Broadcast updated online users list to remaining users
      const onlineUserIds = users.map(u => u.id);
      users.forEach(user => {
        socket.to(user.socketId).emit('onlineUsersUpdate', onlineUserIds);
      });
    }
  });

  //#endregion

  //#region //!Like
  socket.on("likePost", (newPost) => {
    let ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));
    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit("likeToClient", newPost);
      });
    }
  });

  socket.on("unLikePost", (newPost) => {
    let ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));
    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit("unLikeToClient", newPost);
      });
    }
  });
  //#endregion

  //#region //!comment
  socket.on("createComment", (newPost) => {
    let ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));
    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit("createCommentToClient", newPost);
      });
    }
  });

  socket.on("deleteComment", (newPost) => {
    let ids = [...newPost.user.followers, newPost.user._id];
    const clients = users.filter((user) => ids.includes(user.id));
    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit("deleteCommentToClient", newPost);
      });
    }
  });
  //#endregion

  //#region //!follow
  socket.on("follow", (newUser) => {
    const user = users.find((user) => user.id === newUser._id);
    user && socket.to(`${user.socketId}`).emit("followToClient", newUser);
  });

  socket.on("unFollow", (newUser) => {
    const user = users.find((user) => user.id === newUser._id);
    user && socket.to(`${user.socketId}`).emit("unFollowToClient", newUser);
  });
  //#endregion

  //#region //!Notifications
  socket.on("createNotify", (msg) => {
    const clients = users.filter((user) => msg.recipients.includes(user.id));
    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit("createNotifyToClient", msg);
      });
    }
  });

  socket.on("removeNotify", (msg) => {
    const clients = users.filter((user) => msg.recipients.includes(user.id));
    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit("removeNotifyToClient", msg);
      });
    }
  });
  //#endregion

  socket.on("getActiveUsers", (id) => {
    const admin = admins.find((user) => user.id === id);
    const totalActiveUsers = users.length;

    socket
      .to(`${admin.socketId}`)
      .emit("getActiveUsersToClient", totalActiveUsers);
  });

  //#region //!Messages
  socket.on("addMessage", (msg) => {
    console.log(`💬 Message from ${msg.sender} to ${msg.recipient}:`, msg.text);
    
    const user = users.find(user => user.id === msg.recipient);
    if (user) {
      console.log(`✅ Recipient ${msg.recipient} is online, sending message via socket`);
      // Send message to recipient
      socket.to(`${user.socketId}`).emit("addMessageToClient", msg);
      
      // Create notification for recipient (not for sender)
      if (msg.sender !== msg.recipient) {
        const notificationMsg = {
          id: msg._id,
          recipients: [msg.recipient],
          url: `/message/${msg.sender}`,
          text: 'sent you a message',
          content: msg.text,
          image: msg.media && msg.media.length > 0 ? msg.media[0].url : '',
          user: {
            _id: msg.sender,
            username: msg.senderUsername || 'Someone',
            avatar: msg.senderAvatar || ''
          }
        };
        
        socket.to(`${user.socketId}`).emit("createNotifyToClient", notificationMsg);
      }
    } else {
      console.log(`❌ Recipient ${msg.recipient} is offline`);
    }
  });

  // typing indicators
  socket.on('typing', ({ from, to }) => {
    const user = users.find(u => u.id === to);
    if (user) {
      socket.to(`${user.socketId}`).emit('typingToClient', { from });
    }
  });

  socket.on('stopTyping', ({ from, to }) => {
    const user = users.find(u => u.id === to);
    if (user) {
      socket.to(`${user.socketId}`).emit('stopTypingToClient', { from });
    }
  });

  //#region //!Group Messages
  socket.on('joinGroup', ({ groupId, userId }) => {
    socket.join(`group_${groupId}`);
    console.log(`👥 User ${userId} joined group ${groupId}`);
  });

  socket.on('leaveGroup', ({ groupId, userId }) => {
    socket.leave(`group_${groupId}`);
    console.log(`👋 User ${userId} left group ${groupId}`);
  });

  socket.on('addGroupMessage', (msg) => {
    console.log(`💬 Group message from ${msg.sender} to group ${msg.group}:`, msg.text);
    
    // Send message to all group members
    socket.to(`group_${msg.group}`).emit('addGroupMessageToClient', msg);
    
    // Also send to the sender for confirmation
    socket.emit('addGroupMessageToClient', msg);
  });

  // Group typing indicators
  socket.on('groupTyping', ({ from, groupId }) => {
    socket.to(`group_${groupId}`).emit('groupTypingToClient', { from, groupId });
  });

  socket.on('stopGroupTyping', ({ from, groupId }) => {
    socket.to(`group_${groupId}`).emit('stopGroupTypingToClient', { from, groupId });
  });

  // Group notifications (member joined, left, etc.)
  socket.on('groupNotification', ({ groupId, notification }) => {
    socket.to(`group_${groupId}`).emit('groupNotificationToClient', notification);
  });
  //#endregion

  //#endregion
}

module.exports = SocketServer;