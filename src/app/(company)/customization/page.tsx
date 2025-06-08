import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/db/supabase';
import { ChatbotCustomizationForm } from '@/components/company/ChatbotCustomizationForm';
import { AppearanceForm } from '@/components/company/AppearanceForm';

export default async function CustomizationPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'company') {
    redirect('/login');
  }

  // Fetch company's current customization
  const { data: company } = await supabase
    .from('companies')
    .select('customization, appearance')
    .eq('id', session.user.companyId)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Chatbot Behavior</h3>
        <p className="text-sm text-muted-foreground">
          Customize how your chatbot responds to users.
        </p>
      </div>
      <ChatbotCustomizationForm 
        initialData={company?.customization || {}} 
        companyId={session.user.companyId} 
      />

      <div className="mt-12">
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of your chatbot.
        </p>
      </div>
      <AppearanceForm 
        initialData={company?.appearance || {}} 
        companyId={session.user.companyId} 
      />
    </div>
  );
}