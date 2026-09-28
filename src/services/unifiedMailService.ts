import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { EmailItem, EmailCategory, ThreatClassification, SecurityStatus } from '../types';
import { computeSha256, testForPromptInjection, inspectDomainTyposquatting } from '../utils/forensicEngine';

export interface ImapAccountConfig {
  user: string;
  pass: string;
  host?: string;
  port?: number;
  secure?: boolean;
  provider?: 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'corporate';
}

// Auto-discovery configurations for known email service providers
export const KNOWN_PROVIDER_SERVERS: Record<string, { host: string; port: number; secure: boolean }> = {
  gmail: { host: 'imap.gmail.com', port: 993, secure: true },
  outlook: { host: 'outlook.office365.com', port: 993, secure: true },
  m365: { host: 'outlook.office365.com', port: 993, secure: true },
  yahoo: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
  icloud: { host: 'imap.mail.me.com', port: 993, secure: true },
  zoho: { host: 'imappro.zoho.com', port: 993, secure: true }
};

export function resolveServerForEmail(email: string, explicitHost?: string): { host: string; port: number; secure: boolean } {
  if (explicitHost) return { host: explicitHost, port: 993, secure: true };
  
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (domain.includes('gmail.com') || domain.includes('googlemail.com')) return KNOWN_PROVIDER_SERVERS.gmail;
  if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com') || domain.includes('office365.com')) return KNOWN_PROVIDER_SERVERS.outlook;
  if (domain.includes('yahoo.com') || domain.includes('ymail.com') || domain.includes('aol.com')) return KNOWN_PROVIDER_SERVERS.yahoo;
  if (domain.includes('icloud.com') || domain.includes('me.com') || domain.includes('mac.com')) return KNOWN_PROVIDER_SERVERS.icloud;
  if (domain.includes('zoho.com')) return KNOWN_PROVIDER_SERVERS.zoho;

  return { host: `imap.${domain}`, port: 993, secure: true };
}

export async function fetchUniversalRealEmails(config: ImapAccountConfig, maxCount = 25): Promise<EmailItem[]> {
  const resolved = resolveServerForEmail(config.user, config.host);
  
  const client = new ImapFlow({
    host: resolved.host,
    port: config.port || resolved.port,
    secure: config.secure ?? resolved.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
  });

  await client.connect();
  let lock: any = null;

  const emails: EmailItem[] = [];

  try {
    lock = await client.getMailboxLock('INBOX');
    const status = await client.status('INBOX', { messages: true });
    const totalMessages = status.messages || 0;
    if (totalMessages === 0) return [];

    const startSeq = Math.max(1, totalMessages - maxCount + 1);
    const range = `${startSeq}:*`;

    for await (const message of client.fetch(range, { source: true, envelope: true })) {
      if (!message.source) continue;
      
      const parsed: ParsedMail = await simpleParser(message.source);
      const rawHeaders = message.source.toString('utf-8', 0, 4000);
      const emailText = parsed.text || (typeof parsed.html === 'string' ? parsed.html.replace(/<[^>]+>/g, ' ') : '') || '(No Content)';
      const hash = await computeSha256(emailText);
      const injectionCheck = testForPromptInjection(emailText);

      const fromAddress = parsed.from?.value[0]?.address || config.user;
      const fromName = parsed.from?.value[0]?.name || fromAddress.split('@')[0];
      const fromDomain = fromAddress.split('@')[1] || 'unknown.org';
      const domainAudit = inspectDomainTyposquatting(fromDomain);

      const hasDkim = /dkim=pass/i.test(rawHeaders);
      const hasSpf = /spf=pass/i.test(rawHeaders);
      const hasDmarc = /dmarc=pass/i.test(rawHeaders);

      const isThreat = !hasDmarc || domainAudit.isLookalike || injectionCheck.hasInjection;
      const riskScore = injectionCheck.hasInjection ? 97 : domainAudit.isLookalike ? 95 : isThreat ? 78 : 5;

      const emailItem: EmailItem = {
        id: `real-${message.uid || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fromName,
        fromEmail: fromAddress,
        toEmail: config.user,
        date: parsed.date ? parsed.date.toUTCString() : new Date().toUTCString(),
        subject: parsed.subject || '(No Subject)',
        bodySnippet: emailText.slice(0, 160).trim() + '...',
        bodyText: emailText,
        rawHeaders,
        category: (domainAudit.isLookalike ? 'banking' : 'companies') as EmailCategory,
        importanceScore: /urgent|wire|invoice|alert|account/i.test(parsed.subject || '') ? 92 : 60,
        importanceReason: 'Retrieved via Live Zero-Trust IMAP Gateway',
        securityRiskScore: riskScore,
        threatClassification: isThreat ? (domainAudit.isLookalike ? 'phishing' : 'suspicious') : 'legitimate',
        securityStatus: isThreat ? 'quarantined' : 'clean',
        isRead: false,
        isStarred: false,
        attachments: (parsed.attachments || []).map((att) => ({
          name: att.filename || 'attachment',
          size: `${Math.round(att.size / 1024)} KB`,
          mimeType: att.contentType,
          isSuspicious: /(exe|scr|iso|docm|vbs|bat)$/i.test(att.filename || ''),
          threatDetails: /(exe|iso|docm)$/i.test(att.filename || '') ? 'Executable/Container attachment flagged' : undefined,
        })),
        urls: [],
        forensics: {
          returnPath: fromAddress,
          messageId: parsed.messageId || `<${message.uid}@imap-stream>`,
          replyTo: parsed.replyTo?.value[0]?.address || fromAddress,
          dkimStatus: hasDkim ? 'pass' : 'fail',
          dkimDomain: fromDomain,
          spfStatus: hasSpf ? 'pass' : 'fail',
          spfIp: '127.0.0.1',
          dmarcStatus: hasDmarc ? 'pass' : 'fail',
          dmarcPolicy: 'reject',
          routingAnomalies: domainAudit.isLookalike ? [`Lookalike domain targeting ${domainAudit.target}`] : [],
          forgedFields: isThreat ? ['Header signature validation mismatch'] : [],
        },
        attribution: {
          campaignConfidence: domainAudit.isLookalike ? 90 : 20,
          likelyCompromisedAccount: 15,
          spoofedDomainConfidence: domainAudit.isLookalike ? 95 : 5,
          infrastructureOriginText: `Live Ingress: ${resolved.host} (${resolved.port})`,
        },
        evidence: {
          evidenceId: `EV-${Math.floor(10000 + Math.random() * 90000)}`,
          sha256: hash,
          originalTimestamp: new Date().toISOString(),
          analyst: 'Automated IMAP Connector',
          status: 'original_sealed',
          chainOfCustody: [
            { step: 'Ingestion', timestamp: new Date().toISOString(), operator: 'Unified IMAP Engine', detail: 'Packet sealed with SHA-256' },
          ],
        },
        promptInjectionDetected: injectionCheck.hasInjection,
        promptInjectionExplanation: injectionCheck.hasInjection ? injectionCheck.reason : undefined,
        sourceApp: (resolved.host.includes('outlook') || resolved.host.includes('office365') ? 'outlook' : resolved.host.includes('yahoo') ? 'yahoo' : resolved.host.includes('google') || resolved.host.includes('gmail') ? 'gmail' : 'corporate'),
      };

      emails.unshift(emailItem);
    }
  } finally {
    if (lock) {
      try { lock.release(); } catch {}
    }
    try {
      await client.logout();
    } catch {}
  }

  return emails;
}
