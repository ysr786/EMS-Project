import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["superadmin", "admin", "hr_manager"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;
  const emp = await Employee.findById(id).select("name email position salary salaryRecords").lean();
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(emp);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["superadmin", "admin", "hr_manager"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { amount, month, year, note } = await req.json();
  if (!amount || !month || !year)
    return NextResponse.json({ error: "Amount, month and year are required" }, { status: 400 });

  await connectDB();
  const { id } = await params;
  const emp = await Employee.findById(id);
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  emp.salaryRecords.push({ amount: Number(amount), month, year: Number(year), note: note || "" } as any);
  emp.salary = Number(amount); // update current salary
  await emp.save();
  return NextResponse.json(emp, { status: 201 });
}
