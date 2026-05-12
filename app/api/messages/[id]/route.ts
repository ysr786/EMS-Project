import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Conversation } from "@/models/Conversation";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const conversation = await Conversation.findOne({ _id: id, participants: userId }).lean();
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Conversation.updateOne(
    { _id: id },
    { $addToSet: { "messages.$[].readBy": userId } }
  );

  return NextResponse.json(conversation);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const userName = session?.user?.name || "Unknown";
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });

  await connectDB();
  const { id } = await params;
  const conversation = await Conversation.findOne({ _id: id, participants: userId });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  conversation.messages.push({ senderId: userId, senderName: userName, content: content.trim(), readBy: [userId] } as any);
  conversation.lastMessage = content.trim();
  conversation.lastMessageAt = new Date();
  await conversation.save();

  return NextResponse.json(conversation);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const conversation = await Conversation.findOne({ _id: id, participants: userId });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Conversation.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
