import React, { useState } from 'react';
import { 
  HelpCircle, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Globe2, 
  Layers, 
  Mail, 
  Search,
  BookOpen
} from 'lucide-react';

interface FriendlyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendlyGuideModal: React.FC<FriendlyGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeSection, setActiveSection] = useState<'basics' | 'phishing' | 'headers' | 'actions' | 'ai'>('basics');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Friendly Guide to MailGuard</h3>
              <p className="text-[11px] text-slate-400">Simple, plain-English explanations of how we keep you safe</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="p-2 bg-slate-950 border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto text-xs font-medium">
          {[
            { id: 'basics', label: '🛡️ How It Works' },
            { id: 'phishing', label: '🎣 Spotting Phishing' },
            { id: 'headers', label: '✉️ SPF & DMARC in Plain Words' },
            { id: 'actions', label: '🔐 Quarantine vs Block' },
            { id: 'ai', label: '🤖 Friendly AI Protection' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSection === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          
          {activeSection === 'basics' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-900/50 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  What is MailGuard?
                </h4>
                <p>
                  Think of MailGuard as your personal digital bodyguard for your inbox. Whenever an email arrives, MailGuard checks its return address, routing hops, and technical passport before you even open it.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-cyan-400">1. We protect, not pry</span>
                  <p className="text-[11px] text-slate-400">
                    Your personal phone numbers, bank details, and names are masked to ensure your private life stays completely private.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-cyan-400">2. Real-time protection</span>
                  <p className="text-[11px] text-slate-400">
                    If an email attempts to steal your password or trick you into a fake wire transfer, it is instantly tagged and held in quarantine.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'phishing' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  What is the difference between Phishing, BEC, and Spam?
                </h4>
                <p>
                  Not all unwanted emails are the same. Here is how MailGuard classifies them:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-red-400">🔴 Phishing (Impersonation Traps)</span>
                  <p className="text-[11px] text-slate-400">
                    Scammers pretend to be trusted brands (like Chase Bank or Netflix) with fake websites designed to steal your passwords or credit cards.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-400">🟠 Business Email Compromise (BEC Fraud)</span>
                  <p className="text-[11px] text-slate-400">
                    High-pressure emails pretending to be a boss, CEO, or lawyer asking you to urgently wire money or send gift cards.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-slate-400">⚫ Routine Spam</span>
                  <p className="text-[11px] text-slate-400">
                    Annoying sales pitches, newsletter blasts, or junk mail that is not dangerous, but clutters your workspace.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'headers' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">
                  SPF, DKIM, and DMARC in Simple Words
                </h4>
                <p className="text-slate-400 text-xs">
                  Security engineers use lots of acronyms. Here is what they actually mean in the real world:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400">SPF = The Return Address License</span>
                  <p className="text-[11px] text-slate-400">
                    Like a list of authorized mail trucks. If a letter says it is from Chase Bank, SPF checks if the computer sending it is actually on Chase's approved list.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-blue-400">DKIM = The Wax Seal & Signature</span>
                  <p className="text-[11px] text-slate-400">
                    A cryptographic digital signature guaranteeing that nobody modified the email while it was travelling across the internet.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-purple-400">DMARC = The House Rule</span>
                  <p className="text-[11px] text-slate-400">
                    Tells your email provider what to do if someone fakes their identity: either reject the fake email completely or quarantine it immediately.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'actions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-900/50 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  What is Quarantine vs Block?
                </h4>
                <p>
                  You are always in control of your emails. Here is what each button does:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-purple-300">🔐 Quarantine</span>
                  <p className="text-[11px] text-slate-400">
                    Puts a suspicious email into a secure isolation vault. Links are disabled so you cannot accidentally click them. You can release it anytime if it turns out to be safe!
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-red-400">🚫 Block Sender & Domain</span>
                  <p className="text-[11px] text-slate-400">
                    Completely rejects future emails from that sender and tells your firewall never to accept messages from that lookalike website again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ai' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-900/50 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  How MailGuard AI Protects You from Being Tricked
                </h4>
                <p>
                  Modern attackers sometimes hide secret commands in emails (called "prompt injections") trying to trick AI assistants into leaking your data.
                </p>
              </div>

              <p className="text-slate-300 text-xs">
                MailGuard AI has built-in zero-trust guardrails. It treats all email text as untrusted raw material. No matter what tricky command an attacker includes in their email, MailGuard AI will never obey it, keeping your passwords and private messages 100% safe.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
};
