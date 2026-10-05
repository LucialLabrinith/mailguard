export type EmailCategory = 
  | 'banking'
  | 'loans'
  | 'family'
  | 'companies'
  | 'staff'
  | 'documents'
  | 'education'
  | 'subscriptions'
  | 'purchases'
  | 'security'
  | 'general';

export type ThreatClassification = 
  | 'legitimate'
  | 'suspicious'
  | 'impersonated'
  | 'phishing'
  | 'fraud';

export type SecurityStatus = 
  | 'clean'
  | 'suspicious'
  | 'phishing'
  | 'fraud'
  | 'spam'
  | 'quarantined'
  | 'blocked';

export type NotificationSeverity = 
  | 'critical'
  | 'high'
  | 'important'
  | 'priority'
  | 'normal'
  | 'info';

export interface GeoLocationData {
  country: string;
  countryCode: string;
  city: string;
  region: string; // State or Province
  state?: string;
  street?: string; // Exact street or road
  streetAddress?: string; // Full street address (e.g. 100 Main St)
  postalCode?: string;
  latitude: number;
  longitude: number;
  lat?: number;
  long?: number;
  asn: string;
  isp: string;
  org: string;
  ip?: string;
  source?: string;
  accuracyMeters?: number;
}

export interface InfrastructureFlags {
  isTorExitNode: boolean;
  isVpnProxy: boolean;
  isOpenRelay: boolean;
  isCloudHosting: boolean;
  isBotnetSuspect: boolean;
  riskCategory: 'High Risk Cloud / Bulletproof' | 'Tor / Anonymizer' | 'Residential Relay' | 'Authorized Enterprise SMTP' | 'Standard Consumer ISP';
}

export interface RelayHop {
  hopNumber: number;
  byServer: string;
  fromServer: string;
  ipAddress: string;
  timestamp: string;
  delaySeconds: number;
  isEarliestReliableNode: boolean;
  geo: GeoLocationData;
  infra: InfrastructureFlags;
}

export interface EmailHeaderForensics {
  returnPath: string;
  receivedChain?: RelayHop[];
  messageId: string;
  replyTo: string;
  dkimStatus: 'pass' | 'fail' | 'neutral' | 'none';
  dkimDomain: string;
  spfStatus: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none';
  spfIp: string;
  dmarcStatus: 'pass' | 'fail' | 'quarantine' | 'reject' | 'none';
  dmarcPolicy: string;
  routingAnomalies: string[];
  forgedFields: string[];
  clientUserAgent?: string;
  contentMimeType?: string;
}

export interface AttributionIntelligence {
  probableCampaignId?: string;
  campaignName?: string;
  campaignConfidence: number; // 0 - 100%
  likelyCompromisedAccount: number; // 0 - 100%
  spoofedDomainConfidence: number; // 0 - 100%
  infrastructureOriginText: string;
  lookalikeTarget?: string;
  detectedDomain?: string;
  techniqueSummary?: string[];
}

export interface ChainOfCustodyEntry {
  step: string;
  timestamp: string;
  operator: string;
  detail: string;
}

export interface EvidenceVaultItem {
  evidenceId: string;
  sha256: string;
  originalTimestamp: string;
  analyst: string;
  status: 'original_sealed' | 'under_forensic_review' | 'verified_tamper_free';
  chainOfCustody: ChainOfCustodyEntry[];
}

export interface EmailAttachment {
  name: string;
  size: string;
  mimeType: string;
  isSuspicious: boolean;
  threatDetails?: string;
  sha256?: string;
}

export interface EmailUrlItem {
  url: string;
  domain: string;
  isLookalike: boolean;
  isPhishingTarget: boolean;
  reputation: 'Safe' | 'Suspicious' | 'Malicious URL' | 'Deceptive Redirect';
  originalDisplay?: string;
}

export interface EmailGeolocationMetadata {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  lat?: number;
  long?: number;
  region?: string;
  country: string;
  countryCode?: string;
  asn?: string;
  isp?: string;
  org?: string;
  postalCode?: string;
  timezone?: string;
  ip?: string;
}

export interface EmailItem {
  id: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  date: string;
  subject: string;
  bodySnippet: string;
  bodyText: string;
  bodyHtml?: string;
  rawHeaders: string;
  category: EmailCategory;
  importanceScore: number; // 0 to 100
  importanceReason: string;
  securityRiskScore: number; // 0 to 100
  threatClassification: ThreatClassification;
  securityStatus: SecurityStatus;
  isRead: boolean;
  isStarred: boolean;
  attachments: EmailAttachment[];
  urls: EmailUrlItem[];
  forensics: EmailHeaderForensics;
  attribution: AttributionIntelligence;
  evidence: EvidenceVaultItem;
  geolocation?: EmailGeolocationMetadata;
  promptInjectionDetected?: boolean;
  promptInjectionExplanation?: string;
  aiSummary?: string;
  tags?: string[];
  analystNotes?: string[];
  sourceApp?: 'gmail' | 'docs' | 'm365' | 'outlook' | 'yahoo' | 'corporate';
  threadId?: string;
  threadMessagesCount?: number;
  threadMessages?: EmailItem[];
  isRealEmail?: boolean;
  isLiveGmail?: boolean;
}

export type ConnectedSourceId = 'all' | 'gmail' | 'docs' | 'm365' | 'outlook' | 'yahoo' | 'corporate';

export interface ConnectedSourceAccount {
  id: 'all' | 'gmail' | 'docs' | 'm365' | 'outlook' | 'yahoo' | 'corporate';
  name: string;
  type?: 'email' | 'workspace_docs' | 'suite' | 'unified';
  account: string;
  status: 'connected' | 'syncing' | 'ready';
  itemCount: number;
  threatCount: number;
  lastSync: string;
  badge?: string;
  description?: string;
}

