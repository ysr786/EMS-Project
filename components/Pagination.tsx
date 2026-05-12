"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ totalPages, currentPage }: { totalPages: number; currentPage: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/employees?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-2">
      <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => goTo(p)}
            className={`w-9 h-9 text-sm font-medium rounded-xl transition-colors cursor-pointer ${p === currentPage ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {p}
          </button>
        ))}
        <button onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
