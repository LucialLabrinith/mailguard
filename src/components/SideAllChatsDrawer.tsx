import React, { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Clock, 
  Search, 
  ChevronRight, 
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';
import { ChatHistorySession } from '../types';

interface SideAllChatsDrawerProps {
  sessions: ChatHistorySession[];
  activeSessionId: string;
  onSelectSession: (session: ChatHistorySession) => void;
  onCreateNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  onToggleOpen?: () => void;
  title?: string;
  className?: string;
}

export const SideAllChatsDrawer: React.FC<SideAllChatsDrawerProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
  isOpen,
  onToggleOpen,
  title = 'Side All Chats',
  className = '',
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.previewSnippet.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className={`w-72 sm:w-80 flex flex-col bg-slate-950 border-r border-slate-800 text-slate-200 select-none ${className}`}>
      
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              {title}
            </h4>
            <p className="text-[10px] text-slate-400">
              {sessions.length} archived conversation{sessions.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onCreateNewSession}
          className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1 shadow-sm transition-all"
          title="Start fresh conversation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search past chats..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>
      </div>

      {/* Chat Session List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            <MessageSquare className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
            <p>No chat history found.</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-sm ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-xs font-bold truncate flex-1 block">
                    {session.title}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-opacity"
                    title="Delete session"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {session.previewSnippet || 'Empty discussion thread...'}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {session.createdAt}
                  </span>

                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {session.messageCount || session.messages?.length || 0} msgs
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