export interface ConnectedProviderInfo {
  provider: 'gmail' | 'docs' | 'm365' | 'outlook' | 'yahoo' | 'corporate' | 'gemini';
  name: string;
  accountEmail: string;
  status: 'connected' | 'needs_permission' | 'syncing';
  permissions: string[];
  lastSyncTime: string;
}

export interface ActionAuditEntry {
  id: string;
  action: string;
  targetId?: string;
  targetTitle: string;
  timestamp: string;
  operator: string;
  role: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'quarantine' | 'block' | 'release' | 'ingest' | 'case' | 'tag' | 'quick_reply' | 'bulk' | 'sync' | 'general';
  notes?: string;
  metadata?: Record<string, any>;
}

export interface InvestigationCase {
  id: string;
  title: string;
  emailIds: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'contained' | 'closed';
  createdAt: string;
  leadAttribution: string;
  campaignId?: string;
  tags: string[];
  timeline: { time: string; event: string; type: 'ingest' | 'auth' | 'ip' | 'ioc' | 'action' }[];
  notes: string[];
  reportPdfAvailable?: boolean;
}

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: string;
  emailId?: string;
  caseId?: string;
  isRead: boolean;
  actionLabel?: string;
  category: string;
}

export interface AnalyticsData {
  timeRange: 'today' | 'week' | 'month';
  received: number;
  important: number;
  spam: number;
  suspicious: number;
  blocked: number;
  phishing: number;
  quarantined: number;
  aiTrendNarrative: string;
  categoryDistribution: Record<string, number>;
  topTargetedBrands: { brand: string; count: number; risk: string }[];
  topThreatCountries: { country: string; count: number; code: string; lat: number; lng: number }[];
  trendTimeline: { label: string; legitimate: number; threats: number; spam: number }[];
}

export interface UserSession {
  email: string;
  name: string;
  username?: string;
  role: 'Senior Cyber Forensic Analyst' | 'SOC Security Engineer' | 'Enterprise Administrator';
  mfaVerified: boolean;
  dataMasking: boolean;
  autoIngestStream: boolean;
  retentionDays: number;
  theme?: 'dark' | 'light';
  connectedApps?: Record<string, ConnectedProviderInfo>;
  connectedSources?: Record<string, ConnectedSourceAccount>;
  activeSource?: ConnectedSourceId;
  isGoogleConnected?: boolean;
}

// Sandbox Policy Simulator Types
export interface PolicySimulationConfig {
  dmarcPolicy: 'enforce_reject' | 'enforce_quarantine' | 'permissive_none';
  spfStrictness: 'hard_fail_reject' | 'soft_fail_quarantine' | 'permissive';
  dkimRequirement: 'mandatory' | 'optional';
  torRelayAction: 'drop_immediately' | 'tag_warning_banner' | 'allow';
  lookalikeDomainProtection: 'strict_quarantine' | 'flag_only' | 'disabled';
  maxDomainAgeDays: number; // e.g. 30 days
  stripExecutableAttachments: boolean;
  blockPromptInjectionPayloads: boolean;
  riskThreshold: number; // 0 - 100
  geoFencingBlockedCountries: string[]; // country codes e.g. ['RU', 'KP', 'IR']
}

export interface PolicyRuleEvaluation {
  ruleId: string;
  name: string;
  description: string;
  triggered: boolean;
  verdict: 'pass' | 'violation' | 'warning' | 'neutral';
  impact: string;
}

export interface PolicySimulationResult {
  overallVerdict: 'REJECT_GATEWAY' | 'QUARANTINE_ISOLATE' | 'DELIVER_WARNING' | 'DELIVER_INBOX';
  simulatedRiskScore: number;
  originalRiskScore: number;
  ruleEvaluations: PolicyRuleEvaluation[];
  summaryMessage: string;
  smtpResponseCode: number; // e.g. 550, 451, 250
}

// AI Category Memory Rule
export interface CategoryMemoryRule {
  id: string;
  targetPattern: string; // e.g. 'fraud-alerts@chase.com' or 'chase.com'
  matchType: 'sender_email' | 'sender_domain';
  assignedCategory: EmailCategory;
  originalCategory?: EmailCategory;
  createdAt: string;
  sourceEmailId?: string;
  hitCount: number;
}

// Campaign Threat Timeline Milestone
export interface CampaignMilestone {
  milestoneType: 'arrival' | 'analysis' | 'containment';
  title: string;
  timestamp: string;
  elapsedSecondsFromArrival: number;
  status: 'completed' | 'in_progress' | 'bypassed';
  details: string;
  actor: string;
  technicalTelemetry: {
    label: string;
    value: string;
  }[];
}

export interface CampaignThreatData {
  id: string;
  campaignName: string;
  threatLevel: 'critical' | 'high' | 'medium' | 'baseline';
  threatType: 'phishing' | 'ransomware' | 'impersonation' | 'credential_harvesting' | 'clean';
  emailIds: string[];
  primaryActorOrInfrastructure: string;
  originGeo: {
    country: string;
    countryCode: string;
    city: string;
    ip: string;
  };
  targetedDepartment: string;
  mttrSeconds: number; // Mean Time to Respond / Contain
  milestones: CampaignMilestone[];
}

// Chat Session for History Sidebar ("Side All Chats")
export interface ChatHistorySession {
  id: string;
  title: string;
  createdAt: string;
  lastActive: string;
  previewSnippet: string;
  messageCount: number;
  messages: {
    id: string;
    sender: 'user' | 'assistant' | 'penguin';
    text: string;
    timestamp: string;
  }[];
}

