import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export const useMobilePatientNavigation = (selectedPatientId?: string) => {
  const isMobile = useIsMobile();
  const [showingDetails, setShowingDetails] = useState(false);
  const [hasUserSelectedPatient, setHasUserSelectedPatient] = useState(false);

  // On mobile, only show details if user has explicitly selected a patient
  useEffect(() => {
    if (isMobile) {
      // Don't auto-show details on mobile unless user has selected a patient
      setShowingDetails(hasUserSelectedPatient && !!selectedPatientId);
    } else {
      // Desktop behavior: show details if patient is selected
      setShowingDetails(!!selectedPatientId);
    }
  }, [isMobile, selectedPatientId, hasUserSelectedPatient]);

  // Reset user selection flag when switching to mobile
  useEffect(() => {
    if (isMobile && !hasUserSelectedPatient) {
      setShowingDetails(false);
    }
  }, [isMobile, hasUserSelectedPatient]);

  const showPatientList = () => {
    setShowingDetails(false);
    setHasUserSelectedPatient(false);
  };

  const showPatientDetails = () => {
    setShowingDetails(true);
    setHasUserSelectedPatient(true);
  };

  const handlePatientSelect = () => {
    setHasUserSelectedPatient(true);
    if (isMobile) {
      setShowingDetails(true);
    }
  };

  return {
    isMobile,
    showingDetails,
    showPatientList,
    showPatientDetails,
    handlePatientSelect
  };
};