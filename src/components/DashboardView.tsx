import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Inbox, 
  Star, 
  Sparkles, 
  ArrowUpRight, 
  AlertTriangle, 
  FileCode2, 
  Globe2, 
  ChevronRight, 
  Landmark, 
  Coins, 
  Building2, 
  Users2, 
  Briefcase, 
  Flame, 
  FileText, 
  Lock, 
  Radio, 
  Search,
  ExternalLink,
  ShieldQuestion,
  RefreshCw,
  Download,
  BookOpen,
  Layers,
  HelpCircle
} from 'lucide-react';
import { EmailItem, SmartNotification, InvestigationCase } from '../types';
import { ThreatTimelineChart } from './ThreatTimelineChart';
import { ThreatCorrelationChart } from './ThreatCorrelationChart';

interface DashboardViewProps {
  emails: EmailItem[];
  cases: InvestigationCase[];
  notifications: SmartNotification[];
  onSelectEmail: (email: EmailItem) => void;
  onNavigate: (view: string) => void;
  onSelectCategory: (category: string) => void;
  onSelectSecurityStatus: (status: string) => void;
  onOpenAI: () => void;
  onOpenIngest: () => void;
  onOpenFriendlyGuide?: () => void;
  onConnectAllSources?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  emails,
  cases,
  notifications,
  onSelectEmail,
  onNavigate,
  onSelectCategory,
  onSelectSecurityStatus,
  onOpenAI,
  onOpenIngest,
  onOpenFriendlyGuide,
  onConnectAllSources,
}) => {
  const [trendRange, setTrendRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Export CSV Report of Flagged Threats & Security Incidents
  const handleExportCSV = () => {
    const headers = [
      'Incident_ID',
      'Subject',
      'From_Name',
      'From_Email',
      'Category',
      'Threat_Classification',
      'Security_Risk_Score',
      'Importance_Score',
      'SPF_Status',
      'DKIM_Status',
      'DMARC_Status',
      'Probable_Campaign',
      'Attribution_Origin',
      'Evidence_SHA256',
      'Security_Status',
      'Date'
    ];

    const rows = emails.map((e) => [
      `"${e.id || ''}"`,
      `"${(e.subject || '').replace(/"/g, '""')}"`,
      `"${(e.fromName || '').replace(/"/g, '""')}"`,
      `"${(e.fromEmail || '').replace(/"/g, '""')}"`,
      `"${e.category || ''}"`,
      `"${e.threatClassification || ''}"`,
      e.securityRiskScore ?? 0,
      e.importanceScore ?? 0,
      `"${e.forensics?.spfStatus || ''}"`,
      `"${e.forensics?.dkimStatus || ''}"`,
      `"${e.forensics?.dmarcStatus || ''}"`,
      `"${e.attribution?.campaignName || 'N/A'}"`,
      `"${(e.attribution?.infrastructureOriginText || 'Unknown').replace(/"/g, '""')}"`,
      `"${e.evidence?.sha256 || ''}"`,
      `"${e.securityStatus || ''}"`,
      `"${e.date || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MailGuard_Security_Incidents_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Computed metrics
  const totalEmails = (emails || []).length;
  const threatEmails = (emails || []).filter((e) => e && ((e.securityRiskScore ?? 0) > 65 || e.threatClassification !== 'legitimate'));
  const phishingEmails = (emails || []).filter((e) => e && e.threatClassification === 'phishing');
  const fraudEmails = (emails || []).filter((e) => e && e.threatClassification === 'fraud');
  const suspiciousEmails = (emails || []).filter((e) => e && e.threatClassification === 'suspicious');
  const quarantinedEmails = (emails || []).filter((e) => e && e.securityStatus === 'quarantined');
  const blockedEmails = (emails || []).filter((e) => e && e.securityStatus === 'blocked');

  // Important emails sorted by importance score descending
  const importantEmails = [...(emails || [])]
    .filter((e) => e && (e.importanceScore ?? 0) >= 75)
    .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0));

  // Category counts
  const categoryCounts = {
    banking: emails.filter((e) => e.category === 'banking').length,
    loans: emails.filter((e) => e.category === 'loans').length,
    companies: emails.filter((e) => e.category === 'companies').length,
    family: emails.filter((e) => e.category === 'family').length,
    staff: emails.filter((e) => e.category === 'staff').length,
    documents: emails.filter((e) => e.category === 'documents').length,
    subscriptions: emails.filter((e) => e.category === 'subscriptions').length,
  };

  // Dynamic targets for AI Intelligence Brief based on currently active emails
  const phishTarget = emails.find((e) => e.id === 'em-002') || phishingEmails[0] || threatEmails[0] || emails[0];
  const promptTarget = emails.find((e) => e.id === 'em-007') || suspiciousEmails[0] || threatEmails[1] || emails[1] || emails[0];
  const legitTarget = emails.find((e) => e.id === 'em-005') || importantEmails[0] || emails.find(e => e.threatClassification === 'legitimate') || emails[0];

  // Dynamic Threat trend points derived from current active mailbox stream
  const trendData = React.useMemo(() => {
    const totalCount = emails.length || 1;
    const threatCount = threatEmails.length;
    const cleanCount = Math.max(0, totalCount - threatCount);

    // Multipliers to distribute realistically across time slots
    const dailySlots = [
      { label: '00:00', cRatio: 0.08, tRatio: 0.05 },
      { label: '04:00', cRatio: 0.05, tRatio: 0.02 },
      { label: '08:00', cRatio: 0.24, tRatio: 0.35 },
      { label: '12:00', cRatio: 0.32, tRatio: 0.30 },
      { label: '16:00', cRatio: 0.21, tRatio: 0.20 },
      { label: '20:00', cRatio: 0.10, tRatio: 0.08 },
    ];

    const weeklySlots = [
      { label: 'Mon', cRatio: 0.14, tRatio: 0.12 },
      { label: 'Tue', cRatio: 0.17, tRatio: 0.18 },
      { label: 'Wed', cRatio: 0.20, tRatio: 0.26 },
      { label: 'Thu', cRatio: 0.18, tRatio: 0.15 },
      { label: 'Fri', cRatio: 0.19, tRatio: 0.21 },
      { label: 'Sat', cRatio: 0.07, tRatio: 0.05 },
      { label: 'Sun', cRatio: 0.05, tRatio: 0.03 },
    ];

    const monthlySlots = [
      { label: 'Wk 1', cRatio: 0.22, tRatio: 0.23 },
      { label: 'Wk 2', cRatio: 0.26, tRatio: 0.28 },
      { label: 'Wk 3', cRatio: 0.30, tRatio: 0.32 },
      { label: 'Wk 4', cRatio: 0.22, tRatio: 0.17 },
    ];

    const scaleFactor = Math.max(1, Math.round(50 / totalCount));

    return {
      daily: dailySlots.map((s) => ({
        label: s.label,
        clean: Math.max(2, Math.round(cleanCount * s.cRatio * scaleFactor)),
        threats: Math.max(s.tRatio > 0.1 && threatCount > 0 ? 1 : 0, Math.round(threatCount * s.tRatio * scaleFactor)),
      })),
      weekly: weeklySlots.map((s) => ({
        label: s.label,
        clean: Math.max(4, Math.round(cleanCount * s.cRatio * scaleFactor * 2)),
        threats: Math.max(s.tRatio > 0.1 && threatCount > 0 ? 1 : 0, Math.round(threatCount * s.tRatio * scaleFactor * 2)),
      })),
      monthly: monthlySlots.map((s) => ({
        label: s.label,
        clean: Math.max(15, Math.round(cleanCount * s.cRatio * scaleFactor * 8)),
        threats: Math.max(1, Math.round(threatCount * s.tRatio * scaleFactor * 8)),
      })),
    };
  }, [emails, threatEmails.length]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* Top Banner: Quick Summary & Ingest Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Forensic Operations Stream</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Live Gateway Connected
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Active RFC 5322 packet inspection. Threat engine isolating impersonation & adversarial injection.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenFriendlyGuide && (
            <button
              onClick={onOpenFriendlyGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Friendly Guide</span>
            </button>
          )}

          {onConnectAllSources && (
            <button
              onClick={onConnectAllSources}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Connect All Sources</span>
            </button>
          )}

          <button
            id="btn-dash-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800 transition-colors shadow-sm"
            title="Download CSV report of threats and security incidents"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-dash-ingest"
            onClick={onOpenIngest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/15"
          >
            <FileCode2 className="w-4 h-4" />
            <span>Ingest Raw RFC 5322</span>
          </button>

          <button
            id="btn-dash-brief"
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Executive Brief</span>
          </button>
        </div>
      </div>

      {/* Primary Key Metric Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Widget 1: 📬 Total Ingested Mail */}
        <div 
          id="widget-total-inbox"
          onClick={() => {
            onNavigate('mail');
            onSelectCategory('all');
            onSelectSecurityStatus('all');
          }}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Mailbox</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{totalEmails}</span>
            <span className="text-xs text-slate-400">analyzed msgs</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <span>RFC 5322 Ingestion Stream</span>
            <span className="text-cyan-400 flex items-center gap-0.5">Explore <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>

        {/* Widget 2: 🚨 Threats Detected (CLICKABLE to see all blocked/spam/risky) */}
        <div 
          id="widget-threats-detected"
          onClick={() => {
            onNavigate('security');
            onSelectSecurityStatus('all');
          }}
          className="p-4 rounded-xl bg-slate-900/70 border border-red-900/40 hover:border-red-600/60 cursor-pointer transition-all hover:translate-y-[-2px] group relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Threats Detected
            </span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-400 font-mono">{threatEmails.length}</span>
            <span className="text-xs text-red-300/70">critical & high risk</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>{phishingEmails.length} Phishing • {quarantinedEmails.length} Quarantined</span>
            <span className="text-red-400 font-semibold flex items-center gap-0.5">Threat Center <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>

        {/* Widget 3: ⭐ Important Mail Prioritized */}
        <div 
          id="widget-important-mail"
          onClick={() => {
            onNavigate('mail');
            onSelectCategory('important');
          }}
          className="p-4 rounded-xl bg-slate-900/70 border border-amber-900/40 hover:border-amber-600/60 cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Important Mail</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Star className="w-4 h-4 fill-amber-400/20" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300 font-mono">{importantEmails.length}</span>
            <span className="text-xs text-amber-300/70">prioritized items</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Banks, Loans, Staff, Legal</span>
            <span className="text-amber-400 flex items-center gap-0.5">Filter <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>

        {/* Widget 4: 🛡️ Security Risk Posture */}
        <div 
          id="widget-security-posture"
          onClick={() => onNavigate('investigation')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-700/60 cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Forensic Status</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">ISOLATED</span>
            <span className="text-xs text-slate-400">Zero-Trust Active</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <span>{cases.length} Open Forensic Cases</span>
            <span className="text-emerald-400 flex items-center gap-0.5">Vault <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>

      </div>

      {/* Row 2: AI Daily Brief Widget + Threat Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget: 🤖 AI Daily Brief Widget (Clickable Action Items) */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between backdrop-blur-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Daily Intelligence Brief</h3>
                  <p className="text-[10px] text-slate-400 font-mono">MailGuard Copilot Engine</p>
                </div>
              </div>
              <button 
                onClick={onOpenAI}
                className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                Chat with Copilot <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Good morning, Analyst. Across <strong className="text-white">{totalEmails} analyzed messages</strong>, 
                our neural parser has isolated <strong className="text-red-400">1 coordinated phishing campaign</strong> (DarkHydra) 
                and <strong className="text-amber-400">1 adversarial prompt-injection attack</strong> disguised as an IT update.
              </p>

              {/* Actionable Clickable Items */}
              <div className="space-y-2 pt-1">
                {phishTarget && (
                  <div 
                    onClick={() => onSelectEmail(phishTarget)}
                    className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/60 hover:border-red-500/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-red-300 flex items-center gap-1.5 truncate max-w-[220px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        Action: {phishTarget.subject.slice(0, 32)}...
                      </span>
                      <span className="text-[10px] font-mono text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800 flex-shrink-0">
                        Risk {phishTarget.securityRiskScore || 85}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      From {phishTarget.fromEmail} • {phishTarget.threatClassification.toUpperCase()} quarantine active.
                    </p>
                  </div>
                )}

                {promptTarget && (
                  <div 
                    onClick={() => onSelectEmail(promptTarget)}
                    className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-900/60 hover:border-amber-500/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-300 flex items-center gap-1.5 truncate max-w-[220px]">
                        <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        Action: {promptTarget.subject.slice(0, 32)}...
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800 flex-shrink-0">
                        Neutralized
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      From {promptTarget.fromEmail} • AI heuristic isolation enforced.
                    </p>
                  </div>
                )}

                {legitTarget && (
                  <div 
                    onClick={() => onSelectEmail(legitTarget)}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5 truncate max-w-[220px]">
                        <Coins className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        Action: {legitTarget.subject.slice(0, 32)}...
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 flex-shrink-0">
                        Legit
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      From {legitTarget.fromEmail} • Importance score {legitTarget.importanceScore || 90}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500 font-mono">
            <span>Model: Gemini 3.8 Flash</span>
            <span className="text-cyan-400">Zero-Trust Guard active</span>
          </div>
        </div>

        {/* Widget: 📊 Threat Trend & Traffic Analytics Widget */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Threat Trend & Gateway Velocity</h3>
                <p className="text-[10px] text-slate-400 font-mono">Real-time incoming message classification ratio</p>
              </div>

              {/* Daily / Weekly / Monthly Switch */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                {(['daily', 'weekly', 'monthly'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTrendRange(r)}
                    className={`px-2.5 py-1 text-xs rounded capitalize transition-colors font-mono ${
                      trendRange === r
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Bar Visualization */}
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-6 sm:grid-cols-6 md:grid-cols-7 gap-2 items-end h-40 pt-6">
                {trendData[trendRange].map((item, idx) => {
                  const maxVal = Math.max(10, ...trendData[trendRange].map(t => Math.max(t.clean, t.threats)));
                  const threatHeight = Math.max(8, (item.threats / maxVal) * 120);
                  const cleanHeight = Math.max(12, (item.clean / maxVal) * 120);

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-200 whitespace-nowrap z-20 pointer-events-none shadow-xl">
                        Clean: {item.clean} | Threats: {item.threats}
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-32">
                        {/* Clean bar */}
                        <div 
                          className="w-3 rounded-t bg-cyan-500/40 group-hover:bg-cyan-500/70 transition-all"
                          style={{ height: `${cleanHeight}px` }}
                          title={`Clean: ${item.clean}`}
                        />
                        {/* Threat bar */}
                        <div 
                          className="w-3 rounded-t bg-red-500 group-hover:bg-red-400 transition-all shadow-sm shadow-red-500/30"
                          style={{ height: `${threatHeight}px` }}
                          title={`Threats: ${item.threats}`}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend & Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-500/50"></span>
                    <span className="text-slate-400 text-[11px]">Legitimate / Clean Mail</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-red-500"></span>
                    <span className="text-slate-400 text-[11px]">Flagged Threats & Phishing</span>
                  </div>
                </div>

                <button 
                  onClick={() => onNavigate('analytics')}
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 24-Hour Threat Velocity Timeline (D3) */}
      <ThreatTimelineChart emails={emails} />

      {/* Threat Correlation: Domain-Level Coordinated Phishing Campaign Mapping (Scatter Plot & Line Graph) */}
      <ThreatCorrelationChart 
        emails={emails} 
        onSelectEmail={onSelectEmail} 
        onNavigate={onNavigate} 
      />

      {/* Row 3: Important Emails Prioritized + Threat Origin Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Important Mail Prioritized (Staffs, Companies, Families, Banks, Loans, Documents, Subscription) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">High-Priority & Life-Critical Mail</h3>
                <p className="text-[10px] text-slate-400 font-mono">Classified by MailGuard Priority Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onNavigate('mail');
                  onSelectCategory('banking');
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors"
              >
                Banks ({categoryCounts.banking})
              </button>
              <button
                onClick={() => {
                  onNavigate('mail');
                  onSelectCategory('loans');
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 transition-colors"
              >
                Loans ({categoryCounts.loans})
              </button>
              <button
                onClick={() => {
                  onNavigate('mail');
                  onSelectCategory('important');
                }}
                className="text-[10px] font-mono text-cyan-400 hover:underline ml-2"
              >
                View All Priority
              </button>
            </div>
          </div>

          {/* List of Important Emails */}
          <div className="mt-3 divide-y divide-slate-800/60">
            {importantEmails.slice(0, 5).map((email) => {
              const isPhishing = email.threatClassification === 'phishing';
              return (
                <div
                  key={email.id}
                  onClick={() => onSelectEmail(email)}
                  className="py-3 px-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      email.category === 'banking' ? 'bg-emerald-500/10 text-emerald-400' :
                      email.category === 'loans' ? 'bg-amber-500/10 text-amber-400' :
                      email.category === 'companies' ? 'bg-blue-500/10 text-blue-400' :
                      email.category === 'staff' ? 'bg-indigo-500/10 text-indigo-400' :
                      'bg-teal-500/10 text-teal-400'
                    }`}>
                      {email.category === 'banking' && <Landmark className="w-4 h-4" />}
                      {email.category === 'loans' && <Coins className="w-4 h-4" />}
                      {email.category === 'companies' && <Building2 className="w-4 h-4" />}
                      {email.category === 'staff' && <Briefcase className="w-4 h-4" />}
                      {email.category === 'documents' && <FileText className="w-4 h-4" />}
                      {email.category === 'family' && <Users2 className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 truncate">{email.fromName}</span>
                        <span className="text-[10px] font-mono text-slate-500 truncate hidden sm:inline">&lt;{email.fromEmail}&gt;</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium truncate mt-0.5">{email.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Security Badge */}
                    {isPhishing ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> FAKE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        SPF/DKIM ✓
                      </span>
                    )}

                    {/* Dual-Metric Priority Pill */}
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-400">
                        {email.importanceScore}
                        <span className="text-[9px] font-normal text-slate-500">/100</span>
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase font-mono">Importance</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Origin Geolocation & Threat Infrastructure Widget */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Infrastructure Origins</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Earliest Reliable Relay Nodes</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Relay Trace
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Origin item 1 */}
              <div 
                onClick={() => onNavigate('investigation')}
                className="p-3 rounded-lg bg-slate-950 border border-red-900/50 hover:border-red-500/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-red-300">FlokiNET Bulletproof (AS44050)</span>
                  <span className="font-mono text-[10px] text-red-400">Bucharest, RO</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">IP: 91.240.118.42 • Tor Exit: Frankfurt</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">DarkHydra Campaign</span>
                  <span className="text-slate-500">em-002, em-003</span>
                </div>
              </div>

              {/* Origin item 2 */}
              <div 
                onClick={() => onNavigate('investigation')}
                className="p-3 rounded-lg bg-slate-950 border border-amber-900/50 hover:border-amber-500/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-300">VDSina Hosting Ltd (AS58224)</span>
                  <span className="font-mono text-[10px] text-amber-400">Moscow, RU</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">IP: 194.26.29.112 • BEC Impersonation</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">CEO Wire Fraud</span>
                  <span className="text-slate-500">em-004</span>
                </div>
              </div>

              {/* Origin item 3 */}
              <div 
                onClick={() => onNavigate('investigation')}
                className="p-3 rounded-lg bg-slate-950 border border-purple-900/50 hover:border-purple-500/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-300">VNPT Residential Broadband</span>
                  <span className="font-mono text-[10px] text-purple-400">Ho Chi Minh, VN</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">IP: 103.151.124.99 • Open Relay</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">Prompt Injection</span>
                  <span className="text-slate-500">em-007</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 italic leading-snug">
              ⚖️ Notice: Origin coordinates designate probable transmission infrastructure or anonymization relay nodes, not guaranteed physical perpetrator location.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
