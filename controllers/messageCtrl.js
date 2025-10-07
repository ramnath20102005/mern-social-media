const Conversations = require('../models/conversationModel');
const Messages = require('../models/messageModel');
const Groups = require('../models/groupModel');

class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  paginating() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 9;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

const messageCtrl = {
  // Unified message API - handles both DMs and groups
  createUnifiedMessage: async (req, res) => {
    try {
      const { conversationId, text, media, messageType = 'text' } = req.body;
      
      if (!conversationId) {
        return res.status(400).json({ msg: "Conversation ID is required" });
      }
      
      if (!text?.trim() && (!media || media.length === 0)) {
        return res.status(400).json({ msg: "Message content is required" });
      }

      // Find the conversation
      const conversation = await Conversations.findById(conversationId)
        .populate('recipients', 'fullname username avatar')
        .populate('group');

      if (!conversation) {
        return res.status(404).json({ msg: "Conversation not found" });
      }

      // Check permissions based on conversation type
      if (conversation.isGroupConversation) {
        // Group conversation - check membership
        const group = conversation.group;
        if (!group) {
          return res.status(404).json({ msg: "Group not found" });
        }

        const isMember = group.isMember(req.user._id);
        const isCreator = group.creator.toString() === req.user._id.toString();
        
        if (!isMember && !isCreator) {
          return res.status(403).json({ msg: "You are not a member of this group" });
        }

        // Check if group is expired
        if (group.checkExpiry()) {
          await group.save();
          return res.status(400).json({ msg: "Cannot send message to expired group" });
        }
      } else {
        // DM conversation - check if user is recipient
        const isRecipient = conversation.recipients.some(
          recipient => recipient._id.toString() === req.user._id.toString()
        );
        
        if (!isRecipient) {
          return res.status(403).json({ msg: "You are not part of this conversation" });
        }
      }

      // Create the message
      const newMessage = new Messages({
        conversation: conversationId,
        sender: req.user._id,
        text,
        media: media || [],
        messageType,
        isGroupMessage: conversation.isGroupConversation,
        group: conversation.isGroupConversation ? conversation.group._id : undefined,
        recipient: !conversation.isGroupConversation ? 
          conversation.recipients.find(r => r._id.toString() !== req.user._id.toString())?._id : 
          undefined
      });

      const savedMessage = await newMessage.save();
      await savedMessage.populate('sender', 'fullname username avatar');

      // Update conversation last message
      conversation.lastMessage = {
        text: text || 'Media',
        sender: req.user._id,
        messageType,
        timestamp: new Date()
      };
      conversation.updatedAt = new Date();
      await conversation.save();

      // Update group last activity if it's a group conversation
      if (conversation.isGroupConversation && conversation.group) {
        conversation.group.lastActivity = new Date();
        await conversation.group.save();
      }

      res.json({
        message: savedMessage,
        conversation: {
          _id: conversation._id,
          isGroupConversation: conversation.isGroupConversation,
          lastMessage: conversation.lastMessage
        }
      });

    } catch (err) {
      console.error('createUnifiedMessage error:', err);
      return res.status(500).json({ msg: err.message });
    }
  },

  // Unified get messages API - handles both DMs and groups
  getUnifiedMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({ msg: "Conversation ID is required" });
      }

      // Find and validate conversation
      const conversation = await Conversations.findById(conversationId)
        .populate('group');

      if (!conversation) {
        return res.status(404).json({ msg: "Conversation not found" });
      }

      // Check permissions
      if (conversation.isGroupConversation) {
        // Group conversation - check membership
        const group = conversation.group;
        if (!group) {
          return res.status(404).json({ msg: "Group not found" });
        }

        const isMember = group.isMember(req.user._id);
        const isCreator = group.creator.toString() === req.user._id.toString();
        
        if (!isMember && !isCreator) {
          return res.status(403).json({ msg: "You are not a member of this group" });
        }
      } else {
        // DM conversation - check if user is recipient
        const isRecipient = conversation.recipients.some(
          recipient => recipient.toString() === req.user._id.toString()
        );
        
        if (!isRecipient) {
          return res.status(403).json({ msg: "You are not part of this conversation" });
        }
      }

      // Get messages with pagination
      const features = new APIfeatures(
        Messages.find({ 
          conversation: conversationId,
          isDeleted: false
        })
        .populate('sender', 'fullname username avatar')
        .populate('replyTo')
        .sort({ createdAt: -1 }),
        req.query
      ).paginating();

      const messages = await features.query;

      res.json({
        messages: messages.reverse(),
        result: messages.length,
        conversation: {
          _id: conversation._id,
          isGroupConversation: conversation.isGroupConversation,
          recipients: conversation.recipients,
          group: conversation.group?._id
        }
      });

    } catch (err) {
      console.error('getUnifiedMessages error:', err);
      return res.status(500).json({ msg: err.message });
    }
  },

  createMessage: async (req, res) => {
    try {
      const { recipient, text, media } = req.body;
      console.log('Creating message:', { recipient, text, media, sender: req.user._id });
      
      if (!recipient) {
        return res.status(400).json({ msg: "Recipient is required" });
      }
      
      if (!text?.trim() && (!media || media.length === 0)) {
        return res.status(400).json({ msg: "Message content is required" });
      }

      const newConversation = await Conversations.findOneAndUpdate(
        {
          $or: [
            { recipients: [req.user._id, recipient] },
            { recipients: [recipient, req.user._id] },
          ],
        },
        {
          recipients: [req.user._id, recipient],
          text,
          media,
          updatedAt: new Date()
        },
        { new: true, upsert: true }
      );

      const newMessage = new Messages({
        conversation: newConversation._id,
        sender: req.user._id,
        recipient,
        text,
        media,
        messageStatus: 'sent'
      });

      await newMessage.save();

      // Populate sender info for real-time updates
      await newMessage.populate('sender', 'avatar username fullname');

      res.json({ 
        msg: "Message sent successfully",
        newMessage,
        conversation: newConversation
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getConversations: async (req, res) => {
    try {
      console.log('Getting conversations for user:', req.user._id);
      
      const features = new APIfeatures(
        Conversations.find({
          recipients: req.user._id,
        }),
        req.query
      ).paginating();

      const conversations = await features.query
        .sort("-updatedAt")
        .populate("recipients", "avatar username fullname");

      console.log('Found conversations:', conversations.length);
      console.log('Conversations data:', conversations);

      res.json({
        conversations,
        result: conversations.length,
      });
    } catch (err) {
      console.error('Error in getConversations:', err);
      return res.status(500).json({ msg: err.message });
    }
  },

  getMessages: async (req, res) => {
    try {
      console.log('Getting messages between:', req.user._id, 'and', req.params.id);
      
      const features = new APIfeatures(
        Messages.find({
          $or: [
            { sender: req.user._id, recipient: req.params.id },
            { sender: req.params.id, recipient: req.user._id },
          ],
        }),
        req.query
      ).paginating();

      const messages = await features.query
        .sort("-createdAt")
        .populate('sender', 'avatar username fullname')
        .populate('recipient', 'avatar username fullname');

      console.log('Found messages:', messages.length);
      console.log('Messages data:', messages);

      res.json({
        messages,
        result: messages.length,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  markAsDelivered: async (req, res) => {
    try {
      const { messageIds } = req.body;
      
      await Messages.updateMany(
        { 
          _id: { $in: messageIds },
          recipient: req.user._id,
          messageStatus: 'sent'
        },
        { 
          messageStatus: 'delivered',
          deliveredAt: new Date()
        }
      );

      res.json({ msg: "Messages marked as delivered" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { messageIds } = req.body;
      
      await Messages.updateMany(
        { 
          _id: { $in: messageIds },
          recipient: req.user._id,
          messageStatus: { $in: ['sent', 'delivered'] }
        },
        { 
          messageStatus: 'read',
          readAt: new Date()
        }
      );

      res.json({ msg: "Messages marked as read" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { deleteForEveryone } = req.body;

      if (deleteForEveryone) {
        await Messages.findByIdAndUpdate(messageId, {
          isDeleted: true,
          text: "This message was deleted",
          media: []
        });
      } else {
        await Messages.findByIdAndUpdate(messageId, {
          $push: {
            deletedBy: {
              user: req.user._id,
              deletedAt: new Date()
            }
          }
        });
      }

      res.json({ msg: "Message deleted successfully" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Create group message
  createGroupMessage: async (req, res) => {
    try {
      const { groupId, text, media, messageType = 'text' } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ msg: "Group ID is required" });
      }
      
      if (!text?.trim() && (!media || media.length === 0)) {
        return res.status(400).json({ msg: "Message content is required" });
      }

      // Find and validate group
      const group = await Groups.findById(groupId).populate('members.user');
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user is a member or creator
      const isMember = group.isMember(req.user._id);
      const isCreator = group.creator.toString() === req.user._id.toString();
      
      console.log('Message permission check:', {
        userId: req.user._id,
        isMember,
        isCreator,
        groupCreator: group.creator,
        members: group.members.map(m => ({ user: m.user._id || m.user, role: m.role }))
      });
      
      if (!isMember && !isCreator) {
        return res.status(403).json({ msg: "You are not a member of this group" });
      }

      // Check if group is expired
      if (group.checkExpiry()) {
        await group.save();
        return res.status(400).json({ msg: "Cannot send message to expired group" });
      }

      // Check if only admins can message
      if (group.settings.onlyAdminsCanMessage && !group.isAdmin(req.user._id) && !isCreator) {
        return res.status(403).json({ msg: "Only admins can send messages in this group" });
      }

      // Update conversation last message
      const conversation = await Conversations.findById(group.conversation);
      conversation.lastMessage = {
        text: text || 'Media',
        sender: req.user._id,
        messageType,
        timestamp: new Date()
      };
      conversation.updatedAt = new Date();
      await conversation.save();

      // Create the message - only include defined values
      const messageData = {
        conversation: group.conversation,
        sender: req.user._id,
        group: groupId,
        isGroupMessage: true,
        text,
        messageType
      };
      
      // Only add media if it exists
      if (media && media.length > 0) {
        messageData.media = media;
      }
      
      const newMessage = new Messages(messageData);

      await newMessage.save();

      // Update group last activity
      group.lastActivity = new Date();
      await group.save();

      // Populate message data
      const populatedMessage = await Messages.findById(newMessage._id)
        .populate('sender', 'fullname username avatar')
        .populate('group', 'name avatar');

      res.json({
        msg: "Group message sent successfully",
        newMessage: populatedMessage
      });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Get group messages
  getGroupMessages: async (req, res) => {
    try {
      const { groupId } = req.params;
      
      console.log('getGroupMessages called with groupId:', groupId, 'by user:', req.user._id);
      
      // Validate ObjectId
      if (!groupId || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ msg: "Invalid group ID" });
      }
      
      // Find and validate group with populated members
      const group = await Groups.findById(groupId).populate('members.user');
      console.log('Group found for messages:', !!group);
      
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user is a member or creator
      const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
      const isCreator = group.creator.toString() === req.user._id.toString();
      
      console.log('Message access check - isMember:', isMember, 'isCreator:', isCreator);

      if (!isMember && !isCreator) {
        return res.status(403).json({ msg: "You are not a member of this group" });
      }

      const features = new APIfeatures(
        Messages.find({ 
          group: groupId,
          isGroupMessage: true,
          isDeleted: false
        })
        .populate('sender', 'fullname username avatar')
        .populate('group', 'name avatar')
        .populate('replyTo')
        .sort({ createdAt: -1 }),
        req.query
      ).paginating();

      const messages = await features.query;

      console.log('Found', messages.length, 'messages for group:', groupId);

      res.json({
        messages: messages.reverse(),
        result: messages.length
      });

    } catch (err) {
      console.error('getGroupMessages error:', err);
      return res.status(500).json({ msg: err.message });
    }
  },

  // Mark group message as read
  markGroupMessageRead: async (req, res) => {
    try {
      const { messageId } = req.params;
      
      const message = await Messages.findById(messageId);
      if (!message || !message.isGroupMessage) {
        return res.status(404).json({ msg: "Group message not found" });
      }

      // Check if user is a member of the group
      const group = await Groups.findById(message.group);
      if (!group || !group.isMember(req.user._id)) {
        return res.status(403).json({ msg: "Access denied" });
      }

      // Add to readBy array if not already read
      const alreadyRead = message.readBy.some(
        read => read.user.toString() === req.user._id.toString()
      );

      if (!alreadyRead) {
        message.readBy.push({
          user: req.user._id,
          readAt: new Date()
        });
        await message.save();
      }

      res.json({ msg: "Message marked as read" });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Delete single group message
  deleteGroupMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      console.log('🗑️ DELETE request received for message:', messageId);
      console.log('👤 User requesting delete:', req.user._id, req.user.username);
      console.log('🔍 Request URL:', req.originalUrl);
      console.log('🔍 Request method:', req.method);
      
      // Find the message
      const message = await Messages.findById(messageId);
      console.log('📄 Message found:', !!message);
      console.log('🏷️ Is group message:', message?.isGroupMessage);
      console.log('👤 Message sender:', message?.sender);
      
      if (!message || !message.isGroupMessage) {
        console.log('❌ Message not found or not a group message');
        return res.status(404).json({ msg: "Group message not found" });
      }

      // Check if user is the sender or group admin/creator
      const group = await Groups.findById(message.group);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      const isMessageSender = message.sender.toString() === req.user._id.toString();
      const isGroupCreator = group.creator.toString() === req.user._id.toString();
      const isGroupAdmin = group.members.some(
        member => member.user.toString() === req.user._id.toString() && member.role === 'admin'
      );

      console.log('🔐 Permission check:');
      console.log('   - Is message sender:', isMessageSender);
      console.log('   - Is group creator:', isGroupCreator);
      console.log('   - Is group admin:', isGroupAdmin);

      if (!isMessageSender && !isGroupCreator && !isGroupAdmin) {
        console.log('❌ Permission denied for user:', req.user._id);
        return res.status(403).json({ msg: "You can only delete your own messages or you must be a group admin" });
      }

      console.log('✅ Permission granted, proceeding with soft delete');
      
      // Soft delete the message
      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = req.user._id;
      await message.save();

      console.log('✅ Message soft deleted successfully');
      res.json({ msg: "Message deleted successfully" });

    } catch (err) {
      console.error('deleteGroupMessage error:', err);
      return res.status(500).json({ msg: err.message });
    }
  },

  // Delete multiple group messages
  deleteMultipleGroupMessages: async (req, res) => {
    try {
      const { messageIds, groupId } = req.body;
      
      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ msg: "Message IDs are required" });
      }

      if (!groupId) {
        return res.status(400).json({ msg: "Group ID is required" });
      }

      // Find the group
      const group = await Groups.findById(groupId);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user is group creator or admin
      const isGroupCreator = group.creator.toString() === req.user._id.toString();
      const isGroupAdmin = group.members.some(
        member => member.user.toString() === req.user._id.toString() && member.role === 'admin'
      );

      // Find all messages
      const messages = await Messages.find({
        _id: { $in: messageIds },
        group: groupId,
        isGroupMessage: true,
        isDeleted: false
      });

      if (messages.length === 0) {
        return res.status(404).json({ msg: "No messages found to delete" });
      }

      // Check permissions for each message
      const messagesToDelete = [];
      for (const message of messages) {
        const isMessageSender = message.sender.toString() === req.user._id.toString();
        
        if (isMessageSender || isGroupCreator || isGroupAdmin) {
          messagesToDelete.push(message);
        }
      }

      if (messagesToDelete.length === 0) {
        return res.status(403).json({ msg: "You don't have permission to delete any of these messages" });
      }

      // Soft delete all permitted messages
      const updatePromises = messagesToDelete.map(message => {
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.deletedBy = req.user._id;
        return message.save();
      });

      await Promise.all(updatePromises);

      res.json({ 
        msg: `${messagesToDelete.length} message${messagesToDelete.length > 1 ? 's' : ''} deleted successfully`,
        deletedCount: messagesToDelete.length,
        totalRequested: messageIds.length
      });

    } catch (err) {
      console.error('deleteMultipleGroupMessages error:', err);
      return res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = messageCtrl;