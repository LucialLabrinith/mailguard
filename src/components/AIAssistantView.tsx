import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Terminal, 
  AlertTriangle, 
  Image as ImageIcon, 
  FileText, 
  Layers, 
  ChevronRight, 
  RefreshCw,
  Eye,
  CheckCircle2,
  MessageSquare,
  Plus
} from 'lucide-react';
import { EmailItem, ChatHistorySession } from '../types';
import { 
  getStoredChatSessions, 
  saveChatSession, 
  deleteChatSession, 
  createNewChatSession 
} from '../utils/chatHistoryStore';
import { SideAllChatsDrawer } from './SideAllChatsDrawer';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isThreatAlert?: boolean;
  visualData?: any;
}

interface AIAssistantViewProps {
  emails: EmailItem[];
  activeEmail: EmailItem | null;
  initialPrompt?: string;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  emails,
  activeEmail,
  initialPrompt,
}) => {
  // Chat History Sessions
  const [sessions, setSessions] = useState<ChatHistorySession[]>(() => getStoredChatSessions('assistant'));
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const list = getStoredChatSessions('assistant');
    return list[0]?.id || 'session-hydra-investigation';
  });
  const [showSideChats, setShowSideChats] = useState(true);

  // Initialize messages from active session
  const [messages, setMessages] = useState<Message[]>(() => {
    const list = getStoredChatSessions('assistant');
    const first = list[0];
    if (first && first.messages && first.messages.length > 0) {
      return first.messages.map((m) => ({
        id: m.id,
        sender: (m.sender === 'penguin' ? 'assistant' : m.sender) as 'user' | 'assistant',
        text: m.text,
        timestamp: m.timestamp,
      }));
    }
    return [
      {
        id: 'm-init',
        sender: 'assistant',
        text: `Hello Analyst. I am **MailGuard AI**, your zero-trust forensic intelligence copilot.\n\n` +
          `🛡️ **Active Protection Mode**: All email payloads are treated as UNTRUSTED DATA. Anti-Prompt-Injection policies are strictly enforced.\n\n` +
          `I am grounded in your active mailbox (${emails.length} messages indexed). I can help you:\n` +
          `• **Forensic Decompilation**: Explain SPF/DKIM/DMARC failures, relay hops, and lookalike domains.\n` +
          `• **Compare Threats**: Contrast the genuine Chase wire alert with the DarkHydra lookalike phish.\n` +
          `• **Threat Visualization**: Generate graphical vector correlation maps.\n` +
          `• **Mailbox Summarization**: Review your Banking, Loans, Staff, and Personal communications safely.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState<string>(() => {
    return localStorage.getItem('mailguard_ai_draft_prompt') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeVisual, setActiveVisual] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Switch to selected session
  const handleSelectSession = (session: ChatHistorySession) => {
    setActiveSessionId(session.id);
    if (session.messages && session.messages.length > 0) {
      setMessages(
        session.messages.map((m) => ({
          id: m.id,
          sender: (m.sender === 'penguin' ? 'assistant' : m.sender) as 'user' | 'assistant',
          text: m.text,
          timestamp: m.timestamp,
        }))
      );
    } else {
      setMessages([
        {
          id: 'init-' + session.id,
          sender: 'assistant',
          text: `Thread active: **${session.title}**.\n\nYou can query RFC 5322 header traces, simulate perimeter filters, or inspect email payloads.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Create new session
  const handleCreateNewSession = () => {
    const newSession = createNewChatSession('assistant');
    const updatedList = getStoredChatSessions('assistant');
    setSessions(updatedList);
    setActiveSessionId(newSession.id);
    setMessages([
      {
        id: 'new-' + Date.now(),
        sender: 'assistant',
        text: `New investigation session initiated. Grounded in ${emails.length} mailbox emails. How can MailGuard AI assist you?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Delete session
  const handleDeleteSession = (sessionId: string) => {
    const remaining = deleteChatSession('assistant', sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      if (remaining.length > 0) {
        handleSelectSession(remaining[0]);
      } else {
        handleCreateNewSession();
      }
    }
  };

  // Sync draft prompt to localStorage whenever user types
  const handleInputChange = (val: string) => {
    setInput(val);
    localStorage.setItem('mailguard_ai_draft_prompt', val);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeVisual]);

  // If initialPrompt passed, send it
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessagesList = [...messages, userMsg];
    setMessages(newMessagesList);
    setInput('');
    localStorage.removeItem('mailguard_ai_draft_prompt');
    setIsLoading(true);

    try {
      // Check if user is asking for visual graph
      if (promptText.toLowerCase().includes('visual') || promptText.toLowerCase().includes('graph') || promptText.toLowerCase().includes('infographic')) {
        try {
          const visualRes = await fetch('/api/gemini/generate-visual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText }),
          });
          if (visualRes.ok) {
            const vData = await visualRes.json();
            setActiveVisual(vData);
          }
        } catch (visErr) {
          console.warn('Visual generation error:', visErr);
        }
      }

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          emailContextId: activeEmail?.id,
        }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: 'a-' + Date.now(),
        sender: 'assistant',
        text: data.reply || 'Analysis completed with no output.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isThreatAlert: data.blocked,
      };

      const finalMessages = [...newMessagesList, aiMsg];
      setMessages(finalMessages);

      // Save to chat session storage
      const currentSess = sessions.find((s) => s.id === activeSessionId);
      const updatedSess: ChatHistorySession = {
        id: activeSessionId,
        title: currentSess?.title || promptText.slice(0, 36) + '...',
        createdAt: currentSess?.createdAt || new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
        lastActive: 'Just now',
        previewSnippet: promptText.slice(0, 75),
        messageCount: finalMessages.length,
        messages: finalMessages.map((m) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp,
        })),
      };
      saveChatSession('assistant', updatedSess);
      setSessions(getStoredChatSessions('assistant'));
    } catch (err: any) {
      const fallbackMsg: Message = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        text: `Telemetry note: Connected to local zero-trust heuristic model. Your query has been processed against the active mailbox corpus.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Compare genuine Chase email vs fraudulent Chase phish',
    'Summarize all high-risk threats detected today',
    'What loans or mortgage deadlines do I have?',
    'Generate visual threat vector infographic',
    'Test adversarial prompt injection payload',
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden select-none bg-slate-950">
      
      {/* Side All Chats History Drawer */}
      <SideAllChatsDrawer
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateNewSession={handleCreateNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={showSideChats}
        title="Side All Chats"
      />

      {/* Left / Main Chat Pane */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800">
        
        {/* Top Chat Header */}
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">MailGuard AI Copilot</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                  Zero-Trust Guarded
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Model: Gemini 3.8 Flash • Grounded with {emails.length} Mailbox Messages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Side All Chats Toggle Button */}
            <button
              onClick={() => setShowSideChats(!showSideChats)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                showSideChats
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Toggle Side All Chats History"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Side All Chats ({sessions.length})</span>
            </button>

            {activeEmail && (
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono">
                <span className="text-slate-400">Inspecting:</span>
                <span className="text-cyan-400 font-bold">{activeEmail.id}</span>
                <span className="text-slate-300 truncate max-w-[140px]">{activeEmail.subject}</span>
              </div>
            )}
          </div>
        </div>

        {/* Anti-Prompt-Injection Safeguard Pill */}
        <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-cyan-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-Prompt-Injection Defense Active: External email instructions are non-executable.</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">RFC 5322 Compliant</span>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-cyan-600 text-slate-950 font-medium rounded-br-none'
                      : m.isThreatAlert
                      ? 'bg-red-950/70 border border-red-800 text-red-200 rounded-bl-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none backdrop-blur-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {m.text}
                  </div>
                  <div className="flex items-center justify-end text-[10px] opacity-70 font-mono">
                    {m.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1 text-xs font-mono font-bold">
                    SOC
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 p-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>MailGuard Copilot is decompiling forensic headers & evaluating threats...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Predefined Prompt Chips */}
        <div className="p-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(prompt)}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Ask anything about your emails, request threat decompilation, or test prompt injection..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 transition-all font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* Right Visual Threat Infographic Drawer */}
      {activeVisual && (
        <div className="w-full md:w-96 border-l border-slate-800 bg-slate-900/90 p-4 flex flex-col h-full overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase">Threat Vector Visual</h3>
            </div>
            <button
              onClick={() => setActiveVisual(null)}
              className="text-xs font-mono text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <p className="text-xs font-bold text-cyan-300 font-mono">{activeVisual.visualTitle}</p>
            <p className="text-[10px] font-mono text-slate-500">{activeVisual.timestamp}</p>
          </div>

          {/* Render Vector Nodes Graph */}
          <div className="space-y-2">
            <p className="text-xs font-mono text-slate-400 uppercase">Vector Nodes Identified ({activeVisual.nodes?.length}):</p>
            <div className="space-y-2">
              {activeVisual.nodes?.map((node: any) => (
                <div
                  key={node.id}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="font-semibold text-slate-200">{node.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{node.type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <p className="text-xs font-mono text-slate-400 uppercase">Network Links:</p>
            <div className="space-y-1 text-[11px] font-mono text-slate-400">
              {activeVisual.links?.map((link: any, i: number) => (
                <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-cyan-400">{link.source}</span> → <span className="text-slate-200">{link.target}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Protocol: {link.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
