const mongoose = require('mongoose');
const { Schema } = mongoose;

const storySchema = new Schema({
  user: { type: mongoose.Types.ObjectId, ref: 'user', required: true },
  media: [
    {
      url: { type: String, required: true },
      public_id: { type: String },
      type: { type: String, enum: ['image', 'video'], default: 'image' }
    }
  ],
  caption: { type: String, maxLength: 500 },
  
  // Enhanced story settings
  visibility: {
    type: String,
    enum: ['PUBLIC', 'FOLLOWERS', 'CLOSE_FRIENDS'],
    default: 'FOLLOWERS'
  },
  
  expiryDuration: {
    type: Number, // in hours
    default: 24,
    min: 1,
    max: 168 // max 1 week
  },
  
  allowReplies: {
    type: Boolean,
    default: true
  },
  
  // Auto-calculated expiry date
  expiresAt: { 
    type: Date, 
    required: true,
    default: function() {
      return new Date(Date.now() + (this.expiryDuration || 24) * 60 * 60 * 1000);
    }
  },
  
  // Story status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // View tracking
  views: [{
    user: { type: mongoose.Types.ObjectId, ref: 'user' },
    viewedAt: { type: Date, default: Date.now }
  }],
  
  // Reply tracking
  replies: [{
    user: { type: mongoose.Types.ObjectId, ref: 'user' },
    message: { type: String, maxLength: 200 },
    repliedAt: { type: Date, default: Date.now }
  }],
  
  // Close friends list (if visibility is CLOSE_FRIENDS)
  closeFriends: [{ type: mongoose.Types.ObjectId, ref: 'user' }]
  
}, { timestamps: true });

// Indexes for efficient queries
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ user: 1, isActive: 1 });
storySchema.index({ visibility: 1, isActive: 1 });

// Virtual for time remaining
storySchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.expiresAt - now;
  return Math.max(0, remaining);
});

// Virtual for view count
storySchema.virtual('viewCount').get(function() {
  return this.views.length;
});

// Method to check if story is expired
storySchema.methods.isExpired = function() {
  return new Date() > this.expiresAt || !this.isActive;
};

// Method to check if user can view story
storySchema.methods.canUserView = function(userId, userFollowing = []) {
  if (this.isExpired()) return false;
  
  const storyOwnerId = typeof this.user === 'object' ? this.user._id.toString() : this.user.toString();
  
  // Story owner can always view
  if (storyOwnerId === userId.toString()) return true;
  
  switch (this.visibility) {
    case 'PUBLIC':
      return true;
    case 'FOLLOWERS':
      return userFollowing.includes(storyOwnerId);
    case 'CLOSE_FRIENDS':
      return this.closeFriends.some(friendId => friendId.toString() === userId.toString());
    default:
      return false;
  }
};

// Method to add view
storySchema.methods.addView = function(userId) {
  // Don't add view if user is the story owner
  if (this.user.toString() === userId.toString()) return;
  
  // Check if user already viewed
  const existingView = this.views.find(view => view.user.toString() === userId.toString());
  if (!existingView) {
    this.views.push({ user: userId, viewedAt: new Date() });
  }
};

// Method to extend expiry
storySchema.methods.extendExpiry = function(additionalHours) {
  const maxExpiry = new Date(this.createdAt.getTime() + 168 * 60 * 60 * 1000); // 1 week max
  const newExpiry = new Date(this.expiresAt.getTime() + additionalHours * 60 * 60 * 1000);
  
  this.expiresAt = newExpiry > maxExpiry ? maxExpiry : newExpiry;
  this.expiryDuration = Math.round((this.expiresAt - this.createdAt) / (60 * 60 * 1000));
};

module.exports = mongoose.model('story', storySchema);
