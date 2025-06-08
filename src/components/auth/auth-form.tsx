"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

type AuthFormProps = {
  action: "login" | "register";
  defaultRole?: "company" | "customer";
  callbackUrl?: string;
};

type AuthFormSchema = z.infer<typeof loginSchema> | z.infer<typeof registerSchema>;

export function AuthForm({ action, defaultRole, callbackUrl }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schema = action === "login" ? loginSchema : registerSchema;

  const form = useForm<AuthFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      ...(action === "register" && {
        name: "",
        role: defaultRole || "customer",
      }),
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      if (action === "login") {
        const res = await signIn("credentials", {
          ...values,
          redirect: false,
          callbackUrl: callbackUrl || "/",
        });

        if (res?.error) {
          router.push("/login?error=CredentialsSignin");
          return;
        }

        router.push(res?.url || "/");
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(values),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const error = await res.json();
          if (error.code === "P2002") {
            router.push("/register?error=EmailAlreadyExists");
            return;
          }
          throw new Error(error.message || "Registration failed");
        }

        await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: true,
          callbackUrl: callbackUrl || "/",
        });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {action === "register" && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {action === "register" && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full">
          {action === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>
    </Form>
  );
}