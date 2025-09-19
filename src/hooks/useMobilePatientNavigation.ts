import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface UseMobilePatientNavigationProps {
  navigate?: (path: string) => void;
}

export const useMobilePatientNavigation = ({ navigate }: UseMobilePatientNavigationProps = {}) => {
  const isMobile = useIsMobile();
  const [showingDetails, setShowingDetails] = useState(false);

  const showPatientList = () => {
    setShowingDetails(false);
  };

  const showPatientListWithNavigation = () => {
    if (navigate) {
      navigate('/patients');
    }
    setShowingDetails(false);
  };

  const showPatientDetails = () => {
    setShowingDetails(true);
  };

  return {
    isMobile,
    showingDetails,
    showPatientList,
    showPatientListWithNavigation,
    showPatientDetails
  };
};