import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password)
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

  await connectDB();
  const admin = await Admin.findOne({ email });
  if (!admin || !(await bcrypt.compare(password, admin.password)))
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  return NextResponse.json({
    user: { id: admin._id.toString(), name: admin.name, email: admin.email, role: admin.role },
  });
}
