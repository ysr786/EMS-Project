import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import { Department } from "@/models/Department";

export async function GET() {
  await connectDB();

  const existing = await Admin.findOne({ email: "admin@company.com" });
  if (existing) return NextResponse.json({ message: "Already seeded" });

  const password = await bcrypt.hash("admin123", 10);
  await Admin.create({ name: "Super Admin", email: "admin@company.com", password, role: "superadmin" });

  await Department.insertMany([
    { name: "Engineering", description: "Software development team" },
    { name: "Human Resources", description: "HR and recruitment" },
    { name: "Finance", description: "Finance and accounting" },
    { name: "Marketing", description: "Marketing and growth" },
  ]);

  return NextResponse.json({ message: "Seeded successfully", credentials: { email: "admin@company.com", password: "admin123" } });
}
