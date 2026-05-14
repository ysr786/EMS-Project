"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const deptColors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-red-500"];

export default function DepartmentManager({ departments, canWrite = true }: { departments: { _id: string; name: string; description?: string }[]; canWrite?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = editId ? `/api/departments/${editId}` : "/api/departments";
    const method = editId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
    setName(""); setDescription(""); setEditId(null);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this department?")) return;
    setDeletingId(id);
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  function startEdit(dept: { _id: string; name: string; description?: string }) {
    setEditId(dept._id); setName(dept.name); setDescription(dept.description || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() { setEditId(null); setName(""); setDescription(""); }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6`}>
      {/* Form - hidden for HR */}
      {canWrite && (
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${editId ? "bg-amber-100" : "bg-blue-100"}`}>
              <svg className={`w-5 h-5 ${editId ? "text-amber-600" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {editId
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />}
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{editId ? "Edit Department" : "New Department"}</h3>
              <p className="text-xs text-gray-400">{editId ? "Update department details" : "Add a new team or division"}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Department Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Description <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all resize-none"
                placeholder="Brief description of this department..." />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 cursor-pointer ${editId ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}>
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving...
                  </>
                ) : editId ? "Update Department" : "Add Department"}
              </button>
              {editId && (
                <button type="button" onClick={cancelEdit}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      )}

      {/* Department cards */}
      <div className={canWrite ? "lg:col-span-2" : "lg:col-span-3"}>
        {departments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No departments yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first department using the form</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {departments.map((dept, i) => {
              const color = deptColors[i % deptColors.length];
              const initials = dept.name.slice(0, 2).toUpperCase();
              return (
                <div key={dept._id} className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all duration-150 group ${editId === dept._id ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canWrite && (
                        <button onClick={() => startEdit(dept)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {canWrite && (
                        <button onClick={() => handleDelete(dept._id)} disabled={deletingId === dept._id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50">
                          {deletingId === dept._id
                            ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{dept.description || "No description provided"}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
