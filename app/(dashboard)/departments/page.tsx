import { connectDB } from "@/lib/db";
import { Department } from "@/models/Department";
import DepartmentManager from "@/components/DepartmentManager";

export default async function DepartmentsPage() {
  await connectDB();
  const departments = await Department.find().sort({ name: 1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 text-sm mt-1">{departments.length} department{departments.length !== 1 ? "s" : ""} configured</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl text-sm font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {departments.length} Total
        </div>
      </div>

      <DepartmentManager departments={departments.map((d: any) => ({ _id: d._id.toString(), name: d.name, description: d.description }))} />
    </div>
  );
}
