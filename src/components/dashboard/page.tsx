import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { OverviewChart } from './OverViewChart';
import { RecentCompanies } from "@/components/dashboard/RecentCompanies";
import { Company } from '../../../types/company';

const mockCompanies: Company[] = [
  {
    id: "1",
    name: "Acme Inc",
    status: "active",
    joinDate: "2023-10-15",
    plan: "pro" as const
  },
  {
    id: "2",
    name: "Globex Corp",
    status: "pending",
    joinDate: "2023-10-10",
    plan: "free" as const
  },
  // Add more mock data as needed, using only "pro", "free", or "enterprise" for plan
];

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$45,231.89</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <OverviewChart data={[
              { month: "Jan", growth: 10 },
              { month: "Feb", growth: 15 },
              { month: "Mar", growth: 20 },
              // Add more data as needed
            ]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentCompanies companies={mockCompanies} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}