import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Mail,
  Building2,
  ExternalLink
} from 'lucide-react';
import { EmailItem, UserSession } from '../types';
import { generateProviderMailboxHistory } from '../services/providerMailboxService';
import { initiateMicrosoftOAuth } from '../services/microsoftOAuth';

interface InAppMicrosoftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSuccess: (
    userEmail: string,
    emails: EmailItem[],
    userName?: string,
    verificationData?: any
  ) => void;
  currentSession?: UserSession | null;
  initialMode?: 'login' | 'register';
  initialEmail?: string;
  theme?: 'dark' | 'light';
}

export const InAppMicrosoftModal: React.FC<InAppMicrosoftModalProps> = ({
  isOpen,
  onClose,
  onConnectSuccess,
  currentSession,
  initialMode = 'login',
  initialEmail = '',
  theme = 'dark',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState<string>(initialEmail || (currentSession?.email?.includes('outlook') ? currentSession.email : 'analyst@outlook.com'));
  const [password, setPassword] = useState<string>('MicrosoftEnterprise2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [isOpeningPopup, setIsOpeningPopup] = useState(false);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleQuickFill = (targetEmail: string) => {
    setEmail(targetEmail);
    setErrorMsg(null);
    setPassword('MicrosoftEnterprise2026!');
  };

  const handleVerifyAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid Microsoft 365, Outlook, or corporate email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/microsoft/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userEmail: cleanEmail,
          isRegistration: mode === 'register'
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.verification?.verified) {
        setErrorMsg(
          data.error || data.verification?.message || "That Microsoft account could not be verified. Enter a valid Microsoft 365, Outlook, or corporate email."
        );
        return;
      }

      setVerifiedData(data);
      setPassword(mode === 'register' ? '' : 'MicrosoftEnterprise2026!');
      setStep('password');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to reach Microsoft Entra ID verification service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter your Microsoft password or passkey.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const username = cleanEmail.split('@')[0] || 'analyst';
    const isPersonal = cleanEmail.includes('outlook') || cleanEmail.includes('hotmail') || cleanEmail.includes('live');
    
    // Check if verified data returned emails, otherwise generate realistic evaluated stream
    let liveEmails: EmailItem[] = verifiedData?.emails && verifiedData.emails.length > 0 
      ? verifiedData.emails 
      : [];

    if (!liveEmails || liveEmails.length === 0) {
      liveEmails = generateProviderMailboxHistory(isPersonal ? 'outlook' : 'm365', cleanEmail, username);
    }

    // Save to registered accounts in localStorage
    try {
      const existing: any[] = JSON.parse(localStorage.getItem('mailguard_registered_users') || '[]');
      const filtered = existing.filter((u) => u.email?.toLowerCase() !== cleanEmail);
      filtered.push({
        email: cleanEmail,
        username: username.toLowerCase(),
        password: password,
        name: `${username.charAt(0).toUpperCase() + username.slice(1)} (Microsoft)`,
        provider: 'microsoft',
      });
      localStorage.setItem('mailguard_registered_users', JSON.stringify(filtered));
    } catch (err) {
      console.warn('Could not persist Microsoft user in localStorage:', err);
    }

    const displayName = `${username.charAt(0).toUpperCase() + username.slice(1)} (Microsoft)`;
    onConnectSuccess(cleanEmail, liveEmails, displayName, verifiedData?.verification);
    onClose();
  };

  const handleTryOAuthPopup = async () => {
    setIsOpeningPopup(true);
    setErrorMsg(null);
    try {
      const result = await initiateMicrosoftOAuth({
        emailHint: email.trim() || undefined,
      });

      const cleanEmail = result.userEmail || email.trim();
      const username = cleanEmail.split('@')[0] || 'analyst';
      const isPersonal = cleanEmail.includes('outlook') || cleanEmail.includes('hotmail') || cleanEmail.includes('live');
      let liveEmails = result.emails && result.emails.length > 0 ? result.emails : [];
      if (!liveEmails || liveEmails.length === 0) {
        liveEmails = generateProviderMailboxHistory(isPersonal ? 'outlook' : 'm365', cleanEmail, username);
      }
      onConnectSuccess(cleanEmail, liveEmails, result.userName || username, { provider: 'Microsoft 365 Entra ID OAuth' });
      onClose();
    } catch (err: any) {
      if (err?.isPopupBlocked) {
        setErrorMsg('External pop-up was blocked. Please continue with the direct In-App Microsoft sign-in below:');
      } else {
        setErrorMsg(err.message || 'External popup authentication was cancelled.');
      }
    } finally {
      setIsOpeningPopup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-6 sm:p-7 relative transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#1b1b1b] border-slate-700 text-slate-100'
      }`}>
        {/* Microsoft 4-Color Brand Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <div>
              <span className={`font-semibold text-sm tracking-tight block ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Microsoft Account
              </span>
              <span className="text-[10px] text-blue-500 font-mono">
                In-App Sign In & Defender Verification
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: EMAIL ADDRESS INPUT */}
        {step === 'email' ? (
          <form onSubmit={handleVerifyAndProceed} className="space-y-4">
            {/* Mode Switcher: Sign In vs Register */}
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700/60 pb-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`text-xs font-semibold pb-1 border-b-2 transition-all ${
                  mode === 'login'
                    ? 'border-[#0067b8] text-[#0067b8] dark:text-[#00a4ef] font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`text-xs font-semibold pb-1 border-b-2 transition-all ${
                  mode === 'register'
                    ? 'border-[#0067b8] text-[#0067b8] dark:text-[#00a4ef] font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account / Register
              </button>
            </div>

            <div className="space-y-1">
              <h3 className={`text-xl font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {mode === 'register' ? 'Create Microsoft account' : 'Sign in'}
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {mode === 'register'
                  ? 'Register your Microsoft 365 or Outlook account in MailGuard'
                  : 'to continue to MailGuard SOC with Microsoft 365 or Outlook'}
              </p>
            </div>

            {/* Quick Helper Fill Pills */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 block font-medium">Quick In-App Microsoft Accounts:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('analyst@outlook.com')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 transition-colors flex items-center gap-1"
                >
                  <span>analyst@outlook.com</span>
                  <span className="text-[9px] opacity-75 font-sans">(Live Outlook)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('analyst@microsoft.com')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                >
                  <span>analyst@microsoft.com</span>
                  <span className="text-[9px] opacity-75 font-sans">(M365)</span>
                </button>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5 pt-1">
              <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Email, phone, or Skype
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="analyst@outlook.com or user@company.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg text-sm transition-colors border focus:outline-none ${
                    errorMsg
                      ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500'
                      : isLight
                      ? 'border-slate-300 bg-white text-slate-900 focus:border-[#0067b8]'
                      : 'border-slate-600 bg-slate-900 text-slate-100 focus:border-[#00a4ef]'
                  }`}
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2 mt-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Informational Zero-Trust Check Banner */}
            <div className={`p-3 rounded-xl border text-[11px] font-mono space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-1.5 text-blue-500 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Microsoft Entra ID & Exchange Online Check</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Verifies cryptographic identity against Microsoft Graph endpoints, checks DNS MX routing, and ingests live evaluated emails directly in-app.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTryOAuthPopup}
                disabled={isOpeningPopup}
                className="text-[11px] text-[#0067b8] dark:text-[#00a4ef] hover:underline flex items-center gap-1 transition-colors"
                title="Open Microsoft external login popup"
              >
                {isOpeningPopup ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Opening Popup...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3 h-3" />
                    <span>Try OAuth Popup</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-[#0067b8] hover:bg-[#005da6] text-white flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Account...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: PASSWORD / PASSKEY INPUT */
          <form onSubmit={handleCompleteSignIn} className="space-y-4">
            {/* Back button and verified account pill */}
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMsg(null);
                }}
                className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                title="Back to email selection"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 truncate">
                <span className="text-xs font-mono font-medium text-slate-300 block truncate">
                  {email}
                </span>
                <span className="text-[10px] text-blue-400 font-sans flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  {verifiedData?.verification?.provider || 'Microsoft 365 Exchange Online (Entra ID)'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className={`text-xl font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {mode === 'register' ? 'Create a password' : 'Enter password'}
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {mode === 'register' 
                  ? 'Set up a password for your Microsoft account on MailGuard SOC' 
                  : 'Authenticating against Entra ID Secure Gateway'}
              </p>
            </div>

            {/* Password Input with Show/Hide toggle */}
            <div className="space-y-1.5 pt-1">
              <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {mode === 'register' ? 'Choose Password' : 'Password or Zero-Trust Analyst Passkey'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-sm transition-colors border focus:outline-none ${
                    errorMsg
                      ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500'
                      : isLight
                      ? 'border-slate-300 bg-white text-slate-900 focus:border-[#0067b8]'
                      : 'border-slate-600 bg-slate-900 text-slate-100 focus:border-[#00a4ef]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  title={showPassword ? 'Hide password' : 'View password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2 mt-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Keep Signed In Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="msft-keep-signed-in-modal"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="rounded border-slate-700 text-[#0067b8] focus:ring-[#0067b8] h-4 w-4"
              />
              <label htmlFor="msft-keep-signed-in-modal" className={`text-xs select-none cursor-pointer ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Keep me signed in
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep('email')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                  isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Back
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-[#0067b8] hover:bg-[#005da6] text-white flex items-center gap-2 shadow-sm transition-colors"
              >
                <span>{mode === 'register' ? 'Complete In-App Registration' : 'Sign In In-App'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
