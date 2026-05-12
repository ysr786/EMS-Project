import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  await connectDB();
  const user = await Admin.findById(userId).select("-password").lean<{
    _id: any; name: string; email: string; role: string; createdAt: Date;
  }>();

  if (!user) return <p className="text-gray-500">User not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your personal information and password.</p>
      </div>
      <ProfileClient user={{
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      }} />
    </div>
  );
}
