const mongoose = require("mongoose");
const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    recipients: [{type: mongoose.Types.ObjectId, ref: 'user'}],
    text: String,
    media: Array,
    // Group conversation fields
    isGroupConversation: { type: Boolean, default: false },
    group: { type: mongoose.Types.ObjectId, ref: 'group' },
    // Last message info for quick access
    lastMessage: {
      text: String,
      sender: { type: mongoose.Types.ObjectId, ref: 'user' },
      messageType: { type: String, default: 'text' },
      timestamp: { type: Date, default: Date.now }
    },
    // Conversation settings
    isArchived: { type: Boolean, default: false },
    isMuted: [{
      user: { type: mongoose.Types.ObjectId, ref: 'user' },
      mutedUntil: { type: Date }
    }]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("conversation", conversationSchema);
