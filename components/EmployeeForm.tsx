"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Department = { _id: string; name: string };
type Employee = { _id?: string; name: string; email: string; phone?: string; position: string; department: string; role?: string; status: string; joinDate: string; salary: number };

const inputClass = "w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all";

export default function EmployeeForm({ departments, employee }: { departments: Department[]; employee?: Employee }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isNew = !employee?._id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const positionName = form.get("position") as string;
    const matchedDept = departments.find((d) => d.name === positionName);
    const data: any = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      position: positionName,
      department: matchedDept?._id || employee?.department,
      status: form.get("status"),
      joinDate: form.get("joinDate"),
      salary: Number(form.get("salary")),
      role: form.get("role"),
    };
    if (isNew) {
      const pwd = (form.get("password") as string)?.trim();
      if (pwd) data.password = pwd;
    }

    const url = employee?._id ? `/api/employees/${employee._id}` : "/api/employees";
    const method = employee?._id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

    setLoading(false);
    if (!res.ok) { setError("Failed to save employee"); return; }
    router.push("/employees");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Full Name</label>
          <input name="name" type="text" required defaultValue={employee?.name || ""}
            placeholder="John Doe" className={inputClass} />
        </div>
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email</label>
          <input name="email" type="email" required defaultValue={employee?.email || ""}
            placeholder="john@company.com" className={inputClass} />
        </div>
        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Phone <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
          <input name="phone" type="text" defaultValue={employee?.phone || ""}
            placeholder="+1 234 567 8900" className={inputClass} />
        </div>
        {/* Position / Role - dropdown from departments */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Role</label>
          <select name="position" required defaultValue={employee?.position || ""}
            className={inputClass + " cursor-pointer"}>
            <option value="">Select role</option>
            {departments.map((d) => <option key={d._id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        {/* Salary */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Salary ($)</label>
          <input name="salary" type="number" required min={0} defaultValue={employee?.salary || ""}
            placeholder="5000" className={inputClass} />
        </div>
        {/* Join Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Join Date</label>
          <input name="joinDate" type="date" required defaultValue={employee?.joinDate || ""}
            className={inputClass} />
        </div>
        {/* Department - commented out, Role/Position dropdown used instead */}
        {/* <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Department</label>
          <select name="department" required defaultValue={employee?.department || ""}
            className={inputClass + " cursor-pointer"}>
            <option value="">Select department</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div> */}
        {/* Role */}
        {/* <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Role</label>
          <select name="role" defaultValue={employee?.role || "employee"}
            className={inputClass + " cursor-pointer"}>
            <option value="employee">Employee</option>
            <option value="hr_manager">HR Manager</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div> */}
        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Status</label>
          <select name="status" defaultValue={employee?.status || "active"}
            className={inputClass + " cursor-pointer"}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Password — only for new employees */}
      {isNew && (
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">System Account Credentials</p>
              <p className="text-xs text-gray-400">Set a password to create a login account for this employee</p>
            </div>
          </div>
          <div className="relative max-w-sm">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Password <span className="text-gray-400 normal-case font-normal">(optional — creates login account)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input name="password" type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                className={inputClass + " pl-10 pr-10"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                {showPassword
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Leave blank to add employee without a login account. You can issue credentials later from the employees list.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors cursor-pointer">
          {loading ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Saving...</>
          ) : employee?._id ? "Update Employee" : "Add Employee"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}
