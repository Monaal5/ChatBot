export type Status = 'active' | 'pending' | 'inactive';
export type Plan = 'pro' | 'free' | 'enterprise';

export interface Company {
  id: string;
  name: string;
  status: Status;
  joinDate: string;
  plan: Plan;
}
