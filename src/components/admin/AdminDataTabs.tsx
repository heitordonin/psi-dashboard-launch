import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPatientsTab } from "./AdminPatientsTab";
import { AdminPaymentsTab } from "./AdminPaymentsTab";
import { AdminExpensesTab } from "./AdminExpensesTab";
import { AdminSentDocumentsTable } from "./AdminSentDocumentsTable";

interface Patient {
  id: string;
  full_name: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  created_at: string;
  patients?: {
    full_name: string;
  };
}

interface Expense {
  id: string;
  amount: number;
  payment_date: string;
  penalty_interest: number;
  residential_adjusted_amount: number | null;
  description: string | null;
  created_at: string;
  expense_categories?: {
    name: string;
  };
}

interface AdminDataTabsProps {
  patients: Patient[];
  payments: Payment[];
  expenses: Expense[];
  filteredUserId: string | null;
  showAllUsers: boolean;
}

export const AdminDataTabs = ({
  patients,
  payments,
  expenses,
  filteredUserId,
  showAllUsers,
}: AdminDataTabsProps) => {
  return (
    <Tabs defaultValue="patients" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="patients">Pacientes</TabsTrigger>
        <TabsTrigger value="payments">Cobranças</TabsTrigger>
        <TabsTrigger value="expenses">Despesas</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
      </TabsList>

      <TabsContent value="patients">
        <AdminPatientsTab patients={patients} showAllUsers={showAllUsers} />
      </TabsContent>

      <TabsContent value="payments">
        <AdminPaymentsTab payments={payments} showAllUsers={showAllUsers} />
      </TabsContent>

      <TabsContent value="expenses">
        <AdminExpensesTab expenses={expenses} showAllUsers={showAllUsers} />
      </TabsContent>

      <TabsContent value="documents">
        <AdminSentDocumentsTable 
          filteredUserId={filteredUserId}
          showAllUsers={showAllUsers}
        />
      </TabsContent>
    </Tabs>
  );
};