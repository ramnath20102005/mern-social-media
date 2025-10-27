const mongoose = require("mongoose");
const { Schema } = mongoose;

const notifySchema = new Schema(
  {
    id: mongoose.Types.ObjectId,
    user: { type: mongoose.Types.ObjectId, ref: "user" },
    recipients: [mongoose.Types.ObjectId],
    url: String,
    text: String,
    content: String,
    image: String,
    isRead: { type: Boolean, default: false },
    
    // Enhanced notification fields
    type: {
      type: String,
      enum: ['follow', 'like', 'comment', 'share', 'group_invite', 'group_expiry', 'story_reply', 'mention'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Auto-expire notifications based on type
        const now = new Date();
        switch(this.type) {
          case 'follow':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
          case 'group_invite':
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
          case 'group_expiry':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
          case 'like':
          case 'comment':
            return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
          default:
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        }
      }
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
  }
);

// Index for automatic cleanup of expired notifications
notifySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for efficient queries
notifySchema.index({ recipients: 1, createdAt: -1 });
notifySchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("notify", notifySchema);
