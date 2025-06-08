import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/db/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { OverviewChart } from '@/components/dashboard/OverViewChart';
import { RecentCompanies } from "@/components/dashboard/RecentCompanies";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  // Fetch analytics data
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: stats, error: statsError } = await supabase
    .rpc('get_admin_stats');

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_companies || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_chats || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.total_revenue || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_documents || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Monthly Growth</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentCompanies companies={companies || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}