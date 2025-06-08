import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/db/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { OverviewChart } from "@/components/dashboard/OverViewChart";
import { RecentCompanies } from "@/components/dashboard/RecentCompanies";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/auth/login");
  }

  const [
    { data: companies, error: companiesError },
    { data: stats, error: statsError },
    { data: growthData, error: growthError }
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.rpc("get_admin_stats"),
    supabase.rpc("get_monthly_growth")
  ]);

  if (companiesError || statsError || growthError) {
    console.error("Error fetching dashboard data:", {
      companiesError,
      statsError,
      growthError
    });
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-4">Dashboard Error</h2>
        <p className="text-red-600">Failed to load dashboard data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Total Companies" value={stats?.total_companies ?? 0} />
        <DashboardCard title="Active Chats" value={stats?.active_chats ?? 0} />
        <DashboardCard title="Revenue" value={`$${stats?.total_revenue ?? 0}`} />
        <DashboardCard title="Documents Processed" value={stats?.total_documents ?? 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Monthly Growth</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={growthData ?? []} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentCompanies companies={companies ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
