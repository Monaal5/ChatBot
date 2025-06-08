import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/db/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewChart } from "@/components/dashboard/OverViewChart";

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const [
    { data: stats, error: statsError },
    { data: growth, error: growthError }
  ] = await Promise.all([
    supabase.rpc("get_admin_stats"),
    supabase.rpc("get_monthly_growth")
  ]);

  if (statsError || growthError) {
    console.error("Analytics fetch error:", { statsError, growthError });
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Companies" value={stats?.total_companies ?? 0} />
        <DashboardCard title="Revenue" value={`$${stats?.total_revenue ?? 0}`} />
        <DashboardCard title="Documents" value={stats?.total_documents ?? 0} />
        <DashboardCard title="Active Chats" value={stats?.active_chats ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <OverviewChart data={growth ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
