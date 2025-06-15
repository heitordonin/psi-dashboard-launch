
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

  // Step 1: Fetch the user's profile
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
      }
    };

    if (!isAuthLoading) {
      fetchProfile();
    }
  }, [user, isAuthLoading]);

  // Step 2: Implement the redirection logic based on profile status
  useEffect(() => {
    if (loadingProfile || isAuthLoading) {
      return; // Wait until all data is loaded
    }

    if (!user) {
      navigate('/login');
      return;
    }

    if (profile) {
      if (profile.phone_verified) {
        // All good, do nothing and let the component render children.
        return;
      }
      
      if (profile.phone) {
        // Phone exists but is not verified, redirect to the verification page.
        const countryCode = profile.phone_country_code || '+55';
        const fullPhoneNumber = `${countryCode}${profile.phone}`;
        navigate('/verify-phone', {
          state: {
            phone: fullPhoneNumber,
            displayPhone: `${countryCode} ${profile.phone}`
          }
        });
      } else {
        // No phone number exists, redirect to the update page.
        navigate('/update-phone');
      }
    } else {
       // Profile could not be loaded, maybe a new user without a profile yet.
       // Redirecting to update phone is a safe fallback.
       navigate('/update-phone');
    }

  }, [profile, loadingProfile, isAuthLoading, user, navigate]);

  // Step 3: Render loading state or children
  if (isAuthLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Verificando...</p>
        </div>
      </div>
    );
  }

  // Render children only if the phone is verified. Otherwise, the useEffect will handle redirection.
  if (profile?.phone_verified) {
    return <>{children}</>;
  }

  // Render null while redirecting to avoid flashing content.
  return null;
};

export default PhoneVerificationGuard;
