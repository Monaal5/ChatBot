import { AuthForm } from "@/components/auth/auth-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string };
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-background p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Enter your credentials to access your account
          </p>
        </div>

        <AuthForm action="login" callbackUrl={searchParams.callbackUrl} />

        {searchParams.error === "CredentialsSignin" && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Invalid email or password
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}