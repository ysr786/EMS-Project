import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import RoleManager from "@/components/RoleManager";

export default async function RolesPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") redirect("/dashboard");

  await connectDB();
  const users = await Admin.find().select("-password").sort({ createdAt: -1 }).lean();
  const currentUserId = (session.user as any).id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} user{users.length !== 1 ? "s" : ""} in the system</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Superadmin Only
        </div>
      </div>
      <RoleManager users={users.map((u: any) => ({ _id: u._id.toString(), name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }))} currentUserId={currentUserId} />
    </div>
  );
}
