import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";
import { connectDB } from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboard({ name }: { name: string }) {
  await connectDB();
  const [totalEmployees, activeEmployees, totalDepartments, salaryAgg, recentEmployees] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: "active" }),
    Department.countDocuments(),
    Employee.aggregate([{ $group: { _id: null, total: { $sum: "$salary" } } }]),
    Employee.find().populate("department", "name").sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  const inactiveEmployees = totalEmployees - activeEmployees;
  const totalSalary = salaryAgg[0]?.total || 0;
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  const cards = [
    { label: "Total Employees", value: totalEmployees, sub: "All time", text: "text-blue-600", iconBg: "bg-blue-600", bar: "bg-blue-50", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "Active", value: activeEmployees, sub: `${totalEmployees ? Math.round((activeEmployees / totalEmployees) * 100) : 0}% of total`, text: "text-green-600", iconBg: "bg-green-600", bar: "bg-green-50", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Inactive", value: inactiveEmployees, sub: `${totalEmployees ? Math.round((inactiveEmployees / totalEmployees) * 100) : 0}% of total`, text: "text-red-600", iconBg: "bg-red-500", bar: "bg-red-50", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Departments", value: totalDepartments, sub: "Active teams", text: "text-purple-600", iconBg: "bg-purple-600", bar: "bg-purple-50", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's your organization overview.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-700">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <p className="text-xs text-gray-400 mt-0.5">{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map(({ label, value, sub, text, iconBg, bar, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-3xl font-bold mt-2 ${text}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
              <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
            </div>
            <div className={`mt-4 h-1 rounded-full ${bar}`}>
              <div className={`h-1 rounded-full ${iconBg} opacity-60`} style={{ width: "60%" }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Total Monthly Salary</p>
            <p className="text-3xl font-bold mt-2">${totalSalary.toLocaleString()}</p>
            <p className="text-blue-200 text-xs mt-1">Across {activeEmployees} active employees</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-900">Recently Added Employees</h3>
            <Link href="/employees" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentEmployees.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No employees yet</p>}
            {recentEmployees.map((emp: any) => {
              const initials = emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500"];
              const color = colors[emp.name.charCodeAt(0) % colors.length];
              return (
                <div key={emp._id.toString()} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400 truncate">{emp.position} · {(emp.department as any)?.name || "—"}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{emp.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
