import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Ban, 
  AlertTriangle, 
  Microscope, 
  Sparkles, 
  CheckCircle2, 
  FileCode2, 
  Filter, 
  Search, 
  ExternalLink,
  ShieldQuestion,
  RotateCcw,
  Download,
  Flame,
  Globe2
} from 'lucide-react';
import { EmailItem } from '../types';

interface ThreatCenterViewProps {
  emails: EmailItem[];
  selectedSecurityStatus: string;
  onSelectSecurityStatus: (status: string) => void;
  onSelectEmail: (email: EmailItem) => void;
  onNavigate: (view: string) => void;
  onOpenAIWithEmail: (email: EmailItem) => void;
  onQuarantineEmail: (emailId: string) => void;
  onBlockSender: (emailId: string) => void;
}

export const ThreatCenterView: React.FC<ThreatCenterViewProps> = ({
  emails,
  selectedSecurityStatus,
  onSelectSecurityStatus,
  onSelectEmail,
  onNavigate,
  onOpenAIWithEmail,
  onQuarantineEmail,
  onBlockSender,
}) => {
  const [search, setSearch] = useState('');
  const [confirmReleaseId, setConfirmReleaseId] = useState<string | null>(null);

  // Filter threats
  const allThreats = (emails || []).filter(
    (e) => e && ((e.securityRiskScore ?? 0) > 50 || e.threatClassification !== 'legitimate' || e.securityStatus !== 'clean')
  );

  const displayedThreats = allThreats.filter((e) => {
    if (selectedSecurityStatus !== 'all') {
      if (selectedSecurityStatus === 'phishing' && e.threatClassification !== 'phishing') return false;
      if (selectedSecurityStatus === 'fraud' && e.threatClassification !== 'fraud') return false;
      if (selectedSecurityStatus === 'suspicious' && e.threatClassification !== 'suspicious') return false;
      if (selectedSecurityStatus === 'spam' && e.securityStatus !== 'spam') return false;
      if (selectedSecurityStatus === 'quarantined' && e.securityStatus !== 'quarantined') return false;
      if (selectedSecurityStatus === 'blocked' && e.securityStatus !== 'blocked') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (e.subject || '').toLowerCase().includes(q) ||
        (e.fromEmail || '').toLowerCase().includes(q) ||
        (e.fromName || '').toLowerCase().includes(q) ||
        (e.attribution?.campaignName && e.attribution.campaignName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-red-900/40 p-5 rounded-2xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Threat Center & Quarantine Isolation</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-semibold">
                {allThreats.length} Flagged
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live containment of Phishing, BEC Fraud, Adversarial Injections, and Spammed vectors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('investigation')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition-colors"
          >
            <Microscope className="w-4 h-4 text-emerald-400" />
            <span>Open Investigation Vault</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs matching User's specific list: "blocked or spam or risky emails" */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: `All Threats (${allThreats.length})` },
            { id: 'phishing', label: '🔴 Phishing' },
            { id: 'fraud', label: '🟠 Fraud / BEC' },
            { id: 'suspicious', label: '🟡 Suspicious' },
            { id: 'quarantined', label: '🔐 Quarantined' },
            { id: 'blocked', label: '🚫 Blocked' },
            { id: 'spam', label: '⚫ Spam' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectSecurityStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedSecurityStatus === tab.id
                  ? 'bg-red-950 text-red-300 border border-red-800 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search threats, campaigns, senders..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Threats List Card Grid */}
      <div className="grid grid-cols-1 gap-4">
        {displayedThreats.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-200">No threats currently in this filter</h3>
            <p className="text-xs text-slate-400">All messages under this classification are clear or resolved.</p>
          </div>
        ) : (
          displayedThreats.map((email) => {
            const isPhish = email.threatClassification === 'phishing';
            const isFraud = email.threatClassification === 'fraud';
            const isQuarantined = email.securityStatus === 'quarantined';
            const isBlocked = email.securityStatus === 'blocked';

            return (
              <div
                key={email.id}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all space-y-3 relative overflow-hidden"
              >
                {/* Threat Banner Ribbon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase flex items-center gap-1 ${
                      isPhish ? 'bg-red-950 text-red-400 border border-red-800' :
                      isFraud ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-yellow-950 text-yellow-400 border border-yellow-800'
                    }`}>
                      <AlertTriangle className="w-3 h-3" />
                      {email.threatClassification}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      ID: {email.id}
                    </span>

                    {email.attribution.campaignName && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Campaign: {email.attribution.campaignName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-slate-400">
                      Security Risk: <strong className="text-red-400 font-bold">{email.securityRiskScore}/100</strong>
                    </span>
                    <span className="text-slate-400">
                      Importance: <strong className="text-amber-300 font-bold">{email.importanceScore}/100</strong>
                    </span>
                  </div>
                </div>

                {/* Email Subject & Senders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1">
                    <h3 className="text-sm font-bold text-slate-100">{email.subject}</h3>
                    <p className="text-slate-400">
                      From: <strong className="text-slate-200">{email.fromName}</strong> &lt;<span className="font-mono text-cyan-400">{email.fromEmail}</span>&gt;
                    </p>
                    <p className="text-slate-400 text-[11px] line-clamp-2 mt-1">
                      {email.bodySnippet}
                    </p>
                  </div>

                  {/* Forensic Indicators Box */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] space-y-1 text-slate-400">
                    <p className="font-bold text-slate-300 text-[10px] uppercase">Header Indicators:</p>
                    <p className="flex justify-between">
                      <span>DMARC:</span>
                      <strong className={email.forensics?.dmarcStatus === 'pass' ? 'text-emerald-400' : 'text-red-400'}>
                        {(email.forensics?.dmarcStatus || 'none').toUpperCase()}
                      </strong>
                    </p>
                    <p className="flex justify-between">
                      <span>SPF:</span>
                      <strong className={email.forensics?.spfStatus === 'pass' ? 'text-emerald-400' : 'text-red-400'}>
                        {(email.forensics?.spfStatus || 'none').toUpperCase()}
                      </strong>
                    </p>
                    <p className="flex justify-between truncate">
                      <span>Return-Path:</span>
                      <span className="text-slate-300 truncate max-w-[120px]">{email.forensics.returnPath}</span>
                    </p>
                  </div>
                </div>

                {/* Infrastructure Origin Text */}
                <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 text-[11px] font-mono text-red-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="truncate">{email.attribution.infrastructureOriginText}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    Attribution: {email.attribution.campaignConfidence}% Conf.
                  </span>
                </div>

                {/* Action Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectEmail(email)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      View Full Message
                    </button>

                    <button
                      onClick={() => onOpenAIWithEmail(email)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AI Threat Explanation</span>
                    </button>

                    <button
                      onClick={() => onNavigate('investigation')}
                      className="px-3 py-1.5 text-xs rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition-colors flex items-center gap-1"
                    >
                      <Microscope className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Investigate Origin</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isQuarantined ? (
                      confirmReleaseId === email.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-amber-300 font-mono">Confirm release?</span>
                          <button
                            onClick={() => {
                              onQuarantineEmail(email.id);
                              setConfirmReleaseId(null);
                            }}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded"
                          >
                            Yes, Release
                          </button>
                          <button
                            onClick={() => setConfirmReleaseId(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmReleaseId(email.id)}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 transition-colors flex items-center gap-1 font-mono"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Release Quarantine</span>
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => onQuarantineEmail(email.id)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 transition-colors flex items-center gap-1 font-mono"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Quarantine</span>
                      </button>
                    )}

                    {!isBlocked ? (
                      <button
                        onClick={() => onBlockSender(email.id)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 transition-colors flex items-center gap-1 font-mono"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Block Sender & Domain</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-400 font-mono">
                        Domain Blocked
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
