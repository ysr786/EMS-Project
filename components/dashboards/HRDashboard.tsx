import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";
import { connectDB } from "@/lib/db";
import Link from "next/link";

const avatarColors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

export default async function HRDashboard({ name }: { name: string }) {
  await connectDB();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalEmployees,
    activeEmployees,
    totalDepartments,
    newThisMonth,
    newLastMonth,
    recentHires,
    departments,
    allEmployees,
    deptCounts,
  ] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: "active" }),
    Department.countDocuments(),
    Employee.countDocuments({ createdAt: { $gte: thisMonthStart } }),
    Employee.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }),
    Employee.find().populate("department", "name").sort({ createdAt: -1 }).limit(5).lean(),
    Department.find().lean(),
    Employee.find({ status: "active" }).select("name joinDate").lean(),
    Employee.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]),
  ]);

  const inactiveEmployees = totalEmployees - activeEmployees;
  const retentionRate = totalEmployees ? Math.round((activeEmployees / totalEmployees) * 100) : 0;
  const newHireGrowth = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : 0;

  // Department breakdown
  const deptMap = new Map(deptCounts.map((d: any) => [d._id.toString(), d.count]));
  const deptBreakdown = departments
    .map((d: any) => ({ name: d.name, count: deptMap.get(d._id.toString()) || 0 }))
    .sort((a: any, b: any) => b.count - a.count);

  // Work anniversaries this month
  const anniversaries = (allEmployees as any[])
    .filter((e) => {
      const join = new Date(e.joinDate);
      return join.getMonth() === now.getMonth() && join.getDate() >= now.getDate();
    })
    .map((e) => ({
      name: e.name,
      years: now.getFullYear() - new Date(e.joinDate).getFullYear(),
      date: new Date(e.joinDate),
    }))
    .filter((e) => e.years > 0)
    .sort((a, b) => a.date.getDate() - b.date.getDate())
    .slice(0, 4);

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  const kpiCards = [
    {
      label: "Total Headcount", value: totalEmployees,
      sub: `${newThisMonth} joined this month`,
      text: "text-blue-600", iconBg: "bg-blue-600", bar: "bg-blue-100",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      label: "Retention Rate", value: `${retentionRate}%`,
      sub: `${activeEmployees} active employees`,
      text: "text-green-600", iconBg: "bg-green-600", bar: "bg-green-100",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
    {
      label: "Inactive / On Leave", value: inactiveEmployees,
      sub: inactiveEmployees > 0 ? "Requires follow-up" : "All staff active",
      text: inactiveEmployees > 0 ? "text-red-600" : "text-gray-500",
      iconBg: inactiveEmployees > 0 ? "bg-red-500" : "bg-gray-400", bar: "bg-red-100",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Departments", value: totalDepartments,
      sub: `${deptBreakdown.filter((d: any) => d.count > 0).length} with active staff`,
      text: "text-purple-600", iconBg: "bg-purple-600", bar: "bg-purple-100",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            HR Manager
          </span>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's your workforce overview for today.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-700">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <p className="text-xs text-gray-400 mt-0.5">{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map(({ label, value, sub, text, iconBg, bar, icon }) => (
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
            <div className={`mt-4 h-1.5 rounded-full ${bar}`}>
              <div className={`h-1.5 rounded-full ${iconBg} opacity-50`} style={{ width: `${Math.min(retentionRate, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* New hires banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg shadow-amber-100 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -left-4 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <p className="text-amber-100 text-xs font-semibold uppercase tracking-wide">New Hires This Month</p>
          <p className="text-4xl font-bold mt-1">{newThisMonth}</p>
          <p className="text-amber-100 text-xs mt-1">
            {newHireGrowth >= 0 ? `↑ ${newHireGrowth}%` : `↓ ${Math.abs(newHireGrowth)}%`} vs last month ({newLastMonth})
          </p>
        </div>
        <Link href="/employees/new" className="relative z-10 flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2.5 rounded-xl text-sm font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </Link>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Department breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Workforce by Department</h3>
              <p className="text-xs text-gray-400 mt-0.5">Active employees distribution</p>
            </div>
            <Link href="/departments" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Manage →</Link>
          </div>
          {deptBreakdown.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No departments yet</p>
            : (
              <div className="space-y-4">
                {deptBreakdown.map((dept: any, i: number) => {
                  const pct = activeEmployees > 0 ? Math.round((dept.count / activeEmployees) * 100) : 0;
                  const barColors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
                  const textColors = ["text-blue-600", "text-purple-600", "text-green-600", "text-orange-600", "text-pink-600", "text-teal-600"];
                  const bgColors = ["bg-blue-50", "bg-purple-50", "bg-green-50", "bg-orange-50", "bg-pink-50", "bg-teal-50"];
                  return (
                    <div key={dept.name} className="flex items-center gap-4">
                      <div className={`w-9 h-9 ${bgColors[i % bgColors.length]} rounded-xl flex items-center justify-center shrink-0`}>
                        <span className={`text-xs font-bold ${textColors[i % textColors.length]}`}>{dept.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-800">{dept.name}</span>
                          <span className="text-xs font-semibold text-gray-500">{dept.count} <span className="text-gray-300">·</span> {pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-2 ${barColors[i % barColors.length]} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* Work anniversaries */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Work Anniversaries</h3>
              <p className="text-xs text-gray-400">This month</p>
            </div>
          </div>
          {anniversaries.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-gray-400 text-sm">No anniversaries this month</p>
              </div>
            )
            : (
              <div className="space-y-3">
                {anniversaries.map((a, i) => {
                  const initials = a.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-9 h-9 ${avatarColors[i % avatarColors.length]} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                      </div>
                      <span className="px-2 py-1 bg-pink-50 text-pink-600 text-xs font-semibold rounded-lg shrink-0">{a.years}yr</span>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent hires */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recent Hires</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest onboarded employees</p>
            </div>
            <Link href="/employees" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
          </div>
          <div className="space-y-2">
            {recentHires.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No employees yet</p>}
            {recentHires.map((emp: any) => {
              const initials = emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const color = avatarColors[emp.name.charCodeAt(0) % avatarColors.length];
              const daysAgo = Math.floor((now.getTime() - new Date(emp.createdAt).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={emp._id.toString()} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400 truncate">{emp.position} · {(emp.department as any)?.name || "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{emp.status}</span>
                    <p className="text-xs text-gray-300 mt-1">{daysAgo === 0 ? "Today" : `${daysAgo}d ago`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { href: "/employees/new", label: "Add New Employee", desc: "Onboard a team member", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z", color: "bg-blue-50 text-blue-600", hover: "hover:bg-blue-100" },
              { href: "/employees", label: "Manage Employees", desc: "View & edit records", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "bg-purple-50 text-purple-600", hover: "hover:bg-purple-100" },
              { href: "/departments", label: "Departments", desc: "Manage teams & divisions", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "bg-green-50 text-green-600", hover: "hover:bg-green-100" },
              { href: "/employees?status=inactive", label: "Inactive Employees", desc: "Review & take action", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-red-50 text-red-600", hover: "hover:bg-red-100" },
            ].map(({ href, label, desc, icon, color, hover }) => (
              <Link key={href} href={href} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${hover} group`}>
                <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center shrink-0`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
