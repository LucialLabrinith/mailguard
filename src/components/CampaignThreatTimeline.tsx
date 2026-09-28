import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Zap, 
  Cpu, 
  Globe, 
  ArrowRight, 
  Layers, 
  ChevronRight, 
  Terminal,
  Activity,
  Flame,
  Radio,
  Download,
  Eye,
  Server,
  CornerDownRight,
  Maximize2,
  Minimize2,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Navigation,
  MapPin,
  Network,
  HardDrive,
  ShieldX
} from 'lucide-react';
import { EmailItem, RelayHop, GeoLocationData, InfrastructureFlags } from '../types';
import { exportEmailForensicReport } from '../utils/exportForensicPdf';

export interface ThreatTimelineProps {
  emails: EmailItem[];
  selectedEmail?: EmailItem | null;
  selectedEmailId?: string;
  onSelectEmail?: (email: EmailItem) => void;
  className?: string;
  isCollapsible?: boolean;
}

// Known campaign-level attack profiles for correlation
const KNOWN_CAMPAIGNS: Record<string, {
  id: string;
  name: string;
  actor: string;
  target: string;
  threatLevel: 'critical' | 'high' | 'medium' | 'baseline';
  mttrSeconds: number;
  iocs: string[];
}> = {
  'phishing': {
    id: 'CAMP-HYDRA-842',
    name: 'DarkHydra Banking Phish Campaign',
    actor: 'AS44050 (FlokiNET Romania) via Tor Exit AS208323',
    target: 'Commercial Accounts & Treasury Operations',
    threatLevel: 'critical',
    mttrSeconds: 29,
    iocs: ['185.220.101.5', 'chase-online-secure-auth.net', 'AS44050', 'Tor-Exit-DE'],
  },
  'fraud': {
    id: 'CAMP-HYDRA-842',
    name: 'DarkHydra Credential & Wire Harvesting',
    actor: 'AS44050 Bulletproof Hosting (Bucharest)',
    target: 'Finance Operations & Wire Transfers',
    threatLevel: 'critical',
    mttrSeconds: 28,
    iocs: ['91.240.118.42', 'wire-escrow-routing.com', 'reverse-proxy-2fa'],
  },
  'impersonation': {
    id: 'CAMP-CEO-221',
    name: 'Executive Wire Impersonation (BEC)',
    actor: 'Consumer Freemail Relay (US East)',
    target: 'Executive Leadership & Payroll',
    threatLevel: 'high',
    mttrSeconds: 24,
    iocs: ['209.85.220.41', 'Display-Name-Spoofing', 'VIP-Keyword-Match'],
  },
  'suspicious': {
    id: 'CAMP-VIPER-104',
    name: 'ViperLocker Macro Ransomware Campaign',
    actor: 'Compromised Supply-Chain Relay (AS16276 OVH)',
    target: 'Supply Chain & Procurement',
    threatLevel: 'high',
    mttrSeconds: 30,
    iocs: ['198.51.100.77', 'Invoice_INV-9821.docm', 'VBA-Dropper-PowerShell'],
  },
  'legitimate': {
    id: 'CAMP-BASELINE-01',
    name: 'Verified Enterprise Core Traffic Baseline',
    actor: 'Authorized Enterprise Gateway (AS15169 / AS8075)',
    target: 'General Enterprise Ingress',
    threatLevel: 'baseline',
    mttrSeconds: 2,
    iocs: ['142.250.72.26', 'SPF=PASS', 'DKIM=PASS', 'DMARC=PASS'],
  },
};

