import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import SalaryManager from "@/components/SalaryManager";

export default async function SalaryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["superadmin", "admin", "hr_manager"].includes(role)) redirect("/dashboard");

  await connectDB();
  const { id } = await params;
  const emp = await Employee.findById(id).populate("department", "name").lean<any>();
  if (!emp) notFound();

  const totalPaid = emp.salaryRecords?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/employees" className="hover:text-gray-600 transition-colors">Employees</Link>
            <span>/</span>
            <span className="text-gray-600 font-medium">{emp.name}</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Salary Records</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Records</h1>
          <p className="text-gray-500 text-sm mt-1">{emp.salaryRecords?.length || 0} record{emp.salaryRecords?.length !== 1 ? "s" : ""} · Total paid: <span className="font-semibold text-gray-700">${totalPaid.toLocaleString()}</span></p>
        </div>
        <Link href={`/employees/${id}`}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Profile
        </Link>
      </div>

      {/* Employee summary card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-blue-100">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-xl font-bold border border-white/20 shrink-0">
            {emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold">{emp.name}</p>
            <p className="text-blue-200 text-sm">{emp.position} · {emp.department?.name}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Current Salary</p>
            <p className="text-2xl font-bold">${emp.salary.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <SalaryManager
        employeeId={id}
        employeeName={emp.name}
        currentSalary={emp.salary}
        records={(emp.salaryRecords || []).map((r: any) => ({
          _id: r._id.toString(),
          amount: r.amount,
          month: r.month,
          year: r.year,
          note: r.note || "",
          createdAt: r.createdAt,
        })).reverse()}
        role={role}
      />
    </div>
  );
}
