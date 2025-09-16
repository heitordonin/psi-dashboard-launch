import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Patient } from '@/types/patient';

export const usePatientDetailsState = (patients: Patient[], isMobile: boolean = false) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Find selected patient
  const selectedPatient = patients.find(p => p.id === id);

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const fullName = patient.full_name.toLowerCase();
    const document = patient.patient_type === 'company' 
      ? patient.cnpj?.toLowerCase() || ''
      : patient.cpf?.toLowerCase() || '';
    
    return fullName.includes(searchLower) || document.includes(searchLower);
  });

  // Auto-select first patient if none selected and patients exist (only on desktop)
  useEffect(() => {
    if (!isMobile && !id && filteredPatients.length > 0) {
      navigate(`/patients/${filteredPatients[0].id}`, { replace: true });
    }
  }, [id, filteredPatients, navigate, isMobile]);

  // Handle patient selection
  const handlePatientSelect = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  };

  return {
    selectedPatient,
    filteredPatients,
    searchTerm,
    setSearchTerm,
    handlePatientSelect,
    selectedPatientId: id
  };
};