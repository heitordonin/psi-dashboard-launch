import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2 } from "lucide-react";
import type { Patient } from "@/types/patient";

interface MobilePatientHeaderProps {
  patient: Patient;
  onBack: () => void;
  onEdit: () => void;
}

export const MobilePatientHeader = ({ patient, onBack, onEdit }: MobilePatientHeaderProps) => {
  return (
    <div 
      style={{ backgroundColor: '#002472' }} 
      className="border-b px-4 py-4 md:hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:text-gray-200 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-white truncate">
              {patient.full_name}
            </h1>
            <p className="text-sm truncate" style={{ color: '#03f6f9' }}>
              {patient.patient_type === 'company' ? patient.cnpj : patient.cpf}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="text-white hover:text-gray-200 hover:bg-white/10"
        >
          <Edit2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};