import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Admin } from "@/models/Admin";
import { PendingRequest } from "@/models/PendingRequest";
import bcrypt from "bcryptjs";

function generatePassword(name: string): string {
  const base = name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}@${suffix}`;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["superadmin", "admin", "hr_manager"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;

  const employee = await Employee.findById(id).lean<{ name: string; email: string }>();
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const existing = await Admin.findOne({ email: employee.email });
  if (existing) return NextResponse.json({ error: "Account already exists for this employee" }, { status: 409 });

  const plainPassword = generatePassword(employee.name);
  const hashed = await bcrypt.hash(plainPassword, 10);

  await Admin.create({
    name: employee.name,
    email: employee.email,
    password: hashed,
    role: "employee",
  });

  // remove any stale pending request for this email
  await PendingRequest.deleteOne({ email: employee.email });

  return NextResponse.json({
    message: "Account created successfully.",
    credentials: { email: employee.email, password: plainPassword },
  }, { status: 201 });
}
