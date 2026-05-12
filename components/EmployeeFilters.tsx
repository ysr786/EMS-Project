"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function EmployeeFilters({ departments }: { departments: { _id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`/employees?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input type="text" placeholder="Search name, email, position..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => update("search", e.target.value)}
          className="border border-gray-200 bg-gray-50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all w-72" />
      </div>
      <select defaultValue={searchParams.get("department") || ""}
        onChange={(e) => update("department", e.target.value)}
        className="border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all cursor-pointer">
        <option value="">All Departments</option>
        {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
      </select>
      <select defaultValue={searchParams.get("status") || ""}
        onChange={(e) => update("status", e.target.value)}
        className="border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all cursor-pointer">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
