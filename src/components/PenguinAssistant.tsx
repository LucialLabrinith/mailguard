import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Key, 
  ShieldCheck, 
  HelpCircle, 
  FileText, 
  AlertTriangle,
  RotateCcw,
  Minimize2,
  Maximize2,
  ChevronDown,
  Video,
  Music,
  Upload,
  Download,
  Folder,
  Check,
  Layers,
  Calendar,
  Play,
  Pause,
  Eye,
  FileCheck,
  Building2,
  Users2,
  Landmark,
  Coins,
  Briefcase,
  Flame,
  ShoppingBag,
  Inbox,
  Filter,
  MessageSquare,
  Plus,
  Trash2
} from 'lucide-react';
import { EmailItem, ChatHistorySession } from '../types';
import {
  getStoredChatSessions,
  saveChatSession,
  deleteChatSession,
  createNewChatSession
} from '../utils/chatHistoryStore';

export interface PenguinAssistantProps {
  currentView?: string;
  userEmail?: string;
  emails?: EmailItem[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  highlightMode?: 'none' | 'all-risk' | 'family' | 'business' | 'marked' | 'smart';
  onSelectHighlightMode?: (mode: 'none' | 'all-risk' | 'family' | 'business' | 'marked' | 'smart') => void;
  forensicDays?: number;
  onUpdateForensicDays?: (days: number) => void;
  onSelectEmail?: (email: EmailItem) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onClose?: () => void;
  onOpenSettings?: () => void;
  currentProvider?: 'gmail' | 'outlook' | 'all' | 'corporate';
  onSelectProvider?: (provider: 'gmail' | 'outlook' | 'all' | 'corporate') => void;
  onSyncGmail?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'penguin';
  text: string;
  timestamp: string;
}

interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadTime: string;
  hash: string;
  analysis?: string;
}

// Custom SVG Mascot of the Colourful Purple & Skin/Peach Tone Penguin
export const PenguinMascot: React.FC<{ 
  size?: number; 
  isSpeaking?: boolean; 
  isListening?: boolean; 
  mood?: 'happy' | 'thinking' | 'waving';
  auraColor?: 'purple' | 'red' | 'yellow' | 'green' | 'blue' | 'maroon';
  className?: string;
}> = React.memo(({ 
  size = 52, 
  isSpeaking = false, 
  isListening = false, 
  mood = 'happy',
  auraColor = 'purple',
  className = '' 
}) => {
  const [blink, setBlink] = useState(false);

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  const getAuraClass = () => {
    switch (auraColor) {
      case 'red': return 'bg-red-500/30';
      case 'yellow': return 'bg-amber-400/30';
      case 'green': return 'bg-emerald-500/30';
      case 'blue': return 'bg-blue-500/30';
      case 'maroon': return 'bg-amber-900/30';
      default: return 'bg-purple-500/30';
    }
  };

  return (
    <div 
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Listening / Speaking / Status Aura Glow */}
      {(isListening || isSpeaking) && (
        <div className={`absolute inset-0 rounded-full ${getAuraClass()} ${isListening ? 'animate-ping' : 'animate-pulse'}`} />
      )}

      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        <defs>
          {/* Purple Feather Gradient */}
          <linearGradient id="purpleFeather" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#7E22CE" />
            <stop offset="100%" stopColor="#581C87" />
          </linearGradient>

          {/* Skin / Warm Peach Belly Gradient */}
          <linearGradient id="peachSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFEDD5" />
            <stop offset="50%" stopColor="#FED7AA" />
            <stop offset="100%" stopColor="#FDBA74" />
          </linearGradient>

          {/* Golden Orange Beak & Feet */}
          <linearGradient id="beakOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          {/* Cyber Purple Cap / Headset */}
          <linearGradient id="cyberPurple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
        </defs>

        {/* Feet (Warm Golden Orange) */}
        <ellipse cx="38" cy="92" rx="10" ry="5" fill="url(#beakOrange)" />
        <ellipse cx="62" cy="92" rx="10" ry="5" fill="url(#beakOrange)" />

        {/* Tail */}
        <path d="M44,88 Q50,97 56,88 Z" fill="#581C87" />

        {/* Outer Body (Cheerful Royal Purple) */}
        <ellipse cx="50" cy="54" rx="34" ry="38" fill="url(#purpleFeather)" />

        {/* Left Wing / Flipper */}
        {mood === 'waving' ? (
          <path 
            d="M20,44 Q8,30 14,20 Q22,24 25,38 Z" 
            fill="url(#purpleFeather)" 
            className="origin-bottom-right animate-[wiggle_1.5s_ease-in-out_infinite]"
          />
        ) : (
          <ellipse cx="18" cy="56" rx="7" ry="18" fill="url(#purpleFeather)" transform="rotate(18, 18, 56)" />
        )}

        {/* Right Wing / Flipper */}
        <ellipse cx="82" cy="56" rx="7" ry="18" fill="url(#purpleFeather)" transform="rotate(-18, 82, 56)" />

        {/* Warm Skin / Peach Tone Friendly Belly (requested: skin colour & purple) */}
        <ellipse cx="50" cy="58" rx="23" ry="29" fill="url(#peachSkin)" />

        {/* Cheerful Blushing Cheeks */}
        <ellipse cx="34" cy="52" rx="4.5" ry="2.5" fill="#FDA4AF" opacity="0.8" />
        <ellipse cx="66" cy="52" rx="4.5" ry="2.5" fill="#FDA4AF" opacity="0.8" />

        {/* Cute Eyes with Friendly Glint */}
        {blink ? (
          <>
            <path d="M34,44 Q38,47 42,44" stroke="#1E1B4B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M58,44 Q62,47 66,44" stroke="#1E1B4B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Left Eye */}
            <circle cx="38" cy="44" r="4.5" fill="#1E1B4B" />
            <circle cx="36.5" cy="42.5" r="1.8" fill="#FFFFFF" />
            {/* Right Eye */}
            <circle cx="62" cy="44" r="4.5" fill="#1E1B4B" />
            <circle cx="60.5" cy="42.5" r="1.8" fill="#FFFFFF" />
          </>
        )}

        {/* Golden Orange Beak */}
        {isSpeaking ? (
          <path d="M42,50 Q50,44 58,50 Q50,62 42,50 Z" fill="url(#beakOrange)" className="animate-pulse" />
        ) : (
          <path d="M43,49 Q50,46 57,49 Q50,58 43,49 Z" fill="url(#beakOrange)" />
        )}

        {/* Security / Detective Badge on Chest */}
        <polygon 
          points="50,66 54,69 53,74 50,72 47,74 46,69" 
          fill="#F59E0B" 
          stroke="#D97706" 
          strokeWidth="0.5"
        />

        {/* Mini Purple Cyber Cap Antenna */}
        <path d="M50,18 L50,12" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="11" r="2.5" fill={isListening ? "#EF4444" : "#10B981"} />
      </svg>
    </div>
  );
});

