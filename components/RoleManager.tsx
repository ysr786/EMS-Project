"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type User = { _id: string; name: string; email: string; role: string; createdAt: string };

const ROLES = ["superadmin", "admin", "hr_manager", "employee"] as const;

const roleMeta: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  superadmin:  { label: "Superadmin",  color: "text-purple-700", bg: "bg-purple-100", dot: "bg-purple-500" },
  admin:       { label: "Admin",       color: "text-blue-700",   bg: "bg-blue-100",   dot: "bg-blue-500"   },
  hr_manager:  { label: "HR Manager",  color: "text-amber-700",  bg: "bg-amber-100",  dot: "bg-amber-500"  },
  employee:    { label: "Employee",    color: "text-green-700",  bg: "bg-green-100",  dot: "bg-green-500"  },
};

const avatarColors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

export default function RoleManager({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleRoleChange(id: string, role: string) {
    setUpdating(id);
    await fetch(`/api/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setUpdating(null);
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(null);
    if (!res.ok) return alert(data.error);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Legend */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3">
        {ROLES.map((r) => {
          const m = roleMeta[r];
          return (
            <span key={r} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
              {m.label}
            </span>
          );
        })}
        <span className="text-xs text-gray-400 ml-auto self-center">Only superadmins can change roles</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["User", "Email", "Current Role", "Change Role", "Joined", "Actions"].map((h) => (
              <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((user, i) => {
            const meta = roleMeta[user.role] || roleMeta.employee;
            const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            const color = avatarColors[i % avatarColors.length];
            const isSelf = user._id === currentUserId;

            return (
              <tr key={user._id} className={`hover:bg-gray-50/70 transition-colors ${isSelf ? "bg-blue-50/30" : ""}`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      {isSelf && <span className="text-xs text-blue-500 font-medium">You</span>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">{user.email}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {isSelf ? (
                    <span className="text-xs text-gray-400 italic">Cannot change own role</span>
                  ) : (
                    <div className="relative">
                      <select
                        defaultValue={user.role}
                        disabled={updating === user._id}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer disabled:opacity-50 pr-8"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{roleMeta[r].label}</option>
                        ))}
                      </select>
                      {updating === user._id && (
                        <svg className="w-3.5 h-3.5 animate-spin text-blue-500 absolute right-2 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4 text-gray-400 text-xs">
                  {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-5 py-4">
                  {isSelf ? (
                    <span className="text-xs text-gray-300">—</span>
                  ) : (
                    <button
                      onClick={() => handleDelete(user._id, user.name)}
                      disabled={deleting === user._id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {deleting === user._id
                        ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
