import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export const useMobilePatientNavigation = () => {
  const isMobile = useIsMobile();
  const [showingDetails, setShowingDetails] = useState(false);

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