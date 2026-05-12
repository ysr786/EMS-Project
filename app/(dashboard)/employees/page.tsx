import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";
import { Admin } from "@/models/Admin";
import EmployeeFilters from "@/components/EmployeeFilters";
import Pagination from "@/components/Pagination";
import DeleteButton from "@/components/DeleteButton";
import CreateAccountButton from "@/components/CreateAccountButton";
import { auth } from "@/lib/auth";

const LIMIT = 10;

async function getEmployees(searchParams: Record<string, string>) {
  await connectDB();
  const page = parseInt(searchParams.page || "1");
  const query: any = {};
  if (searchParams.search) query.$or = [{ name: { $regex: searchParams.search, $options: "i" } }, { email: { $regex: searchParams.search, $options: "i" } }, { position: { $regex: searchParams.search, $options: "i" } }];
  if (searchParams.department) query.department = searchParams.department;
  if (searchParams.status) query.status = searchParams.status;
  const [employees, total] = await Promise.all([
    Employee.find(query).populate("department", "name").sort({ createdAt: -1 }).skip((page - 1) * LIMIT).limit(LIMIT).lean(),
    Employee.countDocuments(query),
  ]);
  return { employees, total, page, totalPages: Math.ceil(total / LIMIT) };
}

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await connectDB();
  const params = await searchParams;
  const { employees, total, page, totalPages } = await getEmployees(params);
  const departments = await Department.find().sort({ name: 1 }).lean();
  const session = await auth();
  const role = (session?.user as any)?.role;
  const canManageAccounts = ["superadmin", "admin", "hr_manager"].includes(role);

  // get emails that already have Admin accounts
  const employeeEmails = (employees as any[]).map((e) => e.email);
  const existingAccounts = await Admin.find({ email: { $in: employeeEmails } }).select("email").lean();
  const accountEmails = new Set(existingAccounts.map((a: any) => a.email));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total employee{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/employees/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <EmployeeFilters departments={departments.map((d: any) => ({ _id: d._id.toString(), name: d.name }))} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Employee", "Position", "Department", "Salary", "Status", "Joined", "Account", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {employees.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-400 font-medium">No employees found</p>
                    <p className="text-gray-300 text-xs">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            )}
            {employees.map((emp: any) => {
              const initials = emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500"];
              const color = colors[emp.name.charCodeAt(0) % colors.length];
              return (
                <tr key={emp._id.toString()} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{emp.position}</td>
                  <td className="px-5 py-4">
                    {emp.department?.name
                      ? <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">{emp.department.name}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-800">${emp.salary.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "active" ? "bg-green-500" : "bg-red-400"}`} />
                      {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{new Date(emp.joinDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="px-5 py-4">
                    {accountEmails.has(emp.email)
                      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Active</span>
                      : canManageAccounts
                        ? <CreateAccountButton employeeId={emp._id.toString()} employeeName={emp.name} />
                        : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />No Account</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/employees/${emp._id}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <Link href={`/employees/${emp._id}/salary`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-medium transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Salary
                      </Link>
                      <DeleteButton id={emp._id.toString()} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination totalPages={totalPages} currentPage={page} />
    </div>
  );
}
