import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema({
  senderId:   { type: String, required: true },
  senderName: { type: String, required: true },
  content:    { type: String, required: true },
  readBy:     [{ type: String }],
}, { timestamps: true });

const ConversationSchema = new Schema({
  participants:     [{ type: String, required: true }],  // array of Admin _id strings
  participantNames: [{ type: String }],
  messages:         [MessageSchema],
  lastMessage:      { type: String, default: "" },
  lastMessageAt:    { type: Date, default: Date.now },
}, { timestamps: true });

delete (mongoose.models as any).Conversation;
export const Conversation = mongoose.model("Conversation", ConversationSchema);
