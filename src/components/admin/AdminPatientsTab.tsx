import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  full_name: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface AdminPatientsTabProps {
  patients: Patient[];
  showAllUsers: boolean;
}

export const AdminPatientsTab = ({ patients, showAllUsers }: AdminPatientsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Últimos Pacientes 
          {!showAllUsers && ' (Filtrado)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Nome</th>
                <th className="text-left p-2">CPF</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Telefone</th>
                <th className="text-left p-2">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {patients.slice(0, 10).map((patient) => (
                <tr key={patient.id} className="border-b">
                  <td className="p-2">{patient.full_name}</td>
                  <td className="p-2">{patient.cpf}</td>
                  <td className="p-2">{patient.email || '-'}</td>
                  <td className="p-2">{patient.phone || '-'}</td>
                  <td className="p-2">
                    {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};