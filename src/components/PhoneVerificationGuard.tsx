
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PhoneVerificationGuardProps {
  children: React.ReactNode;
}

const PhoneVerificationGuard = ({ children }: PhoneVerificationGuardProps) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Step 1: Fetch the user's profile as soon as the user is available.
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('phone, phone_verified, phone_country_code')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('PhoneVerificationGuard: Error fetching profile:', error);
        } else {
          setProfile(data);
        }
        setLoadingProfile(false);
      } else if (!isAuthLoading) {
        // If there's no user and auth is not loading, it's a logged-out state.
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user, isAuthLoading]);

  // Step 2: Implement the redirection logic based on the loaded profile status.
  useEffect(() => {
    // Wait until all authentication and profile data has been loaded.
    if (isAuthLoading || loadingProfile) {
      return; 
    }

    if (!user) {
      navigate('/login');
      return;
    }

    if (profile) {
      // Case 1: User's phone is already verified. Grant access.
      if (profile.phone_verified) {
        return;
      }
      
      // Case 2: Phone exists but is not verified. Redirect to OTP page.
      if (profile.phone) {
        const countryCode = profile.phone_country_code || '+55';
        const fullPhoneNumber = `${countryCode}${profile.phone}`;
        navigate('/verify-phone', {
          state: {
            phone: fullPhoneNumber,
            displayPhone: `${countryCode} ${profile.phone}`
          }
        });
      } else {
        // Case 3: No phone number exists. Redirect to the update page.
        navigate('/update-phone');
      }
    } else {
       // Case 4: Profile does not exist. This is a failsafe.
       navigate('/update-phone');
    }

  }, [profile, loadingProfile, isAuthLoading, user, navigate]);

  // Step 3: Render a loading indicator or the protected content.
  if (isAuthLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Verificando autorização...</p>
        </div>
      </div>
    );
  }

  // Render children only if the phone is verified. Otherwise, the useEffect handles the redirect.
  if (profile?.phone_verified) {
    return <>{children}</>;
  }

  // While redirecting, render nothing to avoid flashing incorrect content.
  return null;
};

export default PhoneVerificationGuard;
