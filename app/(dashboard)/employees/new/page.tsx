import { connectDB } from "@/lib/db";
import { Department } from "@/models/Department";
import EmployeeForm from "@/components/EmployeeForm";

export default async function NewEmployeePage() {
  await connectDB();
  const departments = await Department.find().sort({ name: 1 }).lean();
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Employee</h2>
      <EmployeeForm departments={departments.map((d: any) => ({ _id: d._id.toString(), name: d.name }))} />
    </div>
  );
}
