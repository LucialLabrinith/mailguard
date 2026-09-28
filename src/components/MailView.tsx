import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Inbox, 
  Star, 
  Search, 
  Filter, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  FileCode2, 
  Microscope, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  X,
  Download, 
  ChevronRight, 
  MapPin,
  Landmark, 
  Coins, 
  Building2, 
  Users2, 
  Briefcase, 
  FileText, 
  Flame, 
  ExternalLink,
  Ban,
  Archive,
  Eye,
  Key,
  Globe,
  Radio,
  CheckSquare,
  Square,
  ArrowLeft,
  Copy,
  Check,
  Send,
  RefreshCw,
  Tag,
  Plus,
  Trash2,
  Edit3,
  MessageSquareQuote,
  MessageSquare,
  Paperclip,
  Sliders,
  Activity,
  ChevronDown,
  BrainCircuit,
  FileCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { EmailItem, EmailCategory, PolicySimulationConfig, ConnectedSourceId } from '../types';
import { SYSTEM_AVAILABLE_TAGS, autoScanAndTagEmail } from '../utils/taggingEngine';
import { SenderGeoOriginCard } from './SenderGeoOriginCard';
import { CampaignThreatTimeline } from './CampaignThreatTimeline';
import { PolicySimulatorModal } from './PolicySimulatorModal';
import { exportEmailForensicReport } from '../utils/exportForensicPdf';
import { saveCategoryMemoryRule, getCategoryMemoryRules } from '../utils/categoryMemory';

interface MailViewProps {
  emails: EmailItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedSecurityStatus: string;
  onSelectSecurityStatus: (status: string) => void;
  selectedEmail: EmailItem | null;
  onSelectEmail: (email: EmailItem | null) => void;
  onNavigate: (view: string) => void;
  onOpenAIWithEmail: (email: EmailItem) => void;
  onQuarantineEmail: (emailId: string) => void;
  onBlockSender: (emailId: string) => void;
  onBulkQuarantine?: (emailIds: string[]) => void;
  onBulkBlock?: (emailIds: string[]) => void;
  onAddAuditLog?: (entry: any) => void;
  onUpdateEmailNotes?: (emailId: string, notes: string[]) => void;
  onUpdateEmailTags?: (emailId: string, tags: string[]) => void;
  onUpdateEmailCategory?: (emailId: string, category: EmailCategory) => void;
  highlightMode?: 'none' | 'all-risk' | 'family' | 'business' | 'marked' | 'smart';
  onSelectHighlightMode?: (mode: 'none' | 'all-risk' | 'family' | 'business' | 'marked' | 'smart') => void;
  forensicDays?: number;
  onOpenPenguin?: () => void;
  connectedAccountEmail?: string;
  onOpenSettings?: () => void;
  connectedProvider?: ConnectedSourceId;
  onSelectConnectedProvider?: (provider: ConnectedSourceId) => void;
  onSyncGmail?: (fetchAll?: boolean) => void;
  handleSyncLiveGmail?: (fetchAll?: boolean) => void;
  isSyncingGmail?: boolean;
  syncProgress?: {
    percent: number;
    statusLabel: string;
    loaded: number;
    total: number;
  } | null;
  gmailSyncError?: any;
  onReauthGoogle?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenInAppMicrosoft?: () => void;
}

