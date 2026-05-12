"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SalaryRecord = { _id: string; amount: number; month: string; year: number; note: string; createdAt: string };

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function SalaryManager({ employeeId, employeeName, currentSalary, records, role }: {
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  records: SalaryRecord[];
  role: string;
}) {
  const router = useRouter();
  const now = new Date();
  const [amount, setAmount] = useState(String(currentSalary));
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canDelete = ["superadmin", "admin"].includes(role);
  const totalPaid = records.reduce((sum, r) => sum + r.amount, 0);
  const avgSalary = records.length ? Math.round(totalPaid / records.length) : 0;
  const highest = records.length ? Math.max(...records.map((r) => r.amount)) : 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch(`/api/employees/${employeeId}/salary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), month, year: Number(year), note }),
    });
    setLoading(false);
    if (!res.ok) { setError("Failed to add record"); return; }
    setNote("");
    setSuccess("Salary record added successfully.");
    router.refresh();
  }

  async function handleDelete(recordId: string) {
    if (!confirm("Delete this salary record?")) return;
    setDeletingId(recordId);
    await fetch(`/api/employees/${employeeId}/salary/${recordId}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left: form + stats */}
      <div className="space-y-5">
        {/* Add form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Add Salary Record</h3>
              <p className="text-xs text-gray-400">Log a payment for {employeeName.split(" ")[0]}</p>
            </div>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Amount ($)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min={0}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Month</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer">
                  {MONTHS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Year</label>
                <select value={year} onChange={(e) => setYear(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer">
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Note <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Bonus, Increment..."
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-green-700 text-xs">{success}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold transition-all cursor-pointer">
              {loading
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Saving...</>
                : "Add Record"}
            </button>
          </form>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Summary</h3>
          {[
            { label: "Total Records", value: records.length, color: "text-blue-600" },
            { label: "Total Paid", value: `$${totalPaid.toLocaleString()}`, color: "text-green-600" },
            { label: "Average Salary", value: `$${avgSalary.toLocaleString()}`, color: "text-purple-600" },
            { label: "Highest Payment", value: `$${highest.toLocaleString()}`, color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-500">{label}</span>
              <span className={`text-sm font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: records table */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Payment History</h3>
            <span className="text-xs text-gray-400">{records.length} record{records.length !== 1 ? "s" : ""}</span>
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No salary records yet</p>
              <p className="text-gray-400 text-sm mt-1">Add the first record using the form</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Period", "Amount", "Note", "Added On", ...(canDelete ? [""] : [])].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((rec, i) => (
                  <tr key={rec._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{rec.month} {rec.year}</p>
                          <p className="text-xs text-gray-400">Record #{records.length - i}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-lg font-bold text-green-600">${rec.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      {rec.note
                        ? <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">{rec.note}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(rec.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    {canDelete && (
                      <td className="px-5 py-4">
                        <button onClick={() => handleDelete(rec._id)} disabled={deletingId === rec._id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer">
                          {deletingId === rec._id
                            ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                            : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
