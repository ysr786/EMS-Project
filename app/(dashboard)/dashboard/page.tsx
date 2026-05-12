import { auth } from "@/lib/auth";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import HRDashboard from "@/components/dashboards/HRDashboard";
import EmployeeDashboard from "@/components/dashboards/EmployeeDashboard";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as any;
  const name = user?.name?.split(" ")[0] || "there";
  const email = user?.email || "";
  const role = user?.role || "employee";

  if (role === "superadmin" || role === "admin") return <AdminDashboard name={name} />;
  if (role === "hr_manager") return <HRDashboard name={name} />;
  return <EmployeeDashboard name={name} email={email} />;
}
