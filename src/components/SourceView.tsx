import React, { useState } from 'react';
import { 
  ArrowLeft, 
  X, 
  Layers, 
  FileText, 
  Mail, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Sparkles, 
  Globe, 
  ExternalLink,
  Ban,
  Tag,
  Download,
  Calendar,
  Eye,
  FileCode2
} from 'lucide-react';
import { EmailItem, ConnectedSourceId, UserSession } from '../types';

interface SourceViewProps {
  activeSource: ConnectedSourceId;
  onSelectSource: (source: ConnectedSourceId) => void;
  emails: EmailItem[];
  userSession: UserSession;
  onBackToDashboard: () => void;
  onClose: () => void;
  onSelectEmail: (email: EmailItem) => void;
  onOpenAIWithEmail?: (email: EmailItem) => void;
  onQuarantineEmail?: (emailId: string) => void;
  onBlockSender?: (emailId: string) => void;
}

export const SOURCE_METADATA: Record<ConnectedSourceId, {
  name: string;
  shortName: string;
  badge: string;
  type: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  description: string;
  authMethod: string;
  syncProtocol: string;
}> = {
  all: {
    name: 'All Connected Sources (Unified Gateway)',
    shortName: 'All Sources',
    badge: 'Unified Ingestion',
    type: 'Multi-Suite Gateway',
    iconColor: 'text-cyan-400',
    bgColor: 'bg-cyan-950/40',
    borderColor: 'border-cyan-500/50',
    description: 'Aggregates telemetry, cryptographic headers, and documents across all connected enterprise and personal accounts.',
    authMethod: 'Single Sign-On (Unified Session)',
    syncProtocol: 'REST / Graph / IMAP TLS 1.3'
  },
  gmail: {
    name: 'Google Gmail (Enterprise & Workspace)',
    shortName: 'Gmail',
    badge: 'Google Workspace',
    type: 'Email & Communications',
    iconColor: 'text-red-400',
    bgColor: 'bg-red-950/40',
    borderColor: 'border-red-500/50',
    description: 'OAuth 2.0 encrypted link to Gmail inboxes with live RFC 5322 header inspection and SPF/DKIM verification.',
    authMethod: 'Google OAuth 2.0 Token',
    syncProtocol: 'Google Workspace Mail API v1'
  },
  docs: {
    name: 'Google Workspace Docs & Drive',
    shortName: 'Google Docs',
    badge: 'Collaborative Docs',
    type: 'Cloud Documents & Evidence Vault',
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-950/40',
    borderColor: 'border-blue-500/50',
    description: 'Monitors collaborative Google Docs, Sheets, and Drive file shares for data leakage, embedded malware, and unauthorized permissions.',
    authMethod: 'Google Workspace Drive & Docs API',
    syncProtocol: 'Google Drive v3 Changes Feed'
  },
  m365: {
    name: 'Microsoft 365 (Enterprise Defender & Exchange)',
    shortName: 'Microsoft 365',
    badge: 'Office 365 Suite',
    type: 'Enterprise Cloud & Exchange',
    iconColor: 'text-indigo-400',
    bgColor: 'bg-indigo-950/40',
    borderColor: 'border-indigo-500/50',
    description: 'Microsoft Entra ID identity protection telemetry and Exchange Online quarantine pipeline monitoring.',
    authMethod: 'Microsoft Entra SSO / App Token',
    syncProtocol: 'Microsoft Graph API v1.0'
  },
  outlook: {
    name: 'Microsoft Outlook (Personal & Business)',
    shortName: 'Outlook',
    badge: 'Outlook Web',
    type: 'Email & Calendar',
    iconColor: 'text-sky-400',
    bgColor: 'bg-sky-950/40',
    borderColor: 'border-sky-500/50',
    description: 'Direct integration with Outlook.com and Exchange Online personal email streams with automated lookalike domain tagging.',
    authMethod: 'Microsoft Identity Platform',
    syncProtocol: 'Graph Mail.ReadWrite'
  },
  yahoo: {
    name: 'Yahoo Mail & Business Gateway',
    shortName: 'Yahoo Mail',
    badge: 'Yahoo Gateway',
    type: 'Webmail & Business Posture',
    iconColor: 'text-purple-400',
    bgColor: 'bg-purple-950/40',
    borderColor: 'border-purple-500/50',
    description: 'Secure IMAP TLS 1.3 connection to Yahoo Mailboxes with hardware security key verification and anti-phishing defense.',
    authMethod: 'Yahoo OAuth 2.0 / App Password',
    syncProtocol: 'IMAP over TLS 1.3 (Port 993)'
  },
  corporate: {
    name: 'Corporate Mail Gateway (Exchange / Internal MX)',
    shortName: 'Corporate Mail',
    badge: 'Internal Relay',
    type: 'Private Infrastructure',
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-500/50',
    description: 'Air-gapped and internal corporate SMTP relay hub with BGP route leak defense and RPKI certificate validation.',
    authMethod: 'Internal mTLS Corporate Certificate',
    syncProtocol: 'ESMTPS TLS 1.3 Enforced'
  }
};

