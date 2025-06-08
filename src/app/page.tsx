import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    switch (session.user.role) {
      case 'admin':
        redirect('/admin/dashboard');
      case 'company':
        redirect('/company/dashboard');
      case 'customer':
        redirect('/chat');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background">
      <header className="container py-6">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">MarketingBot</h1>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container py-16">
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AI-Powered Chatbot Solution for Your Marketing Needs
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Enhance customer engagement with our intelligent chatbot that combines your knowledge base with generative AI capabilities.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register?role=company">
              <Button size="lg">For Companies</Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                Live Demo
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-background p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-3">Knowledge Base Integration</h3>
            <p className="text-muted-foreground">
              Upload your documents and provide accurate answers from your company resources.
            </p>
          </div>
          <div className="bg-background p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-3">AI-Powered Responses</h3>
            <p className="text-muted-foreground">
              When answers aren't in your docs, our AI generates helpful responses.
            </p>
          </div>
          <div className="bg-background p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-3">White-Label Solution</h3>
            <p className="text-muted-foreground">
              Fully customizable widget to match your brand identity.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}