import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/db/supabase";
import { ChatbotCustomizationForm } from "@/components/company/ChatbotCustomizationForm";
import { AppearanceForm } from "@/components/company/AppearanceForm";

export default async function CustomizationPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "company") {
    redirect("/login");
  }

  const companyId = session.user.companyId;

  const { data: company, error } = await supabase
    .from("companies")
    .select("customization, appearance")
    .eq("id", companyId)
    .single();

  if (error) {
    console.error("Failed to fetch customization data:", error.message);
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold text-red-600">Error loading customization settings.</h2>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 max-w-4xl mx-auto">
      <section>
        <h2 className="text-2xl font-bold">Chatbot Behavior</h2>
        <p className="text-muted-foreground mb-4">
          Customize how your chatbot responds to users.
        </p>
        <ChatbotCustomizationForm
          initialData={company?.customization || {}}
          companyId={companyId}
        />
      </section>

      <section className="pt-10 border-t">
        <h2 className="text-2xl font-bold">Appearance</h2>
        <p className="text-muted-foreground mb-4">
          Customize the look and feel of your chatbot.
        </p>
        <AppearanceForm
          initialData={company?.appearance || {}}
          companyId={companyId}
        />
      </section>
    </div>
  );
}
