import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 6)
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  await connectDB();
  const user = await Admin.findById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  user.password = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  await user.save();

  return NextResponse.json({ success: true });
}
