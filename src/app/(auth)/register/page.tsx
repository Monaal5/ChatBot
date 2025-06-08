import { AuthForm } from "@/components/auth/auth-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { role?: string; error?: string };
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-background p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            {searchParams.role === "company" ? "Company Registration" : "Create an account"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter your details to get started
          </p>
        </div>

        <AuthForm 
          action="register" 
          defaultRole={searchParams.role === "company" ? "company" : "customer"} 
        />

        {searchParams.error === "EmailAlreadyExists" && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            An account with this email already exists
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}