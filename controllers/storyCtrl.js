const Stories = require('../models/storyModel');
const NotificationService = require('../services/notificationService');

const storyCtrl = {
  createStory: async (req, res) => {
    try {
      const { 
        media, 
        caption, 
        visibility = 'FOLLOWERS', 
        expiryDuration = 24, 
        allowReplies = true,
        closeFriends = []
      } = req.body;
      
      if (!media || !Array.isArray(media) || media.length === 0) {
        return res.status(400).json({ msg: 'Please add media to create a story.' });
      }

      // Validate expiry duration
      if (expiryDuration < 1 || expiryDuration > 168) {
        return res.status(400).json({ msg: 'Expiry duration must be between 1 hour and 1 week.' });
      }

      // Validate visibility
      if (!['PUBLIC', 'FOLLOWERS', 'CLOSE_FRIENDS'].includes(visibility)) {
        return res.status(400).json({ msg: 'Invalid visibility setting.' });
      }

      // Calculate expiry date
      const expiresAt = new Date(Date.now() + expiryDuration * 60 * 60 * 1000);

      const storyData = {
        user: req.user._id,
        media,
        caption: caption?.trim() || '',
        visibility,
        expiryDuration,
        allowReplies,
        expiresAt,
        isActive: true
      };

      // Add close friends if visibility is CLOSE_FRIENDS
      if (visibility === 'CLOSE_FRIENDS' && closeFriends.length > 0) {
        storyData.closeFriends = closeFriends;
      }

      console.log('Creating story with data:', storyData);
      const story = await Stories.create(storyData);
      console.log('Story created:', story);
      
      const populated = await story.populate('user', 'username fullname avatar');
      console.log('Story populated:', populated);
      
      return res.json({ 
        msg: 'Story created successfully.', 
        story: populated 
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteStory: async (req, res) => {
    try {
      const story = await Stories.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!story) {
        return res.status(404).json({ msg: 'Story not found or you do not have permission to delete it.' });
      }

      // Update related messages to remove story reference but keep the message
      const Messages = require('../models/messageModel');
      await Messages.updateMany(
        { storyId: req.params.id, messageType: 'story_reply' },
        { 
          $unset: { 
            storyId: 1,
            storyMedia: 1 
          }
        }
      );

      console.log(`Story ${req.params.id} deleted and related messages updated`);
      return res.json({ msg: 'Story deleted.' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getFeedStories: async (req, res) => {
    try {
      console.log('Getting stories feed for user:', req.user._id);
      const currentUser = req.user;
      const followingIds = currentUser.following || [];
      console.log('User following:', followingIds.length, 'users');
      
      // Build query for visible stories
      const query = {
        isActive: true,
        expiresAt: { $gt: new Date() },
        $or: [
          // User's own stories
          { user: currentUser._id },
          // Public stories
          { visibility: 'PUBLIC' },
          // Followers-only stories from people user follows
          { 
            visibility: 'FOLLOWERS', 
            user: { $in: followingIds }
          },
          // Close friends stories where user is included
          {
            visibility: 'CLOSE_FRIENDS',
            closeFriends: currentUser._id
          }
        ]
      };

      console.log('Story query:', JSON.stringify(query, null, 2));
      const stories = await Stories.find(query)
        .populate('user', 'username fullname avatar')
        .populate('views.user', 'username fullname')
        .sort('-createdAt');
      
      console.log('Found', stories.length, 'stories');

      // Group stories by user
      const groupedStories = {};
      stories.forEach(story => {
        const userId = story.user._id.toString();
        if (!groupedStories[userId]) {
          groupedStories[userId] = {
            user: story.user,
            stories: [],
            latestStory: story, // Set the first story as latest (since sorted by -createdAt)
            hasUnviewed: false,
            storyCount: 0
          };
        }
        
        // Check if user has viewed this story
        const hasViewed = story.views.some(view => 
          view.user._id.toString() === currentUser._id.toString()
        );
        
        if (!hasViewed && story.user._id.toString() !== currentUser._id.toString()) {
          groupedStories[userId].hasUnviewed = true;
        }
        
        groupedStories[userId].stories.push(story);
        groupedStories[userId].storyCount = groupedStories[userId].stories.length;
      });

      const result = Object.values(groupedStories);
      console.log('Returning', result.length, 'grouped stories');
      console.log('Grouped stories:', result.map(g => ({ user: g.user.username, storyCount: g.storyCount })));
      
      return res.json({ 
        result: Object.keys(groupedStories).length, 
        stories: result 
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Get user's own stories
  getMyStories: async (req, res) => {
    try {
      const stories = await Stories.find({ 
        user: req.user._id,
        isActive: true 
      })
      .populate('views.user', 'username fullname avatar')
      .populate('replies.user', 'username fullname avatar')
      .sort('-createdAt');

      return res.json({ result: stories.length, stories });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // View a story (adds to view count)
  viewStory: async (req, res) => {
    try {
      console.log('ViewStory - Story ID:', req.params.id);
      console.log('ViewStory - User ID:', req.user._id);
      
      const story = await Stories.findById(req.params.id)
        .populate('user', 'username fullname avatar');

      console.log('ViewStory - Story found:', !!story);
      if (!story) {
        console.log('ViewStory - Story not found in database');
        return res.status(404).json({ msg: 'Story not found.' });
      }

      // Check if user can view this story
      const userFollowing = req.user.following || [];
      if (!story.canUserView(req.user._id, userFollowing)) {
        return res.status(403).json({ msg: 'You cannot view this story.' });
      }

      // Add view if not story owner
      story.addView(req.user._id);
      await story.save();

      return res.json({ story });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Extend story expiry
  extendStory: async (req, res) => {
    try {
      const { additionalHours } = req.body;
      
      if (!additionalHours || additionalHours < 1 || additionalHours > 24) {
        return res.status(400).json({ msg: 'Additional hours must be between 1 and 24.' });
      }

      const story = await Stories.findOne({ 
        _id: req.params.id, 
        user: req.user._id,
        isActive: true 
      });

      if (!story) {
        return res.status(404).json({ msg: 'Story not found or already expired.' });
      }

      // Check if story is close to expiry (within 2 hours)
      const timeRemaining = story.expiresAt - new Date();
      if (timeRemaining > 2 * 60 * 60 * 1000) {
        return res.status(400).json({ msg: 'Story can only be extended when close to expiry.' });
      }

      story.extendExpiry(additionalHours);
      await story.save();

      return res.json({ 
        msg: 'Story expiry extended successfully.',
        story: {
          _id: story._id,
          expiresAt: story.expiresAt,
          expiryDuration: story.expiryDuration
        }
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Reply to story - creates a direct message
  replyToStory: async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ msg: 'Reply message is required.' });
      }

      const story = await Stories.findById(req.params.id)
        .populate('user', 'username fullname avatar');

      if (!story) {
        return res.status(404).json({ msg: 'Story not found.' });
      }

      if (!story.allowReplies) {
        return res.status(403).json({ msg: 'Replies are disabled for this story.' });
      }

      const userFollowing = req.user.following || [];
      const canView = story.canUserView(req.user._id, userFollowing);
      
      if (!canView) {
        return res.status(403).json({ msg: 'You cannot reply to this story.' });
      }

      // Don't allow replying to own story
      if (story.user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ msg: 'You cannot reply to your own story.' });
      }

      // Create a direct message instead of adding to story replies
      const Conversations = require('../models/conversationModel');
      const Messages = require('../models/messageModel');

      // Find or create conversation between the two users
      let conversation = await Conversations.findOne({
        recipients: { $all: [req.user._id, story.user._id] },
        isGroupConversation: false
      });

      if (!conversation) {
        conversation = new Conversations({
          recipients: [req.user._id, story.user._id],
          isGroupConversation: false,
          text: `Replied to your story`,
          media: [],
          call: null
        });
        await conversation.save();
      }

      // Create the message with story context
      const newMessage = new Messages({
        conversation: conversation._id,
        sender: req.user._id,
        recipient: story.user._id,
        text: message.trim(),
        media: [],
        messageType: 'story_reply',
        storyId: story._id,
        storyMedia: story.media[0] || null // Include story media for context
      });

      await newMessage.save();

      // Update conversation with latest message
      conversation.text = message.trim();
      conversation.media = [];
      conversation.call = null;
      await conversation.save();

      // Populate the message for response
      const populatedMessage = await Messages.findById(newMessage._id)
        .populate('sender', 'username fullname avatar')
        .populate('recipient', 'username fullname avatar');

      // Create story reply notification
      try {
        await NotificationService.createStoryReplyNotification(
          req.user._id, 
          story.user._id, 
          story._id, 
          message.trim()
        );
      } catch (notifyError) {
        console.error('Error creating story reply notification:', notifyError);
        // Don't fail the reply if notification fails
      }

      return res.json({ 
        msg: 'Reply sent as direct message!',
        message: populatedMessage,
        conversationId: conversation._id
      });
    } catch (err) {
      console.error('ReplyToStory - Error:', err);
      console.error('ReplyToStory - Error stack:', err.stack);
      return res.status(500).json({ msg: err.message });
    }
  },

  // Get story analytics (for story owner)
  getStoryAnalytics: async (req, res) => {
    try {
      const story = await Stories.findOne({ 
        _id: req.params.id, 
        user: req.user._id 
      })
      .populate('views.user', 'username fullname avatar')
      .populate('replies.user', 'username fullname avatar');

      if (!story) {
        return res.status(404).json({ msg: 'Story not found.' });
      }

      const analytics = {
        totalViews: story.views.length,
        totalReplies: story.replies.length,
        timeRemaining: Math.max(0, story.expiresAt - new Date()),
        isExpired: story.isExpired(),
        views: story.views.sort((a, b) => b.viewedAt - a.viewedAt),
        replies: story.replies.sort((a, b) => b.repliedAt - a.repliedAt)
      };

      return res.json({ analytics });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = storyCtrl;
