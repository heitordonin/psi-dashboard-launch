import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, remoteip } = await req.json();

    if (!token) {
      console.log('CAPTCHA verification failed: Token is required');
      return new Response(
        JSON.stringify({ success: false, error: 'Token is required' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const secretKey = Deno.env.get('HCAPTCHA_SECRET_KEY');
    if (!secretKey) {
      console.error('HCAPTCHA_SECRET_KEY not found in environment');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify token with hCaptcha
    const verifyUrl = 'https://hcaptcha.com/siteverify';
    const verifyData = new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(remoteip && { remoteip })
    });

    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyData.toString(),
    });

    const verifyResult = await verifyResponse.json();

    console.log('hCaptcha verification result:', verifyResult);

    if (verifyResult.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'CAPTCHA verified successfully',
          challenge_ts: verifyResult['challenge_ts'],
          hostname: verifyResult.hostname
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.log('hCaptcha verification failed:', verifyResult['error-codes'] || []);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CAPTCHA verification failed',
          'error-codes': verifyResult['error-codes'] || []
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});