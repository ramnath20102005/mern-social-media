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

      // Check if user is a member
      if (!group.isMember(req.user._id)) {
        return res.status(403).json({ msg: "You are not a member of this group" });
      }

      // Check if group is expired
      if (group.checkExpiry()) {
        await group.save();
        return res.status(400).json({ msg: "Cannot send message to expired group" });
      }

      // Check if only admins can message
      if (group.settings.onlyAdminsCanMessage && !group.isAdmin(req.user._id)) {
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

      // Create the message
      const newMessage = new Messages({
        conversation: group.conversation,
        sender: req.user._id,
        group: groupId,
        isGroupMessage: true,
        text,
        media: media || [],
        messageType
      });

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
      
      // Find and validate group
      const group = await Groups.findById(groupId);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user is a member
      if (!group.isMember(req.user._id)) {
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

      res.json({
        messages: messages.reverse(),
        result: messages.length
      });

    } catch (err) {
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
  }
};

module.exports = messageCtrl;