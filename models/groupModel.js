const mongoose = require("mongoose");
const { Schema } = mongoose;

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 50
    },
    description: {
      type: String,
      trim: true,
      maxLength: 200
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: 'user',
      required: true
    },
    avatar: {
      type: String,
      default: 'https://res.cloudinary.com/devatchannel/image/upload/v1602752402/avatar/avatar_cugq40.png'
    },
    members: [{
      user: { type: mongoose.Types.ObjectId, ref: 'user' },
      role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    expiryDate: {
      type: Date,
      required: true
    },
    isExpired: {
      type: Boolean,
      default: false
    },
    warnings: [{
      type: String,
      enum: ['7d', '1d', '24h']
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    conversation: {
      type: mongoose.Types.ObjectId,
      ref: 'conversation'
    },
    settings: {
      onlyAdminsCanMessage: {
        type: Boolean,
        default: false
      },
      allowMemberInvites: {
        type: Boolean,
        default: true
      }
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
groupSchema.index({ creator: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ expiryDate: 1 });
groupSchema.index({ isActive: 1, isExpired: 1 });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member && (member.role === 'admin' || this.creator.toString() === userId.toString());
};

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

// Method to check if group is expired
groupSchema.methods.checkExpiry = function() {
  if (new Date() > this.expiryDate && !this.isExpired) {
    this.isExpired = true;
    this.isActive = false;
    return true;
  }
  return this.isExpired;
};

module.exports = mongoose.model("group", groupSchema);
