import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";
import Credentials from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { createClient } from '@supabase/supabase-js';
import { compare } from 'bcryptjs';
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { Session, DefaultSession } from "next-auth";

// 1. Environment Validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET;

if (!supabaseUrl || !supabaseKey || !googleClientId || !googleClientSecret || !authSecret) {
  throw new Error("Missing required environment variables");
}

// 2. Type Definitions
interface User {
  id: string;
  email: string;
  name?: string;
  role: "company" | "customer" | "admin";
  companyId: string;
  password_hash?: string;
}

interface CustomSession extends Session {
  user: User & DefaultSession["user"];
}

interface CustomJWT extends JWT {
  id?: string;
  role?: string;
  companyId?: string;
}

// 3. Supabase Client (Single Instance)
const supabase = createClient(supabaseUrl, supabaseKey);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseKey,
  }) as Adapter,
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "",
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER || "",
          pass: process.env.EMAIL_SERVER_PASSWORD || "",
        },
      },
      from: process.env.EMAIL_FROM || "",
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", required: true },
        password: { label: "Password", type: "password", required: true }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Invalid email or password");
          }

          const { data: user, error } = await supabase
            .from('users')
            .select('id, email, password_hash, name, role, company_id')
            .eq('email', credentials.email)
            .single();

          if (error || !user?.password_hash) {
            throw new Error("Invalid email or password");
          }
          
          const passwordMatch = await compare(credentials.password, user.password_hash);
          if (!passwordMatch) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.company_id
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }: { 
      token: CustomJWT, 
      user?: User | import("next-auth").User | null, 
      trigger?: "signIn" | "signUp" | "update" 
    }) {
      if (trigger === "update") {
        const { data: updatedUser } = await supabase
          .from('users')
          .select('role, company_id')
          .eq('id', token.id)
          .single();
          
        if (updatedUser) {
          token.role = updatedUser.role;
          token.companyId = updatedUser.company_id;
        }
      }
      
      if (user) {
        // Handle both custom User and NextAuth User types
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId ?? (user as any).company_id;
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (session.user) {
        // Ensure required fields are present and fallback to empty string if missing
        session.user.id = (token.id as string) ?? "";
        const allowedRoles = ["company", "admin", "customer"] as const;
        session.user.role = allowedRoles.includes(token.role as any) ? (token.role as User["role"]) : "customer";
        session.user.companyId = (token.companyId as string) ?? "";
        session.user.email = session.user.email ?? "";
        session.user.name = session.user.name ?? "";
        session.user.image = session.user.image ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.SESSION_MAX_AGE || "2592000"), // 30 days default
  },
  secret: authSecret,
  debug: process.env.NODE_ENV === 'development',
});