import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Star, 
  ShieldAlert, 
  Microscope, 
  BarChart3, 
  Bot, 
  Settings, 
  Bell, 
  Landmark, 
  Coins, 
  Users2, 
  Building2, 
  Briefcase, 
  FileText, 
  GraduationCap, 
  Flame, 
  ShoppingBag, 
  Lock, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  History,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { EmailItem } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedSecurityStatus: string;
  onSelectSecurityStatus: (status: string) => void;
  emails: EmailItem[];
  unreadNotifsCount: number;
  onOpenFriendlyGuide?: () => void;
  onOpenAuditTrail?: () => void;
  onOpenEnterprise?: () => void;
  onOpenInAppMicrosoft?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  selectedCategory,
  onSelectCategory,
  selectedSecurityStatus,
  onSelectSecurityStatus,
  emails,
  unreadNotifsCount,
  onOpenFriendlyGuide,
  onOpenAuditTrail,
  onOpenEnterprise,
  onOpenInAppMicrosoft,
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile
}) => {
  const [categoriesOpen, setCategoriesOpen] = React.useState(true);
  const [securityOpen, setSecurityOpen] = React.useState(false);

  // Threat & Priority Counts
  const threatCount = (emails || []).filter((e) => e && ((e.securityRiskScore ?? 0) > 65 || e.threatClassification !== 'legitimate')).length;
  const phishingCount = (emails || []).filter((e) => e && e.threatClassification === 'phishing').length;
  const fraudCount = (emails || []).filter((e) => e && e.threatClassification === 'fraud').length;
  const suspiciousCount = (emails || []).filter((e) => e && e.threatClassification === 'suspicious').length;
  const spamCount = (emails || []).filter((e) => e && e.securityStatus === 'spam').length;
  const quarantinedCount = (emails || []).filter((e) => e && e.securityStatus === 'quarantined').length;
  const blockedCount = (emails || []).filter((e) => e && e.securityStatus === 'blocked').length;
  const importantCount = (emails || []).filter((e) => e && (e.importanceScore ?? 0) >= 80).length;

  const getCategoryCount = (cat: string) => {
    return (emails || []).filter((e) => e && e.category === cat).length;
  };

  const navItemClass = (active: boolean) => 
    `flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} w-full py-2 rounded-lg text-xs font-medium transition-all ${
      active 
        ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 shadow-sm font-semibold' 
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;

  const handleNavClick = (callback: () => void) => {
    callback();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className={`p-3 space-y-6 ${isCollapsed ? 'items-center' : ''}`}>
      {/* Sidebar Header with Open/Close Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold">
              Navigation
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              v2.4
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 w-full justify-between sm:justify-end">
          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Desktop Collapse / Expand Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors mx-auto"
              title={isCollapsed ? "Expand Sidebar (Open)" : "Collapse Sidebar (Close)"}
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Core Mission Navigation */}
      <div className="space-y-1">
        {!isCollapsed && (
          <p className="px-3 text-[11px] font-mono tracking-wider text-slate-500 uppercase">Mission Center</p>
        )}
        
        <button
          id="nav-btn-dashboard"
          onClick={() => handleNavClick(() => {
            onNavigate('dashboard');
            onSelectCategory('all');
            onSelectSecurityStatus('all');
          })}
          className={navItemClass(currentView === 'dashboard')}
          title="Live Threat Dashboard"
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Live</span>
          )}
        </button>

        <button
          id="nav-btn-inbox"
          onClick={() => handleNavClick(() => {
            onNavigate('mail');
            onSelectCategory('all');
            onSelectSecurityStatus('all');
          })}
          className={navItemClass(currentView === 'mail' && selectedCategory === 'all' && selectedSecurityStatus === 'all')}
          title={`Inbox (${emails.length} items)`}
        >
          <div className="flex items-center gap-2.5">
            <Inbox className="w-4 h-4 text-blue-400 flex-shrink-0" />
            {!isCollapsed && <span>Inbox</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {emails.length}
            </span>
          )}
        </button>

        <button
          id="nav-btn-important"
          onClick={() => handleNavClick(() => {
            onNavigate('mail');
            onSelectCategory('important');
          })}
          className={navItemClass(currentView === 'mail' && selectedCategory === 'important')}
          title={`Priority Mail (${importantCount})`}
        >
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/20 flex-shrink-0" />
            {!isCollapsed && <span>Important Mail</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              {importantCount}
            </span>
          )}
        </button>
      </div>

      {/* Security & Threat Center */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3">
          {!isCollapsed && (
            <p className="text-[11px] font-mono tracking-wider text-slate-500 uppercase">Forensic Gate</p>
          )}
          {!isCollapsed && (
            <button 
              onClick={() => setSecurityOpen(!securityOpen)}
              className="text-slate-500 hover:text-slate-300"
            >
              {securityOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
        </div>

        <button
          id="nav-btn-security-overview"
          onClick={() => handleNavClick(() => {
            onNavigate('security');
            onSelectSecurityStatus('all');
          })}
          className={navItemClass(currentView === 'security' && selectedSecurityStatus === 'all')}
          title={`Threat Center (${threatCount} detections)`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
            {!isCollapsed && <span>Threat Center</span>}
          </div>
          {!isCollapsed && threatCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold animate-pulse">
              {threatCount}
            </span>
          )}
        </button>

        {(!isCollapsed ? securityOpen : false) && (
          <div className="space-y-0.5 pl-3 border-l border-slate-800 ml-3 mt-1">
            <button
              onClick={() => handleNavClick(() => {
                onNavigate('security');
                onSelectSecurityStatus('phishing');
              })}
              className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                currentView === 'security' && selectedSecurityStatus === 'phishing'
                  ? 'bg-red-950/60 text-red-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Phishing Infiltrations</span>
              <span className="text-[10px] font-mono text-red-400">{phishingCount}</span>
            </button>

            <button
              onClick={() => handleNavClick(() => {
                onNavigate('security');
                onSelectSecurityStatus('fraud');
              })}
              className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                currentView === 'security' && selectedSecurityStatus === 'fraud'
                  ? 'bg-amber-950/60 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Financial Wire Fraud</span>
              <span className="text-[10px] font-mono text-amber-400">{fraudCount}</span>
            </button>

            <button
              onClick={() => handleNavClick(() => {
                onNavigate('security');
                onSelectSecurityStatus('suspicious');
              })}
              className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                currentView === 'security' && selectedSecurityStatus === 'suspicious'
                  ? 'bg-yellow-950/60 text-yellow-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Suspicious Relays</span>
              <span className="text-[10px] font-mono text-yellow-400">{suspiciousCount}</span>
            </button>

            <button
              onClick={() => handleNavClick(() => {
                onNavigate('security');
                onSelectSecurityStatus('quarantined');
              })}
              className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                currentView === 'security' && selectedSecurityStatus === 'quarantined'
                  ? 'bg-purple-950/60 text-purple-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Quarantined Vault</span>
              <span className="text-[10px] font-mono text-purple-400">{quarantinedCount}</span>
            </button>

            <button
              onClick={() => handleNavClick(() => {
                onNavigate('security');
                onSelectSecurityStatus('blocked');
              })}
              className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                currentView === 'security' && selectedSecurityStatus === 'blocked'
                  ? 'bg-slate-800 text-slate-200 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Perimeter Firewall Drops</span>
              <span className="text-[10px] font-mono text-slate-400">{blockedCount}</span>
            </button>
          </div>
        )}

        {/* Forensic Case Investigation */}
        <button
          id="nav-btn-investigation"
          onClick={() => handleNavClick(() => onNavigate('investigation'))}
          className={navItemClass(currentView === 'investigation')}
          title="Forensic Cases & Evidence"
        >
          <div className="flex items-center gap-2.5">
            <Microscope className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            {!isCollapsed && <span>Forensic Cases</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Evidence
            </span>
          )}
        </button>

        {/* Threat & Geographic Analytics */}
        <button
          id="nav-btn-analytics"
          onClick={() => handleNavClick(() => onNavigate('analytics'))}
          className={navItemClass(currentView === 'analytics')}
          title="Telemetry & Global Heatmap"
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-4 h-4 text-violet-400 flex-shrink-0" />
            {!isCollapsed && <span>Threat Analytics</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
              Heatmap
            </span>
          )}
        </button>

        {/* Action Audit Trail (Audit Log Modal) */}
        {onOpenAuditTrail && (
          <button
            id="nav-btn-audit-trail"
            onClick={() => handleNavClick(onOpenAuditTrail)}
            className={navItemClass(false)}
            title="Action Audit Trail Logs"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              {!isCollapsed && <span>Action Audit Trail</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                Log
              </span>
            )}
          </button>
        )}

        {/* MailGuard AI Assistant */}
        <button
          id="nav-btn-ai"
          onClick={() => handleNavClick(() => onNavigate('ai'))}
          className={navItemClass(currentView === 'ai')}
          title="MailGuard Neural Copilot"
        >
          <div className="flex items-center gap-2.5">
            <Bot className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            {!isCollapsed && <span>MailGuard AI</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Copilot
            </span>
          )}
        </button>
      </div>

      {/* Structured Category Folders */}
      {!isCollapsed && (
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3">
            <p className="text-[11px] font-mono tracking-wider text-slate-500 uppercase">Mail Inflow Categories</p>
            <button 
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="text-slate-500 hover:text-slate-300"
            >
              {categoriesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>

          {categoriesOpen && (
            <div className="space-y-0.5 pt-1 pl-1">
              {[
                { id: 'banking', label: 'Banking', icon: Landmark, color: 'text-emerald-400' },
                { id: 'loans', label: 'Loans & EMI', icon: Coins, color: 'text-amber-400' },
                { id: 'family', label: 'Family & Personal', icon: Users2, color: 'text-pink-400' },
                { id: 'companies', label: 'Companies & Jobs', icon: Building2, color: 'text-blue-400' },
                { id: 'staff', label: 'Staff & Internal', icon: Briefcase, color: 'text-indigo-400' },
                { id: 'documents', label: 'Documents & Legal', icon: FileText, color: 'text-teal-400' },
                { id: 'education', label: 'Education', icon: GraduationCap, color: 'text-sky-400' },
                { id: 'subscriptions', label: 'Subscriptions', icon: Flame, color: 'text-orange-400' },
                { id: 'purchases', label: 'Purchases', icon: ShoppingBag, color: 'text-lime-400' },
                { id: 'security', label: 'Security & Auth', icon: Lock, color: 'text-red-400' },
              ].map((cat) => {
                const Icon = cat.icon;
                const count = getCategoryCount(cat.id);
                const isSelected = currentView === 'mail' && selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    id={`nav-cat-${cat.id}`}
                    onClick={() => handleNavClick(() => {
                      onNavigate('mail');
                      onSelectCategory(cat.id);
                    })}
                    className={navItemClass(isSelected)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${cat.color} flex-shrink-0`} />
                      <span>{cat.label}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* System Settings & Compliance */}
      <div className="pt-2 border-t border-slate-800/80 space-y-1">
        <button
          id="nav-btn-notifications"
          onClick={() => handleNavClick(() => onNavigate('notifications'))}
          className={navItemClass(currentView === 'notifications')}
          title={`Smart Alerts (${unreadNotifsCount} unread)`}
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {!isCollapsed && <span>Smart Alerts</span>}
          </div>
          {unreadNotifsCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-red-500 text-white">
              {unreadNotifsCount}
            </span>
          )}
        </button>

        <button
          id="nav-btn-settings"
          onClick={() => handleNavClick(() => onNavigate('settings'))}
          className={navItemClass(currentView === 'settings')}
          title="Privacy & Safeguards"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {!isCollapsed && <span>Privacy & Safeguards</span>}
          </div>
        </button>

        {onOpenInAppMicrosoft && (
          <button
            id="nav-btn-inapp-microsoft"
            onClick={() => handleNavClick(onOpenInAppMicrosoft)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-blue-300 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/60 transition-colors"
            title="Use In-App Microsoft Account (Outlook & M365)"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              {!isCollapsed && <span>In-App Microsoft</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900 text-blue-200">
                Live
              </span>
            )}
          </button>
        )}

        {onOpenEnterprise && (
          <button
            id="nav-btn-connect-enterprise"
            onClick={() => handleNavClick(onOpenEnterprise)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 transition-colors"
            title="Connect Microsoft 365 & Corporate Exchange Mailbox"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              {!isCollapsed && <span>Connect M365 / Corp</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-200">
                Sync
              </span>
            )}
          </button>
        )}

        {onOpenFriendlyGuide && !isCollapsed && (
          <button
            id="nav-btn-friendly-guide"
            onClick={() => handleNavClick(onOpenFriendlyGuide)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Friendly Guide</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-200">
              Help
            </span>
          </button>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar with Open/Close Width Transition */}
      <aside 
        className={`hidden md:flex flex-col flex-shrink-0 bg-slate-900/60 border-r border-slate-800 h-[calc(100vh-4rem)] overflow-y-auto select-none transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer */}
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
