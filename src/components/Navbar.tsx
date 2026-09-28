import React from 'react';
import { 
  Shield, 
  Search, 
  Bell, 
  Sparkles, 
  Lock, 
  Terminal, 
  UserCheck, 
  LogOut, 
  AlertTriangle,
  FileCode2,
  Menu,
  History,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Mail
} from 'lucide-react';
import { SmartNotification, UserSession } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  notifications: SmartNotification[];
  onOpenNotifications: () => void;
  onOpenAI: () => void;
  onOpenIngest: () => void;
  onOpenAuditTrail: () => void;
  userSession: UserSession;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  onToggleMobileSidebar?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSyncGmail?: (fetchAll?: boolean) => void;
  isSyncingGmail?: boolean;
  syncProgress?: {
    percent: number;
    statusLabel: string;
    loaded: number;
    total: number;
  } | null;
  gmailSyncError?: {
    code: string;
    message: string;
    userFacingSuggestion: string;
    suggestsReauth: boolean;
  } | null;
  onReauthGoogle?: () => void;
  onOpenEnterprise?: () => void;
  onOpenInAppMicrosoft?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  notifications,
  onOpenNotifications,
  onOpenAI,
  onOpenIngest,
  onOpenAuditTrail,
  onOpenEnterprise,
  onOpenInAppMicrosoft,
  userSession,
  onLogout,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onToggleMobileSidebar,
  onToggleSidebar,
  isSidebarCollapsed,
  theme = 'dark',
  onToggleTheme,
  onSyncGmail,
  isSyncingGmail = false,
  syncProgress,
  gmailSyncError,
  onReauthGoogle,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-3 sm:px-4 md:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 select-none">
      {/* Left: Hamburger (Mobile) + Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Drawer Trigger */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Open Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title={isSidebarCollapsed ? "Open Sidebar" : "Close Sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}

        {/* Brand Home Button */}
        <button 
          id="btn-brand-home"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">MailGuard</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-semibold">FORENSICS</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden lg:block">Threat Detection & Attribution Platform</p>
          </div>
        </button>

        {/* Security Posture Pill */}
        <div className="hidden xl:flex items-center gap-2 ml-2 pl-3 border-l border-slate-800 text-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-mono text-[11px]">Gateway: <strong className="text-emerald-400 font-normal">Active Guard (Zero-Trust)</strong></span>
        </div>
      </div>

      {/* Center: Universal Natural Language Search */}
      <div className="flex-1 max-w-lg mx-2 sm:mx-4 hidden md:block">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            id="input-global-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages, tags, campaigns, or headers..."
            className="w-full pl-9 pr-16 py-1.5 text-xs bg-slate-950/70 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">↵</kbd>
          </div>
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Suggest Re-authentication when Gmail OAuth fails */}
        {gmailSyncError?.suggestsReauth && onReauthGoogle && (
          <button
            id="btn-nav-reauth-gmail"
            onClick={onReauthGoogle}
            title={`${gmailSyncError.message} - ${gmailSyncError.userFacingSuggestion}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-amber-950/90 hover:bg-amber-900 text-amber-200 border border-amber-500/80 transition-all font-semibold shadow-xs animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="hidden sm:inline">Re-auth Gmail</span>
          </button>
        )}

        {/* Sync Live Gmail button with progress percentage & batch status */}
        {onSyncGmail && (
          <button
            id="btn-nav-sync-gmail"
            onClick={() => onSyncGmail(true)}
            disabled={isSyncingGmail}
            title={isSyncingGmail ? (syncProgress?.statusLabel || 'Syncing Gmail messages in pages...') : "Sync all live Gmail messages (Google Workspace / OAuth)"}
            className={`relative overflow-hidden flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-all font-semibold shadow-xs ${
              isSyncingGmail
                ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/80 cursor-wait'
                : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 hover:border-emerald-500'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingGmail ? 'animate-spin' : ''}`} />
            <span className="inline font-mono">
              {isSyncingGmail 
                ? (syncProgress?.percent ? `Syncing ${syncProgress.percent}%` : (syncProgress?.statusLabel || 'Syncing...'))
                : 'Sync Live Gmail'
              }
            </span>
            {isSyncingGmail && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-950/80">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(6, syncProgress?.percent || 15)}%` }}
                />
              </div>
            )}
          </button>
        )}

        {/* Quick Ingest / RFC 5322 Ingestion */}
        <button
          id="btn-nav-ingest"
          onClick={onOpenIngest}
          title="Ingest RFC 5322 raw email or test payload"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Ingest RFC</span>
        </button>

        {/* Use In-App Microsoft Account Button */}
        {onOpenInAppMicrosoft && (
          <button
            id="btn-nav-inapp-microsoft"
            onClick={onOpenInAppMicrosoft}
            title={userSession.email?.includes('outlook') || userSession.email?.includes('microsoft') || userSession.activeSource === 'm365' || userSession.activeSource === 'outlook'
              ? `In-App Microsoft Account active (${userSession.email}) - Click to switch/sync`
              : "Use In-App Microsoft Account (Outlook & M365)"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-all font-medium border shadow-xs ${
              userSession.email?.includes('outlook') || userSession.email?.includes('microsoft') || userSession.activeSource === 'm365' || userSession.activeSource === 'outlook'
                ? 'bg-blue-950/80 text-blue-300 border-blue-600/80 ring-1 ring-blue-500/30'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-blue-500/60'
            }`}
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span className="hidden sm:inline font-mono">
              {userSession.email?.includes('outlook') || userSession.email?.includes('microsoft') || userSession.activeSource === 'm365' || userSession.activeSource === 'outlook'
                ? 'In-App Microsoft'
                : 'Use In-App Microsoft'}
            </span>
          </button>
        )}

        {/* Connect M365 / Corporate */}
        {onOpenEnterprise && (
          <button
            id="btn-nav-connect-enterprise"
            onClick={onOpenEnterprise}
            title="Connect Microsoft 365 / Corporate Mailbox"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 hover:border-cyan-600 transition-colors font-medium"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>Connect M365</span>
          </button>
        )}

        {/* Action Audit Trail Trigger */}
        <button
          id="btn-nav-audit-trail"
          onClick={onOpenAuditTrail}
          title="Open Action Audit Trail (Forensic Logs)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/50 transition-colors"
        >
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline font-mono text-[11px]">Audit Trail</span>
        </button>

        {/* AI Assistant Quick Trigger */}
        <button
          id="btn-nav-ai-assistant"
          onClick={onOpenAI}
          title="Open MailGuard AI Assistant"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-medium hidden lg:inline">MailGuard AI</span>
        </button>

        {/* Theme Toggle Button (Light Audit Mode vs Forensic Dark) */}
        {onToggleTheme && (
          <button
            id="btn-nav-theme-toggle"
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={theme === 'light' ? 'Switch to Forensic Dark Mode' : 'Switch to Light Audit Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-cyan-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        )}

        {/* Notifications Button with Live Badge */}
        <button
          id="btn-nav-notifications"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile / Relog */}
        <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-800">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 text-xs font-bold">
            AV
          </div>
          <div className="hidden 2xl:block text-left text-xs">
            <p className="font-medium text-slate-200 leading-tight">{userSession.name}</p>
            <p className="text-[10px] text-slate-400 font-mono leading-tight">{userSession.role.split(' ')[0]} SOC</p>
          </div>
          <button
            id="btn-nav-logout"
            onClick={onLogout}
            title="Switch Session / Relog"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
