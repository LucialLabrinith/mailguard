import React, { useState } from 'react';
import { 
  Microscope, 
  ShieldAlert, 
  Globe2, 
  KeyRound, 
  Server, 
  Layers, 
  FileCheck2, 
  AlertTriangle, 
  Printer, 
  Download, 
  ExternalLink,
  ChevronRight,
  Fingerprint,
  Radio,
  Share2,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { InvestigationCase, EmailItem, RelayHop } from '../types';

interface InvestigationViewProps {
  cases: InvestigationCase[];
  emails: EmailItem[];
  onSelectEmail: (email: EmailItem) => void;
  onOpenAIWithContext: (prompt: string) => void;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  cases,
  emails,
  onSelectEmail,
  onOpenAIWithContext,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || 'INC-2026-042');
  const [activeTab, setActiveTab] = useState<'relays' | 'campaign' | 'evidence' | 'report'>('relays');

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const relatedEmails = emails.filter((e) => activeCase?.emailIds?.includes(e.id));
  
  // Extract relay trace from primary email in case
  const primaryEmail = relatedEmails[0] || emails.find(e => e.id === 'em-002') || emails[0];
  const relayTrace: RelayHop[] = primaryEmail?.forensics?.receivedChain || [];
  const earliestNode = relayTrace.find(h => h.isEarliestReliableNode) || relayTrace[0];

  const handlePrintReport = () => {
    window.print();
  };

  if (!activeCase) {
    return <div className="p-8 text-center text-slate-400">No active cases found</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto select-none print:p-0 print:bg-white print:text-black">
      
      {/* Top Case Selector & Severity Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm print:border-none print:p-2">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Microscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-bold">
                {activeCase.id}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                activeCase.severity === 'critical' ? 'bg-red-950 text-red-400 border border-red-800' :
                'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {activeCase.severity} SEVERITY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {(activeCase.status || 'investigating').toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{activeCase.title}</h2>
          </div>
        </div>

        {/* Case Switcher & Actions */}
        <div className="flex items-center gap-2 print:hidden">
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}: {c.title.slice(0, 32)}...
              </option>
            ))}
          </select>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-mono print:hidden">
        {[
          { id: 'relays', label: '🛰️ Relay Hops & Infrastructure', count: `${relayTrace.length} Hops` },
          { id: 'campaign', label: '🕸️ Multi-Email Correlation Graph', count: `${relatedEmails.length} Emails` },
          { id: 'evidence', label: '🔐 Cryptographic Evidence Vault', count: 'SHA-256' },
          { id: 'report', label: '📄 Executive Forensic Briefing', count: 'Court Ready' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: RELAY HOPS & INFRASTRUCTURE */}
      {activeTab === 'relays' && (
        <div className="space-y-6">
          
          {/* Earliest Reliable Node Highlight Card */}
          {earliestNode && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-red-900/60 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                  Earliest Reliable Ingress Node (Attribution Focal Point)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  Tor / Bulletproof Proxy Identified
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">IP Address</p>
                  <p className="text-base font-bold text-slate-100 font-mono mt-0.5">{earliestNode.ipAddress}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">PTR: {earliestNode.fromServer}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Geolocation Origin</p>
                  <p className="text-base font-bold text-slate-100 font-mono mt-0.5 truncate" title={`${earliestNode.geo?.city}, ${earliestNode.geo?.region || ''}, ${earliestNode.geo?.country}`}>
                    {earliestNode.geo?.city}{earliestNode.geo?.region ? `, ${earliestNode.geo.region}` : ''}, {earliestNode.geo?.country}
                  </p>
                  <p className="text-[10px] text-cyan-400 font-mono mt-1">
                    Coords: {earliestNode.geo?.latitude !== undefined ? `${Math.abs(earliestNode.geo.latitude).toFixed(4)}° ${earliestNode.geo.latitude >= 0 ? 'N' : 'S'}` : ''}, {earliestNode.geo?.longitude !== undefined ? `${Math.abs(earliestNode.geo.longitude).toFixed(4)}° ${earliestNode.geo.longitude >= 0 ? 'E' : 'W'}` : ''}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Autonomous System (ASN)</p>
                  <p className="text-base font-bold text-slate-100 font-mono mt-0.5">{earliestNode.geo?.asn}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">{earliestNode.geo?.isp}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Infrastructure Flags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {earliestNode.infra?.isTorExitNode && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">Tor Exit</span>
                    )}
                    {earliestNode.infra?.isCloudHosting && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">Cloud VPS</span>
                    )}
                    {earliestNode.infra?.isBotnetSuspect && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">Suspect Botnet</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 italic">
                ⚖️ Mandatory Legal Disclosure: Geolocation indicates physical server or proxy egress node. In modern cyber operations, this represents attacker proxy infrastructure, not guaranteed physical operator residency.
              </div>
            </div>
          )}

          {/* Complete Sequential Relay Chain */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              RFC 5322 Received Header Hop Trace Sequence ({relayTrace.length} Nodes)
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {relayTrace.map((hop) => (
                <div key={hop.hopNumber} className="relative group">
                  {/* Dot */}
                  <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-mono font-bold ${
                    hop.isEarliestReliableNode
                      ? 'bg-red-500 border-red-300 text-white'
                      : 'bg-slate-900 border-cyan-500 text-cyan-400'
                  }`}>
                    {hop.hopNumber}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          Hop #{hop.hopNumber}: {hop.fromServer}
                        </span>
                        {hop.isEarliestReliableNode && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                            Earliest Reliable Node
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Timestamp: {hop.timestamp} (+{hop.delaySeconds}s delay)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-400 pt-1">
                      <p>IP: <strong className="text-cyan-400">{hop.ipAddress}</strong></p>
                      <p>Location: <strong className="text-slate-200">{hop.geo?.city}, {hop.geo?.country}</strong></p>
                      <p>ASN: <strong className="text-slate-200">{hop.geo?.asn} ({hop.geo?.isp})</strong></p>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/50">
                      Handled By: <span className="text-slate-300">{hop.byServer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CAMPAIGN CORRELATION GRAPH */}
      {activeTab === 'campaign' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Threat Campaign Infrastructure Graph
                </h3>
                <p className="text-xs text-slate-400">
                  Shared hosting, lookup IPs, and lookalike domain clusters mapped across multiple emails.
                </p>
              </div>
              <button
                onClick={() => onOpenAIWithContext(`Explain the campaign infrastructure of ${activeCase.title}`)}
                className="px-3 py-1 text-xs rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-mono flex items-center gap-1"
              >
                <span>Ask AI to Decompile Graph</span>
              </button>
            </div>

            {/* High-Tech Vector Visualizer Canvas */}
            <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-hidden flex items-center justify-center">
              
              {/* Background Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>

              {/* Graphical Nodes */}
              <div className="relative w-full max-w-4xl h-full flex items-center justify-between px-8 text-xs font-mono">
                
                {/* Attacker Node */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/20">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-red-400">Threat Actor</span>
                  <span className="text-[10px] text-slate-400">DarkHydra Group</span>
                </div>

                <div className="w-16 h-0.5 bg-gradient-to-r from-red-500 to-amber-500"></div>

                {/* Tor Proxy */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500 flex items-center justify-center text-amber-400">
                    <Globe2 className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-amber-400">Tor Exit Node</span>
                  <span className="text-[10px] text-slate-400">Frankfurt AS208323</span>
                </div>

                <div className="w-16 h-0.5 bg-gradient-to-r from-amber-500 to-red-500"></div>

                {/* Bulletproof VPS */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-950/80 border-2 border-red-600 flex items-center justify-center text-red-300 shadow-lg shadow-red-600/30">
                    <Server className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-red-300">AS44050 FlokiNET</span>
                  <span className="text-[10px] text-red-400">91.240.118.42 (Bucharest)</span>
                </div>

                <div className="w-16 h-0.5 bg-gradient-to-r from-red-500 to-cyan-500"></div>

                {/* Phishing Domains Node */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500 flex items-center justify-center text-purple-400">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-purple-400">2 Lookalike Domains</span>
                  <span className="text-[10px] text-slate-400">chase-online-secure-auth.net</span>
                </div>

                <div className="w-16 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500"></div>

                {/* Target Victim */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border-2 border-cyan-500 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                    <Lock className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-cyan-400">Enterprise SOC</span>
                  <span className="text-[10px] text-slate-400">quarantined.corp</span>
                </div>

              </div>

            </div>

            {/* Correlated Messages in this Campaign */}
            <div className="space-y-2 pt-3">
              <p className="text-xs font-mono font-bold text-slate-300 uppercase">
                Correlated Mailbox Messages ({relatedEmails.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => onSelectEmail(email)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-red-400 font-bold">{email.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300">
                        Risk {email.securityRiskScore}/100
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">{email.subject}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">From: {email.fromEmail}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: EVIDENCE VAULT & SHA-256 CHAIN OF CUSTODY */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  Cryptographic Evidence Vault & Chain of Custody
                </h3>
                <p className="text-xs text-slate-400">
                  SHA-256 cryptographic seals ensuring tamper-evident preservation for legal compliance.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                STATUS: ORIGINAL_SEALED
              </span>
            </div>

            {/* Evidence items */}
            <div className="space-y-4">
              {relatedEmails.map((email) => (
                <div key={email.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-200">
                      Artifact ID: {email.evidence.evidenceId} (Email: {email.id})
                    </span>
                    <span className="font-mono text-slate-400">
                      Timestamp: {email.evidence.originalTimestamp}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 break-all">
                    SHA-256: <strong className="text-cyan-400">{email.evidence.sha256}</strong>
                  </div>

                  {/* Chain of Custody Audit Log */}
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[11px] font-mono font-bold text-slate-400 uppercase">Audit Trail & Chain of Custody:</p>
                    <div className="divide-y divide-slate-800 text-[11px] font-mono">
                      {email.evidence.chainOfCustody && email.evidence.chainOfCustody.length > 0 ? (
                        email.evidence.chainOfCustody.map((c, i) => (
                          <div key={i} className="py-1.5 flex items-center justify-between gap-2">
                            <span className="text-emerald-400">{c.step}</span>
                            <span className="text-slate-400">{c.operator}</span>
                            <span className="text-slate-500">{c.timestamp}</span>
                          </div>
                        ))
                      ) : (
                        <div className="py-1.5 text-slate-500">
                          Initial Ingestion Sealed • Automated Forensic Engine • {email.date}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: EXECUTIVE FORENSIC BRIEFING */}
      {activeTab === 'report' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 print:border-none print:p-0">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                OFFICIAL CYBER FORENSIC INCIDENT BRIEFING
              </h1>
              <p className="text-xs font-mono text-slate-400">
                Case Reference: {activeCase.id} • Classification: RESTRICTED SOC
              </p>
            </div>
            <button
              onClick={handlePrintReport}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>Print Briefing</span>
            </button>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <section className="space-y-1">
              <h4 className="font-bold text-slate-100 uppercase font-mono">1. Executive Summary</h4>
              <p>
                On September 14, 2026, the MailGuard Autonomous Ingestion Gateway intercepted a multi-vector phishing campaign 
                targeting enterprise financial authorization workflows. The attack utilized deceptive brand lookalikes imitating JPMorgan Chase 
                and urgent pretexts of unauthorized wire transfers.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-slate-100 uppercase font-mono">2. Infrastructure Attribution</h4>
              <p>
                Transmission headers revealed routing through an anonymization chain consisting of a Frankfurt Tor exit node (AS208323) 
                connecting to a bulletproof hosting VPS operating under AS44050 FlokiNET in Bucharest, Romania (IP: 91.240.118.42). 
                DKIM signatures were fabricated, and DMARC enforcement was bypassed through the registration of lookalike domain 
                <code>chase-online-secure-auth.net</code>.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-slate-100 uppercase font-mono">3. Evidence Preservation & Integrity</h4>
              <p>
                All ingested RFC 5322 payloads were immediately cryptographically sealed with SHA-256 hashes in the immutable evidence vault. 
                Chain of custody logs verify zero modification between network ingestion and forensic inspection.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-slate-100 uppercase font-mono">4. Containment Actions Executed</h4>
              <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-400">
                <li>Immediate quarantine of payload messages ({relatedEmails.map(e => e.id).join(', ')}).</li>
                <li>Edge firewall egress rule created blocking AS44050 IP ranges.</li>
                <li>Sinkhole DNS entry implemented for <code>*.chase-online-secure-auth.net</code>.</li>
              </ul>
            </section>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between text-[11px] font-mono text-slate-500">
            <span>Prepared by: Certified L3 Cyber Forensic Investigator</span>
            <span>MailGuard AI Forensics Core v2.4</span>
          </div>
        </div>
      )}

    </div>
  );
};
