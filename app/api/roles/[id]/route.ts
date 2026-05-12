import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";

async function guardSuperAdmin() {
  const session = await auth();
  return (session?.user as any)?.role === "superadmin" ? session : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guardSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { role } = await req.json();
  const ALLOWED = ["superadmin", "admin", "hr_manager", "employee"];
  if (!ALLOWED.includes(role))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  await connectDB();
  const { id } = await params;
  const user = await Admin.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guardSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;

  // prevent deleting yourself
  if ((session.user as any).id === id)
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  await Admin.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
