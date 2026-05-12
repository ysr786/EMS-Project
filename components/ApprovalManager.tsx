"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Request = { _id: string; name: string; email: string; role: string; status: string; createdAt: string };

const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
  superadmin: { label: "Superadmin", color: "text-purple-700", bg: "bg-purple-100" },
  admin:      { label: "Admin",      color: "text-blue-700",   bg: "bg-blue-100"   },
  hr_manager: { label: "HR Manager", color: "text-amber-700",  bg: "bg-amber-100"  },
  employee:   { label: "Employee",   color: "text-green-700",  bg: "bg-green-100"  },
};

const avatarColors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

export default function ApprovalManager({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = requests.filter((r) => r.status === tab);
  const counts = {
    pending:  requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  async function handleAction(id: string, action: "approve" | "reject") {
    setLoading(`${id}-${action}`);
    await fetch(`/api/approvals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    router.refresh();
  }

  const tabs = [
    { key: "pending",  label: "Pending",  count: counts.pending,  dot: "bg-amber-500"  },
    { key: "approved", label: "Approved", count: counts.approved, dot: "bg-green-500"  },
    { key: "rejected", label: "Rejected", count: counts.rejected, dot: "bg-red-500"    },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1">
        {tabs.map(({ key, label, count, dot }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${tab === key ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {label}
            <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${tab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No {tab} requests</p>
            <p className="text-gray-400 text-sm mt-1">
              {tab === "pending" ? "All caught up! No requests waiting for review." : `No ${tab} requests yet.`}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Applicant", "Requested Role", "Submitted", "Status", ...(tab === "pending" ? ["Actions"] : [])].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((req, i) => {
                const meta = roleMeta[req.role] || roleMeta.employee;
                const initials = req.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                const color = avatarColors[i % avatarColors.length];
                const daysAgo = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <tr key={req._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{initials}</div>
                        <div>
                          <p className="font-semibold text-gray-900">{req.name}</p>
                          <p className="text-xs text-gray-400">{req.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      <p>{new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      <p className="mt-0.5">{daysAgo === 0 ? "Today" : `${daysAgo}d ago`}</p>
                    </td>
                    <td className="px-5 py-4">
                      {req.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending
                        </span>
                      )}
                      {req.status === "approved" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Approved
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Rejected
                        </span>
                      )}
                    </td>
                    {tab === "pending" && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleAction(req._id, "approve")}
                            disabled={!!loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer">
                            {loading === `${req._id}-approve`
                              ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                            Approve
                          </button>
                          <button onClick={() => handleAction(req._id, "reject")}
                            disabled={!!loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer">
                            {loading === `${req._id}-reject`
                              ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
