import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Conversation } from "@/models/Conversation";
import { Admin } from "@/models/Admin";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const conversations = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1 })
    .lean();
  return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const userName = session?.user?.name || "Unknown";
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipientId, content } = await req.json();
  if (!recipientId || !content?.trim())
    return NextResponse.json({ error: "Recipient and message are required" }, { status: 400 });

  await connectDB();
  const recipient = await Admin.findById(recipientId).lean<{ name: string }>();
  if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

  // reuse existing conversation between the two users
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, recipientId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, recipientId],
      participantNames: [userName, recipient.name],
      messages: [],
      lastMessage: "",
      lastMessageAt: new Date(),
    });
  }

  conversation.messages.push({ senderId: userId, senderName: userName, content: content.trim(), readBy: [userId] } as any);
  conversation.lastMessage = content.trim();
  conversation.lastMessageAt = new Date();
  await conversation.save();

  return NextResponse.json(conversation, { status: 201 });
}
