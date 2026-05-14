import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Department } from "@/models/Department";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["superadmin", "admin"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const dept = await Department.findByIdAndUpdate(id, body, { new: true });
  if (!dept) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(dept);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["superadmin", "admin"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await params;
  await Department.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
