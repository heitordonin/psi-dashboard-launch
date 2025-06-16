
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TopEarner {
  user_id: string;
  user_name: string;
  total_revenue: string;
}

interface AdminTopEarnersTableProps {
  topEarners?: TopEarner[];
}

export const AdminTopEarnersTable = ({ topEarners }: AdminTopEarnersTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Psicólogos por Receita</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Posição</TableHead>
              <TableHead>Nome do Psicólogo</TableHead>
              <TableHead className="text-right">Receita Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topEarners?.map((earner, index) => (
              <TableRow key={earner.user_id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{earner.user_name}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(Number(earner.total_revenue))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
