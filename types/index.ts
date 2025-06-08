import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'company' | 'customer';
      companyId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'admin' | 'company' | 'customer';
    companyId?: string;
  }
}

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
};

export type CompanyDocument = {
  id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
};