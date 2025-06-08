import NextAuth from "next-auth";
import { AdapterUser as NextAuthAdapterUser } from "next-auth/adapters";
import { AdapterUser as CoreAdapterUser } from "@auth/core/adapters";

declare module "next-auth" {
  interface AdapterUser extends CoreAdapterUser {
    role: string;
    companyId: string;
  }
  
  interface User extends CoreAdapterUser {
    role: string;
    companyId: string;
  }
  
  interface Session {
    user: {
      id: string;
      role: string;
      companyId: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser extends NextAuthAdapterUser {
    role: string;
    companyId: string;
  }
}