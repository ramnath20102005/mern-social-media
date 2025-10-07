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
          text: `${req.user.fullname} created the group "${name.trim()}"`,
          sender: req.user._id,
          messageType: 'system',
          timestamp: new Date()
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
      
      console.log('Group created:', {
        groupId: newGroup._id,
        creator: newGroup.creator,
        members: newGroup.members,
        memberCount: newGroup.members.length
      });

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

  // Check group membership (for debugging)
  checkMembership: async (req, res) => {
    try {
      const { id } = req.params; // group id
      const group = await Groups.findById(id).populate('members.user');
      
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
      const isCreator = group.creator.toString() === req.user._id.toString();

      res.json({
        groupId: id,
        userId: req.user._id,
        isMember,
        isCreator,
        members: group.members.map(m => ({
          user: m.user._id,
          fullname: m.user.fullname,
          role: m.role,
          joinedAt: m.joinedAt
        })),
        creator: group.creator
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
      
      console.log('getGroup called with id:', id, 'by user:', req.user._id);
      
      // Validate ObjectId
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ msg: "Invalid group ID" });
      }
      
      const group = await Groups.findById(id)
        .populate('creator', 'fullname username avatar')
        .populate('members.user', 'fullname username avatar')
        .populate('conversation');

      console.log('Group found:', !!group);

      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user is a member or creator
      const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
      const isCreator = group.creator._id.toString() === req.user._id.toString();
      
      console.log('Access check - isMember:', isMember, 'isCreator:', isCreator);

      if (!isMember && !isCreator) {
        return res.status(403).json({ msg: "Access denied" });
      }

      // Check expiry
      if (group.checkExpiry()) {
        await group.save();
      }

      res.json({ group });
    } catch (err) {
      console.error('getGroup error:', err);
      return res.status(500).json({ msg: err.message });
    }
  },

  // Debug: Check group membership
  checkMembership: async (req, res) => {
    try {
      const { id } = req.params;
      
      const group = await Groups.findById(id)
        .populate('creator', 'fullname username avatar')
        .populate('members.user', 'fullname username avatar');

      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      const isMember = group.isMember(req.user._id);
      const isCreator = group.creator._id.toString() === req.user._id.toString();
      const isAdmin = group.isAdmin(req.user._id);

      res.json({
        groupId: group._id,
        groupName: group.name,
        userId: req.user._id,
        userFullname: req.user.fullname,
        creator: {
          id: group.creator._id,
          name: group.creator.fullname
        },
        members: group.members.map(m => ({
          id: m.user._id,
          name: m.user.fullname,
          role: m.role
        })),
        permissions: {
          isMember,
          isCreator,
          isAdmin,
          canMessage: isMember || isCreator
        }
      });
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

        // Emit socket event to refresh group membership
        if (req.io) {
          req.io.emit('groupMembershipUpdated', {
            groupId: group._id,
            userId: req.user._id,
            action: 'joined'
          });
        }

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
  },

  // Update group information
  updateGroup: async (req, res) => {
    try {
      const { name, description } = req.body;
      const groupId = req.params.id;

      const group = await Groups.findById(groupId);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user is creator or admin
      const isCreator = group.creator.toString() === req.user._id.toString();
      const isAdmin = group.isAdmin(req.user._id);
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ msg: "Only admins can update group info" });
      }

      if (name && name.trim()) {
        group.name = name.trim();
      }
      
      if (description !== undefined) {
        group.description = description.trim();
      }

      await group.save();

      res.json({ 
        msg: "Group updated successfully",
        group: await group.populate('members.user', 'fullname username avatar')
      });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Extend group expiry
  extendExpiry: async (req, res) => {
    try {
      const { hours } = req.body;
      const groupId = req.params.id;

      if (!hours || hours < 1) {
        return res.status(400).json({ msg: "Valid hours required" });
      }

      const group = await Groups.findById(groupId);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user is creator or admin
      const isCreator = group.creator.toString() === req.user._id.toString();
      const isAdmin = group.isAdmin(req.user._id);
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ msg: "Only admins can extend expiry" });
      }

      // Extend expiry date
      const currentExpiry = new Date(group.expiryDate);
      const newExpiry = new Date(currentExpiry.getTime() + hours * 60 * 60 * 1000);
      
      group.expiryDate = newExpiry;
      group.isExpired = false;
      await group.save();

      // Create system message
      const systemMessage = new Messages({
        conversation: group.conversation,
        sender: req.user._id,
        group: group._id,
        isGroupMessage: true,
        messageType: 'system',
        systemMessageType: 'group_extended',
        systemMessageData: {
          extenderName: req.user.fullname,
          hours: hours
        },
        text: `${req.user.fullname} extended group expiry by ${hours} hours`
      });
      await systemMessage.save();

      res.json({ 
        msg: "Group expiry extended successfully",
        newExpiryDate: newExpiry
      });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Generate avatar for group
  generateAvatar: async (req, res) => {
    try {
      const { groupName } = req.params;
      
      if (!groupName || !groupName.trim()) {
        return res.status(400).json({ msg: "Group name is required" });
      }

      // Generate initials
      const initials = groupName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();

      // Generate gradient colors based on group name hash
      const gradients = [
        ['#3B82F6', '#8B5CF6'], // blue-purple
        ['#10B981', '#3B82F6'], // green-blue
        ['#8B5CF6', '#EC4899'], // purple-pink
        ['#F97316', '#EF4444'], // orange-red
        ['#14B8A6', '#06B6D4'], // teal-cyan
        ['#6366F1', '#8B5CF6'], // indigo-purple
        ['#EC4899', '#F43F5E'], // pink-rose
        ['#059669', '#14B8A6'], // emerald-teal
        ['#D97706', '#F97316'], // amber-orange
        ['#7C3AED', '#8B5CF6']  // violet-purple
      ];

      const hash = groupName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const [color1, color2] = gradients[hash % gradients.length];

      // Create SVG avatar
      const svg = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="url(#grad)" />
          <text x="100" y="120" font-family="Arial, sans-serif" font-size="60" font-weight="bold" 
                text-anchor="middle" fill="white" text-shadow="0 2px 4px rgba(0,0,0,0.3)">${initials}</text>
        </svg>
      `;

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Upload group avatar
  uploadAvatar: async (req, res) => {
    try {
      const groupId = req.params.id;
      const { avatar } = req.body;

      if (!avatar) {
        return res.status(400).json({ msg: "Avatar image is required" });
      }

      const group = await Groups.findById(groupId);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check permissions
      const isCreator = group.creator.toString() === req.user._id.toString();
      const isAdmin = group.isAdmin(req.user._id);
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ msg: "Only admins can update group avatar" });
      }

      // Delete old avatar if exists
      if (group.avatar) {
        await imageDestroy(group.avatar);
      }

      // Upload new avatar
      const uploadResult = await imageUpload(avatar);
      
      group.avatar = uploadResult.url;
      await group.save();

      res.json({ 
        msg: "Avatar updated successfully",
        avatar: uploadResult.url
      });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Delete group avatar
  deleteAvatar: async (req, res) => {
    try {
      const groupId = req.params.id;

      const group = await Groups.findById(groupId);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check permissions
      const isCreator = group.creator.toString() === req.user._id.toString();
      const isAdmin = group.isAdmin(req.user._id);
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ msg: "Only admins can delete group avatar" });
      }

      if (group.avatar) {
        await imageDestroy(group.avatar);
        group.avatar = undefined;
        await group.save();
      }

      res.json({ msg: "Avatar deleted successfully" });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Remove member from group
  removeMember: async (req, res) => {
    try {
      const { id: groupId, userId } = req.params;

      const group = await Groups.findById(groupId).populate('members.user');
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if requester is creator or admin
      const isCreator = group.creator.toString() === req.user._id.toString();
      const isAdmin = group.isAdmin(req.user._id);
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ msg: "Only admins can remove members" });
      }

      // Cannot remove creator
      if (group.creator.toString() === userId) {
        return res.status(400).json({ msg: "Cannot remove group creator" });
      }

      // Find and remove member
      const memberIndex = group.members.findIndex(m => m.user._id.toString() === userId);
      if (memberIndex === -1) {
        return res.status(404).json({ msg: "Member not found in group" });
      }

      const removedMember = group.members[memberIndex];
      group.members.splice(memberIndex, 1);

      // Remove from conversation
      const conversation = await Conversations.findById(group.conversation);
      conversation.recipients = conversation.recipients.filter(
        recipient => recipient.toString() !== userId
      );

      await Promise.all([group.save(), conversation.save()]);

      // Create system message
      const systemMessage = new Messages({
        conversation: group.conversation,
        sender: req.user._id,
        group: group._id,
        isGroupMessage: true,
        messageType: 'system',
        systemMessageType: 'member_removed',
        systemMessageData: {
          removedMemberName: removedMember.user.fullname,
          removerName: req.user.fullname
        },
        text: `${removedMember.user.fullname} was removed by ${req.user.fullname}`
      });
      await systemMessage.save();

      res.json({ msg: "Member removed successfully" });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Promote member to admin
  promoteMember: async (req, res) => {
    try {
      const { id: groupId, userId } = req.params;

      const group = await Groups.findById(groupId).populate('members.user');
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Only creator can promote
      const isCreator = group.creator.toString() === req.user._id.toString();
      if (!isCreator) {
        return res.status(403).json({ msg: "Only group creator can promote members" });
      }

      // Find member
      const member = group.members.find(m => m.user._id.toString() === userId);
      if (!member) {
        return res.status(404).json({ msg: "Member not found in group" });
      }

      if (member.role === 'admin') {
        return res.status(400).json({ msg: "Member is already an admin" });
      }

      member.role = 'admin';
      await group.save();

      // Create system message
      const systemMessage = new Messages({
        conversation: group.conversation,
        sender: req.user._id,
        group: group._id,
        isGroupMessage: true,
        messageType: 'system',
        systemMessageType: 'member_promoted',
        systemMessageData: {
          promotedMemberName: member.user.fullname,
          promoterName: req.user.fullname
        },
        text: `${member.user.fullname} was promoted to admin by ${req.user.fullname}`
      });
      await systemMessage.save();

      res.json({ msg: "Member promoted to admin successfully" });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Demote admin to member
  demoteMember: async (req, res) => {
    try {
      const { id: groupId, userId } = req.params;

      const group = await Groups.findById(groupId).populate('members.user');
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Only creator can demote
      const isCreator = group.creator.toString() === req.user._id.toString();
      if (!isCreator) {
        return res.status(403).json({ msg: "Only group creator can demote admins" });
      }

      // Cannot demote creator
      if (group.creator.toString() === userId) {
        return res.status(400).json({ msg: "Cannot demote group creator" });
      }

      // Find member
      const member = group.members.find(m => m.user._id.toString() === userId);
      if (!member) {
        return res.status(404).json({ msg: "Member not found in group" });
      }

      if (member.role === 'member') {
        return res.status(400).json({ msg: "Member is already a regular member" });
      }

      member.role = 'member';
      await group.save();

      // Create system message
      const systemMessage = new Messages({
        conversation: group.conversation,
        sender: req.user._id,
        group: group._id,
        isGroupMessage: true,
        messageType: 'system',
        systemMessageType: 'member_demoted',
        systemMessageData: {
          demotedMemberName: member.user.fullname,
          demoterName: req.user.fullname
        },
        text: `${member.user.fullname} was demoted to member by ${req.user.fullname}`
      });
      await systemMessage.save();

      res.json({ msg: "Admin demoted to member successfully" });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Update group settings
  updateSettings: async (req, res) => {
    try {
      const groupId = req.params.id;
      const { onlyAdminsCanMessage, allowMemberInvites } = req.body;

      const group = await Groups.findById(groupId);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check permissions
      const isCreator = group.creator.toString() === req.user._id.toString();
      const isAdmin = group.isAdmin(req.user._id);
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ msg: "Only admins can update group settings" });
      }

      if (typeof onlyAdminsCanMessage === 'boolean') {
        group.settings.onlyAdminsCanMessage = onlyAdminsCanMessage;
      }
      
      if (typeof allowMemberInvites === 'boolean') {
        group.settings.allowMemberInvites = allowMemberInvites;
      }

      await group.save();

      res.json({ 
        msg: "Group settings updated successfully",
        settings: group.settings
      });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Get group members
  getMembers: async (req, res) => {
    try {
      const groupId = req.params.id;

      const group = await Groups.findById(groupId)
        .populate('members.user', 'fullname username avatar')
        .populate('creator', 'fullname username avatar');
        
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user is member
      const isMember = group.isMember(req.user._id);
      const isCreator = group.creator._id.toString() === req.user._id.toString();
      
      if (!isMember && !isCreator) {
        return res.status(403).json({ msg: "Access denied" });
      }

      res.json({
        creator: group.creator,
        members: group.members,
        totalMembers: group.members.length + 1 // +1 for creator
      });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Get group media
  getGroupMedia: async (req, res) => {
    try {
      const groupId = req.params.id;
      const { page = 1, limit = 20 } = req.query;

      const group = await Groups.findById(groupId);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }

      // Check if user is member
      const isMember = group.isMember(req.user._id);
      const isCreator = group.creator.toString() === req.user._id.toString();
      
      if (!isMember && !isCreator) {
        return res.status(403).json({ msg: "Access denied" });
      }

      // Get messages with media
      const messages = await Messages.find({
        group: groupId,
        isDeleted: false,
        media: { $exists: true, $ne: [] }
      })
      .populate('sender', 'fullname username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * page)
      .skip((page - 1) * limit);

      const mediaItems = messages.map(msg => ({
        _id: msg._id,
        sender: msg.sender,
        media: msg.media,
        createdAt: msg.createdAt,
        text: msg.text
      }));

      res.json({
        media: mediaItems,
        currentPage: page,
        totalPages: Math.ceil(messages.length / limit)
      });

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = groupCtrl;
