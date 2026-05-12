import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const users = await Admin.find().select("-password").sort({ createdAt: -1 }).lean();
  return NextResponse.json(users);
}
