import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Admin } from "@/models/Admin";
import { PendingRequest } from "@/models/PendingRequest";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const department = searchParams.get("department") || "";
  const status = searchParams.get("status") || "";

  const query: any = {};
  if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }, { position: { $regex: search, $options: "i" } }];
  if (department) query.department = department;
  if (status) query.status = status;

  const total = await Employee.countDocuments(query);
  const employees = await Employee.find(query)
    .populate("department", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return NextResponse.json({ employees, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (![ "superadmin", "admin"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { password, role: employeeRole, ...body } = await req.json();
  const employee = await Employee.create(body);

  if (password?.trim()) {
    const existing = await Admin.findOne({ email: body.email });
    if (!existing) {
      const hashed = await bcrypt.hash(password.trim(), 10);
      const ALLOWED = ["superadmin", "admin", "hr_manager", "employee"];
      await Admin.create({ name: body.name, email: body.email, password: hashed, role: ALLOWED.includes(employeeRole) ? employeeRole : "employee", mustChangePassword: true });
      await PendingRequest.deleteOne({ email: body.email });
    }
  }

  return NextResponse.json(employee, { status: 201 });
}
