import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type UserRole = 'admin' | 'company' | 'customer';

export default async function Home() {
  const session = await auth();

  const roleRedirectMap: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    company: '/company/dashboard',
    customer: '/chat',
  };

  const userRole = session?.user?.role as UserRole | undefined;

  if (userRole && roleRedirectMap[userRole]) {
    return redirect(roleRedirectMap[userRole]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background">
      <header className="container py-6">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">MarketingBot</h1>
          <div className="flex items-center space-x-4">
            <Link href="/login" aria-label="Login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register" aria-label="Register">
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
              <Button size="lg" aria-label="Register as company">
                For Companies
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" aria-label="Try demo">
                Live Demo
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-24 grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Knowledge Base Integration",
              description: "Upload your documents and provide accurate answers from your company resources."
            },
            {
              title: "AI-Powered Responses",
              description: "When answers aren't in your docs, our AI generates helpful responses."
            },
            {
              title: "White-Label Solution",
              description: "Fully customizable widget to match your brand identity."
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="bg-background p-6 rounded-lg border hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
