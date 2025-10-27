const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversation: { type: mongoose.Types.ObjectId, ref: "conversation" },
    sender: { type: mongoose.Types.ObjectId, ref: "user" },
    recipient: { type: mongoose.Types.ObjectId, ref: "user" },
    // Group messaging fields
    group: { type: mongoose.Types.ObjectId, ref: "group" },
    isGroupMessage: { type: Boolean, default: false },
    // Message content
    text: String,
    media: Array,
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'system', 'story_reply'],
      default: 'text'
    },
    // Story reply fields
    storyId: { type: mongoose.Types.ObjectId, ref: "story" },
    storyMedia: {
      url: String,
      type: { type: String, enum: ['image', 'video'] }
    },
    // System messages for group events
    systemMessageType: {
      type: String,
      enum: [
        'member_joined', 'member_left', 'group_created', 'group_expired', 
        'member_promoted', 'member_demoted', 'member_removed', 'group_extended',
        'settings_changed', 'avatar_updated', 'expiry_warning'
      ]
    },
    systemMessageData: {
      type: Schema.Types.Mixed
    },
    // Message status tracking
    messageStatus: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    // For group messages, track read status per member
    readBy: [{
      user: { type: mongoose.Types.ObjectId, ref: "user" },
      readAt: { type: Date, default: Date.now }
    }],
    deliveredAt: {
      type: Date,
      default: null
    },
    readAt: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      default: null
    },
    // Reply/thread support
    replyTo: { type: mongoose.Types.ObjectId, ref: "message" },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to remove null/undefined system fields for non-system messages
messageSchema.pre('save', function(next) {
  if (this.messageType !== 'system') {
    // Remove system fields for non-system messages
    this.systemMessageType = undefined;
    this.systemMessageData = undefined;
  }
  // Clean up null values
  if (this.systemMessageType === null) {
    this.systemMessageType = undefined;
  }
  if (this.systemMessageData === null) {
    this.systemMessageData = undefined;
  }
  next();
});

module.exports = mongoose.model("message", messageSchema);
