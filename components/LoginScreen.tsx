import React, { useState, useEffect } from 'react';
import { Wand2, LogIn, Settings, AlertCircle } from 'lucide-react';

interface Props {
  onLoginSuccess: (token: string, user: any) => void;
}

const SCOPES = [
  'https://www.googleapis.com/auth/generative-language.retrieval',
  'https://www.googleapis.com/auth/generative-language.tuning',
  'https://www.googleapis.com/auth/generative-language',
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/devstorage.read_write'
].join(' ');

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(localStorage.getItem('google_client_id') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('google_client_id'));

  useEffect(() => {
    // If we have a client ID saved, hide settings by default
    if (clientId) setShowSettings(false);
  }, []);

  const handleLogin = () => {
    if (!window.google) {
      setError("Google Identity Services failed to load. Please refresh.");
      return;
    }

    if (!clientId) {
      setError("Please enter a valid Google Client ID in settings.");
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            // Fetch basic user profile
            try {
              const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              }).then(res => res.json());
              
              onLoginSuccess(tokenResponse.access_token, userInfo);
            } catch (e) {
              console.error("Failed to fetch user info", e);
              // Proceed anyway with just token
              onLoginSuccess(tokenResponse.access_token, { name: 'User', email: 'authenticated' });
            }
          } else {
            setLoading(false);
            setError("Authentication failed or was cancelled.");
          }
        },
        error_callback: (err: any) => {
          setLoading(false);
          setError("OAuth Error: " + JSON.stringify(err));
        }
      });

      tokenClient.requestAccessToken();
    } catch (e: any) {
      setLoading(false);
      setError("Failed to initialize OAuth: " + e.message);
    }
  };

  const saveSettings = () => {
    if (clientId) {
      localStorage.setItem('google_client_id', clientId);
      setShowSettings(false);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full z-10 space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wand2 size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">StoryToMedia <span className="text-blue-400">AI</span></h1>
            <p className="text-slate-400 mt-2">Sign in to access your Google GenAI workspace.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-start space-x-2 text-left">
            <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
               <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"/> Connecting...</span>
            ) : (
               <>
                 <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                 <span>Sign in with Google</span>
               </>
            )}
          </button>
        </div>

        <div className="pt-6 border-t border-slate-700/50">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <Settings size={12} />
            <span>{showSettings ? 'Hide Configuration' : 'Configure Client ID'}</span>
          </button>

          {showSettings && (
            <div className="mt-4 animate-fade-in-down bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-left space-y-3">
              <label className="block text-xs font-medium text-slate-400">
                Google OAuth Client ID
                <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Required for authentication. Create one in Google Cloud Console.</span>
              </label>
              <input 
                type="text" 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="apps.googleusercontent.com"
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <button 
                onClick={saveSettings}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-2 rounded transition-colors"
              >
                Save Configuration
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center z-10">
        <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
          By signing in, you agree to allow this application to access your Google Cloud & Generative AI resources on your behalf.
        </p>
      </div>
    </div>
  );
};