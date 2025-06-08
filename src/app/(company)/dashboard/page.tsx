import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/db/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function CompanyDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "company") {
    redirect("/login");
  }

  // Fetch company stats
  const companyId = session.user.companyId;

  const [
    { count: docCount, error: docCountError },
    { count: chatCount, error: chatCountError },
  ] = await Promise.all([
    supabase
      .from("company_documents")
      .select("id", { count: "exact" })
      .eq("company_id", companyId),
    supabase
      .from("chats")
      .select("id", { count: "exact" })
      .eq("company_id", companyId),
  ]);

  if (docCountError || chatCountError) {
    console.error("Error fetching company dashboard stats", {
      docCountError,
      chatCountError,
    });
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold">Company Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <DashboardCard title="Documents Uploaded" value={docCount ?? 0} />
        <DashboardCard title="Chats Conducted" value={chatCount ?? 0} />
        {/* You can add more cards here for other stats */}
      </div>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-150">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}