export const MailView: React.FC<MailViewProps> = ({
  emails,
  selectedCategory,
  onSelectCategory,
  selectedSecurityStatus,
  onSelectSecurityStatus,
  selectedEmail,
  onSelectEmail,
  onNavigate,
  onOpenAIWithEmail,
  onQuarantineEmail,
  onBlockSender,
  onBulkQuarantine,
  onBulkBlock,
  onAddAuditLog,
  onUpdateEmailNotes,
  onUpdateEmailTags,
  onUpdateEmailCategory,
  highlightMode = 'smart',
  onSelectHighlightMode,
  forensicDays = 90,
  onOpenPenguin,
  connectedAccountEmail,
  onOpenSettings,
  connectedProvider,
  onSelectConnectedProvider,
  onSyncGmail,
  handleSyncLiveGmail: propHandleSyncLiveGmail,
  isSyncingGmail = false,
  syncProgress,
  gmailSyncError,
  onReauthGoogle,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onOpenInAppMicrosoft,
}) => {
  const [localAppSource, setLocalAppSource] = useState<ConnectedSourceId>('all');
  const activeAppSource = connectedProvider || localAppSource;
  const setActiveAppSource = (source: ConnectedSourceId) => {
    if (onSelectConnectedProvider) onSelectConnectedProvider(source);
    setLocalAppSource(source);
  };
  const [filterQuery, setFilterQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'clean' | 'threats' | 'important'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showRawHeaders, setShowRawHeaders] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  // Spacious Mode: increased outer padding, subtle vertical gaps between thread list and forensic metadata components
  const [isSpaciousMode, setIsSpaciousMode] = useState<boolean>(true);

  // Preview Mode: 'message' (Clean, breathable reading) or 'security' (Full Forensics & Threat Dossier)
  const [previewMode, setPreviewMode] = useState<'message' | 'security'>('message');
  // Slide-over Security Dossier Drawer (for side-by-side inspection on demand, never open by default)
  const [isSecurityDrawerOpen, setIsSecurityDrawerOpen] = useState(false);
  // Controlled inline security strip (closed by default, opens only on explicit user request)
  const [showInlineSecurity, setShowInlineSecurity] = useState(false);
  // Highlights mode dropdown popover
  const [isHighlightsMenuOpen, setIsHighlightsMenuOpen] = useState(false);

  // Automatically reset to clean 'message' reading mode and close any open side security when selecting an email
  useEffect(() => {
    setPreviewMode('message');
    setIsSecurityDrawerOpen(false);
    setShowInlineSecurity(false);
  }, [selectedEmail?.id]);

  // Sandbox Policy Simulator State
  const [isPolicySimulatorOpen, setIsPolicySimulatorOpen] = useState(false);

  // Visual Threat Progression Timeline State (Delivery -> Gateway Scanning -> User Interaction -> Campaign Correlation)
  const [showCampaignTimeline, setShowCampaignTimeline] = useState(true);

  // Category Reclassification & AI Memory State
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categoryShiftSuccessMsg, setCategoryShiftSuccessMsg] = useState<string | null>(null);

  // Automatically close category dropdown when selected email changes
  useEffect(() => {
    setIsCategoryMenuOpen(false);
  }, [selectedEmail?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCategoryMenuOpen(false);
        setIsSecurityDrawerOpen(false);
        setShowInlineSecurity(false);
        setShowRawHeaders(false);
        if (previewMode === 'security') {
          setPreviewMode('message');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewMode]);

  // PDF Forensic Report Export State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccessNotice, setPdfSuccessNotice] = useState<string | null>(null);

  // Quick Reply (Gemini AI) State
  const [quickReplyType, setQuickReplyType] = useState<'safe_reply' | 'request_info' | null>(null);
  const [quickReplyDraft, setQuickReplyDraft] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [replyCopied, setReplyCopied] = useState(false);
  const [replySentBanner, setReplySentBanner] = useState<string | null>(null);

  // Email Analyst Notes State (Editable Logs in MailView)
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  // Drag-to-Scroll & Pull-to-Refresh State
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const bottomObserverRef = React.useRef<HTMLDivElement>(null);
  const lastAutoFetchRef = React.useRef<number>(0);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [dragRefreshSuccess, setDragRefreshSuccess] = useState<string | null>(null);

  // Sync handler that triggers Gmail sync / next page
  const handleSyncLiveGmail = useCallback((fetchAll: boolean = false) => {
    if (propHandleSyncLiveGmail) {
      propHandleSyncLiveGmail(fetchAll);
    } else if (onSyncGmail && !isSyncingGmail) {
      onSyncGmail(fetchAll);
    }
  }, [propHandleSyncLiveGmail, onSyncGmail, isSyncingGmail]);

  // IntersectionObserver to automatically fetch the next page of emails when reaching the bottom of the email list container
  useEffect(() => {
    const sentinel = bottomObserverRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isSyncingGmail && (onSyncGmail || propHandleSyncLiveGmail)) {
          const now = Date.now();
          if (now - lastAutoFetchRef.current > 3000) {
            lastAutoFetchRef.current = now;
            handleSyncLiveGmail(false);
          }
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '120px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleSyncLiveGmail, isSyncingGmail, onSyncGmail, propHandleSyncLiveGmail, emails.length]);

  // Mouse drag-to-scroll tracking
  const [isMouseDownDrag, setIsMouseDownDrag] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartScrollTop, setDragStartScrollTop] = useState(0);
  const [hasDraggedSignificantly, setHasDraggedSignificantly] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);

  // Helper to trigger pull refresh
  const triggerPullRefresh = () => {
    setIsPullRefreshing(true);
    setPullY(45);
    handleSyncLiveGmail(false);
    setDragRefreshSuccess('✓ Inbox refreshed and synchronized!');
    setTimeout(() => {
      setPullY(0);
      setIsPulling(false);
      setIsPullRefreshing(false);
      setTimeout(() => setDragRefreshSuccess(null), 3500);
    }, 1200);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current) {
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY;
    
    // If at the top of scroll and pulling downwards
    if (scrollContainerRef.current.scrollTop <= 2 && deltaY > 0) {
      const distance = Math.min(80, deltaY * 0.45);
      setPullY(distance);
      setIsPulling(true);
    }
  };

  const handleTouchEnd = () => {
    if (pullY >= 50) {
      triggerPullRefresh();
    } else {
      setPullY(0);
      setIsPulling(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }
    if (e.button === 0 && scrollContainerRef.current) {
      setIsMouseDownDrag(true);
      setDragStartY(e.clientY);
      setDragStartScrollTop(scrollContainerRef.current.scrollTop);
      setHasDraggedSignificantly(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownDrag || !scrollContainerRef.current) return;
    const deltaY = e.clientY - dragStartY;
    if (Math.abs(deltaY) > 5) {
      setHasDraggedSignificantly(true);
    }

    if (dragStartScrollTop === 0 && deltaY > 0) {
      const distance = Math.min(80, deltaY * 0.45);
      setPullY(distance);
      setIsPulling(true);
    } else {
      scrollContainerRef.current.scrollTop = dragStartScrollTop - deltaY;
    }
  };

  const handleMouseUp = () => {
    if (isMouseDownDrag) {
      if (pullY >= 50) {
        triggerPullRefresh();
      } else {
        setPullY(0);
        setIsPulling(false);
      }
      setIsMouseDownDrag(false);
      setTimeout(() => setHasDraggedSignificantly(false), 50);
    }
  };

  const handleMouseLeave = () => {
    if (isMouseDownDrag) {
      setPullY(0);
      setIsPulling(false);
      setIsMouseDownDrag(false);
      setTimeout(() => setHasDraggedSignificantly(false), 50);
    }
  };

  // Quick drag & scroll helpers
  const handleScrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: 320, behavior: 'smooth' });
    }
  };

  const handleScrollTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Bulk Actions
  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBulkSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (bulkSelectedIds.length === filteredEmails.length && filteredEmails.length > 0) {
      setBulkSelectedIds([]);
    } else {
      setBulkSelectedIds(filteredEmails.map((e) => e.id));
    }
  };

  const handleSelectFlagged = () => {
    const flagged = filteredEmails
      .filter((e) => e.securityRiskScore > 50 || e.threatClassification !== 'legitimate')
      .map((e) => e.id);
    setBulkSelectedIds(flagged);
  };

  const handleDeselectAll = () => {
    setBulkSelectedIds([]);
  };

  const handleRunBulkQuarantine = () => {
    if (bulkSelectedIds.length === 0) return;
    if (onBulkQuarantine) {
      onBulkQuarantine(bulkSelectedIds);
    } else {
      bulkSelectedIds.forEach((id) => onQuarantineEmail(id));
    }
    if (onAddAuditLog) {
      onAddAuditLog({
        action: `Bulk Quarantined ${bulkSelectedIds.length} Emails`,
        targetTitle: `Batch quarantine operation across ${bulkSelectedIds.length} flagged items`,
        operator: 'Agent Vance',
        role: 'Senior Cyber Forensic Analyst',
        severity: 'high',
        category: 'bulk',
        notes: `Executed batch quarantine policy on: ${bulkSelectedIds.join(', ')}`,
      });
    }
    setBulkSelectedIds([]);
  };

  const handleRunBulkBlock = () => {
    if (bulkSelectedIds.length === 0) return;
    if (onBulkBlock) {
      onBulkBlock(bulkSelectedIds);
    } else {
      bulkSelectedIds.forEach((id) => onBlockSender(id));
    }
    if (onAddAuditLog) {
      onAddAuditLog({
        action: `Bulk Blocked ${bulkSelectedIds.length} Senders`,
        targetTitle: `Firewall sinkhole rules provisioned for ${bulkSelectedIds.length} items`,
        operator: 'Agent Vance',
        role: 'Senior Cyber Forensic Analyst',
        severity: 'critical',
        category: 'bulk',
        notes: `Network perimeter drop rules deployed for: ${bulkSelectedIds.join(', ')}`,
      });
    }
    setBulkSelectedIds([]);
  };

  // Quick Reply Generator with Gemini API
  const handleGenerateQuickReply = async (type: 'safe_reply' | 'request_info') => {
    if (!selectedEmail) return;
    setQuickReplyType(type);
    setIsGeneratingReply(true);
    setReplyCopied(false);

    try {
      const res = await fetch('/api/gemini/quick-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: selectedEmail.id,
          replyType: type,
          emailSubject: selectedEmail.subject,
          emailBody: selectedEmail.bodyText,
          senderName: selectedEmail.fromName,
          senderEmail: selectedEmail.fromEmail,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuickReplyDraft(data.replyText || '');
      } else {
        throw new Error('Quick reply endpoint failed');
      }
    } catch (err) {
      // Forensic Fallback
      if (type === 'request_info') {
        setQuickReplyDraft(`Dear ${selectedEmail.fromName},

Thank you for your correspondence regarding "${selectedEmail.subject}".

In accordance with enterprise zero-trust security policy, all external requests involving credential operations, financial remittances, or document signing require out-of-band verification.

Could you please provide:
1. Your verified organizational telephone number and extension.
2. Official purchase order (PO) or department ticket reference.
3. Cryptographically authenticated confirmation from your corporate registrar.

All links and attachments are held pending security verification.

Sincerely,
Security Operations & Verification Desk`);
      } else {
        setQuickReplyDraft(`Dear ${selectedEmail.fromName},

Thank you for contacting us regarding "${selectedEmail.subject}".

We have received your message. Please be advised that incoming communications are screened via zero-trust heuristic filters. In accordance with security protocols, our personnel do not execute unverified third-party links or download attachments.

Your inquiry has been cataloged under standard administrative review.

Best regards,
Enterprise Client Relations & Security`);
      }
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleCopyReply = () => {
    if (!quickReplyDraft) return;
    navigator.clipboard.writeText(quickReplyDraft);
    setReplyCopied(true);
    setTimeout(() => setReplyCopied(false), 2500);
  };

  const handleSendSafeReply = () => {
    if (!selectedEmail || !quickReplyDraft) return;
    setReplySentBanner(`Safe response dispatched through secure outbound gateway to ${selectedEmail.fromEmail}.`);

    if (onAddAuditLog) {
      onAddAuditLog({
        action: quickReplyType === 'request_info' ? 'Dispatched Out-of-Band Info Request' : 'Dispatched Forensic Safe Reply',
        targetId: selectedEmail.id,
        targetTitle: `Safe reply dispatched to ${selectedEmail.fromEmail} (${selectedEmail.subject})`,
        operator: 'Agent Vance',
        role: 'Senior Cyber Forensic Analyst',
        severity: 'info',
        category: 'quick_reply',
        notes: `Zero-trust drafted response delivered via secure edge proxy. Response body length: ${quickReplyDraft.length} chars.`,
      });
    }

    setTimeout(() => {
      setReplySentBanner(null);
      setQuickReplyType(null);
      setQuickReplyDraft('');
    }, 4000);
  };

  // Add / Remove Analyst Notes
  const handleAddAnalystNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail || !newNoteText.trim()) return;

    const updatedNotes = [...(selectedEmail.analystNotes || []), `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Agent Vance): ${newNoteText.trim()}`];
    if (onUpdateEmailNotes) {
      onUpdateEmailNotes(selectedEmail.id, updatedNotes);
    }
    selectedEmail.analystNotes = updatedNotes;
    setNewNoteText('');

    if (onAddAuditLog) {
      onAddAuditLog({
        action: 'Annotated Email Forensic Log',
        targetId: selectedEmail.id,
        targetTitle: `Observation logged on ${selectedEmail.subject}`,
        operator: 'Agent Vance',
        role: 'Senior Cyber Forensic Analyst',
        severity: 'info',
        category: 'case',
        notes: newNoteText.trim(),
      });
    }
  };

  const handleDeleteNote = (idx: number) => {
    if (!selectedEmail || !selectedEmail.analystNotes) return;
    const updated = selectedEmail.analystNotes.filter((_, i) => i !== idx);
    selectedEmail.analystNotes = updated;
    if (onUpdateEmailNotes) {
      onUpdateEmailNotes(selectedEmail.id, updated);
    }
  };

  // Handler: Shift Email Category with AI Memory Learning
  const handleShiftCategory = (newCat: EmailCategory) => {
    if (!selectedEmail) return;
    const oldCat = selectedEmail.category;
    if (onUpdateEmailCategory) {
      onUpdateEmailCategory(selectedEmail.id, newCat);
    } else {
      selectedEmail.category = newCat;
    }

    // Persist to AI Memory store so future emails from this sender/domain are remembered
    saveCategoryMemoryRule({
      targetPattern: selectedEmail.fromEmail,
      matchType: 'sender_email',
      assignedCategory: newCat,
      originalCategory: oldCat,
      sourceEmailId: selectedEmail.id,
    });

    setIsCategoryMenuOpen(false);
    setCategoryShiftSuccessMsg(
      `AI Category Memory Updated: Shifted "${selectedEmail.fromName}" to ${newCat.toUpperCase()}. Future emails from ${selectedEmail.fromEmail} will route to ${newCat} automatically!`
    );
    setTimeout(() => setCategoryShiftSuccessMsg(null), 6000);
  };

  // Handler: Export Forensic Dossier to PDF
  const handleExportPdf = () => {
    if (!selectedEmail) return;
    setIsExportingPdf(true);
    try {
      exportEmailForensicReport(selectedEmail);
      setPdfSuccessNotice(`Forensic PDF dossier for ${selectedEmail.id} exported successfully!`);
      setTimeout(() => setPdfSuccessNotice(null), 4500);
    } catch (err) {
      console.error('Failed to export PDF report:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handler: Apply Policy Configured in Sandbox Simulation
  const handleApplySimulatedPolicy = (config: PolicySimulationConfig, summary: string) => {
    if (onAddAuditLog) {
      onAddAuditLog({
        action: 'Applied Security Policy from Sandbox Simulation',
        targetId: selectedEmail?.id,
        targetTitle: 'Organizational Perimeter Policy Update',
        operator: 'SecOps Analyst',
        role: 'Forensic Security Engineer',
        severity: 'high',
        category: 'general',
        notes: `Simulated policy deployed: ${summary}. DMARC: ${config.dmarcPolicy}, Tor relay: ${config.torRelayAction}, Risk cutoff: ${config.riskThreshold}/100.`,
      });
    }
    setIsPolicySimulatorOpen(false);
  };

  // Filtered emails
  const filteredEmails = (emails || []).filter((e) => {
    if (!e) return false;
    // Connected App Source check
    if (activeAppSource !== 'all') {
      const emailSource = e.sourceApp || 'gmail';
      if (emailSource !== activeAppSource) return false;
    }

    // Automated Tag check
    if (selectedTag !== 'all') {
      const emailTags = e.tags || autoScanAndTagEmail(e);
      if (!emailTags.includes(selectedTag)) return false;
    }

    // Category check
    if (selectedCategory === 'important') {
      if (e.importanceScore < 75) return false;
    } else if (selectedCategory !== 'all' && e.category !== selectedCategory) {
      return false;
    }

    // Security Status check
    if (selectedSecurityStatus !== 'all') {
      if (selectedSecurityStatus === 'phishing' && e.threatClassification !== 'phishing') return false;
      if (selectedSecurityStatus === 'fraud' && e.threatClassification !== 'fraud') return false;
      if (selectedSecurityStatus === 'suspicious' && e.threatClassification !== 'suspicious') return false;
      if (selectedSecurityStatus === 'quarantined' && e.securityStatus !== 'quarantined') return false;
      if (selectedSecurityStatus === 'blocked' && e.securityStatus !== 'blocked') return false;
    }

    // Tab check
    if (activeTab === 'clean' && (e.securityRiskScore > 50 || e.threatClassification !== 'legitimate')) return false;
    if (activeTab === 'threats' && (e.securityRiskScore <= 50 && e.threatClassification === 'legitimate')) return false;
    if (activeTab === 'important' && e.importanceScore < 80) return false;

    // Search query check
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      const match =
        (e.subject || '').toLowerCase().includes(q) ||
        (e.fromEmail || '').toLowerCase().includes(q) ||
        (e.fromName || '').toLowerCase().includes(q) ||
        (e.bodyText || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.tags && e.tags.some(t => (t || '').toLowerCase().includes(q))) ||
        (e.attribution?.campaignName && e.attribution.campaignName.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Dedicated split-view auto-preview: display first email in right preview pane on desktop if none selected
  useEffect(() => {
    if (!selectedEmail && filteredEmails && filteredEmails.length > 0) {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        onSelectEmail(filteredEmails[0]);
      }
    }
  }, [selectedEmail, filteredEmails, onSelectEmail]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'banking': return <Landmark className="w-3.5 h-3.5 text-emerald-400" />;
      case 'loans': return <Coins className="w-3.5 h-3.5 text-amber-400" />;
      case 'companies': return <Building2 className="w-3.5 h-3.5 text-blue-400" />;
      case 'staff': return <Briefcase className="w-3.5 h-3.5 text-indigo-400" />;
      case 'documents': return <FileText className="w-3.5 h-3.5 text-teal-400" />;
      case 'family': return <Users2 className="w-3.5 h-3.5 text-pink-400" />;
      case 'subscriptions': return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      default: return <Inbox className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className={`h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden select-none relative ${
      isSpaciousMode 
        ? 'p-3.5 sm:p-5 md:p-6 lg:p-7 gap-4 sm:gap-5 md:gap-6' 
        : 'p-2 sm:p-2.5 md:p-3 gap-2.5 sm:gap-3'
    } bg-slate-950 transition-all duration-200`}>
      
      {/* Left Stream List Pane (Split-View Mail Stream - Floating Rounded Card) */}
      <div className={`w-full md:w-[320px] lg:w-[350px] xl:w-[380px] flex-shrink-0 rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-xl flex flex-col bg-slate-900/60 backdrop-blur-md h-full overflow-hidden ${selectedEmail ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Top Header Controls: Sidebar Toggle, Back to Dashboard, Spacious Mode & Close */}
        <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {onToggleSidebar && (
              <button
                id="btn-mailview-toggle-sidebar"
                onClick={onToggleSidebar}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors text-[11px]"
                title={isSidebarCollapsed ? "Expand Navigation Sidebar" : "Collapse Sidebar for Maximum Workspace"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5 text-cyan-400" /> : <PanelLeftClose className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{isSidebarCollapsed ? 'Expand' : 'Collapse'}</span>
              </button>
            )}
            <button
              id="btn-mailview-back-dashboard"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-600 transition-colors font-medium text-[11px]"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              id="btn-mailview-toggle-spacious"
              onClick={() => setIsSpaciousMode(!isSpaciousMode)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono transition-colors ${
                isSpaciousMode
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title={isSpaciousMode ? "Switch to Compact Mode" : "Switch to Spacious Mode (increased padding & whitespace)"}
            >
              {isSpaciousMode ? <Minimize2 className="w-3 h-3 text-cyan-400" /> : <Maximize2 className="w-3 h-3 text-slate-400" />}
              <span className="hidden sm:inline">{isSpaciousMode ? 'Spacious' : 'Compact'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {onSyncGmail && (
              <button
                onClick={() => onSyncGmail(true)}
                disabled={isSyncingGmail}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-[11px] font-mono flex items-center gap-1 transition-colors"
                title={isSyncingGmail ? (syncProgress?.statusLabel || 'Syncing...') : "Sync Live Mail"}
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingGmail ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncingGmail ? 'Syncing...' : 'Sync'}</span>
              </button>
            )}
            {onOpenPenguin && (
              <button
                onClick={onOpenPenguin}
                className="px-2 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800 text-[11px] font-mono flex items-center gap-1"
                title="Pippin Assistant"
              >
                <span>🐧</span>
              </button>
            )}
            <button
              id="btn-mailview-close"
              onClick={() => onNavigate('dashboard')}
              className="p-1 rounded-lg bg-slate-900 hover:bg-red-950/80 hover:text-red-300 text-slate-400 border border-slate-800 hover:border-red-800 transition-colors"
              title="Close Mail View"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact Stream Filter & Source Bar */}
        <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-col gap-2">
          {/* Row 1: Source Selector (Horizontal Scroller with subtle pill badges) & Highlights */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono pb-0.5 scrollbar-none flex-1">
              {[
                { id: 'all', label: 'All', count: emails.length },
                { id: 'gmail', label: 'Gmail', count: emails.filter(e => (e.sourceApp || 'gmail') === 'gmail').length },
                { id: 'docs', label: 'Docs', count: emails.filter(e => e.sourceApp === 'docs').length },
                { id: 'm365', label: 'M365', count: emails.filter(e => e.sourceApp === 'm365').length },
                { id: 'outlook', label: 'Outlook', count: emails.filter(e => e.sourceApp === 'outlook').length },
                { id: 'corporate', label: 'Corp', count: emails.filter(e => e.sourceApp === 'corporate').length },
              ].map((src) => (
                <button
                  key={src.id}
                  onClick={() => setActiveAppSource(src.id as any)}
                  className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-all ${
                    activeAppSource === src.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {src.label} ({src.count})
                </button>
              ))}

              {onOpenInAppMicrosoft && (
                <button
                  onClick={onOpenInAppMicrosoft}
                  className="px-2 py-0.5 rounded text-[10px] whitespace-nowrap bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/80 hover:border-blue-500 transition-colors flex items-center gap-1 font-mono"
                  title="Use or Connect In-App Microsoft Account"
                >
                  <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  <span>+ In-App MSFT</span>
                </button>
              )}
            </div>

            {/* Compact Highlight Popover Button */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsHighlightsMenuOpen(!isHighlightsMenuOpen)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 transition-colors ${
                  highlightMode !== 'none'
                    ? 'bg-purple-950/70 text-purple-300 border-purple-800'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
                title="Message highlighting mode"
              >
                <span>🎨 Outlines</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
              {isHighlightsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsHighlightsMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-slate-900 border border-slate-700 shadow-xl z-50 p-1 space-y-0.5 text-[11px] font-mono">
                    <button
                      onClick={() => { onSelectHighlightMode?.('smart'); setIsHighlightsMenuOpen(false); }}
                      className={`w-full text-left px-2 py-1 rounded ${highlightMode === 'smart' ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      🎨 Smart Outlines
                    </button>
                    <button
                      onClick={() => { onSelectHighlightMode?.('all-risk'); setIsHighlightsMenuOpen(false); }}
                      className={`w-full text-left px-2 py-1 rounded ${highlightMode === 'all-risk' ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      🔴🟡🟢 Risk Heatmap
                    </button>
                    <button
                      onClick={() => { onSelectHighlightMode?.('family'); setIsHighlightsMenuOpen(false); }}
                      className={`w-full text-left px-2 py-1 rounded ${highlightMode === 'family' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      🔵 Family
                    </button>
                    <button
                      onClick={() => { onSelectHighlightMode?.('business'); setIsHighlightsMenuOpen(false); }}
                      className={`w-full text-left px-2 py-1 rounded ${highlightMode === 'business' ? 'bg-amber-800 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      🟤 Business
                    </button>
                    <button
                      onClick={() => { onSelectHighlightMode?.('marked'); setIsHighlightsMenuOpen(false); }}
                      className={`w-full text-left px-2 py-1 rounded ${highlightMode === 'marked' ? 'bg-purple-800 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      ⭐ Marked
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Re-auth alert if token issue */}
          {gmailSyncError?.suggestsReauth && onReauthGoogle && (
            <button
              onClick={onReauthGoogle}
              className="w-full px-2 py-1 rounded bg-amber-950/90 hover:bg-amber-900 border border-amber-500/80 text-amber-200 text-[10px] font-mono flex items-center justify-center gap-1 transition-all shadow-xs animate-pulse"
              title="OAuth Token issue: Click to re-authenticate with Google"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Re-authenticate Gmail with Google</span>
            </button>
          )}
        </div>

        {/* Search & Sub-Filter Bar */}
        <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter messages, senders, campaigns, tags..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            
            {(selectedCategory !== 'all' || selectedSecurityStatus !== 'all' || selectedTag !== 'all') && (
              <button
                onClick={() => {
                  onSelectCategory('all');
                  onSelectSecurityStatus('all');
                  setSelectedTag('all');
                }}
                className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-mono">
            {[
              { id: 'all', label: `All (${emails.length})` },
              { id: 'important', label: '⭐ Important' },
              { id: 'threats', label: '🚨 Threats Only' },
              { id: 'clean', label: '🛡️ Clean Only' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Automated Tag Filtering System */}
          <div className="pt-1 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1 flex-shrink-0">
              <Tag className="w-3 h-3 text-cyan-400" /> Tags:
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                selectedTag === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
              }`}
            >
              All Tags
            </button>
            {SYSTEM_AVAILABLE_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? 'all' : t)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                  selectedTag === t
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Selection / Bulk Action Bar */}
        <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-mono text-[11px]"
              title={bulkSelectedIds.length === filteredEmails.length ? "Deselect All" : "Select All"}
            >
              {bulkSelectedIds.length === filteredEmails.length && filteredEmails.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              ) : bulkSelectedIds.length > 0 ? (
                <Square className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Select All</span>
            </button>

            <button
              onClick={handleSelectFlagged}
              className="px-2 py-0.5 rounded bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-800/60 font-mono text-[10px]"
            >
              Select Flagged
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            {filteredEmails.length} item{filteredEmails.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Floating Bulk Action Drawer if items are checked */}
        {bulkSelectedIds.length > 0 && (
          <div className="p-2.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top-1">
            <span className="text-xs font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              {bulkSelectedIds.length} selected
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunBulkQuarantine}
                className="px-2.5 py-1 text-xs rounded bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 flex items-center gap-1 transition-colors font-mono font-bold"
              >
                <Lock className="w-3 h-3" />
                <span>Bulk Quarantine</span>
              </button>

              <button
                onClick={handleRunBulkBlock}
                className="px-2.5 py-1 text-xs rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 flex items-center gap-1 transition-colors font-mono font-bold"
              >
                <Ban className="w-3 h-3" />
                <span>Bulk Block</span>
              </button>

              <button
                onClick={handleDeselectAll}
                className="text-[10px] font-mono text-slate-400 hover:text-slate-200 px-1.5 py-0.5"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Drag down pull-to-refresh & sync feedback banner */}
        <div 
          className="overflow-hidden transition-all duration-200 flex flex-col items-center justify-center bg-slate-950/95 border-b border-cyan-500/30 text-xs font-mono select-none"
          style={{ height: pullY > 0 ? `${pullY}px` : (isPullRefreshing || isSyncingGmail ? '46px' : '0px') }}
        >
          {isPullRefreshing || isSyncingGmail ? (
            <div className="flex items-center gap-2 text-cyan-400 font-semibold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Syncing Gmail inbox stream...</span>
            </div>
          ) : pullY >= 50 ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>↑ Release to sync inbox now</span>
            </div>
          ) : pullY > 0 ? (
            <div className="flex items-center gap-2 text-slate-400">
              <ChevronDown className="w-4 h-4 text-cyan-400 transition-transform" style={{ transform: `rotate(${Math.min(180, (pullY / 50) * 180)}deg)` }} />
              <span>↓ Drag down to refresh & sync ({Math.round((pullY / 50) * 100)}%)</span>
            </div>
          ) : null}
        </div>

        {dragRefreshSuccess && (
          <div className="px-3 py-1.5 bg-emerald-950/70 border-b border-emerald-700/60 text-emerald-300 text-[11px] font-mono flex items-center justify-between animate-in fade-in">
            <span>{dragRefreshSuccess}</span>
            <button onClick={() => setDragRefreshSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Email Stream List with Smooth Drag-to-Scroll & Pull */}
        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`flex-1 overflow-y-auto ${isSpaciousMode ? 'p-3 space-y-3' : 'divide-y divide-slate-800/60'} easy-scroll-stream ${isMouseDownDrag ? 'is-dragging' : ''}`}
        >
          {filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No messages match the current forensic criteria.</p>
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = selectedEmail?.id === email.id;
              const isChecked = bulkSelectedIds.includes(email.id);
              const isThreat = email.securityRiskScore > 50 || email.threatClassification !== 'legitimate';
              const emailTags = email.tags || autoScanAndTagEmail(email);

              // Risk & Category classification for dynamic highlighting
              const isHighRisk = email.securityRiskScore > 65 || email.threatClassification === 'phishing' || email.threatClassification === 'fraud';
              const isMidRisk = !isHighRisk && (email.securityRiskScore >= 25 || email.threatClassification === 'suspicious');
              const isZeroRisk = !isHighRisk && !isMidRisk; // very low / 0 risk
              const isFamily = email.category === 'family';
              const isBusiness = email.category === 'companies' || email.category === 'staff' || email.category === 'banking' || email.category === 'loans';
              const isMarked = isChecked || (email as any).isStarred;

              // Dynamic light shade backgrounds and colored outlines as requested
              let dynamicHighlightClass = '';
              let badgeColorLabel = null;

              if (highlightMode === 'smart') {
                // Smart mode applies all the requested outline colors simultaneously!
                if (isFamily) {
                  dynamicHighlightClass = 'bg-blue-500/10 hover:bg-blue-500/15 border-2 border-blue-400 border-l-4 border-l-blue-600 shadow-xs';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">🔵 Family</span>;
                } else if (isBusiness) {
                  dynamicHighlightClass = 'bg-[#78350f]/10 hover:bg-[#78350f]/15 border-2 border-[#854d0e] border-l-4 border-l-[#7f1d1d] shadow-xs';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">🟤 Business</span>;
                } else if (isHighRisk) {
                  dynamicHighlightClass = 'bg-red-500/10 hover:bg-red-500/15 border-2 border-red-500 border-l-4 border-l-red-500 shadow-xs';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">🔴 High Risk</span>;
                } else if (isMidRisk) {
                  dynamicHighlightClass = 'bg-amber-500/10 hover:bg-amber-500/15 border-2 border-amber-500 border-l-4 border-l-amber-500 shadow-xs';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">🟡 Mid Risk</span>;
                } else {
                  dynamicHighlightClass = 'bg-emerald-500/10 hover:bg-emerald-500/15 border-2 border-emerald-500 border-l-4 border-l-emerald-500 shadow-xs';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">🟢 0 Risk</span>;
                }
              } else if (highlightMode === 'all-risk') {
                if (isHighRisk) {
                  dynamicHighlightClass = 'bg-red-500/10 hover:bg-red-500/15 border-l-4 border-l-red-500 border border-red-500/30';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">🔴 High Risk</span>;
                } else if (isMidRisk) {
                  dynamicHighlightClass = 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-500 border border-amber-500/30';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">🟡 Mid Risk</span>;
                } else {
                  dynamicHighlightClass = 'bg-emerald-500/10 hover:bg-emerald-500/15 border-l-4 border-l-emerald-500 border border-emerald-500/30';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">🟢 0 Risk</span>;
                }
              } else if (highlightMode === 'family') {
                if (isFamily) {
                  dynamicHighlightClass = 'bg-blue-500/10 hover:bg-blue-500/15 border-2 border-blue-400 border-l-4 border-l-blue-600 shadow-xs';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">🔵 Family</span>;
                } else {
                  dynamicHighlightClass = 'hover:bg-slate-800/40 border-l-4 border-l-transparent';
                }
              } else if (highlightMode === 'business') {
                if (isBusiness) {
                  dynamicHighlightClass = 'bg-[#78350f]/10 hover:bg-[#78350f]/15 border-2 border-[#854d0e] border-l-4 border-l-[#7f1d1d] shadow-xs';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">🟤 Business</span>;
                } else {
                  dynamicHighlightClass = 'hover:bg-slate-800/40 border-l-4 border-l-transparent';
                }
              } else if (highlightMode === 'marked') {
                if (isMarked) {
                  dynamicHighlightClass = 'bg-purple-500/10 hover:bg-purple-500/15 border-2 border-purple-400 border-l-4 border-l-purple-600 shadow-xs';
                  badgeColorLabel = <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">⭐ Marked</span>;
                } else {
                  dynamicHighlightClass = 'hover:bg-slate-800/40 border-l-4 border-l-transparent';
                }
              } else {
                dynamicHighlightClass = isSelected
                  ? 'bg-cyan-950/25 border-l-4 border-l-cyan-500'
                  : 'hover:bg-slate-800/40 border-l-4 border-l-transparent';
              }

              return (
                <div
                  key={email.id}
                  id={`email-item-${email.id}`}
                  onClick={() => {
                    if (!hasDraggedSignificantly) {
                      onSelectEmail(email);
                    }
                  }}
                  className={`p-3.5 cursor-pointer transition-all ${isSpaciousMode ? 'rounded-2xl border border-slate-800/80 shadow-sm' : ''} ${dynamicHighlightClass} ${
                    isSelected ? 'ring-2 ring-cyan-500/60' : ''
                  } ${!email.isRead ? 'font-medium' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Checkbox for Bulk Selection */}
                      <button
                        onClick={(e) => handleToggleSelect(e, email.id)}
                        className="p-1 -ml-1 text-slate-400 hover:text-cyan-400 rounded focus:outline-none"
                        aria-label="Select item"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>

                      <div className="flex items-center gap-1.5 truncate">
                        {getCategoryIcon(email.category)}
                        <span className={`text-xs truncate ${!email.isRead ? 'font-bold text-white' : 'text-slate-300'}`}>
                          {email.fromName}
                        </span>
                        {email.sourceApp === 'outlook' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800 flex-shrink-0">
                            Outlook 365
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-950 text-red-300 border border-red-800 flex-shrink-0">
                            Gmail
                          </span>
                        )}
                        {badgeColorLabel}
                        {email.threadMessagesCount && email.threadMessagesCount > 1 && (
                          <span 
                            className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-700/70 flex items-center gap-1 flex-shrink-0 shadow-xs"
                            title={`${email.threadMessagesCount} messages in this conversation thread`}
                          >
                            <MessageSquare className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{email.threadMessagesCount}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      {email.date.split(' ').slice(0, 3).join(' ')}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-200 truncate mt-1">
                    {email.subject}
                  </p>

                  <p className="text-[11px] text-slate-400 truncate mt-0.5 line-clamp-1">
                    {email.bodySnippet}
                  </p>

                  {/* Tag Badges on Card */}
                  {emailTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {emailTags.slice(0, 3).map((tg) => (
                        <span
                          key={tg}
                          className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800"
                        >
                          #{tg}
                        </span>
                      ))}
                      {emailTags.length > 3 && (
                        <span className="text-[9px] font-mono text-slate-500">
                          +{emailTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Dual Metric Indicator Row - Subtle vertical gap between thread info and forensic metadata */}
                  <div className={`mt-3 flex items-center justify-between pt-2 border-t border-slate-800/50 text-[10px] font-mono`}>
                    <div className="flex items-center gap-1.5">
                      {isThreat ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-2.5 h-2.5" /> Risk {email.securityRiskScore}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" /> Risk {email.securityRiskScore}
                        </span>
                      )}

                      {email.promptInjectionDetected && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                          AI INJECTION
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <span>Priority:</span>
                      <span className={`font-bold ${email.importanceScore >= 80 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {email.importanceScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Load More Button and IntersectionObserver Sentinel for Gmail batch expansion */}
          {filteredEmails.length > 0 && (
            <div className="p-4 flex flex-col items-center justify-center gap-2 border-t border-slate-800/80 bg-slate-950/40">
              <button
                type="button"
                onClick={() => handleSyncLiveGmail(false)}
                disabled={isSyncingGmail}
                className="w-full max-w-xs py-2 px-4 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 hover:text-cyan-100 border border-cyan-700/60 hover:border-cyan-500 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Load additional emails from Gmail"
              >
                {isSyncingGmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Loading more emails from Gmail...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Load More</span>
                  </>
                )}
              </button>
              {syncProgress && isSyncingGmail && (
                <span className="text-[11px] text-cyan-400 font-mono animate-pulse">
                  {syncProgress.statusLabel} ({syncProgress.loaded}/{syncProgress.total})
                </span>
              )}
              {/* IntersectionObserver Sentinel */}
              <div
                ref={bottomObserverRef}
                className="h-4 w-full opacity-0 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Drag Down Quick Navigation Bar */}
        <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
          <div className="flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px]">Drag down to scroll or pull to sync</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleScrollDown}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 border border-slate-700 flex items-center gap-1 text-[10px] transition-colors"
              title="Drag and scroll down through mailbox"
            >
              <span>Scroll Down</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleScrollTop}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 border border-slate-700 flex items-center text-[10px] transition-colors"
              title="Scroll to top"
            >
              <span>Top</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Detail Pane (Dedicated Split-View Preview Pane - Floating Rounded Card) */}
      <div className={`flex-1 min-w-0 flex flex-col bg-slate-900/50 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-xl h-full overflow-hidden ${!selectedEmail ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {!selectedEmail ? (
          <div className="flex-1 flex items-center justify-center text-center p-8 space-y-3">
            <div className="max-w-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Eye className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Select an email to inspect</h3>
              <p className="text-xs text-slate-500">
                Split-view active. Click any conversation thread or message from the inbox stream on the left to render full content in this dedicated preview pane.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            
            {/* Top Email Header Controls - Natural scrolling so email body and thread remain fully readable */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 space-y-3">
              {/* Mobile Back Button */}
              <div className="flex items-center justify-between md:hidden pb-1 border-b border-slate-800/40">
                <button
                  onClick={() => onSelectEmail(null)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Mailbox List</span>
                </button>
                <span className="text-[10px] font-mono text-slate-500">{selectedEmail.id}</span>
              </div>

              {/* AI Memory / Category Shift Success Banner */}
              {categoryShiftSuccessMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-xs text-emerald-200 flex items-center justify-between gap-2 shadow-md">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{categoryShiftSuccessMsg}</span>
                  </div>
                  <button
                    onClick={() => setCategoryShiftSuccessMsg(null)}
                    className="text-emerald-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded hover:bg-emerald-900"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* PDF Export Success Notice Banner */}
              {pdfSuccessNotice && (
                <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-xs text-cyan-200 flex items-center justify-between gap-2 shadow-md">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{pdfSuccessNotice}</span>
                  </div>
                  <button
                    onClick={() => setPdfSuccessNotice(null)}
                    className="text-cyan-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded hover:bg-cyan-900"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    
                    {/* Category Pill with Dropdown Menu for AI Reclassification */}
                    <div className="relative inline-block">
                      <button
                        id="btn-category-shift-trigger"
                        type="button"
                        onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 uppercase font-semibold flex items-center gap-1 transition-colors"
                        title="Click to shift category (AI will remember for future messages)"
                      >
                        <span>{selectedEmail.category}</span>
                        <ChevronDown className="w-3 h-3 text-cyan-400" />
                      </button>

                      {isCategoryMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCategoryMenuOpen(false);
                            }}
                          />
                          <div className="absolute left-0 top-full mt-1 w-64 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-2xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-2 py-1.5 text-[10px] font-mono text-cyan-400 font-bold border-b border-slate-800 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Reclassify Category (AI Learns)</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsCategoryMenuOpen(false);
                                }}
                                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
                                title="Close prompt"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-0.5 pt-1">
                              {[
                                { id: 'banking', label: '🏦 Banking & Wire', desc: 'Financial remittances, statements' },
                                { id: 'companies', label: '🏢 Companies & B2B', desc: 'Corporate vendors, enterprise' },
                                { id: 'family', label: '👥 Family & Personal', desc: 'Personal contacts' },
                                { id: 'staff', label: '💼 Staff & Internal', desc: 'Colleagues, teams, HR' },
                                { id: 'loans', label: '💰 Loans & Mortgages', desc: 'Credit facilities, debt' },
                                { id: 'documents', label: '📄 Documents & Legal', desc: 'Contracts, NDAs, audits' },
                                { id: 'subscriptions', label: '🔔 Subscriptions & SaaS', desc: 'Recurring renewals' },
                                { id: 'phishing', label: '⚠️ Phishing Threat', desc: 'Credential harvesting, spoof' },
                                { id: 'malware', label: '🦠 Malware Exploit', desc: 'Payloads, trojans, macros' },
                                { id: 'suspicious', label: '🛡️ Suspicious', desc: 'Anomalous origin or hops' },
                                { id: 'general', label: '📥 General Inbox', desc: 'Standard correspondence' },
                              ].map((cat) => (
                                <button
                                  key={cat.id}
                                  onClick={() => {
                                    handleShiftCategory(cat.id as EmailCategory);
                                    setIsCategoryMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex flex-col transition-colors ${
                                    selectedEmail.category === cat.id
                                      ? 'bg-cyan-500 text-slate-950 font-bold'
                                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <span className="font-semibold text-xs">{cat.label}</span>
                                  <span className={`text-[10px] ${selectedEmail.category === cat.id ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {cat.desc}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <div className="pt-1 border-t border-slate-800/80">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsCategoryMenuOpen(false);
                                }}
                                className="w-full py-1 text-center text-[10px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded transition-colors"
                              >
                                Close prompt
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      ID: {selectedEmail.id}
                    </span>
                    {/* Conversation View Badge */}
                    {selectedEmail.threadMessagesCount && selectedEmail.threadMessagesCount > 1 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-semibold flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-cyan-400" />
                        <span>Conversation View ({selectedEmail.threadMessagesCount} messages)</span>
                      </span>
                    )}

                    {/* Tags */}
                    {(selectedEmail.tags || autoScanAndTagEmail(selectedEmail)).map((tg) => (
                      <span
                        key={tg}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800"
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">{selectedEmail.subject}</h2>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onOpenAIWithEmail(selectedEmail)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 transition-all font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ask AI</span>
                  </button>

                  <button
                    id="btn-export-forensic-pdf"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors font-mono font-medium"
                    title="Download forensic dossier, headers, and AI threat findings as PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
                  </button>

                  {selectedEmail.securityStatus !== 'quarantined' ? (
                    <button
                      onClick={() => onQuarantineEmail(selectedEmail.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Quarantine</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono px-2 py-1 rounded bg-purple-950 text-purple-400 border border-purple-800">
                      Quarantined
                    </span>
                  )}

                  {/* Spacious Mode Toggle in Preview Header */}
                  <button
                    id="btn-preview-toggle-spacious"
                    onClick={() => setIsSpaciousMode(!isSpaciousMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors font-mono font-medium ${
                      isSpaciousMode
                        ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/80 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                    title={isSpaciousMode ? "Switch to Compact Mode" : "Switch to Spacious Mode (increased padding & whitespace)"}
                  >
                    {isSpaciousMode ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="hidden sm:inline">{isSpaciousMode ? 'Spacious' : 'Compact'}</span>
                  </button>

                  {/* Toggle Floating Security Forensics Sidebar */}
                  <button
                    id="btn-toggle-security-sidebar"
                    onClick={() => setIsSecurityDrawerOpen(!isSecurityDrawerOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all font-mono font-medium ${
                      isSecurityDrawerOpen
                        ? 'bg-red-950/80 text-red-300 border-red-700/80 hover:bg-red-900 ring-1 ring-red-500/30 font-semibold shadow-xs'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-600'
                    }`}
                    title={isSecurityDrawerOpen ? "Close Security Sidebar (ESC)" : "Open Floating Security Forensics Sidebar"}
                  >
                    {isSecurityDrawerOpen ? (
                      <>
                        <X className="w-3.5 h-3.5 text-red-400" />
                        <span>Close Security</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className={`w-3.5 h-3.5 ${selectedEmail.securityRiskScore > 50 ? 'text-red-400' : 'text-cyan-400'}`} />
                        <span>Security Sidebar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Row 2: Subject & Segmented Mode Switcher (Email Message vs Security Forensics) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">Viewing:</span>
                  <span className="text-xs text-slate-200 font-semibold truncate max-w-md">{selectedEmail.subject}</span>
                </div>

                {/* Segmented Mode Switcher */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner flex-shrink-0">
                  <button
                    id="tab-view-message"
                    onClick={() => setPreviewMode('message')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      previewMode === 'message'
                        ? 'bg-slate-800 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Email Message</span>
                  </button>

                  <button
                    id="tab-view-security"
                    onClick={() => setPreviewMode('security')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      previewMode === 'security'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldAlert className={`w-3.5 h-3.5 ${selectedEmail.securityRiskScore > 50 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
                    <span>Security Forensics</span>
                    {selectedEmail.securityRiskScore > 50 && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">
                        {selectedEmail.securityRiskScore}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Row 3: Clean Sender, Recipient & Date Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs border-t border-slate-800/40 text-slate-400">
                <div className="flex items-center gap-2 truncate">
                  <p className="truncate">
                    <strong className="text-slate-200">{selectedEmail.fromName}</strong> &lt;<span className="font-mono text-cyan-400">{selectedEmail.fromEmail}</span>&gt;
                  </p>
                  <span className="text-slate-600">•</span>
                  <p className="text-slate-400 truncate">
                    to <span className="font-mono text-slate-300">{selectedEmail.toEmail}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span>{selectedEmail.date}</span>
                </div>
              </div>
            </div>

            {/* Main Email Viewing Body: Spacious, un-suffocating Reading Mode */}
            {previewMode === 'message' ? (
              <div className={`${isSpaciousMode ? 'p-6 sm:p-8 lg:p-10 space-y-7 lg:space-y-9' : 'p-4 sm:p-6 space-y-4 sm:space-y-5'} max-w-5xl mx-auto w-full transition-all duration-200`}>
                {/* Non-suffocating Security Alert Pill if Threat */}
                {(selectedEmail.securityRiskScore > 50 || selectedEmail.threatClassification !== 'legitimate' || selectedEmail.promptInjectionDetected) && (
                  <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-red-950/40 border border-red-800/60 text-xs flex items-center justify-between gap-3 shadow-md animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
                      <div>
                        <span className="font-bold text-red-300">
                          Security Alert: {selectedEmail.threatClassification.toUpperCase()} ({selectedEmail.securityRiskScore}/100 Risk)
                        </span>
                        <span className="text-slate-400 ml-2 hidden sm:inline text-[11px]">
                          {selectedEmail.promptInjectionDetected ? 'Adversarial prompt injection detected.' : 'Unverified relay hops or spoofed sender domain detected.'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPreviewMode('security')}
                      className="px-3 py-1.5 rounded-xl bg-red-900/80 hover:bg-red-800 text-white font-mono text-[10px] font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
                    >
                      <span>Inspect Threat Dossier & Timeline →</span>
                    </button>
                  </div>
                )}

                {/* Banner: Reply Sent Confirmation */}
                {replySentBanner && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2.5 shadow-md">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{replySentBanner}</span>
                  </div>
                )}

                {/* Conversation Thread or Single Message Body with subtle vertical gaps */}
                {selectedEmail.threadMessages && selectedEmail.threadMessages.length > 1 ? (
                  <div className={`space-y-5 ${isSpaciousMode ? 'sm:space-y-7' : 'sm:space-y-5'}`}>
                    <div className="flex items-center justify-between px-1 text-xs font-mono text-cyan-400 border-b border-slate-800 pb-2.5">
                      <span className="flex items-center gap-1.5 font-bold">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                        Conversation Thread ({selectedEmail.threadMessages.length} Messages)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Chronological Order
                      </span>
                    </div>

                    <div className={`space-y-4 ${isSpaciousMode ? 'sm:space-y-5' : 'sm:space-y-4'}`}>
                      {selectedEmail.threadMessages.map((msg, idx) => {
                        const isLatest = idx === selectedEmail.threadMessages!.length - 1;
                        return (
                          <div
                            key={msg.id || idx}
                            className={`rounded-2xl sm:rounded-3xl border transition-all ${
                              isLatest
                                ? 'bg-slate-900/85 border-cyan-500/50 shadow-lg ring-1 ring-cyan-500/20'
                                : 'bg-slate-900/40 border-slate-800/80 shadow-sm'
                            } ${isSpaciousMode ? 'p-6 sm:p-7 space-y-4' : 'p-5 sm:p-6 space-y-3'}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border ${
                                  isLatest 
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                  {idx + 1}
                                </div>
                                <div className="truncate">
                                  <span className="text-xs font-bold text-slate-200 block truncate">
                                    {msg.fromName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                                    &lt;{msg.fromEmail}&gt; &rarr; {msg.toEmail}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] font-mono text-slate-500">
                                  {msg.date}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${
                                  msg.securityRiskScore > 50
                                    ? 'bg-red-950 text-red-400 border border-red-800'
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                }`}>
                                  {msg.securityRiskScore > 50 ? 'Threat' : 'Clean'}
                                </span>
                              </div>
                            </div>

                            {/* Thread Message Body */}
                            <div className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                              {msg.bodyText}
                            </div>

                            {/* Attachments if any */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2.5 border-t border-slate-800/40">
                                {msg.attachments.map((att, attIdx) => (
                                  <div
                                    key={attIdx}
                                    className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1.5"
                                  >
                                    <Paperclip className="w-3 h-3 text-cyan-400" />
                                    <span>{att.name}</span>
                                    <span className="text-slate-500">({att.size})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-7 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap shadow-inner">
                    {selectedEmail.bodyText}
                  </div>
                )}

                {/* Attachments Section - Floating rounded-2xl card */}
                {selectedEmail.attachments.length > 0 && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3.5 shadow-md">
                    <p className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                      Attached Artifacts ({selectedEmail.attachments.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedEmail.attachments.map((att: any, idx: number) => {
                        const verdict = att.sandboxVerdict || (att.isSuspicious ? 'suspicious' : 'clean');
                        const displayName = att.fileName || att.name || 'Attachment';
                        const displaySize = att.fileSize || att.size || '';
                        return (
                          <div
                            key={att.id || att.name || idx}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <p className="font-semibold text-slate-200">{displayName}</p>
                              <p className="text-[10px] font-mono text-slate-400">{displaySize}{displaySize && att.mimeType ? ' • ' : ''}{att.mimeType || ''}</p>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              verdict === 'malicious' ? 'bg-red-950 text-red-400 border border-red-800' :
                              verdict === 'suspicious' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                              'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}>
                              {(verdict || 'clean').toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Gemini AI Quick Reply Generation Box - Floating rounded-2xl card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-cyan-500/30 space-y-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                          Gemini Forensic Quick Reply
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Draft professional zero-trust responses to safely verify identity without exposure.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="btn-quick-safe-reply"
                        onClick={() => handleGenerateQuickReply('safe_reply')}
                        disabled={isGeneratingReply}
                        className="px-3 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Safe Reply</span>
                      </button>

                      <button
                        id="btn-quick-request-info"
                        onClick={() => handleGenerateQuickReply('request_info')}
                        disabled={isGeneratingReply}
                        className="px-3 py-1.5 rounded-xl bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Search className="w-3.5 h-3.5 text-amber-400" />
                        <span>Request Info</span>
                      </button>
                    </div>
                  </div>

                  {isGeneratingReply && (
                    <div className="p-4 text-center text-xs text-cyan-400 font-mono flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini is synthesizing zero-trust response...</span>
                    </div>
                  )}

                  {quickReplyDraft && !isGeneratingReply && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="text-cyan-300 font-semibold">
                          Drafted Response ({quickReplyType === 'request_info' ? 'Out-of-Band Verification' : 'Zero-Trust Safe Reply'})
                        </span>
                        <span className="text-amber-400">Tone: Forensic Safe</span>
                      </div>

                      <textarea
                        value={quickReplyDraft}
                        onChange={(e) => setQuickReplyDraft(e.target.value)}
                        rows={4}
                        className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-sans focus:outline-none focus:border-cyan-500 leading-relaxed shadow-inner"
                      />

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setQuickReplyDraft('');
                            setQuickReplyType(null);
                          }}
                          className="text-xs text-slate-400 hover:text-slate-200"
                        >
                          Discard
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyReply}
                            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                          >
                            {replyCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{replyCopied ? 'Copied!' : 'Copy Draft'}</span>
                          </button>

                          <button
                            onClick={handleSendSafeReply}
                            className="px-3.5 py-1.5 text-xs rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/15"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Dispatch via Gateway</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Forensic Metadata Strip: Clean summary bar, details closed by default unless analyst requests */}
                <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200">Security Verification:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            selectedEmail.securityRiskScore > 50 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}>
                            {selectedEmail.threatClassification} ({selectedEmail.securityRiskScore}/100)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          SPF: {(selectedEmail.forensics?.spfStatus || 'pass').toUpperCase()} • DKIM: {(selectedEmail.forensics?.dkimStatus || 'pass').toUpperCase()} • DMARC: {(selectedEmail.forensics?.dmarcStatus || 'pass').toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="btn-toggle-inline-security-details"
                        onClick={() => setShowInlineSecurity(!showInlineSecurity)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                        title={showInlineSecurity ? "Close detailed telemetry" : "View forensic origin details"}
                      >
                        {showInlineSecurity ? <X className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>{showInlineSecurity ? 'Close Details' : 'View Details'}</span>
                      </button>

                      <button
                        id="btn-open-side-security"
                        onClick={() => setIsSecurityDrawerOpen(!isSecurityDrawerOpen)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-colors border border-cyan-800"
                        title="Open Security Sidebar on right"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isSecurityDrawerOpen ? 'Close Side Security' : 'Open Side Security'}</span>
                      </button>

                      <button
                        id="btn-switch-full-forensics"
                        onClick={() => setPreviewMode('security')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                        title="Open Full Forensic Dossier"
                      >
                        <Microscope className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Full Forensics Tab</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable details when user clicks 'View Details' */}
                  {showInlineSecurity && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] font-mono">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">ORIGIN SENDER IP</span>
                          <span className="text-cyan-300 font-semibold">{selectedEmail.forensics?.senderIp || '209.85.220.41'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">INGRESS GATEWAY</span>
                          <span className="text-slate-200">{selectedEmail.sourceApp.toUpperCase()}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">ENCRYPTION CIPHER</span>
                          <span className="text-emerald-400">TLS 1.3 (ECDHE-RSA)</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">SECURITY STATUS</span>
                          <span className="text-cyan-400 capitalize">{selectedEmail.securityStatus}</span>
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setShowInlineSecurity(false)}
                          className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-800 transition-colors"
                        >
                          <X className="w-3 h-3 text-red-400" />
                          <span>Close Security Details</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Security Forensics & Threat Dossier Tab Mode with floating rounded cards and subtle vertical gaps */
              <div className="space-y-6 sm:space-y-8 p-5 sm:p-7 lg:p-8 max-w-5xl mx-auto w-full">
                
                {/* Prominent Close / Return to Message Header */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-md">
                  <button
                    id="btn-return-to-message-top"
                    onClick={() => setPreviewMode('message')}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-xs font-mono font-bold transition-all shadow-xs"
                    title="Close Security Dossier and return to email reading"
                  >
                    <ArrowLeft className="w-4 h-4 text-cyan-400" />
                    <span>← Close Security View & Return to Email</span>
                  </button>

                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    Forensic Dossier Active • Press ESC to close
                  </span>

                  <button
                    id="btn-close-forensics-tab"
                    onClick={() => setPreviewMode('message')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono transition-colors"
                    title="Close Forensics (ESC)"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close</span>
                  </button>
                </div>

                {/* Security Header Bar: Floating Rounded Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl border ${
                        selectedEmail.securityRiskScore > 65
                          ? 'bg-red-950/80 border-red-700 text-red-400'
                          : selectedEmail.securityRiskScore > 30
                          ? 'bg-amber-950/80 border-amber-700 text-amber-400'
                          : 'bg-emerald-950/80 border-emerald-700 text-emerald-400'
                      }`}>
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                            {selectedEmail.threatClassification.toUpperCase()} VERDICT
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Risk: {selectedEmail.securityRiskScore}/100
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Campaign: <strong className="text-cyan-400">{selectedEmail.attribution?.campaignName || 'Isolated Vector'}</strong> • Ingress: {selectedEmail.sourceApp.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        id="btn-simulate-sandbox-policy"
                        onClick={() => setIsPolicySimulatorOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800 transition-colors font-mono font-bold"
                        title="Test headers against security policies in sandbox"
                      >
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        <span>Simulate</span>
                      </button>

                      <button
                        onClick={() => setShowRawHeaders(!showRawHeaders)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 flex items-center gap-1.5"
                      >
                        <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{showRawHeaders ? 'Hide RFC Headers' : 'Raw Headers'}</span>
                      </button>

                      {selectedEmail.threatClassification === 'phishing' && (
                        <button
                          onClick={() => onBlockSender(selectedEmail.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-900 hover:bg-red-800 text-white font-mono text-xs flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Block Domain</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cryptographic Badges: SPF, DKIM, DMARC */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] flex items-center gap-1 ${
                      selectedEmail.forensics?.spfStatus === 'pass'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}>
                      SPF: {(selectedEmail.forensics?.spfStatus || 'none').toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] flex items-center gap-1 ${
                      selectedEmail.forensics?.dkimStatus === 'pass'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}>
                      DKIM: {(selectedEmail.forensics?.dkimStatus || 'none').toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] flex items-center gap-1 ${
                      selectedEmail.forensics?.dmarcStatus === 'pass'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}>
                      DMARC: {(selectedEmail.forensics?.dmarcStatus || 'none').toUpperCase()}
                    </span>
                    {selectedEmail.forensics?.returnPath && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Return-Path: <span className="text-slate-200">{selectedEmail.forensics.returnPath}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Threat Progression Timeline (Delivery -> Gateway Scanning -> User Interaction -> Campaign Correlation) */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
                  <CampaignThreatTimeline
                    emails={emails}
                    selectedEmail={selectedEmail}
                    selectedEmailId={selectedEmail.id}
                    onSelectEmail={onSelectEmail}
                  />
                </div>

                {/* Geographic Origin of Email Sender IP & Map Visualization */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
                  <SenderGeoOriginCard email={selectedEmail} />
                </div>

                {/* Prompt Injection Warning Banner */}
                {selectedEmail.promptInjectionDetected && (
                  <div className="p-5 rounded-2xl bg-amber-950/50 border border-amber-700/80 text-amber-200 text-xs space-y-2 shadow-md">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>MailGuard Anti-Prompt-Injection Shield Activated</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {selectedEmail.promptInjectionExplanation || 'An adversarial instruction payload attempting to override AI instructions was detected and neutralized.'}
                    </p>
                    <p className="text-[10px] font-mono text-amber-400">
                      🔒 Zero-Trust Protection: Payload content is rendered in read-only sandbox mode.
                    </p>
                  </div>
                )}

                {/* Raw Headers Drawer */}
                {showRawHeaders && (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        <FileCode2 className="w-3.5 h-3.5" /> RFC 5322 Ingestion Headers
                      </span>
                      <span>SHA-256: {selectedEmail.evidence?.sha256?.slice(0, 16)}...</span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60">
                      {selectedEmail.rawHeaders}
                    </pre>
                  </div>
                )}

                {/* Forensic Evidence Metadata Card */}
                {selectedEmail.evidence && (
                  <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-xs space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" /> Cryptographic Evidence Vault Record
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Evidence ID: {selectedEmail.evidence.evidenceId}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                      <p>SHA-256: <strong className="text-slate-200 break-all">{selectedEmail.evidence.sha256}</strong></p>
                      <p>Chain of Custody: <strong className="text-emerald-400">{selectedEmail.evidence.status}</strong></p>
                    </div>
                  </div>
                )}

                {/* Editable Analyst Notes & Case Log */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Analyst Investigation Notes
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {(selectedEmail.analystNotes || []).length} note{(selectedEmail.analystNotes || []).length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(selectedEmail.analystNotes || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No notes added to this incident yet.</p>
                    ) : (
                      selectedEmail.analystNotes!.map((nt, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                        >
                          <p className="text-slate-300 text-[11px] font-sans leading-relaxed">{nt}</p>
                          <button
                            onClick={() => handleDeleteNote(idx)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded"
                            title="Delete note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddAnalystNote} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Add forensic observation or telephone confirmation timestamp..."
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 text-xs rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Note</span>
                    </button>
                  </form>
                </div>

                {/* Bottom Return / Close Bar */}
                <div className="flex items-center justify-center pt-2 pb-4">
                  <button
                    id="btn-return-to-message-bottom"
                    onClick={() => setPreviewMode('message')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-xs font-mono font-bold transition-all shadow-md"
                  >
                    <ArrowLeft className="w-4 h-4 text-cyan-400" />
                    <span>← Close Security View & Return to Email</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating, Rounded-Corner Security Sidebar Card (creating whitespace and breathable feel) */}
      {isSecurityDrawerOpen && selectedEmail && (
        <>
          {/* Subtle Dimmed Backdrop for Focus on smaller screens */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs xl:hidden transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsSecurityDrawerOpen(false)}
          />
          <aside className="fixed xl:relative right-3 sm:right-6 xl:right-auto top-16 sm:top-20 xl:top-auto bottom-3 sm:bottom-6 xl:bottom-auto z-50 xl:z-auto w-[calc(100vw-1.5rem)] sm:w-[480px] md:w-[520px] lg:w-[560px] xl:w-[420px] 2xl:w-[460px] flex-shrink-0 flex flex-col rounded-2xl sm:rounded-3xl border border-slate-800/90 bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden h-full max-h-[calc(100vh-5.5rem)] xl:max-h-full animate-in slide-in-from-right-6 zoom-in-95 duration-200 ring-1 ring-white/10">
            {/* Floating Card Header */}
            <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">Security Forensics Sidebar</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Floating Threat Dossier</p>
                </div>
              </div>
              <button
                id="btn-close-security-sidebar"
                onClick={() => setIsSecurityDrawerOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-red-950/80 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-700/60 transition-all shadow-xs"
                title="Close Security Sidebar (ESC)"
              >
                <X className="w-3.5 h-3.5 text-red-400" />
                <span>Close</span>
              </button>
            </div>

            {/* Floating Card Content with rounded sub-cards and vertical whitespace */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
              {/* Quick Summary Floating Pill Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <span className="font-mono text-slate-400 text-[10px] block uppercase">Target Incident</span>
                  <span className="font-mono text-slate-200 truncate block font-medium">{selectedEmail.subject}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-xl font-mono font-bold text-[11px] flex-shrink-0 ${
                  selectedEmail.securityRiskScore > 50 
                    ? 'bg-red-950 text-red-300 border border-red-800' 
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  Risk: {selectedEmail.securityRiskScore}/100
                </span>
              </div>

              {/* Cryptographic Authentication Badges Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2.5 shadow-sm">
                <span className="font-mono text-cyan-400 font-bold block flex items-center gap-1.5 text-xs">
                  <Lock className="w-3.5 h-3.5" /> Authentication & Integrity
                </span>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                  <span className={`px-2 py-0.5 rounded ${selectedEmail.forensics?.spfStatus === 'pass' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                    SPF: {(selectedEmail.forensics?.spfStatus || 'pass').toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded ${selectedEmail.forensics?.dkimStatus === 'pass' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                    DKIM: {(selectedEmail.forensics?.dkimStatus || 'pass').toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded ${selectedEmail.forensics?.dmarcStatus === 'pass' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                    DMARC: {(selectedEmail.forensics?.dmarcStatus || 'pass').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Campaign Timeline with event nodes in the floating sidebar card */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden shadow-md">
                <CampaignThreatTimeline
                  emails={emails}
                  selectedEmail={selectedEmail}
                  selectedEmailId={selectedEmail.id}
                  onSelectEmail={onSelectEmail}
                />
              </div>

              {/* Geographic map in the floating sidebar card */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden shadow-md">
                <SenderGeoOriginCard email={selectedEmail} />
              </div>

              {/* Evidence record floating card */}
              {selectedEmail.evidence && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5 shadow-sm">
                  <span className="font-mono text-cyan-400 font-bold block flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Cryptographic Evidence Hash:
                  </span>
                  <span className="font-mono text-slate-300 break-all block text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800/60">{selectedEmail.evidence.sha256}</span>
                </div>
              )}

              {/* Actions Floating Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 shadow-sm">
                <span className="text-xs font-mono text-slate-400 block font-bold">Investigation Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsPolicySimulatorOpen(true)}
                    className="p-2.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Sandbox Test</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('security')}
                    className="p-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Microscope className="w-3.5 h-3.5" />
                    <span>Full Dossier</span>
                  </button>
                </div>
              </div>

              {/* Bottom Quick Close Button */}
              <div className="pt-1">
                <button
                  id="btn-bottom-close-security-sidebar"
                  onClick={() => setIsSecurityDrawerOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
                >
                  <X className="w-4 h-4 text-red-400" />
                  <span>Close Security Sidebar</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Security Analyst Sandbox Policy Simulator Modal */}
      {selectedEmail && (
        <PolicySimulatorModal
          isOpen={isPolicySimulatorOpen}
          onClose={() => setIsPolicySimulatorOpen(false)}
          email={selectedEmail}
          onApplyPolicy={handleApplySimulatedPolicy}
        />
      )}

    </div>
  );
};
