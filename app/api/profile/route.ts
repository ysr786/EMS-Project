import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await Admin.findById(userId).select("-password").lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, currentPassword, newPassword } = await req.json();

  if (!name?.trim() || !email?.trim())
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });

  await connectDB();
  const user = await Admin.findById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // check email uniqueness if changed
  if (email !== user.email) {
    const existing = await Admin.findOne({ email, _id: { $ne: userId } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  // handle password change
  if (newPassword) {
    if (!currentPassword)
      return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid)
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    if (newPassword.length < 6)
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    user.password = await bcrypt.hash(newPassword, 10);
  }

  user.name = name.trim();
  user.email = email.trim();
  await user.save();

  return NextResponse.json({
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
  });
}
