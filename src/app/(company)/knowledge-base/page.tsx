import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/db/supabase';
import { DocumentUpload } from '@/components/company/DocumentUpload';
import { DocumentList } from '@/components/company/DocumentList';

export default async function KnowledgeBasePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'company') {
    redirect('/login');
  }

  const { data: documents } = await supabase
    .from('company_documents')
    .select('*')
    .eq('company_id', session.user.companyId)
    .order('uploaded_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Knowledge Base</h3>
        <p className="text-sm text-muted-foreground">
          Upload documents to enhance your chatbot's knowledge
        </p>
      </div>

      <DocumentUpload companyId={session.user.companyId} />

      <DocumentList documents={documents || []} />
    </div>
  );
}