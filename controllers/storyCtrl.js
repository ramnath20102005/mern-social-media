const Stories = require('../models/storyModel');

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

      const story = await Stories.create(storyData);
      const populated = await story.populate('user', 'username fullname avatar');
      
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
      return res.json({ msg: 'Story deleted.' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getFeedStories: async (req, res) => {
    try {
      const currentUser = req.user;
      const followingIds = currentUser.following || [];
      
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

      const stories = await Stories.find(query)
        .populate('user', 'username fullname avatar')
        .populate('views.user', 'username fullname')
        .sort('-createdAt');

      // Group stories by user
      const groupedStories = {};
      stories.forEach(story => {
        const userId = story.user._id.toString();
        if (!groupedStories[userId]) {
          groupedStories[userId] = {
            user: story.user,
            stories: [],
            hasUnviewed: false
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
      });

      return res.json({ 
        result: Object.keys(groupedStories).length, 
        stories: Object.values(groupedStories) 
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
      const story = await Stories.findById(req.params.id)
        .populate('user', 'username fullname avatar');

      if (!story) {
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

  // Reply to story
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

      // Check if user can view this story
      const userFollowing = req.user.following || [];
      if (!story.canUserView(req.user._id, userFollowing)) {
        return res.status(403).json({ msg: 'You cannot reply to this story.' });
      }

      // Add reply
      story.replies.push({
        user: req.user._id,
        message: message.trim(),
        repliedAt: new Date()
      });

      await story.save();

      return res.json({ 
        msg: 'Reply sent successfully.',
        reply: {
          user: {
            _id: req.user._id,
            username: req.user.username,
            fullname: req.user.fullname,
            avatar: req.user.avatar
          },
          message: message.trim(),
          repliedAt: new Date()
        }
      });
    } catch (err) {
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
