import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { PendingRequest } from "@/models/PendingRequest";
import ApprovalManager from "@/components/ApprovalManager";

export default async function ApprovalsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["superadmin", "admin"].includes(role)) redirect("/dashboard");

  await connectDB();
  const requests = await PendingRequest.find().sort({ createdAt: -1 }).lean();
  const pending = requests.filter((r: any) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Approvals</h1>
          <p className="text-gray-500 text-sm mt-1">{requests.length} total request{requests.length !== 1 ? "s" : ""}</p>
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-xl text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pending} pending approval{pending !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      <ApprovalManager requests={requests.map((r: any) => ({
        _id: r._id.toString(),
        name: r.name,
        email: r.email,
        role: r.role,
        status: r.status,
        createdAt: r.createdAt,
      }))} />
    </div>
  );
}
