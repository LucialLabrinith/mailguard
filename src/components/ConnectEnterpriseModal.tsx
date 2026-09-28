import React, { useState } from 'react';
import { X, Mail, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

interface ConnectEnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess: (count: number, emails?: any[]) => void;
}

export const ConnectEnterpriseModal: React.FC<ConnectEnterpriseModalProps> = ({
  isOpen,
  onClose,
  onSyncSuccess,
}) => {
  const [provider, setProvider] = useState<'m365' | 'corporate_imap'>('m365');
  const [email, setEmail] = useState('');
  const [tokenOrPassword, setTokenOrPassword] = useState('');
  const [serverHost, setServerHost] = useState('outlook.office365.com');
  const [serverPort, setServerPort] = useState(993);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    provider: string;
    domain: string;
    mxHost: string;
    authType: string;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyMicrosoft = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your Microsoft or Corporate email first.');
      return;
    }
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/microsoft/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: cleanEmail,
          accessToken: tokenOrPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify Microsoft account.');
      setVerificationResult(data.verification);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (provider === 'm365') {
        // Direct Microsoft Real-Time Verification & Synchronous Ingestion
        const res = await fetch('/api/auth/microsoft/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: email.trim(),
            accessToken: tokenOrPassword.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to sync Microsoft 365');
        onSyncSuccess(data.count, data.emails);
        onClose();
      } else {
        // Corporate IMAP/Exchange connection
        const res = await fetch('/api/emails/sync-imap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: email.trim(),
            pass: tokenOrPassword.trim(),
            host: serverHost.trim(),
            port: Number(serverPort),
            secure: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to connect to Corporate Mail');
        onSyncSuccess(data.count, data.emails);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm">Connect M365 & Corporate Email</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider Switcher */}
        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setProvider('m365'); setServerHost('outlook.office365.com'); }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
              provider === 'm365' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Microsoft 365 / Outlook
          </button>
          <button
            type="button"
            onClick={() => { setProvider('corporate_imap'); setServerHost('mail.company.com'); }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
              provider === 'corporate_imap' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Corporate Exchange / IMAP
          </button>
        </div>

        <form onSubmit={handleConnect} className="space-y-3 text-xs">
          <div>
            {provider === 'm365' && (
              <div className="flex flex-wrap items-center gap-1.5 pb-2">
                <span className="text-[10px] text-slate-400">In-App Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => setEmail('analyst@outlook.com')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950/60 text-sky-300 border border-sky-800/80 hover:bg-sky-900/60 transition-colors"
                >
                  analyst@outlook.com (Outlook)
                </button>
                <button
                  type="button"
                  onClick={() => setEmail('analyst@microsoft.com')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/60 text-blue-300 border border-blue-800/80 hover:bg-blue-900/60 transition-colors"
                >
                  analyst@microsoft.com (M365)
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-semibold">Corporate / Outlook Email</label>
              {provider === 'm365' && (
                <button
                  type="button"
                  onClick={handleVerifyMicrosoft}
                  disabled={isVerifying || !email.trim()}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      <span>Verify Microsoft Account</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@enterprise.corp or user@outlook.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Microsoft Account Login Verification Card */}
          {verificationResult && provider === 'm365' && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-700/60 text-cyan-200 space-y-1 animate-in fade-in slide-in-from-top-1 text-[11px]">
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Microsoft Account Login Verified</span>
              </div>
              <p className="text-slate-300 text-[11px]">{verificationResult.message}</p>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono pt-1">
                <div>Provider: <span className="text-cyan-300">{verificationResult.provider}</span></div>
                <div>Auth: <span className="text-cyan-300">{verificationResult.authType}</span></div>
                <div className="col-span-2">MX Route: <span className="text-cyan-300">{verificationResult.mxHost}</span></div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 mb-1">
              {provider === 'm365' ? 'Microsoft Graph Bearer Token (Optional)' : 'App Password / Password'}
            </label>
            <input
              type="password"
              value={tokenOrPassword}
              onChange={(e) => setTokenOrPassword(e.target.value)}
              placeholder={provider === 'm365' ? 'Optional: Paste token, or leave blank for instant verification' : 'Enter account password'}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {provider === 'corporate_imap' && (
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-slate-300 mb-1">IMAP Server Host</label>
                <input
                  type="text"
                  required
                  value={serverHost}
                  onChange={(e) => setServerHost(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Port</label>
                <input
                  type="number"
                  required
                  value={serverPort}
                  onChange={(e) => setServerPort(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating & Syncing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Connect & Ingest Mailbox</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
