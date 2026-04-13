import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your account...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);

        // PKCE flow: ?code=... is present in the query string
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setStatus('success');
          setMessage('Account verified! Taking you to your dashboard...');
          setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
          return;
        }

        // Implicit / email-link flow: #access_token=... in the hash
        // Supabase JS v2 automatically parses the hash and sets the session
        // when getSession() is called after page load
        const hash = url.hash;
        if (hash && hash.includes('access_token')) {
          // Give the Supabase client a moment to parse the hash
          await new Promise((r) => setTimeout(r, 500));
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data.session) {
            setStatus('success');
            setMessage('Signed in! Taking you to your dashboard...');
            setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
            return;
          }
        }

        // Fallback: check if session already exists (e.g. user clicked link again)
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          setStatus('success');
          setMessage('Already signed in! Redirecting...');
          setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
          return;
        }

        // No session found, something went wrong
        throw new Error('No valid session found. The link may have expired or already been used.');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Verification failed. Please try signing in again.');
        setTimeout(() => navigate('/auth', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0A0F0A]">
      <div className="text-center space-y-5 px-6 max-w-sm">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="text-white font-semibold text-lg">Verifying your account</p>
            <p className="text-white/45 text-sm">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
            <p className="text-white font-semibold text-lg">You're in!</p>
            <p className="text-white/45 text-sm">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-red-500" />
            <p className="text-white font-semibold text-lg">Something went wrong</p>
            <p className="text-white/45 text-sm">{message}</p>
            <p className="text-white/30 text-xs">Redirecting to sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
