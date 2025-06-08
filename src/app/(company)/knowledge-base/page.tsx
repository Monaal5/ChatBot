import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/db/supabase";
import { DocumentUpload } from "@/components/company/DocumentUpload";
import { DocumentList } from "@/components/company/DocumentList";

export default async function KnowledgeBasePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "company") {
    redirect("/login");
  }

  const companyId = session.user.companyId;

  const { data: documents, error } = await supabase
    .from("company_documents")
    .select("*")
    .eq("company_id", companyId)
    // Use "created_at" instead of "uploaded_at" based on your schema above
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error.message);
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold text-red-600">
          Failed to load documents.
        </h2>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">
          Upload documents to enhance your chatbot&apos;s knowledge.
        </p>
      </header>

      <DocumentUpload companyId={companyId} />

      <DocumentList documents={documents || []} />
    </div>
  );
}
