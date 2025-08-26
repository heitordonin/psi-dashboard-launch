import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTheme } from 'next-themes';

// Site key público - substitua pela sua chave real do hCaptcha
// Para obter: https://dashboard.hcaptcha.com/sites
const HCAPTCHA_SITE_KEY = 'your-real-hcaptcha-site-key-here';

export interface CaptchaRef {
  execute: () => void;
  reset: () => void;
  getResponse: () => string | null;
}

interface CaptchaProps {
  onVerify?: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

export const Captcha = forwardRef<CaptchaRef, CaptchaProps>(({
  onVerify,
  onError,
  onExpire,
  size = 'normal',
  className = ''
}, ref) => {
  const hcaptchaRef = useRef<HCaptcha>(null);
  const [token, setToken] = useState<string | null>(null);
  const { theme } = useTheme();

  useImperativeHandle(ref, () => ({
    execute: () => {
      hcaptchaRef.current?.execute();
    },
    reset: () => {
      hcaptchaRef.current?.resetCaptcha();
      setToken(null);
    },
    getResponse: () => token
  }));

  const handleVerify = (token: string) => {
    setToken(token);
    onVerify?.(token);
  };

  const handleError = (err: string) => {
    setToken(null);
    onError?.(err);
  };

  const handleExpire = () => {
    setToken(null);
    onExpire?.();
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <HCaptcha
        ref={hcaptchaRef}
        sitekey={HCAPTCHA_SITE_KEY}
        onVerify={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        theme={theme === 'dark' ? 'dark' : 'light'}
        size={size}
      />
    </div>
  );
});

Captcha.displayName = 'Captcha';