export const VisualThreatTimeline: React.FC<ThreatTimelineProps> = ({
  emails,
  selectedEmail: propSelectedEmail,
  selectedEmailId,
  onSelectEmail,
  className = '',
  isCollapsible = true,
}) => {
  // Find current email
  const activeEmail = useMemo(() => {
    if (propSelectedEmail) return propSelectedEmail;
    if (selectedEmailId) return emails.find(e => e.id === selectedEmailId);
    return emails[0] || null;
  }, [propSelectedEmail, selectedEmailId, emails]);

  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'transit' | 'timeline' | 'campaign'>('transit');
  const [selectedHopIdx, setSelectedHopIdx] = useState<number>(0);
  const [expandedStep, setExpandedStep] = useState<number | null>(1); // default expand step 2 (Gateway) in timeline tab
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [isSimulatingPing, setIsSimulatingPing] = useState(false);
  const [pingLatencyMs, setPingLatencyMs] = useState<number | null>(null);

  if (!activeEmail) return null;

  const isThreat = activeEmail.threatClassification === 'phishing' || 
                   activeEmail.threatClassification === 'fraud' || 
                   activeEmail.threatClassification === 'suspicious' || 
                   activeEmail.threatClassification === 'impersonated';

  const earliestHop = activeEmail.forensics?.receivedChain?.find(h => h.isEarliestReliableNode) || activeEmail.forensics?.receivedChain?.[0];
  const geo = earliestHop?.geo || activeEmail.geolocation || {
    country: 'United States',
    city: 'Mountain View',
    region: 'California',
    latitude: 37.3861,
    longitude: -122.0839,
    ip: '142.250.72.26',
    asn: 'AS15169',
    isp: 'Google LLC',
    org: 'Alphabet Inc.'
  };

  // Determine campaign profile
  const campaignKey = activeEmail.threatClassification || 'legitimate';
  const campaignMeta = KNOWN_CAMPAIGNS[campaignKey] || KNOWN_CAMPAIGNS['phishing'];

  // Correlated emails in mailbox that share this campaign
  const correlatedEmails = emails.filter(e => {
    if (e.id === activeEmail.id) return false;
    if (isThreat) {
      return e.threatClassification === activeEmail.threatClassification ||
             (e.attribution?.probableCampaignId && e.attribution.probableCampaignId === campaignMeta.id) ||
             (e.forensics?.returnPath && e.forensics.returnPath.split('@')[1] === activeEmail.forensics?.returnPath?.split('@')[1]);
    }
    return e.threatClassification === 'legitimate';
  });

  // Extract or synthesize the full chain of physical transit path hops (Event Nodes)
  const transitHops: RelayHop[] = useMemo(() => {
    if (activeEmail.forensics?.receivedChain && activeEmail.forensics.receivedChain.length > 0) {
      return activeEmail.forensics.receivedChain;
    }

    const baseGeo = activeEmail.geolocation || {
      country: 'United States',
      city: 'Mountain View',
      region: 'California',
      latitude: 37.3861,
      longitude: -122.0839,
      ip: '142.250.72.26',
      asn: 'AS15169',
      isp: 'Google LLC Mail Hub',
      org: 'Enterprise Mail Infrastructure'
    };

    if (isThreat) {
      return [
        {
          hopNumber: 1,
          byServer: 'mail.bulletproof-vps.ro',
          fromServer: 'evil-origin-client.local',
          ipAddress: '185.220.101.5',
          timestamp: activeEmail.date || '14 Sep 2026 08:41:55 GMT',
          delaySeconds: 0,
          isEarliestReliableNode: true,
          geo: {
            country: 'Germany',
            city: 'Frankfurt',
            region: 'Hesse',
            latitude: 50.1109,
            longitude: 8.6821,
            asn: 'AS208323',
            isp: 'Tor Exit Node Organization',
            org: 'Zwiebelfreunde e.V.'
          },
          infra: {
            isTorExitNode: true,
            isVpnProxy: false,
            isOpenRelay: false,
            isCloudHosting: true,
            isBotnetSuspect: true,
            riskCategory: 'Tor / Anonymizer'
          }
        },
        {
          hopNumber: 2,
          byServer: 'relay-edge-02.flokinet.is',
          fromServer: 'mail.bulletproof-vps.ro',
          ipAddress: '91.240.118.42',
          timestamp: '+14s latency',
          delaySeconds: 14,
          isEarliestReliableNode: false,
          geo: {
            country: 'Romania',
            city: 'Bucharest',
            region: 'Ilfov',
            latitude: 44.4268,
            longitude: 26.1025,
            asn: 'AS44050',
            isp: 'FlokiNET Bulletproof Hosting',
            org: 'FlokiNET Network Solutions'
          },
          infra: {
            isTorExitNode: false,
            isVpnProxy: true,
            isOpenRelay: false,
            isCloudHosting: true,
            isBotnetSuspect: false,
            riskCategory: 'High Risk Cloud / Bulletproof'
          }
        },
        {
          hopNumber: 3,
          byServer: 'mx.mailguard-soc.net',
          fromServer: 'relay-edge-02.flokinet.is',
          ipAddress: '198.51.100.89',
          timestamp: '+28s latency',
          delaySeconds: 14,
          isEarliestReliableNode: false,
          geo: {
            country: 'United States',
            city: 'Ashburn',
            region: 'Virginia',
            latitude: 39.0438,
            longitude: -77.4874,
            asn: 'AS14618',
            isp: 'Amazon Corporate Ingress',
            org: 'MailGuard Secure Gateway Perimeter'
          },
          infra: {
            isTorExitNode: false,
            isVpnProxy: false,
            isOpenRelay: false,
            isCloudHosting: true,
            isBotnetSuspect: false,
            riskCategory: 'Authorized Enterprise SMTP'
          }
        }
      ];
    }

    return [
      {
        hopNumber: 1,
        byServer: 'mail-out.corporate-edge.com',
        fromServer: 'workstation.internal',
        ipAddress: baseGeo.ip || '142.250.72.26',
        timestamp: activeEmail.date || '14 Sep 2026 09:14:58 GMT',
        delaySeconds: 1,
        isEarliestReliableNode: true,
        geo: {
          country: baseGeo.country || 'United States',
          city: baseGeo.city || 'Mountain View',
          region: baseGeo.region || 'California',
          latitude: baseGeo.latitude ?? 37.3861,
          longitude: baseGeo.longitude ?? -122.0839,
          asn: baseGeo.asn || 'AS15169',
          isp: baseGeo.isp || 'Google LLC Mail Hub',
          org: baseGeo.org || 'Enterprise Mail Infrastructure'
        },
        infra: {
          isTorExitNode: false,
          isVpnProxy: false,
          isOpenRelay: false,
          isCloudHosting: true,
          isBotnetSuspect: false,
          riskCategory: 'Authorized Enterprise SMTP'
        }
      },
      {
        hopNumber: 2,
        byServer: 'mx.mailguard-soc.net',
        fromServer: 'mail-out.corporate-edge.com',
        ipAddress: '142.250.72.26',
        timestamp: '+1.2s latency',
        delaySeconds: 1.2,
        isEarliestReliableNode: false,
        geo: {
          country: 'United States',
          city: 'Council Bluffs',
          region: 'Iowa',
          latitude: 41.2619,
          longitude: -95.8608,
          asn: 'AS15169',
          isp: 'Google Cloud Platform',
          org: 'Alphabet Inc.'
        },
        infra: {
          isTorExitNode: false,
          isVpnProxy: false,
          isOpenRelay: false,
          isCloudHosting: true,
          isBotnetSuspect: false,
          riskCategory: 'Authorized Enterprise SMTP'
        }
      }
    ];
  }, [activeEmail, isThreat]);

  // Selected active hop for deep-dive technical inspector
  const activeHop = transitHops[selectedHopIdx] || transitHops[0];

  // Construct the 4 sequential milestones (for Tab 2: Temporal Progression)
  const timelineMilestones = [
    {
      step: 1,
      type: 'delivery',
      title: 'Delivery & Transport Ingress',
      subtitle: 'RFC 5322 SMTP Handoff & TLS Negotiation',
      timestamp: activeEmail.date || '14 Sep 2026 08:41:55 GMT',
      offsetSeconds: 0.0,
      status: activeEmail.forensics?.routingAnomalies?.length ? 'Anomalous Ingress' : 'Delivered to Perimeter',
      statusColor: activeEmail.forensics?.routingAnomalies?.length ? 'text-amber-400 bg-amber-950/40 border-amber-800' : 'text-cyan-400 bg-cyan-950/40 border-cyan-800',
      icon: Radio,
      summary: `Initial SMTP connection established from host node ${earliestHop?.ipAddress || geo?.ip || '142.250.72.26'} (${geo.city}, ${geo.country}).`,
      artifacts: [
        { label: 'Origin IP & Host', value: `${earliestHop?.ipAddress || geo?.ip || '142.250.72.26'} [${geo.asn || 'AS15169'}]` },
        { label: 'Ingress Protocol', value: 'ESMTPS with TLS 1.3 / ChaCha20-Poly1305' },
        { label: 'Envelope Return-Path', value: activeEmail.forensics?.returnPath || activeEmail.fromEmail },
        { label: 'RFC Message-ID', value: activeEmail.forensics?.messageId || `<${activeEmail.id}@relay.mailguard>` },
        { label: 'Physical Hop Location', value: `${geo.city}, ${geo.country}` },
        { label: 'Hop Delay', value: `${earliestHop?.delaySeconds || 0} seconds network transit` },
      ]
    },
    {
      step: 2,
      type: 'scanning',
      title: 'Gateway Scanning & Zero-Trust Inspection',
      subtitle: 'Cryptographic Protocol Evaluation & Neural Detonation',
      timestamp: '+0.82s post-ingress',
      offsetSeconds: 0.82,
      status: isThreat ? `Threat Flagged (${activeEmail.securityRiskScore}/100)` : 'Security Signatures Validated',
      statusColor: isThreat ? 'text-red-400 bg-red-950/40 border-red-800' : 'text-emerald-400 bg-emerald-950/40 border-emerald-800',
      icon: Cpu,
      summary: isThreat 
        ? `Zero-Trust Engine flagged ${activeEmail.threatClassification.toUpperCase()} payload. SPF=${activeEmail.forensics?.spfStatus || 'FAIL'}, DMARC=${activeEmail.forensics?.dmarcStatus || 'FAIL'}.` 
        : `Cryptographic signatures passed. SPF, DKIM, and DMARC verified against authoritative DNS root.`,
      artifacts: [
        { label: 'SPF Verification', value: `${(activeEmail.forensics?.spfStatus || 'PASS').toUpperCase()} (${activeEmail.forensics?.spfIp || 'Designated IP authorized'})` },
        { label: 'DKIM Signature', value: `${(activeEmail.forensics?.dkimStatus || 'PASS').toUpperCase()} (Domain: ${activeEmail.forensics?.dkimDomain || 'authoritative'})` },
        { label: 'DMARC Alignment', value: `${(activeEmail.forensics?.dmarcStatus || 'PASS').toUpperCase()} (Policy: p=${activeEmail.forensics?.dmarcPolicy || 'quarantine'})` },
        { label: 'Threat Classification', value: `${(activeEmail.threatClassification || 'Legitimate').toUpperCase()}` },
        { label: 'Calculated Risk Score', value: `${activeEmail.securityRiskScore} / 100` },
        { label: 'Prompt Injection Scan', value: activeEmail.promptInjectionDetected ? '🚨 ADVERSARIAL PAYLOAD DETECTED' : '✅ Clear (No Injections Found)' },
        { label: 'Attachment Detonation', value: activeEmail.attachments?.length ? `${activeEmail.attachments.length} attachment(s) sandbox-scanned` : 'No payload executables' },
      ]
    },
    {
      step: 3,
      type: 'user_action',
      title: 'User Interaction & Mailbox Telemetry',
      subtitle: 'Endpoint Containment & Protective Sandbox State',
      timestamp: '+2.10s post-ingress',
      offsetSeconds: 2.10,
      status: activeEmail.securityStatus === 'quarantined' ? 'Quarantined in Vault' : activeEmail.isRead ? 'Viewed in Sandbox' : 'Protected in Queue',
      statusColor: activeEmail.securityStatus === 'quarantined' ? 'text-purple-400 bg-purple-950/40 border-purple-800' : 'text-blue-400 bg-blue-950/40 border-blue-800',
      icon: Eye,
      summary: activeEmail.securityStatus === 'quarantined' 
        ? 'Email isolated in zero-trust quarantine vault. External asset rendering and hyperlinks neutralized.' 
        : 'Delivered to user inbox under MailGuard protective client shield with click-time URL verification.',
      artifacts: [
        { label: 'Mailbox Routing Status', value: activeEmail.securityStatus === 'quarantined' ? 'Vault Isolated (Quarantine)' : 'User Inbox (Protected)' },
        { label: 'Read / Inspection State', value: activeEmail.isRead ? 'Opened in Zero-Trust Sandbox' : 'Unopened' },
        { label: 'Click-Time URL Shield', value: activeEmail.urls?.length ? `${activeEmail.urls.length} link(s) sinkholed` : 'Zero embedded links' },
        { label: 'Endpoint Security Status', value: (activeEmail.securityStatus || 'clean').toUpperCase() },
        { label: 'Importance Priority', value: `${activeEmail.importanceScore || 50}/100 (${activeEmail.category})` },
      ]
    },
    {
      step: 4,
      type: 'campaign_correlation',
      title: 'Campaign-Level Attack Correlation',
      subtitle: 'Cross-Mailbox Cluster Intelligence & Attribution',
      timestamp: '+4.85s post-ingress',
      offsetSeconds: 4.85,
      status: isThreat ? `Matched: ${campaignMeta.id}` : 'Baseline Traffic Verified',
      statusColor: isThreat ? 'text-red-400 bg-red-950/40 border-red-800' : 'text-emerald-400 bg-emerald-950/40 border-emerald-800',
      icon: Flame,
      summary: isThreat 
        ? `Associated with ${campaignMeta.name}. Attacker infrastructure: ${campaignMeta.actor}. Identified ${correlatedEmails.length} correlated email(s) across mailbox.` 
        : `Normal institutional email traffic. Authenticated under standard enterprise baseline communication profile.`,
      artifacts: [
        { label: 'Correlated Campaign ID', value: campaignMeta.id },
        { label: 'Campaign Attack Name', value: campaignMeta.name },
        { label: 'Primary Attacker Entity', value: campaignMeta.actor },
        { label: 'Targeted Org Sector', value: campaignMeta.target },
        { label: 'Containment MTTR', value: `${campaignMeta.mttrSeconds} seconds automated response` },
        { label: 'Related Mailbox Emails', value: `${correlatedEmails.length} correlated item(s)` },
      ]
    },
  ];

  const handleExportPdf = () => {
    try {
      exportEmailForensicReport(activeEmail);
      setExportNotice(`Forensic PDF dossier for ${activeEmail.id} exported successfully!`);
      setTimeout(() => setExportNotice(null), 4500);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2500);
  };

  const handleSimulatePing = () => {
    setIsSimulatingPing(true);
    setPingLatencyMs(null);
    setTimeout(() => {
      const simulated = Math.floor(Math.random() * 45) + 12;
      setPingLatencyMs(simulated);
      setIsSimulatingPing(false);
    }, 600);
  };

  return (
    <div className={`rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-xl overflow-hidden text-slate-100 transition-all ${className}`}>
      
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        
        {/* Left: Title & Badge */}
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg border ${
            isThreat 
              ? 'bg-red-500/10 text-red-400 border-red-500/30' 
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          }`}>
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Visual Threat Progression &amp; Transit Timeline
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isThreat 
                  ? 'bg-red-950/80 text-red-300 border-red-700' 
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
              }`}>
                {isThreat ? `Campaign Threat: ${campaignMeta.id}` : 'Clean Traffic'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Interactive Event Nodes: Ingress Hops → Geolocation → ASN Providers → Latency
            </p>
          </div>
        </div>

        {/* Right: View switcher tabs & Export PDF button */}
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setActiveTab('transit')}
              className={`px-2.5 py-1 rounded transition-colors font-semibold flex items-center gap-1.5 ${
                activeTab === 'transit'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3 h-3" />
              <span>Transit Nodes ({transitHops.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-2.5 py-1 rounded transition-colors font-semibold flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Lifecycle Stages</span>
            </button>
            <button
              onClick={() => setActiveTab('campaign')}
              className={`px-2.5 py-1 rounded transition-colors font-semibold flex items-center gap-1.5 ${
                activeTab === 'campaign'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Campaign Cluster</span>
              {correlatedEmails.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[9px] font-bold">
                  {correlatedEmails.length}
                </span>
              )}
            </button>
          </div>

          {/* Download Forensic PDF Report */}
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 text-xs font-mono font-bold transition-colors shadow-xs"
            title="Export forensic analysis report as downloadable PDF document"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Collapse / Expand Toggle */}
          {isCollapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title={isExpanded ? 'Collapse timeline' : 'Expand timeline'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Export Success Notification Banner */}
      {exportNotice && (
        <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-700 text-emerald-200 text-xs flex items-center justify-between font-mono animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Body */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          
          {/* TAB 1: INTERACTIVE TRANSIT PATH EVENT NODES */}
          {activeTab === 'transit' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Event Nodes Sequence Track */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Network className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Email Ingress Transit Path (Click an Event Node for Deep Technical Telemetry)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {transitHops.length} Relay Hops Traversed &bull; Total Latency: ~{transitHops.reduce((sum, h) => sum + (h.delaySeconds || 0), 0)}s
                  </span>
                </div>

                {/* Horizontal event node strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {transitHops.map((hop, idx) => {
                    const isSelected = selectedHopIdx === idx;
                    const isEarliest = hop.isEarliestReliableNode || idx === 0;
                    const isBorder = idx === transitHops.length - 1;
                    const isMaliciousNode = hop.infra.isTorExitNode || hop.infra.riskCategory.includes('Bulletproof') || hop.infra.isBotnetSuspect;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedHopIdx(idx)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                          isSelected
                            ? isMaliciousNode
                              ? 'bg-slate-900 border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-500/20'
                              : 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/20'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        {/* Selected Indicator Ribbon */}
                        {isSelected && (
                          <div className={`absolute -top-2 left-4 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border shadow-xs ${
                            isMaliciousNode 
                              ? 'bg-red-600 text-white border-red-400' 
                              : 'bg-cyan-600 text-white border-cyan-300'
                          }`}>
                            Active Inspected Node
                          </div>
                        )}

                        {/* Node Header: Hop number, status badge, latency chip */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                              isMaliciousNode
                                ? 'bg-red-600 text-white'
                                : isBorder
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-cyan-600 text-white'
                            }`}>
                              {idx + 1}
                            </div>
                            <span className="text-xs font-bold font-mono text-slate-200">
                              {isEarliest ? 'Origin Ingress' : isBorder ? 'Perimeter Edge' : 'Transit Relay'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Latency chip */}
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-cyan-400" />
                              +{hop.delaySeconds || 0}s delay
                            </span>
                          </div>
                        </div>

                        {/* Node Core: IP address, Server Handoff */}
                        <div className="space-y-1 my-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-cyan-300 group-hover:text-cyan-200">
                              {hop.ipAddress}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              {hop.geo.asn}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 font-mono truncate" title={hop.byServer}>
                            By: {hop.byServer}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate" title={hop.fromServer}>
                            From: {hop.fromServer}
                          </p>
                        </div>

                        {/* Node Footer: Geo & Threat Flag */}
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                          <span className="flex items-center gap-1 text-slate-400 truncate max-w-[140px]">
                            <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                            {hop.geo.city}, {hop.geo.country}
                          </span>
                          <span className={`font-bold ${
                            isMaliciousNode ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {isSelected ? 'Inspecting ▼' : 'Click to inspect →'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deep-Dive Technical Node Forensic Inspector */}
              {activeHop && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/50 space-y-4 shadow-xl">
                  
                  {/* Inspector Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                            Deep-Dive Technical Telemetry: Transit Node #{activeHop.hopNumber || selectedHopIdx + 1}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                            IP: {activeHop.ipAddress}
                          </span>
                          {activeHop.infra.isTorExitNode && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700">
                              TOR EXIT NODE DETECTED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          RFC 5322 Received Relay Analysis &bull; Physical ASN &amp; Geolocation Carrier Profile
                        </p>
                      </div>
                    </div>

                    {/* Quick actions for inspected node */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => handleCopyIp(activeHop.ipAddress)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-semibold transition-colors"
                        title="Copy IP address to clipboard"
                      >
                        {copiedIp === activeHop.ipAddress ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copied IP!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Copy IP</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleSimulatePing}
                        disabled={isSimulatingPing}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-semibold transition-colors"
                        title="Simulate telemetry round-trip ping to this node IP"
                      >
                        <Activity className={`w-3.5 h-3.5 ${isSimulatingPing ? 'animate-spin' : 'text-cyan-400'}`} />
                        <span>{isSimulatingPing ? 'Pinging...' : pingLatencyMs ? `${pingLatencyMs}ms RTT` : 'Ping Trace'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Core Deep-Dive Metric Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    
                    {/* Card 1: Specific IP Geolocation Details */}
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 font-bold flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-400" />
                          <span>IP Geolocation</span>
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold">Physical PoP</span>
                      </div>

                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">City / Metro:</span>
                          <span className="text-slate-200 font-semibold">{activeHop.geo.city || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">State / Region:</span>
                          <span className="text-slate-200">{activeHop.geo.region || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Country:</span>
                          <span className="text-slate-200 font-semibold">{activeHop.geo.country}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-500">Coordinates:</span>
                          <span className="text-cyan-300 font-bold">
                            {activeHop.geo.latitude?.toFixed(4)}°, {activeHop.geo.longitude?.toFixed(4)}°
                          </span>
                        </div>
                      </div>

                      {/* Mini visual coordinate radar badge */}
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-cyan-400" />
                          <span>Lat/Long Grid</span>
                        </span>
                        <span className="text-emerald-400 font-semibold">Active Geocoded</span>
                      </div>
                    </div>

                    {/* Card 2: Hop Latency & Timing Details */}
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Hop Latency &amp; Timing</span>
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold">Transit Delta</span>
                      </div>

                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Hop Delay:</span>
                          <span className="text-amber-300 font-bold">+{activeHop.delaySeconds || 0} seconds</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Node Timestamp:</span>
                          <span className="text-slate-200 text-[10px] truncate max-w-[120px]" title={activeHop.timestamp}>
                            {activeHop.timestamp}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Transit Protocol:</span>
                          <span className="text-slate-200">ESMTPS</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-500">TLS Encryption:</span>
                          <span className="text-emerald-400 font-semibold">TLS 1.3 / ChaCha20</span>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Latency Status:</span>
                        <span className={activeHop.delaySeconds > 10 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {activeHop.delaySeconds > 10 ? 'MTA Queue Delay' : 'Nominal Transit'}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: ASN Provider & Routing Intelligence */}
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 font-bold flex items-center gap-1.5">
                          <Network className="w-3.5 h-3.5 text-cyan-400" />
                          <span>ASN Provider Info</span>
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold">Carrier BGP</span>
                      </div>

                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ASN Number:</span>
                          <span className="text-cyan-300 font-bold">{activeHop.geo.asn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Carrier ISP:</span>
                          <span className="text-slate-200 truncate max-w-[120px]" title={activeHop.geo.isp}>
                            {activeHop.geo.isp || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Registered Org:</span>
                          <span className="text-slate-200 truncate max-w-[120px]" title={activeHop.geo.org}>
                            {activeHop.geo.org || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-500">Risk Profile:</span>
                          <span className={`font-bold truncate max-w-[120px] ${
                            activeHop.infra.riskCategory.includes('Bulletproof') || activeHop.infra.riskCategory.includes('Tor')
                              ? 'text-red-400'
                              : 'text-emerald-400'
                          }`}>
                            {activeHop.infra.riskCategory}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Autonomous System:</span>
                        <span className="text-slate-200 font-semibold">{activeHop.geo.asn}</span>
                      </div>
                    </div>

                    {/* Card 4: Infrastructure & Threat Flags */}
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 font-bold flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                          <span>Infrastructure Flags</span>
                        </span>
                        <span className="text-[10px] text-purple-400 font-bold">Threat Eval</span>
                      </div>

                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tor Exit Node:</span>
                          <span className={activeHop.infra.isTorExitNode ? 'text-red-400 font-bold' : 'text-slate-400'}>
                            {activeHop.infra.isTorExitNode ? 'YES (FLAGGED)' : 'NO'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">VPN / Anonymizer:</span>
                          <span className={activeHop.infra.isVpnProxy ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                            {activeHop.infra.isVpnProxy ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cloud / VPS Host:</span>
                          <span className={activeHop.infra.isCloudHosting ? 'text-cyan-400 font-semibold' : 'text-slate-400'}>
                            {activeHop.infra.isCloudHosting ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-500">Botnet Suspect:</span>
                          <span className={activeHop.infra.isBotnetSuspect ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                            {activeHop.infra.isBotnetSuspect ? 'YES (SUSPICIOUS)' : 'CLEAR'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Classification:</span>
                        <span className={activeHop.isEarliestReliableNode ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {activeHop.isEarliestReliableNode ? 'Origin Gateway' : 'Intermediary'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Raw RFC 5322 Ingress Header Snippet for this node */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        <span>RFC 5322 Received Header Trace (Node #{activeHop.hopNumber || selectedHopIdx + 1})</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Cryptographically Extracted</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 text-slate-300 text-[11px] overflow-x-auto select-all leading-relaxed">
                      <code>
                        Received: from {activeHop.fromServer} ([{activeHop.ipAddress}]) by {activeHop.byServer} with ESMTPS id x9910si{selectedHopIdx + 1}82 for &lt;{activeEmail.toEmail || 'user@organization.corp'}&gt;; {activeHop.timestamp}
                      </code>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: TEMPORAL SEQUENCE OF LIFECYCLE EVENTS */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Stepper track */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {timelineMilestones.map((ms, idx) => {
                  const Icon = ms.icon;
                  const isCurrentExpanded = expandedStep === idx;
                  const isDeliv = ms.type === 'delivery';
                  const isScan = ms.type === 'scanning';
                  const isUser = ms.type === 'user_action';
                  const isCamp = ms.type === 'campaign_correlation';

                  const stepRing = isCamp && isThreat 
                    ? 'ring-1 ring-red-500/50 border-red-500/60' 
                    : isCurrentExpanded 
                      ? 'ring-1 ring-cyan-500/50 border-cyan-500/60' 
                      : 'border-slate-800';

                  return (
                    <div
                      key={ms.step}
                      onClick={() => setExpandedStep(isCurrentExpanded ? null : idx)}
                      className={`p-3.5 rounded-xl border bg-slate-950/70 transition-all cursor-pointer hover:bg-slate-950 flex flex-col justify-between ${stepRing}`}
                    >
                      {/* Step Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                            isCamp && isThreat
                              ? 'bg-red-600 text-white shadow-red-500/30 shadow-md'
                              : isScan && isThreat
                                ? 'bg-amber-600 text-white'
                                : 'bg-cyan-600 text-white'
                          }`}>
                            {ms.step}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {ms.offsetSeconds === 0 ? 'T+0.00s' : `+${ms.offsetSeconds}s`}
                          </span>
                        </div>

                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${ms.statusColor}`}>
                          {ms.type.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${
                            isThreat && (isCamp || isScan) ? 'text-red-400' : 'text-cyan-400'
                          }`} />
                          <span>{ms.title}</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-mono">
                          {ms.subtitle}
                        </p>
                      </div>

                      {/* Status Snippet */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate max-w-[130px]">{ms.status}</span>
                        <span className="text-cyan-400 font-bold flex-shrink-0">
                          {isCurrentExpanded ? 'Hide ▲' : 'Details ▼'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expanded Milestone Details Drawer */}
              {expandedStep !== null && timelineMilestones[expandedStep] && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-xs font-bold border border-cyan-800">
                        Step {timelineMilestones[expandedStep].step} of 4 Telemetry
                      </span>
                      <h4 className="text-xs font-bold text-white font-mono">
                        {timelineMilestones[expandedStep].title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Timestamp: {timelineMilestones[expandedStep].timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {timelineMilestones[expandedStep].summary}
                  </p>

                  {/* Artifacts Key-Value Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                    {timelineMilestones[expandedStep].artifacts.map((art, aidx) => (
                      <div key={aidx} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                          {art.label}
                        </span>
                        <strong className="text-slate-200 block truncate" title={art.value}>
                          {art.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CAMPAIGN ATTACK CLUSTER VIEW */}
          {activeTab === 'campaign' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Campaign Profile Card */}
              <div className={`p-4 rounded-xl border ${
                isThreat 
                  ? 'bg-red-950/20 border-red-700/60' 
                  : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                        {campaignMeta.id}
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {campaignMeta.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Target Sector: <strong className="text-slate-300">{campaignMeta.target}</strong>  |  MTTR: <strong className="text-amber-400">{campaignMeta.mttrSeconds}s</strong>
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border self-start sm:self-auto ${
                    campaignMeta.threatLevel === 'critical' ? 'bg-red-950 text-red-300 border-red-700' : 'bg-amber-950 text-amber-300 border-amber-700'
                  }`}>
                    Threat: {campaignMeta.threatLevel}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Primary Infrastructure / Actor:</span>
                    <p className="text-slate-200 font-semibold">{campaignMeta.actor}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Correlated IoC Indicators:</span>
                    <div className="flex flex-wrap gap-1">
                      {campaignMeta.iocs.map((ioc, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 text-[10px] border border-slate-700">
                          {ioc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Correlated Emails in Mailbox */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Mailbox Incursions Correlated with this Campaign ({correlatedEmails.length + 1} Total)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Click any correlated message to inspect timeline
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {/* Current Active Email Card */}
                  <div className="p-2.5 rounded-lg border border-cyan-500/70 bg-cyan-950/30 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">{activeEmail.id} (Current)</span>
                      <span className="text-[10px] text-cyan-400 font-bold">Active Inspect</span>
                    </div>
                    <p className="text-slate-200 text-xs truncate mt-1">{activeEmail.subject}</p>
                    <p className="text-slate-400 text-[10px] truncate">{activeEmail.fromEmail}</p>
                  </div>

                  {/* Correlated Emails Cards */}
                  {correlatedEmails.map((corEmail) => (
                    <button
                      key={corEmail.id}
                      onClick={() => onSelectEmail && onSelectEmail(corEmail)}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950 text-left transition-all text-xs font-mono group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300 group-hover:text-cyan-300">{corEmail.id}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                          {corEmail.threatClassification}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs truncate mt-1 group-hover:text-white">{corEmail.subject}</p>
                      <p className="text-slate-500 text-[10px] truncate">{corEmail.fromEmail}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

// Backwards-compatible export
export const CampaignThreatTimeline = VisualThreatTimeline;
