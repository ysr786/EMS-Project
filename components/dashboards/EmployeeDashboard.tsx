import { Employee } from "@/models/Employee";
import { connectDB } from "@/lib/db";

export default async function EmployeeDashboard({ name, email }: { name: string; email: string }) {
  await connectDB();
  const emp = await Employee.findOne({ email }).populate("department", "name").lean<any>();
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  if (!emp) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome to the Employee Management System.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">No employee profile linked</p>
          <p className="text-gray-400 text-sm mt-1">Your account ({email}) is not linked to an employee record yet. Please contact your HR manager.</p>
        </div>
      </div>
    );
  }

  const initials = emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const joinDate = new Date(emp.joinDate);
  const monthsWorked = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

  const infoCards = [
    { label: "Position", value: emp.position, icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Department", value: emp.department?.name || "—", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Monthly Salary", value: `$${emp.salary.toLocaleString()}`, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-600", bg: "bg-green-50" },
    { label: "Tenure", value: `${monthsWorked} months`, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Employee</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's your personal profile overview.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-700">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <p className="text-xs text-gray-400 mt-0.5">{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-gradient-to-br from-green-600 to-teal-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-green-200">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-xl font-bold">{emp.name}</p>
            <p className="text-green-200 text-sm">{emp.email}</p>
            {emp.phone && <p className="text-green-200 text-sm">{emp.phone}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${emp.status === "active" ? "bg-white/20 text-white" : "bg-red-400/30 text-red-100"}`}>
                {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
              </span>
              <span className="text-green-200 text-xs">Joined {joinDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {infoCards.map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Salary history */}
      {emp.salaryRecords?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Salary History</h3>
          <div className="space-y-2">
            {[...emp.salaryRecords].reverse().slice(0, 6).map((rec: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{rec.month} {rec.year}</p>
                  {rec.note && <p className="text-xs text-gray-400">{rec.note}</p>}
                </div>
                <span className="text-sm font-semibold text-green-600">${rec.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
