import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();

  const [totalEmployees, activeEmployees, totalDepartments, salaryAgg] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: "active" }),
    Department.countDocuments(),
    Employee.aggregate([{ $group: { _id: null, total: { $sum: "$salary" } } }]),
  ]);

  return NextResponse.json({
    totalEmployees,
    activeEmployees,
    inactiveEmployees: totalEmployees - activeEmployees,
    totalDepartments,
    totalSalary: salaryAgg[0]?.total || 0,
  });
}
