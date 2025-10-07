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
    // Remove existing admin if already connected
    admins = admins.filter(admin => admin.id !== id);
    admins.push({ id, socketId: socket.id });
    const admin = admins.find((admin) => admin.id === id);
    let totalActiveUsers = users.length;

    socket.to(`${admin.socketId}`).emit("activeUsers", totalActiveUsers);
  });

  socket.on("leaveUser", (id) => {
    const leavingUser = users.find(user => user.id === id);
    users = users.filter(user => user.id !== id);
    
    if (leavingUser) {
      console.log(`👋 User ${id} left intentionally. Total users: ${users.length}`);
      
      // Broadcast updated online users list
      const onlineUserIds = users.map(u => u.id);
      users.forEach(user => {
        socket.to(user.socketId).emit('onlineUsersUpdate', onlineUserIds);
      });
    }
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

  //#region //!Messages - Unified approach
  socket.on("sendMessage", async (msg, callback) => {
    console.log(`💬 Unified message:`, { conversationId: msg.conversationId, sender: msg.sender, text: msg.text });
    
    try {
      const Messages = require('./models/messageModel');
      const Conversations = require('./models/conversationModel');
      const Groups = require('./models/groupModel');
      
      // Find the conversation
      const conversation = await Conversations.findById(msg.conversationId)
        .populate('recipients', 'fullname username avatar')
        .populate('group');

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check permissions and create message based on conversation type
      let newMessage;
      
      if (conversation.isGroupConversation) {
        // Group conversation
        const group = conversation.group;
        if (!group) {
          throw new Error('Group not found');
        }

        const isMember = group.isMember(msg.sender);
        const isCreator = group.creator.toString() === msg.sender.toString();
        
        if (!isMember && !isCreator) {
          throw new Error('User is not a member of this group');
        }

        // Check if group is expired
        if (group.checkExpiry()) {
          await group.save();
          throw new Error('Cannot send message to expired group');
        }

        newMessage = new Messages({
          conversation: msg.conversationId,
          sender: msg.sender,
          group: group._id,
          isGroupMessage: true,
          text: msg.text,
          media: msg.media || [],
          messageType: msg.messageType || 'text'
        });

        // Update group last activity
        group.lastActivity = new Date();
        await group.save();

      } else {
        // DM conversation
        const isRecipient = conversation.recipients.some(
          recipient => recipient._id.toString() === msg.sender.toString()
        );
        
        if (!isRecipient) {
          throw new Error('User is not part of this conversation');
        }

        const recipient = conversation.recipients.find(
          r => r._id.toString() !== msg.sender.toString()
        );

        newMessage = new Messages({
          conversation: msg.conversationId,
          sender: msg.sender,
          recipient: recipient._id,
          text: msg.text,
          media: msg.media || [],
          messageType: msg.messageType || 'text'
        });
      }

      const savedMessage = await newMessage.save();
      await savedMessage.populate('sender', 'fullname username avatar');
      
      // Update conversation last message
      conversation.lastMessage = {
        text: msg.text || 'Media',
        sender: msg.sender,
        messageType: msg.messageType || 'text',
        timestamp: new Date()
      };
      conversation.updatedAt = new Date();
      await conversation.save();
      
      console.log(`✅ Message saved to DB with ID: ${savedMessage._id}`);

      // Send acknowledgment to sender
      if (callback) {
        callback({
          success: true,
          message: savedMessage,
          tempId: msg.tempId
        });
      }

      // Broadcast message based on conversation type
      if (conversation.isGroupConversation) {
        // Broadcast to all group members
        socket.to(`group_${conversation.group._id}`).emit('messageReceived', savedMessage);
        socket.emit('messageReceived', savedMessage);
      } else {
        // Broadcast to DM recipient
        const recipientId = conversation.recipients.find(
          r => r._id.toString() !== msg.sender.toString()
        )?._id.toString();
        
        const user = users.find(user => user.id === recipientId);
        if (user) {
          console.log(`✅ Recipient ${recipientId} is online, broadcasting message`);
          socket.to(`${user.socketId}`).emit("messageReceived", savedMessage);
          
          // Create notification for recipient
          const notificationMsg = {
            id: savedMessage._id,
            recipients: [recipientId],
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
      }

    } catch (error) {
      console.error('❌ Error saving message:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message,
          tempId: msg.tempId
        });
      }
    }
  });

  // Join conversation room (works for both DMs and groups)
  socket.on('joinConversation', ({ conversationId, userId }) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`👤 User ${userId} joined conversation ${conversationId}`);
  });

  socket.on('leaveConversation', ({ conversationId, userId }) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`👋 User ${userId} left conversation ${conversationId}`);
  });

  // Handle typing in conversations
  socket.on('typing', data => {
    const user = users.find(u => u.id === data.to);
    if (user) {
      socket.to(`${user.socketId}`).emit('typing', data);
    }
  });

  socket.on('stopTyping', data => {
    const user = users.find(u => u.id === data.to);
    if (user) {
      socket.to(`${user.socketId}`).emit('stopTyping', data);
      socket.to(`${user.socketId}`).emit('stopTypingToClient', { from });
    }
  });

  //#region  // Join group room
  socket.on('joinGroup', async ({ groupId, userId }) => {
    try {
      const Groups = require('./models/groupModel');
      const group = await Groups.findById(groupId);
      
      if (group) {
        const isMember = group.members.some(m => m.user.toString() === userId.toString());
        const isCreator = group.creator.toString() === userId.toString();
        
        if (isMember || isCreator) {
          socket.join(`group_${groupId}`);
          console.log(`👤 User ${userId} joined group ${groupId}`);
        } else {
          console.log(`❌ User ${userId} denied access to group ${groupId} - not a member`);
        }
      }
    } catch (error) {
      console.error('Error joining group:', error);
    }
  });

  socket.on('leaveGroup', ({ groupId, userId }) => {
    socket.leave(`group_${groupId}`);
    console.log(`👋 User ${userId} left group ${groupId}`);
  });

  socket.on('addGroupMessage', async (msg, callback) => {
    console.log(`💬 Group message from ${msg.sender} to group ${msg.group}:`, msg.text);
    
    try {
      // Save message to database first
      const Messages = require('./models/messageModel');
      const Groups = require('./models/groupModel');
      const Conversations = require('./models/conversationModel');
      
      // Find the group WITHOUT populating members for simpler comparison
      const group = await Groups.findById(msg.group);
      
      if (!group) {
        console.log('❌ Group not found:', msg.group);
        return callback({ 
          success: false, 
          error: 'Group not found',
          tempId: msg.tempId 
        });
      }

      console.log('Group found:', !!group);
      console.log('Sender ID:', msg.sender);
      console.log('Creator ID:', group.creator);

      // Check if sender is member or creator - simpler check without population
      const isMember = group.members.some(m => {
        return m.user.toString() === msg.sender.toString();
      });
      const isCreator = group.creator.toString() === msg.sender.toString();
      
      console.log('Access check - isMember:', isMember, 'isCreator:', isCreator);
      
      if (!isMember && !isCreator) {
        console.log('❌ Access denied - User is not a member or creator');
        return callback({ 
          success: false, 
          error: 'User is not a member of this group',
          tempId: msg.tempId 
        });
      }

      // Update conversation last message
      const conversation = await Conversations.findById(group.conversation);
      if (conversation) {
        conversation.lastMessage = {
          text: msg.text || 'Media',
          sender: msg.sender,
          messageType: msg.messageType || 'text',
          timestamp: new Date()
        };
        conversation.updatedAt = new Date();
        await conversation.save();
      }

      // Create and save the message - only include defined values
      const messageData = {
        conversation: group.conversation,
        sender: msg.sender,
        group: msg.group,
        isGroupMessage: true,
        text: msg.text,
        messageType: msg.messageType || 'text'
      };
      
      // Only add media if it exists and is not empty
      if (msg.media && msg.media.length > 0) {
        messageData.media = msg.media;
      }

      // Only add systemMessageType if it's a system message
      if (msg.messageType === 'system' && msg.systemMessageType) {
        messageData.systemMessageType = msg.systemMessageType;
        if (msg.systemMessageData) {
          messageData.systemMessageData = msg.systemMessageData;
        }
      }

      const newMessage = new Messages(messageData);

      const savedMessage = await newMessage.save();
      await savedMessage.populate('sender', 'fullname username avatar');
      
      console.log(`✅ Group message saved to DB with ID: ${savedMessage._id}`);

      // Update group last activity
      group.lastActivity = new Date();
      await group.save();

      // Send acknowledgment to sender with saved message
      if (callback) {
        callback({
          success: true,
          message: savedMessage,
          tempId: msg.tempId
        });
      }

      // Broadcast to all group members
      socket.to(`group_${msg.group}`).emit('addGroupMessageToClient', savedMessage);
      
      // Also send to the sender for confirmation
      socket.emit('addGroupMessageToClient', savedMessage);

    } catch (error) {
      console.error('❌ Error saving group message:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message,
          tempId: msg.tempId
        });
      }
    }
  });

  // Group typing indicators
  socket.on('groupTyping', (data) => {
    socket.to(`group_${data.groupId}`).emit('groupTyping', {
      userId: data.from,
      groupId: data.groupId,
      user: socket.user
    });
  });

  socket.on('stopGroupTyping', (data) => {
    socket.to(`group_${data.groupId}`).emit('stopGroupTyping', {
      userId: data.from,
      groupId: data.groupId
    });
  });

  // Group member events
  socket.on('memberJoined', (data) => {
    socket.to(`group_${data.groupId}`).emit('memberJoined', data);
  });

  socket.on('memberLeft', (data) => {
    socket.to(`group_${data.groupId}`).emit('memberLeft', data);
  });

  socket.on('memberPromoted', (data) => {
    socket.to(`group_${data.groupId}`).emit('memberPromoted', data);
  });

  socket.on('memberRemoved', (data) => {
    socket.to(`group_${data.groupId}`).emit('memberRemoved', data);
  });

  // Group settings events
  socket.on('groupUpdated', (data) => {
    socket.to(`group_${data.groupId}`).emit('groupUpdated', data);
  });

  socket.on('groupExpiryExtended', (data) => {
    socket.to(`group_${data.groupId}`).emit('groupExpiryExtended', data);
  });

  socket.on('groupExpired', (data) => {
    socket.to(`group_${data.groupId}`).emit('groupExpired', data);
  });

  // Group avatar events
  socket.on('groupAvatarUpdated', (data) => {
    socket.to(`group_${data.groupId}`).emit('groupAvatarUpdated', data);
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

  // Group message deletion
  socket.on('deleteGroupMessage', ({ messageId, groupId, userId }) => {
    console.log(`🗑️ User ${userId} deleted message ${messageId} in group ${groupId}`);
    
    // Broadcast message deletion to all group members
    socket.to(`group_${groupId}`).emit('groupMessageDeleted', {
      messageId,
      groupId,
      deletedBy: userId,
      deletedAt: new Date()
    });
    
    // Also send to the sender for confirmation
    socket.emit('groupMessageDeleted', {
      messageId,
      groupId,
      deletedBy: userId,
      deletedAt: new Date()
    });
  });

  socket.on('deleteMultipleGroupMessages', ({ messageIds, groupId, userId }) => {
    console.log(`🗑️ User ${userId} deleted ${messageIds.length} messages in group ${groupId}`);
    
    // Broadcast multiple message deletion to all group members
    socket.to(`group_${groupId}`).emit('multipleGroupMessagesDeleted', {
      messageIds,
      groupId,
      deletedBy: userId,
      deletedAt: new Date()
    });
    
    // Also send to the sender for confirmation
    socket.emit('multipleGroupMessagesDeleted', {
      messageIds,
      groupId,
      deletedBy: userId,
      deletedAt: new Date()
    });
  });
  //#endregion

  //#endregion
}

module.exports = SocketServer;