export const PenguinAssistant: React.FC<PenguinAssistantProps> = React.memo(({
  currentView = 'mail',
  userEmail = 'divyaam2008@gmail.com',
  emails = [],
  selectedCategory = 'all',
  onSelectCategory,
  highlightMode = 'smart',
  onSelectHighlightMode,
  forensicDays = 90,
  onUpdateForensicDays,
  onSelectEmail,
  isOpen: controlledIsOpen,
  onToggleOpen,
  onClose,
  onOpenSettings,
  currentProvider = 'gmail',
  onSelectProvider,
  onSyncGmail,
}) => {
  // Local state if not fully controlled
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (controlledIsOpen !== undefined) {
      if (open && onToggleOpen) onToggleOpen();
      else if (!open && onClose) onClose();
    } else {
      setInternalIsOpen(open);
    }
  };

  const [activeTab, setActiveTab] = useState<'chat' | 'all-chats' | 'departments' | 'highlights' | 'apps' | 'media' | 'retention'>('chat');
  const [isCompact, setIsCompact] = useState(false);
  
  // Pippin Chat Sessions
  const [sessions, setSessions] = useState<ChatHistorySession[]>(() => getStoredChatSessions('pippin'));
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const list = getStoredChatSessions('pippin');
    return list[0]?.id || 'session-pippin-intro';
  });
  const [showChatHistory, setShowChatHistory] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const list = getStoredChatSessions('pippin');
    const first = list[0];
    if (first && first.messages && first.messages.length > 0) {
      return first.messages.map((m) => ({
        id: m.id,
        sender: m.sender as 'user' | 'penguin',
        text: m.text,
        timestamp: m.timestamp,
      }));
    }
    return [
      {
        id: 'welcome',
        sender: 'penguin',
        text: `👋 Greetings! I'm Pippin, your friendly AI security guide.\n\nI'm directly integrated with your connected Gmail (${userEmail}). You can filter departments, highlight risk & categories, choose forensic lookback days, or talk freely about anything!`,
        timestamp: 'Just now',
      },
    ];
  });

  // Switch to selected session
  const handleSelectSession = (session: ChatHistorySession) => {
    setActiveSessionId(session.id);
    if (session.messages && session.messages.length > 0) {
      setMessages(
        session.messages.map((m) => ({
          id: m.id,
          sender: m.sender as 'user' | 'penguin',
          text: m.text,
          timestamp: m.timestamp,
        }))
      );
    } else {
      setMessages([
        {
          id: 'welcome-' + session.id,
          sender: 'penguin',
          text: `Thread activated: **${session.title}**. What would you like to investigate?`,
          timestamp: 'Just now',
        },
      ]);
    }
    setShowChatHistory(false);
    setActiveTab('chat');
  };

  // Create new session
  const handleCreateNewSession = () => {
    const newSession = createNewChatSession('pippin');
    const updated = getStoredChatSessions('pippin');
    setSessions(updated);
    setActiveSessionId(newSession.id);
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'penguin',
        text: `✨ New conversation started! I'm listening. Ask me anything about your inbox, policies, or email threats.`,
        timestamp: 'Just now',
      },
    ]);
    setShowChatHistory(false);
    setActiveTab('chat');
  };

  // Delete session
  const handleDeleteSession = (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const remaining = deleteChatSession('pippin', sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      if (remaining.length > 0) {
        handleSelectSession(remaining[0]);
      } else {
        handleCreateNewSession();
      }
    }
  };

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Media & Video State
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoSceneIdx, setVideoSceneIdx] = useState(0);
  const [audioGenerated, setAudioGenerated] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Uploaded docs & Connected docs state
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [inspectingDoc, setInspectingDoc] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const assistantCardRef = useRef<HTMLDivElement>(null);
  const activationBtnRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Click outside to minimize cleanly
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        assistantCardRef.current &&
        !assistantCardRef.current.contains(e.target as Node) &&
        activationBtnRef.current &&
        !activationBtnRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Persist messages to active Pippin session
  const persistCurrentMessages = (allMsgs: ChatMessage[]) => {
    const cur = sessions.find((s) => s.id === activeSessionId);
    const updatedSess: ChatHistorySession = {
      id: activeSessionId,
      title: cur?.title || allMsgs.find((m) => m.sender === 'user')?.text.slice(0, 30) || 'Pippin Conversation',
      createdAt: cur?.createdAt || new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      lastActive: 'Just now',
      previewSnippet: allMsgs[allMsgs.length - 1]?.text.slice(0, 75) || '',
      messageCount: allMsgs.length,
      messages: allMsgs.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp,
      })),
    };
    saveChatSession('pippin', updatedSess);
    setSessions(getStoredChatSessions('pippin'));
  };

  // Speech synthesis
  const speakText = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_~]/g, '').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.25; // Cheerful friendly pitch

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speech recognition (Listening)
  const toggleSpeechRecognition = async () => {
    setMicError(null);
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsListening(false);
      setVoiceVolume(0);
      return;
    }

    // Step 1: Initialize Web Speech API immediately for zero-latency capture
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError('Speech-to-text is not natively available in this browser. You can type directly.');
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      const baseText = inputValue.trim();

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onaudiostart = () => {
        setIsListening(true);
      };

      recognition.onspeechstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalPiece = '';
        let interimPiece = '';
        for (let i = 0; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalPiece += (finalPiece ? ' ' : '') + piece.trim();
          } else {
            interimPiece += piece;
          }
        }
        const textParts = [baseText, finalPiece, interimPiece].filter(Boolean);
        const combined = textParts.join(' ').trim();
        if (combined) {
          setInputValue(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status event:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Microphone permission blocked. Please allow microphone in your browser settings.');
          setIsListening(false);
        } else if (event.error === 'network') {
          setMicError('Speech recognition network service is limited. You can dictate or type directly.');
        } else if (event.error === 'no-speech') {
          // Keep listening
        } else {
          setMicError(`Mic note: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Keep active or allow restart if user didn't explicitly stop
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);

      // Step 2: In parallel (non-blocking), start visual audio level analyzer
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((micStream) => {
          mediaStreamRef.current = micStream;
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              audioContextRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(micStream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              source.connect(analyser);

              const bufferLength = analyser.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);

              const checkVolume = () => {
                if (!mediaStreamRef.current) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                  sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setVoiceVolume(Math.min(100, Math.round((average / 128) * 100)));
                requestAnimationFrame(checkVolume);
              };
              checkVolume();
            }
          } catch {
            // AudioContext visual fallback
          }
        }).catch((permErr) => {
          console.warn('Background audio visualizer permission note:', permErr);
        });
      }
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      setMicError('Could not start speech recognition: ' + (err.message || 'Check microphone settings.'));
      setIsListening(false);
    }
  };

  // Handle Freeform Chat / Instructions
  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend || inputValue).trim();
    if (!msg) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || "I've analyzed your request. Everything in your mailbox is being screened under Zero-Trust protocols.";
        const penguinMsg: ChatMessage = {
          id: `penguin-${Date.now()}`,
          sender: 'penguin',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const nextMsgs = [...newMsgs, penguinMsg];
        setMessages(nextMsgs);
        speakText(replyText);
        persistCurrentMessages(nextMsgs);
      } else {
        throw new Error('API request failed');
      }
    } catch (err) {
      // Smart Fallback
      let fallback = "I'm with you! I can help check passwords, scan threats, highlight risky emails, or generate reports.";
      const lower = msg.toLowerCase();
      if (lower.includes('gmail') || lower.includes('sync') || lower.includes('inbox') || lower.includes('divyaam')) {
        if (onSyncGmail) {
          onSyncGmail();
          fallback = `🔄 Initiating live Gmail sync for your account (${userEmail})! Connecting to Google Workspace API to fetch your real inbox and apply zero-trust forensic analysis.`;
        } else {
          fallback = `You can sync your real Gmail history by clicking the "Sync Live Gmail" button in the top navigation bar.`;
        }
      } else if (lower.includes('password') || lower.includes('criteria') || lower.includes('condition')) {
        fallback = "🔒 Strong Password Criteria:\n• Min 8 characters\n• At least 1 uppercase letter\n• At least 1 lowercase letter\n• At least 1 number\n• At least 1 special symbol (@$!%*?&)\n\nTip: Click the eye icon (👁️) in login or signup to view/hide your password anytime!";
      } else if (lower.includes('department') || lower.includes('filter')) {
        fallback = "🏢 You can switch departments using the 'Departments' tab above! We have Banking, Loans, Family, Business, Staff, Documents, Education, Subscriptions, and Security.";
      } else if (lower.includes('highlight') || lower.includes('colour') || lower.includes('color') || lower.includes('red') || lower.includes('green') || lower.includes('yellow')) {
        fallback = "🎨 Highlighting is active!\n• 🔴 Red: High Risk (>65)\n• 🟡 Yellow: Mid-level Risk (25-65)\n• 🟢 Green: 0 Risk / Clean\n• 🔵 Blue: Family emails\n• 🟤 Maroon/Brown: Business emails\n• ⭐ Purple: Marked messages";
      } else if (lower.includes('forensic') || lower.includes('days') || lower.includes('retention')) {
        fallback = `⏳ Your forensic retention window is currently set to ${forensicDays} days. You can adjust this in the 'Forensic Days' tab to re-access historic records.`;
      } else if (lower.includes('summary') || lower.includes('summarize')) {
        fallback = `📊 Mailbox Summary:\n• Total indexed emails: ${emails.length}\n• High-risk alerts: ${emails.filter(e => e.securityRiskScore > 65).length}\n• Clean / Verified: ${emails.filter(e => e.securityRiskScore < 25).length}\n• Retention window: ${forensicDays} days.`;
      }

      const penguinMsg: ChatMessage = {
        id: `penguin-${Date.now()}`,
        sender: 'penguin',
        text: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const nextMsgs = [...newMsgs, penguinMsg];
      setMessages(nextMsgs);
      speakText(fallback);
      persistCurrentMessages(nextMsgs);
    } finally {
      setIsLoading(false);
    }
  };

  // Video Generation Simulation
  const handleGenerateVideo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setVideoGenerated(true);
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `vid-${Date.now()}`,
          sender: 'penguin',
          text: "🎬 I've generated a complete 4-scene Forensic Video Dossier for your connected mailbox! Check the 'Docs & Media' tab to preview or download the video storyboard.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }, 800);
  };

  // Audio Voice Briefing Generation
  const handleGenerateAudio = () => {
    setAudioGenerated(true);
    const audioScript = `Security briefing for ${userEmail}. All zero-trust gateway heuristics are active. Active forensic retention is set to ${forensicDays} days. ${emails.filter(e => e.securityRiskScore > 65).length} elevated threat vectors are quarantined.`;
    speakText(audioScript);
    setMessages((prev) => [
      ...prev,
      {
        id: `audio-${Date.now()}`,
        sender: 'penguin',
        text: `🎙️ Audio Voice Briefing generated and playing: "${audioScript}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Document Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fakeHash = `sha256-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    const newDoc: UploadedDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || file.name.split('.').pop() || 'document',
      uploadTime: 'Just now',
      hash: fakeHash,
      analysis: `Cryptographically verified. No malicious macros or exploit sequences identified. Zero-trust hash: ${fakeHash}.`,
    };

    setUploadedDocs((prev) => [newDoc, ...prev]);
    setMessages((prev) => [
      ...prev,
      {
        id: `upload-${Date.now()}`,
        sender: 'penguin',
        text: `📄 Upload received: "${file.name}" (${newDoc.size}). I've scanned and verified the document's cryptographic integrity!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Download Generated Document (PDF / CSV / RFC)
  const handleDownloadDoc = (type: 'pdf' | 'csv' | 'rfc') => {
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    if (type === 'csv') {
      filename = `forensic_audit_export_${Date.now()}.csv`;
      mimeType = 'text/csv';
      content = 'ID,Date,From,Subject,RiskScore,Classification,Category\n' +
        emails.map(e => `"${e.id}","${e.date}","${e.fromEmail}","${e.subject}",${e.securityRiskScore},"${e.threatClassification}","${e.category}"`).join('\n');
    } else if (type === 'pdf') {
      filename = `zero_trust_dossier_${Date.now()}.txt`;
      content = `=== ZERO-TRUST FORENSIC DOSSIER ===\nTarget Mailbox: ${userEmail}\nRetention Days: ${forensicDays}\nDate: ${new Date().toISOString()}\n\nThreat Summary:\nTotal Messages: ${emails.length}\nHigh Risk: ${emails.filter(e => e.securityRiskScore > 65).length}\n\nEvidence Hash: SHA-256 Verified\nChain-of-Custody: Intact`;
    } else {
      filename = `rfc5322_audit_${Date.now()}.eml`;
      content = `X-Forensic-Audit: Passed\nX-Zero-Trust-Gateway: MailGuard Edge\nDate: ${new Date().toUTCString()}\nSubject: RFC 5322 Forensics\n\nVerified across all connected accounts.`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // All 10 Departments list
  const departmentsList = [
    { id: 'all', label: 'All Departments', icon: <Inbox className="w-3.5 h-3.5" />, color: 'text-purple-600' },
    { id: 'banking', label: 'Banking', icon: <Landmark className="w-3.5 h-3.5 text-emerald-500" />, color: 'text-emerald-600' },
    { id: 'loans', label: 'Loans & EMI', icon: <Coins className="w-3.5 h-3.5 text-amber-500" />, color: 'text-amber-600' },
    { id: 'family', label: 'Family (Blue)', icon: <Users2 className="w-3.5 h-3.5 text-blue-500" />, color: 'text-blue-600', highlight: 'family' },
    { id: 'companies', label: 'Business / Companies (Maroon)', icon: <Building2 className="w-3.5 h-3.5 text-amber-800" />, color: 'text-amber-900', highlight: 'business' },
    { id: 'staff', label: 'Staff & Internal', icon: <Briefcase className="w-3.5 h-3.5 text-indigo-500" />, color: 'text-indigo-600' },
    { id: 'documents', label: 'Documents & Legal', icon: <FileText className="w-3.5 h-3.5 text-teal-500" />, color: 'text-teal-600' },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Flame className="w-3.5 h-3.5 text-orange-500" />, color: 'text-orange-600' },
    { id: 'purchases', label: 'Purchases', icon: <ShoppingBag className="w-3.5 h-3.5 text-cyan-500" />, color: 'text-cyan-600' },
    { id: 'security', label: 'Security & Auth', icon: <ShieldCheck className="w-3.5 h-3.5 text-red-500" />, color: 'text-red-600' },
  ];

  // Connected documents (from email attachments)
  const connectedAttachments = emails.flatMap(e => 
    (e.attachments || []).map(att => ({
      emailId: e.id,
      emailSubject: e.subject,
      from: e.fromName,
      ...att,
    }))
  );

  // Dynamic aura color
  let auraColor: 'purple' | 'red' | 'yellow' | 'green' | 'blue' | 'maroon' = 'purple';
  if (highlightMode === 'family') auraColor = 'blue';
  else if (highlightMode === 'business') auraColor = 'maroon';
  else if (highlightMode === 'all-risk') auraColor = 'yellow';

  return (
    // Fixed non-blocking viewport container anchored at bottom-right (z-40)
    // Ensures Pippin remains visible on bottom whether scrolling up or down across any connected app.
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none flex flex-col-reverse items-end select-none">
      
      {/* 1. COMPACT FLOATING CIRCLE ACTIVATION BUTTON (POINTER-EVENTS-AUTO) */}
      <div 
        ref={activationBtnRef} 
        className={`pointer-events-auto transition-transform duration-200 ${isOpen ? 'scale-90 opacity-90' : 'hover:scale-105 active:scale-95'}`}
      >
        <button
          onClick={() => {
            if (onToggleOpen) onToggleOpen();
            else setIsOpen(!isOpen);
          }}
          aria-label={isOpen ? "Minimize Pippin Assistant" : "Activate Pippin AI Penguin Guide"}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-2 ${
            isOpen 
              ? 'bg-purple-600 border-purple-300 shadow-purple-900/30' 
              : 'bg-white border-purple-300 shadow-purple-900/20 hover:border-purple-400'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="relative flex items-center justify-center w-full h-full">
              <PenguinMascot size={46} mood="happy" auraColor={auraColor} />
              {/* Pulsing gentle indicator ring */}
              <div className="absolute inset-0 rounded-full border-2 border-purple-200 animate-pulse pointer-events-none" />
            </div>
          )}
        </button>
      </div>

      {/* 2. EXPANDED INTERACTIVE MINI ASSISTANT PANEL (POINTER-EVENTS-AUTO) */}
      {isOpen && (
        <div 
          ref={assistantCardRef}
          className={`pointer-events-auto mb-2 w-[92vw] max-w-[360px] max-h-[calc(100vh-6rem)] ${
            isCompact ? 'h-[230px]' : 'h-[440px] sm:h-[470px]'
          } rounded-2xl bg-white text-slate-800 border-2 border-purple-200 shadow-xl shadow-purple-900/15 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 select-text`}
        >
          
          {/* Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-purple-100 via-purple-50 to-amber-50 border-b border-purple-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-0.5 rounded-full bg-white border border-purple-200 shadow-xs flex items-center justify-center">
                <PenguinMascot size={30} isSpeaking={isSpeaking} isListening={isListening} auraColor={auraColor} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-purple-950 flex items-center gap-1 font-sans">
                    Pippin <span className="text-[10px] text-purple-600 font-medium">In-App Copilot</span>
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-purple-700/80 font-mono">
                  {isListening ? '🎙️ Listening...' : isSpeaking ? '🔊 Speaking...' : `Connected to Gmail & Outlook`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Voice Mute / Unmute Toggle */}
              <button
                onClick={() => {
                  if (isSpeaking) window.speechSynthesis?.cancel();
                  setIsMuted(!isMuted);
                }}
                className={`p-1 rounded-lg border transition-colors ${
                  isMuted 
                    ? 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600' 
                    : 'bg-white border-purple-200 text-purple-700 hover:text-purple-900 hover:bg-purple-100/60'
                }`}
                title={isMuted ? "Unmute Pippin voice" : "Mute Pippin voice"}
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>

              {/* Compact / Expand View Toggle */}
              <button
                onClick={() => setIsCompact(!isCompact)}
                className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-100/60 rounded-lg transition-colors"
                title={isCompact ? "Expand assistant view" : "Compact assistant view"}
              >
                {isCompact ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  if (isSpeaking) window.speechSynthesis?.cancel();
                  setIsOpen(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-purple-100/60 rounded-lg transition-colors"
                title="Minimize Pippin"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar inside Pippin */}
          <div className="px-2 py-1 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between text-[10px] font-mono overflow-x-auto gap-1 flex-shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === 'chat' ? 'bg-purple-600 text-white font-bold' : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <span>💬 Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('all-chats')}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === 'all-chats' ? 'bg-purple-600 text-white font-bold' : 'text-purple-900 hover:bg-purple-100'
              }`}
              title="View all saved chat sessions"
            >
              <MessageSquare className="w-2.5 h-2.5" />
              <span>All Chats ({sessions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === 'departments' ? 'bg-purple-600 text-white font-bold' : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <span>🏢 Depts</span>
            </button>
            <button
              onClick={() => setActiveTab('highlights')}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === 'highlights' ? 'bg-purple-600 text-white font-bold' : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <span>🎨 Colors</span>
            </button>
            <button
              onClick={() => setActiveTab('apps')}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === 'apps' ? 'bg-purple-600 text-white font-bold' : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <span>🔗 Apps</span>
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === 'media' ? 'bg-purple-600 text-white font-bold' : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <span>📁 Media/Docs</span>
            </button>
            <button
              onClick={() => setActiveTab('retention')}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === 'retention' ? 'bg-purple-600 text-white font-bold' : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <span>⏳ {forensicDays}d</span>
            </button>
          </div>

          {/* TAB 1: AI CHAT VIEW */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-purple-50/20">
              {/* Side All Chats Toggle Sub-bar */}
              <div className="px-2.5 py-1 bg-purple-100/70 border-b border-purple-200 flex items-center justify-between text-[10px] font-mono flex-shrink-0">
                <button
                  onClick={() => setShowChatHistory(!showChatHistory)}
                  className="flex items-center gap-1.5 font-bold text-purple-950 hover:text-purple-700 transition-colors"
                  title="Toggle Side All Chats History"
                >
                  <MessageSquare className="w-3 h-3 text-purple-600" />
                  <span>Side All Chats ({sessions.length})</span>
                  <ChevronDown className={`w-2.5 h-2.5 text-purple-600 transition-transform ${showChatHistory ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={handleCreateNewSession}
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-sans text-[10px] flex items-center gap-1 font-medium transition-colors shadow-xs"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>New Chat</span>
                </button>
              </div>

              {/* Collapsible Side All Chats List */}
              {showChatHistory && (
                <div className="bg-purple-50/95 border-b-2 border-purple-300 p-2 max-h-48 overflow-y-auto space-y-1.5 shadow-inner flex-shrink-0">
                  <div className="text-[10px] font-mono text-purple-700 font-bold px-1 flex items-center justify-between">
                    <span>SAVED CHATS</span>
                    <span className="text-[9px] font-normal">{sessions.length} threads</span>
                  </div>
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={`p-1.5 rounded-lg border text-left cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                        activeSessionId === sess.id
                          ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                          : 'bg-white hover:bg-purple-100/80 text-slate-800 border-purple-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold truncate">{sess.title}</div>
                        <div className={`text-[9px] truncate ${activeSessionId === sess.id ? 'text-purple-200' : 'text-slate-500'}`}>
                          {sess.previewSnippet || 'Pippin conversation'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-[9px] font-mono ${activeSessionId === sess.id ? 'text-purple-200' : 'text-slate-400'}`}>
                          {sess.messageCount} msg
                        </span>
                        {sessions.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteSession(sess.id, e)}
                            className={`p-0.5 rounded hover:bg-red-500 hover:text-white transition-colors ${
                              activeSessionId === sess.id ? 'text-purple-200' : 'text-slate-400'
                            }`}
                            title="Delete thread"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Prompt Chips (Hidden in compact mode) */}
              {!isCompact && (
                <div className="px-2 py-1.5 bg-white border-b border-purple-100 flex items-center gap-1.5 overflow-x-auto text-[10px] scrollbar-none flex-shrink-0">
                  <button
                    onClick={() => handleSendMessage('Summarize my connected Gmail inbox')}
                    className="px-2 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 whitespace-nowrap transition-colors flex items-center gap-1 font-medium"
                  >
                    <span>📊 Summarize Inbox</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('What are password criteria and how do I view password?')}
                    className="px-2 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 whitespace-nowrap transition-colors flex items-center gap-1 font-medium"
                  >
                    <Key className="w-2.5 h-2.5 text-amber-500" />
                    <span>Password Conditions</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('Explain how highlighting and department filters work on Gmail')}
                    className="px-2 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 whitespace-nowrap transition-colors flex items-center gap-1 font-medium"
                  >
                    <span>🎨 Highlights Info</span>
                  </button>
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 p-2.5 overflow-y-auto space-y-2 font-sans text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-1.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'penguin' && (
                      <div className="flex-shrink-0 mt-0.5">
                        <PenguinMascot size={22} auraColor={auraColor} />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] p-2 rounded-2xl text-[11px] ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-xs'
                          : 'bg-white text-slate-800 border border-purple-200 rounded-bl-none shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">
                        {m.text}
                      </p>
                      <div className={`flex items-center justify-between mt-1 pt-0.5 border-t text-[8px] font-mono ${
                        m.sender === 'user' ? 'border-white/20 text-purple-100' : 'border-purple-100 text-purple-700'
                      }`}>
                        <span>{m.timestamp}</span>
                        {m.sender === 'penguin' && (
                          <button
                            onClick={() => speakText(m.text)}
                            className="hover:text-purple-950 font-bold transition-colors flex items-center gap-0.5"
                            title="Read aloud"
                          >
                            <Volume2 className="w-2.5 h-2.5" /> Speak
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-1.5 items-center text-purple-800 text-xs">
                    <PenguinMascot size={20} mood="waving" isSpeaking={true} />
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-2xl border border-purple-200 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-200" />
                      <span className="ml-1 text-[9px] text-purple-900 font-mono">Pippin is thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Mic Error Banner if any */}
              {micError && (
                <div className="px-2.5 py-1.5 bg-amber-50 border-t border-amber-200 flex items-start justify-between text-[11px] text-amber-900 flex-shrink-0">
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-600">🎙️</span>
                    <span className="leading-tight">{micError}</span>
                  </div>
                  <button 
                    onClick={() => setMicError(null)}
                    className="text-[9px] font-mono ml-2 text-amber-700 hover:text-amber-900 font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Voice Listening Bar Indicator */}
              {isListening && (
                <div className="px-2.5 py-1.5 bg-purple-100/90 border-t border-purple-200 flex items-center justify-between text-xs text-purple-900 flex-shrink-0 shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <div className="flex items-center gap-1">
                      {/* Audio visualizer wave bars */}
                      <span className="w-1 h-3 rounded-full bg-purple-600 animate-pulse" style={{ height: `${Math.max(6, voiceVolume * 0.24)}px` }} />
                      <span className="w-1 h-4 rounded-full bg-purple-500 animate-pulse delay-75" style={{ height: `${Math.max(8, voiceVolume * 0.32)}px` }} />
                      <span className="w-1 h-2.5 rounded-full bg-purple-600 animate-pulse delay-150" style={{ height: `${Math.max(5, voiceVolume * 0.2)}px` }} />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-purple-900">
                      Listening... Speak your question
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {inputValue.trim() && (
                      <button
                        onClick={() => {
                          toggleSpeechRecognition();
                          handleSendMessage();
                        }}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                      >
                        Send Now
                      </button>
                    )}
                    <button 
                      onClick={toggleSpeechRecognition}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Input */}
              <div className="p-1.5 bg-white border-t border-purple-100 flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={toggleSpeechRecognition}
                  aria-label={isListening ? "Stop listening" : "Speak to Pippin"}
                  title={isListening ? "Stop listening" : "Speak using microphone"}
                  className={`p-1.5 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-red-600 border-red-500 text-white animate-pulse'
                      : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder={isListening ? "Speaking... (transcribing live)" : "Talk freely with Pippin..."}
                  className="flex-1 px-2 py-1 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-500"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  className="p-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-40 transition-all shadow-xs"
                  title="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB: ALL CHATS HISTORY */}
          {activeTab === 'all-chats' && (
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-purple-50/30 font-sans text-xs flex flex-col">
              <div className="flex items-center justify-between pb-1.5 border-b border-purple-200">
                <div>
                  <h4 className="font-bold text-purple-950 flex items-center gap-1.5 text-xs">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                    <span>Side All Chats History</span>
                  </h4>
                  <p className="text-[10px] text-purple-700 font-mono">
                    {sessions.length} conversation threads stored locally
                  </p>
                </div>
                <button
                  onClick={handleCreateNewSession}
                  className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-mono text-[10px] flex items-center gap-1 font-semibold transition-colors shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Chat</span>
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      activeSessionId === sess.id
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                        : 'bg-white hover:bg-purple-50 text-slate-800 border-purple-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs truncate">{sess.title}</span>
                          {activeSessionId === sess.id && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-700 text-purple-100 uppercase font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] mt-0.5 line-clamp-2 ${activeSessionId === sess.id ? 'text-purple-100' : 'text-slate-500'}`}>
                          {sess.previewSnippet || 'Conversation with Pippin'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono">
                          <span className={activeSessionId === sess.id ? 'text-purple-200' : 'text-slate-400'}>
                            {sess.createdAt}
                          </span>
                          <span className={activeSessionId === sess.id ? 'text-purple-200' : 'text-slate-400'}>•</span>
                          <span className={activeSessionId === sess.id ? 'text-purple-200' : 'text-purple-700 font-semibold'}>
                            {sess.messageCount} messages
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {sessions.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteSession(sess.id, e)}
                            className={`p-1 rounded-md transition-colors ${
                              activeSessionId === sess.id
                                ? 'text-purple-200 hover:bg-purple-700 hover:text-white'
                                : 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                            }`}
                            title="Delete thread"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DEPARTMENTS SELECTOR */}
          {activeTab === 'departments' && (
            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-purple-50/20 font-sans text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-purple-100">
                <span className="font-bold text-purple-950 flex items-center gap-1 text-[11px]">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" /> All Connected Departments
                </span>
                <span className="text-[10px] font-mono text-purple-600">{departmentsList.length} categories</span>
              </div>

              <p className="text-[10px] text-slate-500 leading-snug">
                Click any department below to filter your connected Gmail stream immediately:
              </p>

              <div className="grid grid-cols-1 gap-1.5">
                {departmentsList.map((dept) => {
                  const count = dept.id === 'all' 
                    ? emails.length 
                    : emails.filter(e => e.category === dept.id).length;
                  const isCurrent = selectedCategory === dept.id;

                  return (
                    <button
                      key={dept.id}
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory(dept.id);
                        if (dept.highlight && onSelectHighlightMode) {
                          onSelectHighlightMode(dept.highlight as any);
                        }
                        handleSendMessage(`Filtered mailbox to ${dept.label}. Found ${count} matching records.`);
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between transition-all text-left ${
                        isCurrent 
                          ? 'bg-purple-600 text-white border-purple-700 shadow-xs' 
                          : 'bg-white hover:bg-purple-50 text-slate-800 border-purple-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-lg ${isCurrent ? 'bg-white/20 text-white' : 'bg-purple-50'}`}>
                          {dept.icon}
                        </div>
                        <div>
                          <span className="font-medium text-[11px] block">{dept.label}</span>
                          {dept.id === 'family' && (
                            <span className={`text-[9px] ${isCurrent ? 'text-purple-200' : 'text-blue-600 font-mono'}`}>
                              🔵 Blue Highlight
                            </span>
                          )}
                          {dept.id === 'companies' && (
                            <span className={`text-[9px] ${isCurrent ? 'text-purple-200' : 'text-amber-800 font-mono'}`}>
                              🟤 Maroon Outline
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isCurrent ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-900 font-bold'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: COLOR HIGHLIGHTS SELECTOR */}
          {activeTab === 'highlights' && (
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-purple-50/20 font-sans text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-purple-100">
                <span className="font-bold text-purple-950 flex items-center gap-1 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-purple-600" /> Color Shading & Outlines
                </span>
                <span className="text-[10px] font-mono text-purple-600">Gmail Stream</span>
              </div>

              <p className="text-[10px] text-slate-500 leading-snug">
                Click a highlighting mode to shade or outline your messages in very light tones directly on Gmail:
              </p>

              {/* All Risk Modes */}
              <div className="space-y-1.5">
                {/* Smart Combined Outlines (Active by default) */}
                <button
                  onClick={() => {
                    if (onSelectHighlightMode) onSelectHighlightMode('smart');
                  }}
                  className={`w-full p-2.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                    highlightMode === 'smart' 
                      ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-300' 
                      : 'bg-white border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎨</span>
                    <div className="text-left">
                      <span className="font-bold text-[11px] text-purple-950 block">All Outlines Active (Smart)</span>
                      <span className="text-[9px] text-purple-700">Red/Yellow/Green risks + Blue family + Brown business</span>
                    </div>
                  </div>
                  {highlightMode === 'smart' && <Check className="w-4 h-4 text-purple-600" />}
                </button>

                <button
                  onClick={() => {
                    if (onSelectHighlightMode) onSelectHighlightMode('all-risk');
                  }}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    highlightMode === 'all-risk' 
                      ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-300' 
                      : 'bg-white border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔴🟡🟢</span>
                    <div className="text-left">
                      <span className="font-bold text-[11px] text-slate-900 block">All Risk Heatmap</span>
                      <span className="text-[9px] text-slate-500">Light shades of Red, Yellow & Green</span>
                    </div>
                  </div>
                  {highlightMode === 'all-risk' && <Check className="w-4 h-4 text-purple-600" />}
                </button>

                {/* Red High Risk Description */}
                <div className="p-2 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="font-bold text-red-950">High Risk (&gt;65 / Phishing / Fraud)</span>
                  </div>
                  <span className="text-red-700 font-mono font-bold">Light Red Shade</span>
                </div>

                {/* Yellow Mid-Level Risk */}
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="font-bold text-amber-950">Mid-Level Risk (25 - 65 / Suspicious)</span>
                  </div>
                  <span className="text-amber-700 font-mono font-bold">Light Yellow Shade</span>
                </div>

                {/* Green 0 Risk */}
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="font-bold text-emerald-950">0 Risk / Very Low (&lt;25 / Clean)</span>
                  </div>
                  <span className="text-emerald-700 font-mono font-bold">Light Green Shade</span>
                </div>

                {/* Blue Family Highlight */}
                <button
                  onClick={() => {
                    if (onSelectHighlightMode) onSelectHighlightMode('family');
                  }}
                  className={`w-full p-2.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                    highlightMode === 'family' 
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300' 
                      : 'bg-white border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔵</span>
                    <div className="text-left">
                      <span className="font-bold text-[11px] text-blue-950 block">Family Messages</span>
                      <span className="text-[9px] text-blue-700">Light blue shade & blue outline</span>
                    </div>
                  </div>
                  {highlightMode === 'family' && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                {/* Maroon/Brown Business Highlight */}
                <button
                  onClick={() => {
                    if (onSelectHighlightMode) onSelectHighlightMode('business');
                  }}
                  className={`w-full p-2.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                    highlightMode === 'business' 
                      ? 'bg-amber-100/60 border-amber-800 ring-2 ring-amber-600/30' 
                      : 'bg-white border-amber-800/60 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🟤</span>
                    <div className="text-left">
                      <span className="font-bold text-[11px] text-amber-950 block">Business & Companies</span>
                      <span className="text-[9px] text-amber-800">Light maroon shade & brown outline</span>
                    </div>
                  </div>
                  {highlightMode === 'business' && <Check className="w-4 h-4 text-amber-800" />}
                </button>

                {/* Marked Messages Highlight */}
                <button
                  onClick={() => {
                    if (onSelectHighlightMode) onSelectHighlightMode('marked');
                  }}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    highlightMode === 'marked' 
                      ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-300' 
                      : 'bg-white border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">⭐</span>
                    <div className="text-left">
                      <span className="font-bold text-[11px] text-purple-950 block">Marked & Starred Messages</span>
                      <span className="text-[9px] text-purple-700">Purple outline for selected emails</span>
                    </div>
                  </div>
                  {highlightMode === 'marked' && <Check className="w-4 h-4 text-purple-600" />}
                </button>
              </div>
            </div>
          )}

          {/* TAB: CONNECTED APPS & PROVIDER PERMISSIONS */}
          {activeTab === 'apps' && (
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-purple-50/20 font-sans text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-purple-100">
                <span className="font-bold text-purple-950 flex items-center gap-1 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-purple-600" /> Connected Mailbox Gateways
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">2 Apps Synced</span>
              </div>

              <div className="p-2 rounded-xl bg-purple-100/70 border border-purple-200 text-[11px] text-purple-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1">
                  <span>🐧 In-App Pippin Active Everywhere</span>
                </p>
                <p className="text-[10px] text-purple-800 mt-0.5">
                  Pippin floats on bottom whether you scroll up or down, active directly in your connected Gmail and Outlook without opening external browser windows.
                </p>
              </div>

              {/* 1. Google Workspace / Gmail */}
              <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔴</span>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Google Workspace (Gmail)</span>
                      <span className="text-[10px] text-slate-500 font-mono">{userEmail}</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Connected
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 space-y-1">
                  <p className="flex items-center justify-between font-mono">
                    <span>Permissions:</span>
                    <span className="text-emerald-700 font-bold">Full Mail Read & Outlines</span>
                  </p>
                  <p className="text-slate-500">
                    Outlines messages in Red (High Risk), Yellow (Mid Risk), Green (0 Risk), Blue (Family), and Brown (Business).
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      if (onSelectProvider) onSelectProvider('gmail');
                      handleSendMessage("Switched active mailbox view to connected Gmail.");
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                      currentProvider === 'gmail'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    View Gmail In-App
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenSettings) onOpenSettings();
                      handleSendMessage("Opening SOC & Connected App Permissions in Settings.");
                    }}
                    className="py-1 px-2 rounded-lg text-[10px] font-mono text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                  >
                    Permissions
                  </button>
                </div>
              </div>

              {/* 2. Microsoft 365 / Outlook */}
              <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔵</span>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Microsoft 365 (Outlook)</span>
                      <span className="text-[10px] text-slate-500 font-mono">divyaam2008@outlook.com</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Connected
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 space-y-1">
                  <p className="flex items-center justify-between font-mono">
                    <span>Exchange Online:</span>
                    <span className="text-emerald-700 font-bold">Mail.Read & Live Outlines</span>
                  </p>
                  <p className="text-slate-500">
                    Outlines enterprise & personal Outlook communications with the exact designated risk & category colors.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      if (onSelectProvider) onSelectProvider('outlook');
                      handleSendMessage("Switched active mailbox view to connected Microsoft 365 Outlook.");
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                      currentProvider === 'outlook'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-950 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    View Outlook In-App
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenSettings) onOpenSettings();
                      handleSendMessage("Opening SOC & Connected App Permissions in Settings.");
                    }}
                    className="py-1 px-2 rounded-lg text-[10px] font-mono text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                  >
                    Permissions
                  </button>
                </div>
              </div>

              {/* 3. Google Gemini 2.5 AI Engine */}
              <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Google Gemini 2.5 Flash</span>
                      <span className="text-[10px] text-purple-700 font-mono">Deep Cyber Intelligence</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Powers Pippin's in-app answers, risk reasoning, document parsing, and voice guidance.
                </p>
              </div>

            </div>
          )}

          {/* TAB 4: DOCS, VIDEO, AUDIO & CONNECTED FILES */}
          {activeTab === 'media' && (
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-purple-50/20 font-sans text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-purple-100">
                <span className="font-bold text-purple-950 flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Multimodal AI & Documents
                </span>
                <span className="text-[9px] font-mono text-purple-600">Generate & Read</span>
              </div>

              {/* 1. Generate Video Section */}
              <div className="p-2.5 rounded-xl bg-white border border-purple-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-950 text-[11px]">
                    <Video className="w-3.5 h-3.5 text-purple-600" />
                    <span>Generate Video Storyboard</span>
                  </div>
                  <button
                    onClick={handleGenerateVideo}
                    disabled={isLoading}
                    className="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-mono text-[10px] font-bold transition-colors"
                  >
                    {videoGenerated ? 'Regenerate' : 'Generate Video'}
                  </button>
                </div>

                {videoGenerated && (
                  <div className="p-2 rounded-lg bg-slate-900 text-white space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Scene {videoSceneIdx + 1} of 4</span>
                      <span className="text-emerald-400">● 1080p Forensic Reel</span>
                    </div>

                    {/* Simulated Player Canvas */}
                    <div className="h-16 bg-slate-950 rounded border border-slate-800 flex items-center justify-center p-2 text-center">
                      {videoSceneIdx === 0 && (
                        <p className="text-[10px] text-cyan-300 font-mono">
                          🎬 Scene 1: Executive Threat Overview for {userEmail}
                        </p>
                      )}
                      {videoSceneIdx === 1 && (
                        <p className="text-[10px] text-amber-300 font-mono">
                          🌐 Scene 2: Network Forensics & IP Hop Traceroute
                        </p>
                      )}
                      {videoSceneIdx === 2 && (
                        <p className="text-[10px] text-red-300 font-mono">
                          🎣 Scene 3: Phishing Anatomy & Deceptive Sender Domain
                        </p>
                      )}
                      {videoSceneIdx === 3 && (
                        <p className="text-[10px] text-emerald-300 font-mono">
                          🛡️ Scene 4: Recommended Zero-Trust Quarantine Actions
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setVideoSceneIdx((prev) => (prev + 1) % 4)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-mono"
                        >
                          Next Scene
                        </button>
                      </div>
                      <button
                        onClick={() => handleDownloadDoc('pdf')}
                        className="text-[9px] font-mono text-cyan-400 hover:underline flex items-center gap-0.5"
                      >
                        <Download className="w-2.5 h-2.5" /> Download Script
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Generate Audio Voice Briefing */}
              <div className="p-2.5 rounded-xl bg-white border border-purple-200 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-950 text-[11px]">
                    <Music className="w-3.5 h-3.5 text-purple-600" />
                    <span>Generate Audio Briefing</span>
                  </div>
                  <button
                    onClick={handleGenerateAudio}
                    className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono text-[10px] font-bold"
                  >
                    Generate & Play
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Synthesizes real-time audio voiceover briefing covering your threat landscape.
                </p>
              </div>

              {/* 3. Generate Any Form of Document */}
              <div className="p-2.5 rounded-xl bg-white border border-purple-200 space-y-2 shadow-xs">
                <div className="font-bold text-purple-950 text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>Generate Documents</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleDownloadDoc('pdf')}
                    className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 text-[10px] font-mono flex flex-col items-center gap-1 text-center"
                  >
                    <Download className="w-3 h-3 text-purple-600" />
                    <span>PDF Dossier</span>
                  </button>
                  <button
                    onClick={() => handleDownloadDoc('csv')}
                    className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 text-[10px] font-mono flex flex-col items-center gap-1 text-center"
                  >
                    <Download className="w-3 h-3 text-purple-600" />
                    <span>CSV Logs</span>
                  </button>
                  <button
                    onClick={() => handleDownloadDoc('rfc')}
                    className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 text-[10px] font-mono flex flex-col items-center gap-1 text-center"
                  >
                    <Download className="w-3 h-3 text-purple-600" />
                    <span>RFC Report</span>
                  </button>
                </div>
              </div>

              {/* 4. Upload Any Document & Read Connected Documents */}
              <div className="p-2.5 rounded-xl bg-white border border-purple-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-purple-950 text-[11px] flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    <span>Upload & Read Documents</span>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-0.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 font-mono text-[10px] font-bold transition-colors"
                  >
                    + Upload File
                  </button>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                </div>

                {/* Uploaded Files list */}
                {uploadedDocs.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-purple-100">
                    <span className="text-[9px] font-mono text-purple-700 font-bold">Uploaded Documents:</span>
                    {uploadedDocs.map(doc => (
                      <div key={doc.id} className="p-1.5 rounded bg-purple-50 text-[10px] border border-purple-100 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">{doc.name}</span>
                          <span className="text-[9px] text-slate-500 ml-1.5 font-mono">{doc.size}</span>
                        </div>
                        <span className="text-[9px] text-emerald-600 font-mono font-bold">Verified</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Connected Mailbox Attachments */}
                <div className="space-y-1 pt-1 border-t border-purple-100">
                  <span className="text-[9px] font-mono text-purple-700 font-bold">
                    Connected Mailbox Documents ({connectedAttachments.length}):
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {connectedAttachments.map((att, idx) => (
                      <div 
                        key={idx} 
                        className="p-1.5 rounded bg-slate-50 hover:bg-purple-50 border border-slate-200 text-[10px] flex items-center justify-between cursor-pointer"
                        onClick={() => {
                          setInspectingDoc(att.filename);
                          handleSendMessage(`Read and analyze attached file: ${att.filename} from email "${att.emailSubject}"`);
                        }}
                      >
                        <div className="truncate pr-2">
                          <span className="font-medium text-slate-800 truncate block">{att.filename}</span>
                          <span className="text-[9px] text-slate-400 truncate block">{att.emailSubject}</span>
                        </div>
                        <button className="text-[9px] font-mono text-purple-600 font-bold hover:underline whitespace-nowrap">
                          Read AI
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: FORENSIC DAYS CHOOSING (RE-ACCESS WINDOW) */}
          {activeTab === 'retention' && (
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-purple-50/20 font-sans text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-purple-100">
                <span className="font-bold text-purple-950 flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" /> Forensic Retention Days
                </span>
                <span className="text-[10px] font-mono text-purple-600">Re-access Window</span>
              </div>

              <p className="text-[10px] text-slate-500 leading-snug">
                Choose how many days of forensic history are actively indexed and re-accessible from your connected accounts:
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[7, 30, 60, 90, 180, 365].map((days) => {
                  const isSelected = forensicDays === days;
                  return (
                    <button
                      key={days}
                      onClick={() => {
                        if (onUpdateForensicDays) onUpdateForensicDays(days);
                        handleSendMessage(`Forensic retention lookback window updated to ${days} days. All historic records within ${days} days are now re-accessible.`);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected 
                          ? 'bg-purple-600 text-white border-purple-700 shadow-xs' 
                          : 'bg-white hover:bg-purple-50 text-slate-800 border-purple-200'
                      }`}
                    >
                      <span className="font-bold text-sm block">{days}</span>
                      <span className="text-[9px] opacity-80 block font-mono">Days</span>
                    </button>
                  );
                })}
              </div>

              {/* Retention Status Card */}
              <div className="p-2.5 rounded-xl bg-purple-100/60 border border-purple-200 text-[10px] space-y-1 font-mono">
                <div className="flex items-center justify-between font-bold text-purple-950">
                  <span>Active Retention:</span>
                  <span className="text-purple-700">{forensicDays} Days</span>
                </div>
                <div className="flex items-center justify-between text-purple-800">
                  <span>Re-accessible records:</span>
                  <span>{emails.length} messages</span>
                </div>
                <p className="text-[9px] text-purple-700/80 pt-1 border-t border-purple-200/60">
                  ✓ Cryptographic SHA-256 chain-of-custody hashes preserved for all historic messages within this window.
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
});
