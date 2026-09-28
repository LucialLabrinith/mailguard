import React, { useState } from 'react';
import {
  X,
  History,
  ShieldAlert,
  Search,
  Download,
  Filter,
  Edit3,
  Check,
  Plus,
  Ban,
  Lock,
  Unlock,
  FileCode2,
  Briefcase,
  Sparkles,
  ExternalLink,
  Tag,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';
import { ActionAuditEntry, EmailItem } from '../types';

interface ActionAuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: ActionAuditEntry[];
  onUpdateLogNotes: (logId: string, notes: string) => void;
  onAddAuditLog: (entry: Omit<ActionAuditEntry, 'id' | 'timestamp'>) => void;
  onNavigateToEmail?: (emailId: string) => void;
  onNavigateToCase?: (caseId: string) => void;
  currentUser?: string;
  currentRole?: string;
}

export const ActionAuditTrailModal: React.FC<ActionAuditTrailModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  onUpdateLogNotes,
  onAddAuditLog,
  onNavigateToEmail,
  onNavigateToCase,
  currentUser = 'Agent Vance',
  currentRole = 'Senior Cyber Forensic Analyst',
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editNotesText, setEditNotesText] = useState('');
  const [isAddingLog, setIsAddingLog] = useState(false);

  // New log form state
  const [newAction, setNewAction] = useState('Manual Security Review');
  const [newTargetTitle, setNewTargetTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState<'critical' | 'high' | 'medium' | 'low' | 'info'>('medium');
  const [newCategory, setNewCategory] = useState<'quarantine' | 'block' | 'release' | 'ingest' | 'case' | 'tag' | 'quick_reply' | 'bulk'>('case');
  const [newNotes, setNewNotes] = useState('');

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter((log) => {
    if (filterCategory !== 'all' && log.category !== filterCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        log.id.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.targetTitle.toLowerCase().includes(q) ||
        log.operator.toLowerCase().includes(q) ||
        (log.notes && log.notes.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleStartEdit = (log: ActionAuditEntry) => {
    setEditingLogId(log.id);
    setEditNotesText(log.notes || '');
  };

  const handleSaveEdit = (logId: string) => {
    onUpdateLogNotes(logId, editNotesText);
    setEditingLogId(null);
  };

  const handleCreateNewLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetTitle.trim()) return;

    onAddAuditLog({
      action: newAction,
      targetTitle: newTargetTitle.trim(),
      operator: currentUser,
      role: currentRole,
      severity: newSeverity,
      category: newCategory,
      notes: newNotes.trim() || 'Manual audit observation documented by analyst.',
    });

    setNewTargetTitle('');
    setNewNotes('');
    setIsAddingLog(false);
  };

  const handleExportCSV = () => {
    const headers = ['Log_ID', 'Action', 'Target_Title', 'Target_ID', 'Timestamp', 'Operator', 'Role', 'Severity', 'Category', 'Notes'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.targetTitle.replace(/"/g, '""')}"`,
      `"${l.targetId || ''}"`,
      `"${l.timestamp}"`,
      `"${l.operator.replace(/"/g, '""')}"`,
      `"${l.role.replace(/"/g, '""')}"`,
      `"${l.severity}"`,
      `"${l.category}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MailGuard_Action_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-audit-trail"
        className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Security Action Audit Trail</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Forensic Chain of Custody
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Immutable chronological log of all operator actions, quarantines, blocks, and manual audit observations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Export filtered log entries to CSV for compliance audits"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => setIsAddingLog(!isAddingLog)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingLog ? 'Cancel' : 'Add Audit Entry'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Manual Audit Log Form */}
        {isAddingLog && (
          <form onSubmit={handleCreateNewLog} className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Document Manual Security Action / SOC Note
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Logged By: {currentUser} ({currentRole})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Action Type</label>
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="e.g. Host Isolation, Out-of-Band Call"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Description / Identifier</label>
                <input
                  type="text"
                  value={newTargetTitle}
                  onChange={(e) => setNewTargetTitle(e.target.value)}
                  placeholder="e.g. Isolated executive laptop from VLAN 4, called CFO office"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Severity & Dept</label>
                <div className="flex gap-2">
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="case">Case</option>
                    <option value="quarantine">Quarantine</option>
                    <option value="block">Block</option>
                    <option value="tag">Tag</option>
                    <option value="quick_reply">Quick Reply</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Forensic Investigation Notes</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={2}
                placeholder="Document detailed findings, telephone confirmation timestamps, or compliance justifications..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingLog(false)}
                className="px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Commit to Audit Trail
              </button>
            </div>
          </form>
        )}

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Actions' },
              { id: 'quarantine', label: 'Quarantines' },
              { id: 'block', label: 'Blocks' },
              { id: 'release', label: 'Releases' },
              { id: 'case', label: 'Case Ops' },
              { id: 'bulk', label: 'Bulk Batch' },
              { id: 'quick_reply', label: 'Quick Replies' },
              { id: 'ingest', label: 'Ingestions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterCategory === tab.id
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Log Stream List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No action audit entries match the current filter.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isEditing = editingLogId === log.id;

              return (
                <div
                  key={log.id}
                  id={`audit-entry-${log.id}`}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`p-1.5 rounded-lg text-xs ${
                        log.category === 'quarantine' ? 'bg-purple-500/10 text-purple-400 border border-purple-800/60' :
                        log.category === 'block' ? 'bg-red-500/10 text-red-400 border border-red-800/60' :
                        log.category === 'case' ? 'bg-blue-500/10 text-blue-400 border border-blue-800/60' :
                        log.category === 'quick_reply' ? 'bg-amber-500/10 text-amber-400 border border-amber-800/60' :
                        'bg-cyan-500/10 text-cyan-400 border border-cyan-800/60'
                      }`}>
                        {log.category === 'quarantine' && <Lock className="w-4 h-4" />}
                        {log.category === 'block' && <Ban className="w-4 h-4" />}
                        {log.category === 'release' && <Unlock className="w-4 h-4" />}
                        {log.category === 'case' && <Briefcase className="w-4 h-4" />}
                        {log.category === 'quick_reply' && <Sparkles className="w-4 h-4" />}
                        {log.category === 'ingest' && <FileCode2 className="w-4 h-4" />}
                        {log.category === 'tag' && <Tag className="w-4 h-4" />}
                        {log.category === 'bulk' && <ShieldCheck className="w-4 h-4" />}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">{log.action}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                            log.severity === 'critical' ? 'bg-red-950 text-red-400 border border-red-800' :
                            log.severity === 'high' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                            log.severity === 'medium' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {log.severity}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">ID: {log.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {log.timestamp}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        {log.operator}
                      </span>
                    </div>
                  </div>

                  {/* Target Title & Navigatable Link */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/40">
                    <p className="text-slate-300 font-medium">
                      Target: <span className="text-slate-100">{log.targetTitle}</span>
                    </p>

                    {log.targetId && (
                      <div className="flex items-center gap-2">
                        {log.targetId.startsWith('em-') && onNavigateToEmail && (
                          <button
                            onClick={() => {
                              onNavigateToEmail(log.targetId!);
                              onClose();
                            }}
                            className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <span>Inspect Email</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        {log.targetId.startsWith('INC-') && onNavigateToCase && (
                          <button
                            onClick={() => {
                              onNavigateToCase(log.targetId!);
                              onClose();
                            }}
                            className="text-[11px] font-mono text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <span>Open Case</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Forensic Notes Section (Editable Logs) */}
                  <div className="pt-2">
                    {isEditing ? (
                      <div className="space-y-2 bg-slate-900 p-3 rounded-lg border border-cyan-500/40">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-cyan-400 font-bold">
                            Edit Forensic Note & Audit Observations
                          </span>
                          <span className="text-[10px] text-slate-400">Department SOC Segregation</span>
                        </div>
                        <textarea
                          value={editNotesText}
                          onChange={(e) => setEditNotesText(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingLogId(null)}
                            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(log.id)}
                            className="px-2.5 py-1 text-xs rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save Note</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3 bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800/50 group">
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">
                          <strong className="text-slate-300 font-mono text-[11px]">Audit Notes: </strong>
                          {log.notes || 'No custom analyst annotations attached.'}
                        </p>
                        <button
                          onClick={() => handleStartEdit(log)}
                          className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          title="Edit audit observations"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Log</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Metadata Tags if any */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                      {Object.entries(log.metadata).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                        >
                          {key}: <strong className="text-slate-300">{String(value)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredLogs.length} audit entries • Compliant with SOC2 Trust Criteria</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
