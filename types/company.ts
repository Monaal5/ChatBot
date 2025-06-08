export type Company = {
  id: string;
  name: string;
  status: "active" | "pending" | "inactive";
  joinDate: string;
  plan: string;
};