const mongoose = require("mongoose");
const { Schema } = mongoose;

const groupInviteSchema = new Schema(
  {
    group: {
      type: mongoose.Types.ObjectId,
      ref: 'group',
      required: true
    },
    inviter: {
      type: mongoose.Types.ObjectId,
      ref: 'user',
      required: true
    },
    invitee: {
      type: mongoose.Types.ObjectId,
      ref: 'user',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending'
    },
    message: {
      type: String,
      trim: true,
      maxLength: 200
    },
    expiryDate: {
      type: Date,
      default: function() {
        // Invites expire in 7 days
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    },
    respondedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate invites
groupInviteSchema.index({ group: 1, invitee: 1 }, { unique: true });
groupInviteSchema.index({ invitee: 1, status: 1 });
groupInviteSchema.index({ expiryDate: 1 });

// Method to check if invite is expired
groupInviteSchema.methods.checkExpiry = function() {
  if (new Date() > this.expiryDate && this.status === 'pending') {
    this.status = 'expired';
    return true;
  }
  return this.status === 'expired';
};

module.exports = mongoose.model("groupInvite", groupInviteSchema);
