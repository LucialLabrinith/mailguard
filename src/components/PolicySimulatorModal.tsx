import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  FileCode2, 
  Lock, 
  Play, 
  CheckCircle2, 
  Ban, 
  RefreshCw,
  Sparkles,
  Globe,
  Radio,
  FileCheck2,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { EmailItem, PolicySimulationConfig, PolicySimulationResult, PolicyRuleEvaluation } from '../types';

interface PolicySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: EmailItem | null;
  onApplyPolicy?: (config: PolicySimulationConfig, summary: string) => void;
}

const DEFAULT_CONFIG: PolicySimulationConfig = {
  dmarcPolicy: 'enforce_reject',
  spfStrictness: 'hard_fail_reject',
  dkimRequirement: 'mandatory',
  torRelayAction: 'drop_immediately',
  lookalikeDomainProtection: 'strict_quarantine',
  maxDomainAgeDays: 30,
  stripExecutableAttachments: true,
  blockPromptInjectionPayloads: true,
  riskThreshold: 65,
  geoFencingBlockedCountries: ['RU', 'RO', 'KP', 'IR'],
};

export const PolicySimulatorModal: React.FC<PolicySimulatorModalProps> = ({
  isOpen,
  onClose,
  email,
  onApplyPolicy,
}) => {
  const [config, setConfig] = useState<PolicySimulationConfig>(DEFAULT_CONFIG);
  const [activePreset, setActivePreset] = useState<'strict' | 'balanced' | 'permissive' | 'custom'>('balanced');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Apply Presets
  const handleSelectPreset = (preset: 'strict' | 'balanced' | 'permissive') => {
    setActivePreset(preset);
    if (preset === 'strict') {
      setConfig({
        dmarcPolicy: 'enforce_reject',
        spfStrictness: 'hard_fail_reject',
        dkimRequirement: 'mandatory',
        torRelayAction: 'drop_immediately',
        lookalikeDomainProtection: 'strict_quarantine',
        maxDomainAgeDays: 60,
        stripExecutableAttachments: true,
        blockPromptInjectionPayloads: true,
        riskThreshold: 45,
        geoFencingBlockedCountries: ['RU', 'RO', 'KP', 'IR', 'BY'],
      });
    } else if (preset === 'balanced') {
      setConfig(DEFAULT_CONFIG);
    } else {
      setConfig({
        dmarcPolicy: 'permissive_none',
        spfStrictness: 'permissive',
        dkimRequirement: 'optional',
        torRelayAction: 'tag_warning_banner',
        lookalikeDomainProtection: 'flag_only',
        maxDomainAgeDays: 7,
        stripExecutableAttachments: false,
        blockPromptInjectionPayloads: false,
        riskThreshold: 85,
        geoFencingBlockedCountries: [],
      });
    }
  };

  // Run Simulation Logic
  const simulationResult: PolicySimulationResult = useMemo(() => {
    if (!email) {
      return {
        overallVerdict: 'DELIVER_INBOX',
        simulatedRiskScore: 0,
        originalRiskScore: 0,
        ruleEvaluations: [],
        summaryMessage: 'No email loaded for policy simulation.',
        smtpResponseCode: 250,
      };
    }

    const evals: PolicyRuleEvaluation[] = [];
    let wouldReject = false;
    let wouldQuarantine = false;
    let wouldTag = false;
    let simulatedRisk = email.securityRiskScore ?? 0;

    const earliestHop = email.forensics?.receivedChain?.find(h => h.isEarliestReliableNode) || email.forensics?.receivedChain?.[0];
    const isTor = earliestHop?.infra?.isTorExitNode;
    const countryCode = earliestHop?.geo?.countryCode;
    const dmarcStatus = email.forensics?.dmarcStatus;
    const spfStatus = email.forensics?.spfStatus;
    const dkimStatus = email.forensics?.dkimStatus;
    const isLookalike = email.attribution?.lookalikeTarget || email.urls?.some(u => u.isLookalike);
    const hasExecutable = email.attachments?.some(a => 
      a.mimeType?.includes('executable') || 
      a.name?.endsWith('.exe') || 
      a.name?.endsWith('.scr') || 
      a.name?.endsWith('.docm')
    );

    // Rule 1: DMARC Policy
    if (dmarcStatus === 'fail') {
      if (config.dmarcPolicy === 'enforce_reject') {
        evals.push({
          ruleId: 'DMARC-01',
          name: 'DMARC Policy Enforcement',
          description: 'Sender failed DMARC cryptographic alignment test',
          triggered: true,
          verdict: 'violation',
          impact: '550 SMTP Permanent Rejection (Dropped at perimeter)',
        });
        wouldReject = true;
      } else if (config.dmarcPolicy === 'enforce_quarantine') {
        evals.push({
          ruleId: 'DMARC-01',
          name: 'DMARC Policy Enforcement',
          description: 'Sender failed DMARC alignment test',
          triggered: true,
          verdict: 'warning',
          impact: 'Quarantined in isolated forensic storage',
        });
        wouldQuarantine = true;
      } else {
        evals.push({
          ruleId: 'DMARC-01',
          name: 'DMARC Policy Permissive',
          description: 'DMARC failure ignored under p=none monitoring',
          triggered: false,
          verdict: 'neutral',
          impact: 'Delivered with advisory telemetry header',
        });
      }
    } else {
      evals.push({
        ruleId: 'DMARC-01',
        name: 'DMARC Alignment Check',
        description: 'DMARC policy verified and aligned',
        triggered: false,
        verdict: 'pass',
        impact: 'Cryptographic policy verified',
      });
    }

    // Rule 2: Tor / Bulletproof Relay
    if (isTor) {
      if (config.torRelayAction === 'drop_immediately') {
        evals.push({
          ruleId: 'TOR-02',
          name: 'Darknet / Tor Exit Node Blocker',
          description: `Earliest hop originated through known Tor Exit Node (${earliestHop?.ipAddress})`,
          triggered: true,
          verdict: 'violation',
          impact: 'Connection dropped with TCP RST packet',
        });
        wouldReject = true;
      } else if (config.torRelayAction === 'tag_warning_banner') {
        evals.push({
          ruleId: 'TOR-02',
          name: 'Tor Relay Warning Tagging',
          description: 'Traffic from anonymizing Tor proxy flagged for recipient',
          triggered: true,
          verdict: 'warning',
          impact: 'Warning banner injected into header and view',
        });
        wouldTag = true;
      }
    }

    // Rule 3: Lookalike Domain Detection
    if (isLookalike) {
      if (config.lookalikeDomainProtection === 'strict_quarantine') {
        evals.push({
          ruleId: 'LOOKALIKE-03',
          name: 'Lookalike & Typosquatting Blocker',
          description: `Domain mimics legitimate brand '${email.attribution?.lookalikeTarget || 'chase.com'}'`,
          triggered: true,
          verdict: 'violation',
          impact: 'Diverted to SOC Isolation Sandbox for triage',
        });
        wouldQuarantine = true;
      } else if (config.lookalikeDomainProtection === 'flag_only') {
        evals.push({
          ruleId: 'LOOKALIKE-03',
          name: 'Lookalike Domain Flagging',
          description: 'Possible domain spoofing flagged to user',
          triggered: true,
          verdict: 'warning',
          impact: 'Tagged with warning badge',
        });
        wouldTag = true;
      }
    }

    // Rule 4: Geo-Fencing
    if (countryCode && config.geoFencingBlockedCountries.includes(countryCode)) {
      evals.push({
        ruleId: 'GEO-04',
        name: 'Perimeter Geo-Fencing',
        description: `Originating server relay in restricted zone (${countryCode})`,
        triggered: true,
        verdict: 'violation',
        impact: 'Border gateway refused SMTP handshake',
      });
      wouldReject = true;
    }

    // Rule 5: Anti-Prompt-Injection
    if (email.promptInjectionDetected) {
      if (config.blockPromptInjectionPayloads) {
        evals.push({
          ruleId: 'PROMPT-05',
          name: 'Adversarial Prompt-Injection Defense',
          description: 'Suspicious LLM jailbreak or hidden prompt instructions detected',
          triggered: true,
          verdict: 'violation',
          impact: 'Payload stripped and sanitized; AI memory protected',
        });
        wouldQuarantine = true;
      }
    }

    // Rule 6: Executable Attachments
    if (hasExecutable && config.stripExecutableAttachments) {
      evals.push({
        ruleId: 'MIME-06',
        name: 'Executable & Macro Attachment Stripping',
        description: 'Weaponized binary or macro container (.exe, .docm, .scr) present',
        triggered: true,
        verdict: 'violation',
        impact: 'Attachment quarantined; placeholder text delivered',
      });
      wouldQuarantine = true;
    }

    // Determine Overall Outcome
    let overallVerdict: PolicySimulationResult['overallVerdict'] = 'DELIVER_INBOX';
    let summary = '';
    let smtpCode = 250;

    if (wouldReject) {
      overallVerdict = 'REJECT_GATEWAY';
      summary = 'Mail would be REJECTED at the perimeter edge. Sender receives 550 Policy Violation error.';
      smtpCode = 550;
      simulatedRisk = 0; // Prevented
    } else if (wouldQuarantine) {
      overallVerdict = 'QUARANTINE_ISOLATE';
      summary = 'Mail would be ISOLATED in Zero-Trust Quarantine. Recipient is not exposed.';
      smtpCode = 451;
      simulatedRisk = Math.max(10, simulatedRisk - 40);
    } else if (wouldTag) {
      overallVerdict = 'DELIVER_WARNING';
      summary = 'Mail would be DELIVERED with high-visibility warning banner and neutralized links.';
      smtpCode = 250;
    } else {
      overallVerdict = 'DELIVER_INBOX';
      summary = 'Mail meets all organizational security policy criteria and is DELIVERED normally.';
      smtpCode = 250;
    }

    return {
      overallVerdict,
      simulatedRiskScore: simulatedRisk,
      originalRiskScore: email.securityRiskScore ?? 0,
      ruleEvaluations: evals,
      summaryMessage: summary,
      smtpResponseCode: smtpCode,
    };
  }, [config, email]);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setAppliedNotice('Organization security policy rules updated successfully and applied to active perimeter.');
      if (onApplyPolicy) {
        onApplyPolicy(config, simulationResult.summaryMessage);
      }
      setTimeout(() => {
        setAppliedNotice(null);
      }, 4000);
    }, 600);
  };

  if (!isOpen || !email) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Security Policy Sandbox Simulator</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Interactive Testbed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Test how RFC 5322 email headers react to organizational rules before deploying to perimeter gateways.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Controls, Right Live Simulation Feedback */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left Column: Policy Configuration Controls (7 cols) */}
          <div className="lg:col-span-7 p-5 space-y-5">
            
            {/* Presets Bar */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Organizational Security Policy Presets
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('strict')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    activePreset === 'strict'
                      ? 'bg-red-950/40 border-red-500/80 text-red-300 ring-1 ring-red-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold">Strict Zero-Trust</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Drop unaligned mail</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('balanced')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    activePreset === 'balanced'
                      ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300 ring-1 ring-cyan-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold">Enterprise Guard</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Quarantine & verify</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('permissive')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    activePreset === 'permissive'
                      ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold">Permissive Audit</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Log without blocking</p>
                </button>
              </div>
            </div>

            {/* Granular Policy Rule Toggles */}
            <div className="space-y-3.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Policy Parameters Under Test
              </span>

              {/* DMARC Policy */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
                    DMARC Enforcement Action
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">RFC 7489</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] font-mono">
                  {(['enforce_reject', 'enforce_quarantine', 'permissive_none'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({ ...prev, dmarcPolicy: mode }));
                        setActivePreset('custom');
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                        config.dmarcPolicy === mode
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode === 'enforce_reject' ? 'Reject (Drop)' : mode === 'enforce_quarantine' ? 'Quarantine' : 'Log Only'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tor & Anonymizer Action */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    Tor Exit Nodes & Anonymizer Relays
                  </span>
                  <span className="text-[10px] font-mono text-purple-400">Zero-Trust Geo</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] font-mono">
                  {(['drop_immediately', 'tag_warning_banner', 'allow'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({ ...prev, torRelayAction: mode }));
                        setActivePreset('custom');
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                        config.torRelayAction === mode
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode === 'drop_immediately' ? 'Drop Connection' : mode === 'tag_warning_banner' ? 'Tag Warning' : 'Allow'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lookalike & Typosquatting Protection */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Lookalike Domain Defense</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Quarantines domains mimicking authorized company brands
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({
                      ...prev,
                      lookalikeDomainProtection: prev.lookalikeDomainProtection === 'strict_quarantine' ? 'disabled' : 'strict_quarantine',
                    }));
                    setActivePreset('custom');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                    config.lookalikeDomainProtection === 'strict_quarantine'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {config.lookalikeDomainProtection === 'strict_quarantine' ? 'Enabled' : 'Bypassed'}
                </button>
              </div>

              {/* Anti-Prompt-Injection AI Defense */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Anti-Prompt-Injection AI Firewall</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Neutralize adversarial instructions and jailbreak attempts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.blockPromptInjectionPayloads}
                  onChange={(e) => {
                    setConfig((prev) => ({ ...prev, blockPromptInjectionPayloads: e.target.checked }));
                    setActivePreset('custom');
                  }}
                  className="rounded text-cyan-500 focus:ring-0"
                />
              </div>

              {/* Executable MIME Filtering */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Strip Executables & Macros (.exe, .docm)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Isolate binary payload attachments before reaching client
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.stripExecutableAttachments}
                  onChange={(e) => {
                    setConfig((prev) => ({ ...prev, stripExecutableAttachments: e.target.checked }));
                    setActivePreset('custom');
                  }}
                  className="rounded text-cyan-500 focus:ring-0"
                />
              </div>

              {/* Risk Score Threshold Slider */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span>Perimeter Quarantine Threshold</span>
                  <span className="text-amber-400 font-mono font-bold">&gt; {config.riskThreshold}/100</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={config.riskThreshold}
                  onChange={(e) => {
                    setConfig((prev) => ({ ...prev, riskThreshold: Number(e.target.value) }));
                    setActivePreset('custom');
                  }}
                  className="w-full accent-cyan-500"
                />
                <p className="text-[10px] text-slate-500 font-mono">
                  Emails with simulated risk exceeding this score are quarantined automatically.
                </p>
              </div>

            </div>
          </div>

          {/* Right Column: Simulated Live Evaluation (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-slate-950/60 flex flex-col justify-between space-y-4">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Simulated Gateway Outcome
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Target: {email.id}
                </span>
              </div>

              {/* Primary Verdict Card */}
              <div className={`p-4 rounded-xl border text-center space-y-2 ${
                simulationResult.overallVerdict === 'REJECT_GATEWAY'
                  ? 'bg-red-950/40 border-red-500/80 text-red-200' :
                simulationResult.overallVerdict === 'QUARANTINE_ISOLATE'
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-200' :
                simulationResult.overallVerdict === 'DELIVER_WARNING'
                  ? 'bg-blue-950/40 border-blue-500/80 text-blue-200' :
                  'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {simulationResult.overallVerdict === 'REJECT_GATEWAY' ? (
                    <Ban className="w-6 h-6 text-red-400" />
                  ) : simulationResult.overallVerdict === 'QUARANTINE_ISOLATE' ? (
                    <Lock className="w-6 h-6 text-amber-400" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  )}
                  <h3 className="text-base font-extrabold tracking-wide">
                    {simulationResult.overallVerdict.replace('_', ' ')}
                  </h3>
                </div>

                <p className="text-xs font-mono font-bold">
                  SMTP {simulationResult.smtpResponseCode} Response
                </p>

                <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                  {simulationResult.summaryMessage}
                </p>

                {/* Score Comparison */}
                <div className="pt-2 flex items-center justify-center gap-4 text-xs font-mono border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Original Risk</span>
                    <strong className="text-red-400">{simulationResult.originalRiskScore}/100</strong>
                  </div>
                  <div className="text-slate-500">➔</div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Simulated Post-Policy</span>
                    <strong className="text-emerald-400">{simulationResult.simulatedRiskScore}/100</strong>
                  </div>
                </div>
              </div>

              {/* Rule by Rule Evaluation List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Rule Evaluation Telemetry ({simulationResult.ruleEvaluations.length})
                </span>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {simulationResult.ruleEvaluations.map((rule) => (
                    <div
                      key={rule.ruleId}
                      className={`p-2 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                        rule.verdict === 'violation'
                          ? 'bg-red-950/30 border-red-900/60 text-red-300'
                          : rule.verdict === 'warning'
                          ? 'bg-amber-950/30 border-amber-900/60 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          {rule.verdict === 'violation' ? (
                            <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          )}
                          <span>{rule.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{rule.description}</p>
                      </div>

                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0 ${
                        rule.verdict === 'violation'
                          ? 'bg-red-900 text-red-200'
                          : rule.verdict === 'warning'
                          ? 'bg-amber-900 text-amber-200'
                          : 'bg-emerald-900 text-emerald-200'
                      }`}>
                        {rule.verdict}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Apply Policy Actions */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              {appliedNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{appliedNotice}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {isApplying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>Apply Tested Policy to Organization</span>
              </button>

              <p className="text-[10px] text-center text-slate-500">
                Logged to tamper-proof SOC Action Audit Trail upon confirmation.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
