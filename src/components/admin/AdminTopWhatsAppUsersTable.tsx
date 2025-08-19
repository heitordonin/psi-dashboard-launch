import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TopWhatsAppUser {
  user_id: string;
  user_name: string;
  total_messages: number;
}

interface AdminTopWhatsAppUsersTableProps {
  topWhatsAppUsers?: TopWhatsAppUser[];
}

export const AdminTopWhatsAppUsersTable = ({ topWhatsAppUsers }: AdminTopWhatsAppUsersTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Psicólogos - Mensagens WhatsApp</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Posição</TableHead>
              <TableHead>Nome do Psicólogo</TableHead>
              <TableHead className="text-right">Total de Mensagens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topWhatsAppUsers?.map((user, index) => (
              <TableRow key={user.user_id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{user.user_name}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('pt-BR').format(user.total_messages)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};