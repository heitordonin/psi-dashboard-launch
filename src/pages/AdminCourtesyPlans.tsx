import { CourtesyPlansManager } from "@/components/admin/CourtesyPlansManager";
import AdminRoute from "@/components/AdminRoute";

export default function AdminCourtesyPlans() {
  return (
    <AdminRoute>
      <div className="container mx-auto py-8">
        <CourtesyPlansManager />
      </div>
    </AdminRoute>
  );
}