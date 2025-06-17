
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface PhoneVerificationGuardProps {
  children: React.ReactNode;
}

const PhoneVerificationGuard = ({ children }: PhoneVerificationGuardProps) => {
  const { user, isLoading, profileStatus, profileData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for all authentication and profile data to be loaded
    if (isLoading) {
      return;
    }

    // Not authenticated - redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    // Handle different profile statuses
    switch (profileStatus) {
      case 'verified':
        // Phone is verified - allow access
        if (import.meta.env.MODE === 'development') {
          console.log('PhoneVerificationGuard: Phone verified, granting access');
        }
        break;

      case 'needs_verification':
        // Phone exists but not verified - redirect to OTP verification
        if (profileData?.phone) {
          const countryCode = profileData.phoneCountryCode || '+55';
          const fullPhoneNumber = `${countryCode}${profileData.phone}`;
          
          if (import.meta.env.MODE === 'development') {
            console.log('PhoneVerificationGuard: Phone needs verification, redirecting to verify-phone');
          }
          
          navigate('/verify-phone', {
            state: {
              phone: fullPhoneNumber,
              displayPhone: `${countryCode} ${profileData.phone}`
            }
          });
        } else {
          // Fallback: if status says needs_verification but no phone data
          navigate('/update-phone');
        }
        break;

      case 'needs_phone':
        // No phone number - redirect to phone update
        if (import.meta.env.MODE === 'development') {
          console.log('PhoneVerificationGuard: No phone number, redirecting to update-phone');
        }
        navigate('/update-phone');
        break;

      case 'no_profile':
        // Profile error or doesn't exist - redirect to phone update
        if (import.meta.env.MODE === 'development') {
          console.log('PhoneVerificationGuard: No profile found, redirecting to update-phone');
        }
        navigate('/update-phone');
        break;

      default:
        // Unknown status - redirect to phone update as fallback
        navigate('/update-phone');
        break;
    }
  }, [user, isLoading, profileStatus, profileData, navigate]);

  // Show loading while checking authentication and profile
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Verificando autorização...</p>
        </div>
      </div>
    );
  }

  // Only render children if phone is verified
  if (profileStatus === 'verified') {
    return <>{children}</>;
  }

  // While redirecting, render nothing to avoid flashing content
  return null;
};

export default PhoneVerificationGuard;