export const SourceView: React.FC<SourceViewProps> = ({
  activeSource,
  onSelectSource,
  emails,
  userSession,
  onBackToDashboard,
  onClose,
  onSelectEmail,
  onOpenAIWithEmail,
  onQuarantineEmail,
  onBlockSender
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterThreatsOnly, setFilterThreatsOnly] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const currentMeta = SOURCE_METADATA[activeSource] || SOURCE_METADATA.all;

  // Filter items belonging to this source
  const sourceItems = emails.filter((item) => {
    if (activeSource !== 'all') {
      const itemSource = item.sourceApp || 'gmail';
      if (itemSource !== activeSource) return false;
    }
    if (filterThreatsOnly && item.securityStatus === 'clean') return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.subject.toLowerCase().includes(q) ||
        item.fromName.toLowerCase().includes(q) ||
        item.fromEmail.toLowerCase().includes(q) ||
        item.bodyText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const threatCount = sourceItems.filter((i) => i.securityStatus !== 'clean').length;

  const handleSyncNow = () => {
    setIsSyncing(true);
    setSyncNotice(`Syncing live data from ${currentMeta.name}...`);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice(`Successfully synchronized ${sourceItems.length} items from ${currentMeta.shortName}.`);
      setTimeout(() => setSyncNotice(null), 3500);
    }, 900);
  };

  const username = userSession.username || userSession.email.split('@')[0] || 'analyst';

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* 1. TOP NAVIGATION & CLOSING BAR */}
      <header className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          {/* Back to Dashboard Button */}
          <button
            id="btn-source-back-dashboard"
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950/80 hover:text-cyan-300 text-slate-200 border border-slate-700 hover:border-cyan-600 transition-all text-xs font-semibold shadow-xs group"
            title="Return to the Main Security Dashboard"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Dashboard</span>
          </button>

          {/* Breadcrumbs Navigation */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="hover:text-slate-200 cursor-pointer" onClick={onBackToDashboard}>Dashboard</span>
            <span>/</span>
            <span className="text-slate-300">Connected Sources</span>
            <span>/</span>
            <span className="text-cyan-400 font-bold">{currentMeta.shortName}</span>
          </div>
        </div>

        {/* User Identity & Close Option */}
        <div className="flex items-center gap-3">
          {/* Unified Persona Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-950/50 border border-cyan-800/80 text-[11px] font-mono text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Signed in as <strong>{username}</strong></span>
            <span className="opacity-60 hidden md:inline">• No re-login required across sources</span>
          </div>

          {/* Close Source View Option */}
          <button
            id="btn-source-close"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/60 transition-colors text-xs font-semibold"
            title="Close Source View and return to Dashboard"
          >
            <X className="w-4 h-4" />
            <span>Close Source</span>
          </button>
        </div>
      </header>

      {/* 2. SOURCE APP TOGGLE BAR (TOGGLE BETWEEN ALL SOURCES WITHOUT RE-LOGIN) */}
      <nav aria-label="Connected sources navigation" className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max text-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Switch App:
          </span>

          {(Object.keys(SOURCE_METADATA) as ConnectedSourceId[]).map((srcId) => {
            const meta = SOURCE_METADATA[srcId];
            const isSelected = activeSource === srcId;
            const count = emails.filter((e) => srcId === 'all' ? true : (e.sourceApp || 'gmail') === srcId).length;

            return (
              <button
                key={srcId}
                id={`btn-toggle-source-${srcId}`}
                onClick={() => onSelectSource(srcId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? `${meta.bgColor} ${meta.iconColor} border ${meta.borderColor} font-bold shadow-xs`
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{meta.shortName}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-black/40' : 'bg-slate-800/60 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. ACTIVE SOURCE HERO BANNER & STATS */}
      <section aria-label="Source metadata and telemetry" className="p-4 md:p-6 border-b border-slate-800/80 bg-gradient-to-r from-slate-900/80 via-slate-950 to-slate-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-xl border ${currentMeta.bgColor} ${currentMeta.borderColor} ${currentMeta.iconColor}`}>
                {activeSource === 'docs' ? <FileText className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white">{currentMeta.name}</h1>
                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${currentMeta.bgColor} ${currentMeta.borderColor} ${currentMeta.iconColor}`}>
                    {currentMeta.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">{currentMeta.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Auth: <strong className="text-slate-200">{currentMeta.authMethod}</strong>
              </span>
              <span>•</span>
              <span>Protocol: <strong className="text-slate-200">{currentMeta.syncProtocol}</strong></span>
              <span>•</span>
              <span>Account: <strong className="text-cyan-300">{username}@{activeSource === 'yahoo' ? 'yahoo.com' : activeSource === 'm365' || activeSource === 'outlook' ? 'outlook.com' : activeSource === 'corporate' ? 'enterprise.corp' : 'gmail.com'}</strong></span>
            </div>
          </div>

          {/* Quick Actions & Live Ingest */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Sync Source Now'}</span>
            </button>

            <button
              onClick={() => setFilterThreatsOnly(!filterThreatsOnly)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterThreatsOnly
                  ? 'bg-red-950/80 border-red-500 text-red-200 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Flagged Threats ({threatCount})</span>
            </button>
          </div>
        </div>

        {syncNotice && (
          <div className="mt-3 p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800 text-xs text-cyan-200 flex items-center justify-between animate-in fade-in">
            <span>{syncNotice}</span>
            <button onClick={() => setSyncNotice(null)} className="text-[10px] text-cyan-400 font-mono">Dismiss</button>
          </div>
        )}
      </section>

      {/* 4. SEARCH & FILTER TOOLBAR */}
      <div className="px-4 py-3 bg-slate-900/40 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${currentMeta.shortName} subjects, senders, content...`}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px] self-end sm:self-auto">
          <span>Showing <strong>{sourceItems.length}</strong> items from <strong>{currentMeta.shortName}</strong></span>
          {filterThreatsOnly && <span className="text-red-400 font-bold">(Threats Filter Active)</span>}
        </div>
      </div>

      {/* 5. ITEM STREAM & EVIDENCE DETAILS */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {sourceItems.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-900/30 rounded-2xl border border-slate-800/80">
            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No items found for {currentMeta.name}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filterThreatsOnly 
                ? 'No high-risk threats detected in this source stream. Mailbox posture is clean.'
                : 'Items ingested from this source will automatically display here with full cryptographic forensics.'
              }
            </p>
            {filterThreatsOnly && (
              <button
                onClick={() => setFilterThreatsOnly(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-cyan-400 text-xs font-mono hover:bg-slate-700"
              >
                Clear Threat Filter
              </button>
            )}
          </div>
        ) : (
          sourceItems.map((item) => {
            const isThreat = item.securityStatus !== 'clean';
            const itemSourceMeta = SOURCE_METADATA[item.sourceApp || 'gmail'] || SOURCE_METADATA.all;

            return (
              <article
                key={item.id}
                onClick={() => onSelectEmail(item)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-cyan-500/80 ${
                  isThreat
                    ? 'bg-red-950/20 border-red-800/50 hover:bg-red-950/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 border ${itemSourceMeta.bgColor} ${itemSourceMeta.borderColor} ${itemSourceMeta.iconColor}`}>
                      {item.sourceApp === 'docs' ? <FileText className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white">{item.subject}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${itemSourceMeta.bgColor} ${itemSourceMeta.borderColor} ${itemSourceMeta.iconColor}`}>
                          {itemSourceMeta.shortName}
                        </span>

                        {isThreat ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            {item.threatClassification.toUpperCase()} ({item.securityRiskScore}/100)
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            CLEAN
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="text-slate-200 font-medium">{item.fromName}</span>
                        <span>&lt;{item.fromEmail}&gt;</span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">{item.date}</span>
                      </div>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {item.bodySnippet || item.bodyText.slice(0, 200)}
                      </p>
                    </div>
                  </div>

                  {/* Actions right pane */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0 pt-2 md:pt-0">
                    {onOpenAIWithEmail && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAIWithEmail(item);
                        }}
                        className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-800/80 text-purple-300 text-xs font-mono flex items-center gap-1"
                        title="Analyze with Pippin Forensic Copilot"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span className="hidden sm:inline">Pippin Forensics</span>
                      </button>
                    )}

                    {isThreat && onQuarantineEmail && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuarantineEmail(item.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-mono font-bold"
                        title="Quarantine Threat Immediately"
                      >
                        Quarantine
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEmail(item);
                      }}
                      className="px-3 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>

                {/* Forensics quick tags */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                  <span>SPF: <strong className={item.forensics.spfStatus === 'pass' ? 'text-emerald-400' : 'text-red-400'}>{item.forensics.spfStatus.toUpperCase()}</strong></span>
                  <span>•</span>
                  <span>DKIM: <strong className={item.forensics.dkimStatus === 'pass' ? 'text-emerald-400' : 'text-red-400'}>{item.forensics.dkimStatus.toUpperCase()}</strong></span>
                  <span>•</span>
                  <span>DMARC: <strong className={item.forensics.dmarcStatus === 'pass' ? 'text-emerald-400' : 'text-red-400'}>{item.forensics.dmarcStatus.toUpperCase()}</strong></span>
                  <span>•</span>
                  <span>SHA-256: <code className="text-slate-300">{item.evidence.sha256.slice(0, 12)}...</code></span>
                </div>
              </article>
            );
          })
        )}
      </div>

    </div>
  );
};
