import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export const useMobilePatientNavigation = (selectedPatientId?: string) => {
  const isMobile = useIsMobile();
  const [showingDetails, setShowingDetails] = useState(false);

  // Auto-manage mobile navigation based on patient selection
  useEffect(() => {
    if (isMobile) {
      setShowingDetails(!!selectedPatientId);
    }
  }, [isMobile, selectedPatientId]);

  const showPatientList = () => {
    setShowingDetails(false);
  };

  const showPatientDetails = () => {
    setShowingDetails(true);
  };

  return {
    isMobile,
    showingDetails,
    showPatientList,
    showPatientDetails
  };
};