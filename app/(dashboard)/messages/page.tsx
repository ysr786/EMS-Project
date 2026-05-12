import { auth } from "@/lib/auth";
import MessagesClient from "@/components/MessagesClient";

export default async function MessagesPage() {
  const session = await auth();
  const user = session?.user as any;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 text-sm mt-1">Communicate with your team members.</p>
      </div>
      <MessagesClient currentUserId={user?.id} currentUserName={user?.name || ""} />
    </div>
  );
}
