import { EmailItem } from '../types';

export const SYSTEM_AVAILABLE_TAGS = [
  'Credential Phishing',
  'Malware Attachment',
  'Business Email Compromise',
  'Executive Impersonation',
  'Lookalike Typosquatting',
  'Prompt Injection',
  'Invoice Fraud',
  'Legitimate Verified',
] as const;

export type SystemTag = typeof SYSTEM_AVAILABLE_TAGS[number];

/**
 * Heuristic automated scanner that analyzes email metadata, subject, body,
 * headers, URLs, and attachments to assign forensic tags.
 */
export function autoScanAndTagEmail(email: Partial<EmailItem>): string[] {
  const tags = new Set<string>(email.tags || []);
  const subject = (email.subject || '').toLowerCase();
  const body = (email.bodyText || '').toLowerCase();
  const fromEmail = (email.fromEmail || '').toLowerCase();
  const fromName = (email.fromName || '').toLowerCase();
  const headers = (email.rawHeaders || '').toLowerCase();

  // 1. Prompt Injection
  if (
    email.promptInjectionDetected ||
    body.includes('system override') ||
    body.includes('ignore previous instructions') ||
    body.includes('system prompt') ||
    body.includes('bypass guardrails') ||
    subject.includes('override')
  ) {
    tags.add('Prompt Injection');
  }

  // 2. Malware Attachment
  const hasMaliciousAttachment = email.attachments?.some(
    (a) => {
      const fileName = (a.name || (a as any).fileName || '').toLowerCase();
      return (
        a.isSuspicious ||
        fileName.endsWith('.iso') ||
        fileName.endsWith('.exe') ||
        fileName.endsWith('.scr') ||
        fileName.endsWith('.vbs') ||
        fileName.endsWith('.zip')
      );
    }
  );
  if (
    hasMaliciousAttachment ||
    subject.includes('iso') ||
    subject.includes('payload') ||
    body.includes('executable') ||
    body.includes('trojan')
  ) {
    tags.add('Malware Attachment');
  }

  // 3. Credential Phishing
  const hasPhishUrls = email.urls?.some((u) => u.isPhishingTarget || u.isLookalike || u.reputation === 'Malicious URL');
  if (
    hasPhishUrls ||
    email.threatClassification === 'phishing' ||
    body.includes('password reset') ||
    body.includes('verify your account') ||
    body.includes('unauthorized login') ||
    body.includes('2fa credentials') ||
    body.includes('security hold') ||
    body.includes('docusign') ||
    subject.includes('security alert') ||
    subject.includes('account suspended')
  ) {
    if (email.threatClassification !== 'legitimate') {
      tags.add('Credential Phishing');
    }
  }

  // 4. Lookalike Typosquatting
  const hasLookalike =
    email.attribution?.spoofedDomainConfidence && email.attribution.spoofedDomainConfidence > 70;
  const isLookalikeTarget =
    fromEmail.includes('chase-') ||
    fromEmail.includes('docusign-') ||
    fromEmail.includes('.cloud') ||
    fromEmail.includes('.xyz') ||
    email.urls?.some((u) => u.isLookalike);
  if (hasLookalike || isLookalikeTarget) {
    if (email.threatClassification !== 'legitimate') {
      tags.add('Lookalike Typosquatting');
    }
  }

  // 5. Business Email Compromise (BEC)
  if (
    email.attribution?.campaignName?.includes('BEC') ||
    email.attribution?.campaignName?.includes('NimbleMule') ||
    (body.includes('wire transfer') && (fromName.includes('cfo') || fromName.includes('ceo') || subject.includes('confidential acquisition'))) ||
    body.includes('urgent payment diversion') ||
    body.includes('swift code')
  ) {
    tags.add('Business Email Compromise');
  }

  // 6. Executive Impersonation
  if (
    fromName.toLowerCase().includes('cfo') ||
    fromName.toLowerCase().includes('ceo') ||
    fromName.toLowerCase().includes('executive') ||
    body.includes('confidential acquisition') ||
    body.includes('do not discuss with anyone') ||
    body.includes('are you at your desk')
  ) {
    if (email.threatClassification !== 'legitimate') {
      tags.add('Executive Impersonation');
    }
  }

  // 7. Invoice Fraud
  if (
    subject.includes('invoice') ||
    subject.includes('wire transfer') ||
    body.includes('outstanding balance') ||
    body.includes('remittance') ||
    body.includes('routing number')
  ) {
    if (email.threatClassification !== 'legitimate' || email.category === 'banking') {
      tags.add('Invoice Fraud');
    }
  }

  // 8. Legitimate Verified
  if (
    email.threatClassification === 'legitimate' &&
    email.forensics?.dmarcStatus === 'pass' &&
    email.forensics?.spfStatus === 'pass' &&
    email.forensics?.dkimStatus === 'pass'
  ) {
    tags.add('Legitimate Verified');
  }

  return Array.from(tags);
}
