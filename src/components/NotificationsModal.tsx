import React from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Star, 
  CheckCircle2, 
  ExternalLink,
  Trash2,
  ArrowRight,
  Check
} from 'lucide-react';
import { SmartNotification, EmailItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SmartNotification[];
  emails: EmailItem[];
  onSelectEmail: (email: EmailItem) => void;
  onNavigateToView?: (view: string, filter?: string) => void;
  onClearAll: () => void;
  onDismissNotification?: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  emails,
  onSelectEmail,
  onNavigateToView,
  onClearAll,
  onDismissNotification,
}) => {
  if (!isOpen) return null;

  const handleNotificationClick = (notif: SmartNotification) => {
    if (notif.emailId) {
      const targetEmail = emails.find((e) => e.id === notif.emailId);
      if (targetEmail) {
        onSelectEmail(targetEmail);
        onClose();
        return;
      }
    }

    if (notif.category === 'phishing' || notif.category === 'threat') {
      onNavigateToView?.('security', 'phishing');
      onClose();
      return;
    }

    if (notif.category === 'important') {
      onNavigateToView?.('mail', 'important');
      onClose();
      return;
    }

    // Default fallback
    onNavigateToView?.('mail', 'all');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Smart Incident Notifications</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {notifications.length} Total Alert{notifications.length === 1 ? '' : 's'} • Click any item to navigate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 font-mono"
                title="Clear all alerts"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
          {notifications.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">All incident notifications cleared</p>
              <p className="text-[11px] text-slate-500">Zero unhandled alerts in the pipeline.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const email = emails.find((e) => e.id === notif.emailId);
              const isCritical = notif.severity === 'critical';
              const isHigh = notif.severity === 'high';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className="pt-2.5 first:pt-0 group cursor-pointer"
                >
                  <div className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          isCritical ? 'bg-red-950 text-red-400 border border-red-800' :
                          isHigh ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}>
                          {notif.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">#{notif.category}</span>
                        {email && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            ID: {email.id}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500">{notif.timestamp}</span>
                        {onDismissNotification && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismissNotification(notif.id);
                            }}
                            className="text-slate-600 hover:text-slate-300 p-0.5 rounded"
                            title="Dismiss"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                      <span className="text-[10px] text-slate-500">
                        {email ? `From: ${email.fromName}` : 'System Telemetry Alert'}
                      </span>
                      <span className="flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>{notif.actionLabel || (email ? 'Inspect Forensic Artifact' : 'View Target')}</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
