import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";
import EmployeeForm from "@/components/EmployeeForm";
import { notFound } from "next/navigation";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const [employee, departments] = await Promise.all([
    Employee.findById(id).lean(),
    Department.find().sort({ name: 1 }).lean(),
  ]);
  if (!employee) notFound();

  const emp = employee as any;
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Employee</h2>
      <EmployeeForm
        departments={departments.map((d: any) => ({ _id: d._id.toString(), name: d.name }))}
        employee={{
          _id: emp._id.toString(),
          name: emp.name,
          email: emp.email,
          phone: emp.phone || "",
          position: emp.position,
          department: emp.department.toString(),
          status: emp.status,
          joinDate: new Date(emp.joinDate).toISOString().split("T")[0],
          salary: emp.salary,
        }}
      />
    </div>
  );
}
