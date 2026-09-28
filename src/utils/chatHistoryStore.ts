import { ChatHistorySession } from '../types';

const STORAGE_KEYS = {
  assistant: 'mailguard_ai_chat_sessions_v1',
  pippin: 'mailguard_pippin_chat_sessions_v1',
};

// Seed initial historical chat sessions
const INITIAL_ASSISTANT_SESSIONS: ChatHistorySession[] = [
  {
    id: 'session-hydra-investigation',
    title: 'DarkHydra Banking Phish Investigation',
    createdAt: '14 Sep 2026 09:12 AM',
    lastActive: '14 Sep 2026 09:25 AM',
    previewSnippet: 'Decompiled relay hops from FlokiNET VPS and Tor exit node. DMARC reject triggered.',
    messageCount: 6,
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Can you analyze the hops on the urgent Chase wire notification?',
        timestamp: '09:12 AM',
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        text: 'The email claims to originate from Chase Bank, but the earliest reliable node is 185.220.101.5 (Tor Exit Node, Frankfurt) relaying to 91.240.118.42 (FlokiNET Bulletproof VPS). SPF, DKIM, and DMARC alignment all failed.',
        timestamp: '09:13 AM',
      },
      {
        id: 'msg-3',
        sender: 'user',
        text: 'What action should we take?',
        timestamp: '09:20 AM',
      },
      {
        id: 'msg-4',
        sender: 'assistant',
        text: 'Quarantine the email immediately, add chase-online-secure-auth.net to the border firewall DNS sinkhole, and check if any corporate users entered credentials.',
        timestamp: '09:25 AM',
      },
    ],
  },
  {
    id: 'session-macro-ransomware',
    title: 'ViperLocker Macro Detonation Report',
    createdAt: '14 Sep 2026 11:30 AM',
    lastActive: '14 Sep 2026 11:42 AM',
    previewSnippet: 'Sandbox execution analysis for Invoice_INV-9821.docm PowerShell dropper.',
    messageCount: 4,
    messages: [
      {
        id: 'msg-r1',
        sender: 'user',
        text: 'Evaluate the attachment Invoice_INV-9821.docm',
        timestamp: '11:30 AM',
      },
      {
        id: 'msg-r2',
        sender: 'assistant',
        text: 'Dynamic sandbox detonation identified obfuscated VBA auto-execute macro attempting PowerShell dropper download. Risk score 96/100.',
        timestamp: '11:32 AM',
      },
    ],
  },
  {
    id: 'session-dmarc-policy',
    title: 'Organizational DMARC & Quarantine Rules',
    createdAt: '13 Sep 2026 04:15 PM',
    lastActive: '13 Sep 2026 04:30 PM',
    previewSnippet: 'Guidance on switching from p=none monitoring to p=quarantine and p=reject.',
    messageCount: 4,
    messages: [
      {
        id: 'msg-d1',
        sender: 'user',
        text: 'How should we stage our DMARC enforcement rollout?',
        timestamp: '04:15 PM',
      },
      {
        id: 'msg-d2',
        sender: 'assistant',
        text: 'Begin with p=none for 30 days to collect aggregate RUA reports. Once legitimate senders are aligned, advance to p=quarantine with pct=25, scaling to 100 before setting p=reject.',
        timestamp: '04:20 PM',
      },
    ],
  },
];

const INITIAL_PIPPIN_SESSIONS: ChatHistorySession[] = [
  {
    id: 'pippin-session-onboarding',
    title: 'Pippin Setup & Security Guidelines',
    createdAt: '14 Sep 2026 08:30 AM',
    lastActive: '14 Sep 2026 08:45 AM',
    previewSnippet: 'Configuring multi-step source verification, OTP validation, and email category routing.',
    messageCount: 4,
    messages: [
      {
        id: 'p-msg-1',
        sender: 'user',
        text: 'How does the source verification and OTP registration protect my account?',
        timestamp: '08:30 AM',
      },
      {
        id: 'p-msg-2',
        sender: 'penguin',
        text: 'First, the server performs a source check to verify if your domain exists and has active MX records. Then we dispatch a secure 6-digit OTP before you set your master password with strict complexity rules!',
        timestamp: '08:31 AM',
      },
    ],
  },
  {
    id: 'pippin-session-colors',
    title: 'Dynamic Border Highlighting Guide',
    createdAt: '13 Sep 2026 02:00 PM',
    lastActive: '13 Sep 2026 02:15 PM',
    previewSnippet: 'Explanation of Blue (Family), Brown (Business), Red/Amber/Green risk borders.',
    messageCount: 4,
    messages: [
      {
        id: 'p-msg-c1',
        sender: 'user',
        text: 'What do the colored outlines on my emails mean?',
        timestamp: '02:00 PM',
      },
      {
        id: 'p-msg-c2',
        sender: 'penguin',
        text: 'Blue is for Family, Brown/Maroon is for Business/Banking/Staff, Red is High Risk, Yellow/Amber is Mid Risk, and Green is 0-Risk Clean!',
        timestamp: '02:02 PM',
      },
    ],
  },
];

export function getStoredChatSessions(scope: 'assistant' | 'pippin'): ChatHistorySession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[scope]);
    if (!raw) {
      const initial = scope === 'assistant' ? INITIAL_ASSISTANT_SESSIONS : INITIAL_PIPPIN_SESSIONS;
      localStorage.setItem(STORAGE_KEYS[scope], JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return scope === 'assistant' ? INITIAL_ASSISTANT_SESSIONS : INITIAL_PIPPIN_SESSIONS;
  }
}

export function saveChatSession(scope: 'assistant' | 'pippin', session: ChatHistorySession): void {
  const current = getStoredChatSessions(scope);
  const existingIdx = current.findIndex(s => s.id === session.id);
  
  let updated: ChatHistorySession[];
  if (existingIdx >= 0) {
    updated = current.map((s, idx) => idx === existingIdx ? session : s);
  } else {
    updated = [session, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEYS[scope], JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to persist chat session', err);
  }
}

export function deleteChatSession(scope: 'assistant' | 'pippin', sessionId: string): ChatHistorySession[] {
  const current = getStoredChatSessions(scope);
  const updated = current.filter(s => s.id !== sessionId);
  try {
    localStorage.setItem(STORAGE_KEYS[scope], JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete chat session', err);
  }
  return updated;
}

export function createNewChatSession(scope: 'assistant' | 'pippin', title?: string): ChatHistorySession {
  const newSession: ChatHistorySession = {
    id: 'session-' + Date.now(),
    title: title || `New Chat Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    lastActive: 'Just now',
    previewSnippet: 'Fresh conversation started.',
    messageCount: 0,
    messages: [],
  };
  saveChatSession(scope, newSession);
  return newSession;
}
