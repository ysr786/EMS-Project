import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { PendingRequest } from "@/models/PendingRequest";
import { Admin } from "@/models/Admin";
import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["superadmin", "admin"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action } = await req.json();
  if (!["approve", "reject"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  await connectDB();
  const { id } = await params;
  const request = await PendingRequest.findById(id);
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (action === "approve") {
    // create Admin account if not exists
    let admin = await Admin.findOne({ email: request.email });
    if (!admin) {
      admin = await Admin.create({
        name: request.name,
        email: request.email,
        password: request.password,
        role: request.role,
      });
    }

    // auto-create Employee record for employee role
    if (request.role === "employee") {
      const existingEmp = await Employee.findOne({ email: request.email });
      if (!existingEmp) {
        // use first available department or leave null workaround with a default
        const firstDept = await Department.findOne().lean<{ _id: any }>();
        if (firstDept) {
          await Employee.create({
            name: request.name,
            email: request.email,
            position: "Unassigned",
            department: firstDept._id,
            salary: 0,
            joinDate: new Date(),
            status: "active",
          });
        }
      }
    }

    await PendingRequest.findByIdAndUpdate(id, { status: "approved" });
    return NextResponse.json({ message: "User approved and account created." });
  }

  await PendingRequest.findByIdAndUpdate(id, { status: "rejected" });
  return NextResponse.json({ message: "Request rejected." });
}
