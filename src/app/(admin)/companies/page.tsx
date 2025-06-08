import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminCompaniesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, website, subscription_status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch companies:", error.message);
    return <div>Error loading companies</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">All Companies</h1>
      <div className="grid gap-4">
        {companies?.map((company) => (
          <Card key={company.id}>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>{company.name}</CardTitle>
              <Badge variant={company.subscription_status === "active" ? "default" : "secondary"}>
                {company.subscription_status}
              </Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div>Website: {company.website || "N/A"}</div>
              <div>Joined: {new Date(company.created_at).toLocaleDateString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
