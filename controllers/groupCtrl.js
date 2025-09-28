const Groups = require('../models/groupModel');
const GroupInvites = require('../models/groupInviteModel');
const Conversations = require('../models/conversationModel');
const Messages = require('../models/messageModel');
const Users = require('../models/userModel');

const groupCtrl = {
  // Create a new group
  createGroup: async (req, res) => {
    try {
      const { name, description, members, expiryDuration, avatar } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ msg: "Group name is required" });
      }
      
      if (!expiryDuration || expiryDuration < 1) {
        return res.status(400).json({ msg: "Valid expiry duration is required" });
      }

      // Calculate expiry date (expiryDuration in hours)
      const expiryDate = new Date(Date.now() + expiryDuration * 60 * 60 * 1000);

      // Create conversation for the group
      const conversation = new Conversations({
        recipients: [req.user._id], // Start with creator
        isGroupConversation: true,
        lastMessage: {
          text: `${req.user.fullname} created the group`,
          sender: req.user._id,
          messageType: 'system'
        }
      });
      await conversation.save();

      // Create the group
      const newGroup = new Groups({
        name: name.trim(),
        description: description?.trim() || '',
        creator: req.user._id,
        avatar: avatar || undefined,
        members: [{
          user: req.user._id,
          role: 'admin',
          joinedAt: new Date()
        }],
        expiryDate,
        conversation: conversation._id
      });

      await newGroup.save();

      // Update conversation with group reference
      conversation.group = newGroup._id;
      await conversation.save();

      // Create system message for group creation
      const systemMessage = new Messages({
        conversation: conversation._id,
        sender: req.user._id,
        group: newGroup._id,
        isGroupMessage: true,
        messageType: 'system',
        systemMessageType: 'group_created',
        systemMessageData: {
          groupName: name,
          creator: req.user.fullname
        },
        text: `${req.user.fullname} created the group "${name}"`
      });
      await systemMessage.save();

      // Send invites to members if provided
      if (members && members.length > 0) {
        const invitePromises = members.map(async (memberId) => {
          // Check if user exists
          const user = await Users.findById(memberId);
          if (!user) return null;

          // Don't invite the creator
          if (memberId === req.user._id.toString()) return null;

          // Create invite
          const invite = new GroupInvites({
            group: newGroup._id,
            inviter: req.user._id,
            invitee: memberId,
            message: `${req.user.fullname} invited you to join "${name}"`
          });

          try {
            await invite.save();
            return invite;
          } catch (error) {
            // Handle duplicate invite error
            if (error.code === 11000) {
              return null;
            }
            throw error;
          }
        });

        await Promise.all(invitePromises);
      }

      // Populate the group data
      const populatedGroup = await Groups.findById(newGroup._id)
        .populate('creator', 'fullname username avatar')
        .populate('members.user', 'fullname username avatar')
        .populate('conversation');

      res.json({
        msg: "Group created successfully",
        group: populatedGroup
      });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Get user's groups
  getUserGroups: async (req, res) => {
    try {
      const groups = await Groups.find({
        $or: [
          { creator: req.user._id },
          { 'members.user': req.user._id }
        ],
        isActive: true
      })
      .populate('creator', 'fullname username avatar')
      .populate('members.user', 'fullname username avatar')
      .populate({
        path: 'conversation',
        populate: {
          path: 'lastMessage.sender',
          select: 'fullname username'
        }
      })
      .sort({ lastActivity: -1 });

      // Check and update expired groups
      const updatedGroups = await Promise.all(
        groups.map(async (group) => {
          if (group.checkExpiry()) {
            await group.save();
          }
          return group;
        })
      );

      res.json({ groups: updatedGroups });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Get group details
  getGroup: async (req, res) => {
    try {
      const { id } = req.params;
      
      const group = await Groups.findById(id)
        .populate('creator', 'fullname username avatar')
        .populate('members.user', 'fullname username avatar')
        .populate('conversation');

      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user is a member
      if (!group.isMember(req.user._id) && group.creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: "Access denied" });
      }

      // Check expiry
      if (group.checkExpiry()) {
        await group.save();
      }

      res.json({ group });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Send group invite
  inviteToGroup: async (req, res) => {
    try {
      const { id } = req.params;
      const { userIds, message } = req.body;

      const group = await Groups.findById(id);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user can invite (admin or if member invites are allowed)
      const canInvite = group.isAdmin(req.user._id) || 
                       (group.isMember(req.user._id) && group.settings.allowMemberInvites);
      
      if (!canInvite) {
        return res.status(403).json({ msg: "You don't have permission to invite members" });
      }

      if (group.isExpired) {
        return res.status(400).json({ msg: "Cannot invite to expired group" });
      }

      const invitePromises = userIds.map(async (userId) => {
        // Check if user exists
        const user = await Users.findById(userId);
        if (!user) return { userId, success: false, error: "User not found" };

        // Check if already a member
        if (group.isMember(userId)) {
          return { userId, success: false, error: "User is already a member" };
        }

        // Create invite
        try {
          const invite = new GroupInvites({
            group: group._id,
            inviter: req.user._id,
            invitee: userId,
            message: message || `${req.user.fullname} invited you to join "${group.name}"`
          });

          await invite.save();
          return { userId, success: true, invite };
        } catch (error) {
          if (error.code === 11000) {
            return { userId, success: false, error: "Invite already sent" };
          }
          return { userId, success: false, error: error.message };
        }
      });

      const results = await Promise.all(invitePromises);
      
      res.json({
        msg: "Invites processed",
        results
      });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Respond to group invite
  respondToInvite: async (req, res) => {
    try {
      const { id } = req.params;
      const { response } = req.body; // 'accept' or 'reject'

      const invite = await GroupInvites.findById(id)
        .populate('group')
        .populate('inviter', 'fullname username avatar');

      if (!invite) {
        return res.status(404).json({ msg: "Invite not found" });
      }

      if (invite.invitee.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: "Access denied" });
      }

      if (invite.status !== 'pending') {
        return res.status(400).json({ msg: "Invite already responded to" });
      }

      if (invite.checkExpiry()) {
        await invite.save();
        return res.status(400).json({ msg: "Invite has expired" });
      }

      const group = invite.group;
      if (group.isExpired) {
        return res.status(400).json({ msg: "Group has expired" });
      }

      if (response === 'accept') {
        // Add user to group
        group.members.push({
          user: req.user._id,
          role: 'member',
          joinedAt: new Date()
        });

        // Add user to conversation
        const conversation = await Conversations.findById(group.conversation);
        if (!conversation.recipients.includes(req.user._id)) {
          conversation.recipients.push(req.user._id);
          await conversation.save();
        }

        await group.save();

        // Create system message
        const systemMessage = new Messages({
          conversation: group.conversation,
          sender: req.user._id,
          group: group._id,
          isGroupMessage: true,
          messageType: 'system',
          systemMessageType: 'member_joined',
          systemMessageData: {
            memberName: req.user.fullname
          },
          text: `${req.user.fullname} joined the group`
        });
        await systemMessage.save();

        invite.status = 'accepted';
        invite.respondedAt = new Date();
        await invite.save();

        res.json({
          msg: "Invite accepted successfully",
          group: await Groups.findById(group._id)
            .populate('creator', 'fullname username avatar')
            .populate('members.user', 'fullname username avatar')
        });

      } else if (response === 'reject') {
        invite.status = 'rejected';
        invite.respondedAt = new Date();
        await invite.save();

        res.json({ msg: "Invite rejected" });
      } else {
        return res.status(400).json({ msg: "Invalid response. Use 'accept' or 'reject'" });
      }

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Get user's pending invites
  getPendingInvites: async (req, res) => {
    try {
      const invites = await GroupInvites.find({
        invitee: req.user._id,
        status: 'pending'
      })
      .populate('group', 'name description avatar creator expiryDate')
      .populate('inviter', 'fullname username avatar')
      .populate({
        path: 'group',
        populate: {
          path: 'creator',
          select: 'fullname username avatar'
        }
      })
      .sort({ createdAt: -1 });

      // Filter out expired invites and groups
      const validInvites = invites.filter(invite => {
        const isInviteExpired = invite.checkExpiry();
        const isGroupExpired = invite.group && invite.group.checkExpiry();
        return !isInviteExpired && !isGroupExpired;
      });

      res.json({ invites: validInvites });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Leave group
  leaveGroup: async (req, res) => {
    try {
      const { id } = req.params;
      
      const group = await Groups.findById(id);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      if (!group.isMember(req.user._id)) {
        return res.status(400).json({ msg: "You are not a member of this group" });
      }

      // Creator cannot leave, must transfer ownership or delete group
      if (group.creator.toString() === req.user._id.toString()) {
        return res.status(400).json({ msg: "Group creator cannot leave. Transfer ownership or delete the group." });
      }

      // Remove user from group
      group.members = group.members.filter(
        member => member.user.toString() !== req.user._id.toString()
      );

      // Remove from conversation
      const conversation = await Conversations.findById(group.conversation);
      conversation.recipients = conversation.recipients.filter(
        recipient => recipient.toString() !== req.user._id.toString()
      );

      await Promise.all([group.save(), conversation.save()]);

      // Create system message
      const systemMessage = new Messages({
        conversation: group.conversation,
        sender: req.user._id,
        group: group._id,
        isGroupMessage: true,
        messageType: 'system',
        systemMessageType: 'member_left',
        systemMessageData: {
          memberName: req.user.fullname
        },
        text: `${req.user.fullname} left the group`
      });
      await systemMessage.save();

      res.json({ msg: "Left group successfully" });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Delete/Expire group (admin only)
  deleteGroup: async (req, res) => {
    try {
      const { id } = req.params;
      
      const group = await Groups.findById(id);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      if (!group.isAdmin(req.user._id)) {
        return res.status(403).json({ msg: "Only admins can delete the group" });
      }

      // Mark as expired and inactive
      group.isExpired = true;
      group.isActive = false;
      await group.save();

      // Create system message
      const systemMessage = new Messages({
        conversation: group.conversation,
        sender: req.user._id,
        group: group._id,
        isGroupMessage: true,
        messageType: 'system',
        systemMessageType: 'group_expired',
        systemMessageData: {
          adminName: req.user.fullname
        },
        text: `Group was ended by ${req.user.fullname}`
      });
      await systemMessage.save();

      res.json({ msg: "Group deleted successfully" });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = groupCtrl;
