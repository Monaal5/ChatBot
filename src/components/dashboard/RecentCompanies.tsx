import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Company {
  id: string
  name: string
  status: "active" | "pending" | "inactive"
  joinDate: string
  plan: "free" | "pro" | "enterprise"
}

export function RecentCompanies({ companies }: { companies: Company[] }) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableCaption>A list of recently onboarded companies.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className="text-right">Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>
                <Badge 
                  variant={
                    company.status === "active" 
                      ? "default" 
                      : company.status === "pending" 
                        ? "secondary" 
                        : "destructive"
                  }
                >
                  {company.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {company.plan}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{company.joinDate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}