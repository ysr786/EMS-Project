import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; recordId: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["superadmin", "admin"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id, recordId } = await params;
  const emp = await Employee.findById(id);
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  emp.salaryRecords = emp.salaryRecords.filter((r: any) => r._id.toString() !== recordId);
  await emp.save();
  return NextResponse.json({ success: true });
}
