import { CourtesyPlansManager } from "@/components/admin/CourtesyPlansManager";
import AdminRoute from "@/components/AdminRoute";

export default function AdminCourtesyPlans() {
  console.log('AdminCourtesyPlans - Component rendering');
  
  return (
    <AdminRoute>
      <CourtesyPlansManager />
    </AdminRoute>
  );
}