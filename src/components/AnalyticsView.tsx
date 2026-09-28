import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Globe2, 
  ShieldAlert, 
  Star, 
  Landmark, 
  Coins, 
  Building2, 
  Users2, 
  Briefcase, 
  FileText, 
  Flame,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { INITIAL_ANALYTICS } from '../data/mockEmails';
import { AnalyticsData, EmailItem } from '../types';
import { GlobalThreatHeatmap } from './GlobalThreatHeatmap';

interface AnalyticsViewProps {
  emails?: EmailItem[];
  onNavigateToMailWithFilter?: (category?: string, country?: string) => void;
  onNavigateToThreats?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  emails = [],
  onNavigateToMailWithFilter,
  onNavigateToThreats,
}) => {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');

  const data: AnalyticsData = INITIAL_ANALYTICS[timeframe];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">AI Threat & Mailbox Analytics</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 font-semibold">
                NEURAL TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-dimensional analysis across Daily, Weekly, and Monthly intelligence windows.
            </p>
          </div>
        </div>

        {/* Timeframe Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          {[
            { id: 'today', label: 'Daily (Today)' },
            { id: 'week', label: 'Weekly' },
            { id: 'month', label: 'Monthly' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id as any)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
                timeframe === t.id
                  ? 'bg-violet-950 text-violet-300 border border-violet-800 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Intelligence Narrative Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-900/80 to-slate-900/80 border border-violet-800/40 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              AI Forensic Narrative Summary ({(timeframe || '24h').toUpperCase()})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Model: Gemini 3.8 Flash</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {data.aiTrendNarrative}
        </p>
      </div>

      {/* Primary KPI Metric Cards (Navigatable) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateToMailWithFilter?.('all')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Total Messages</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-white font-mono mt-1">{data.received}</p>
          <p className="text-[10px] text-slate-500 mt-1">RFC 5322 Ingestion • Click to explore</p>
        </div>

        <div 
          onClick={() => onNavigateToThreats ? onNavigateToThreats() : onNavigateToMailWithFilter?.(undefined, undefined)}
          className="p-4 rounded-xl bg-slate-900/70 border border-red-900/40 hover:border-red-600/60 cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-red-400 uppercase">Threats Intercepted</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-red-400 font-mono mt-1">{data.phishing + data.suspicious}</p>
          <p className="text-[10px] text-red-300/70 mt-1">{data.phishing} Phishing • {data.quarantined} Quarantined</p>
        </div>

        <div 
          onClick={() => onNavigateToMailWithFilter?.('important')}
          className="p-4 rounded-xl bg-slate-900/70 border border-amber-900/40 hover:border-amber-600/60 cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-400 uppercase">Priority Mail</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-amber-300 font-mono mt-1">{data.important}</p>
          <p className="text-[10px] text-amber-400/70 mt-1">Banking, Loans, Staff</p>
        </div>

        <div 
          onClick={() => onNavigateToMailWithFilter?.('all')}
          className="p-4 rounded-xl bg-slate-900/70 border border-purple-900/40 hover:border-purple-600/60 cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-purple-400 uppercase">Spam Blocked</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-purple-300 font-mono mt-1">{data.spam + data.blocked}</p>
          <p className="text-[10px] text-purple-400/70 mt-1">Junk & Firewall Drops</p>
        </div>
      </div>

      {/* Interactive Global Threat Origin Heatmap */}
      <GlobalThreatHeatmap
        emails={emails}
        onSelectCountryFilter={(country) => onNavigateToMailWithFilter?.(undefined, country)}
        onNavigateToThreats={onNavigateToThreats}
      />

      {/* Category Breakdown & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Important Email Categories Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            Category Distribution & Inflow
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Banking & Financial', key: 'banking', color: 'bg-emerald-500', icon: Landmark },
              { label: 'Loans & Mortgage', key: 'loans', color: 'bg-amber-500', icon: Coins },
              { label: 'Companies & Invoices', key: 'companies', color: 'bg-blue-500', icon: Building2 },
              { label: 'Staff & Internal SOC', key: 'staff', color: 'bg-indigo-500', icon: Briefcase },
              { label: 'Family & Personal', key: 'family', color: 'bg-pink-500', icon: Users2 },
              { label: 'Documents & Contracts', key: 'documents', color: 'bg-teal-500', icon: FileText },
              { label: 'Subscriptions & Services', key: 'subscriptions', color: 'bg-orange-500', icon: Flame },
            ].map((cat, idx) => {
              const Icon = cat.icon;
              const count = data.categoryDistribution[cat.key] || 0;
              const counts = Object.values(data.categoryDistribution) as number[];
              const maxCount = counts.length > 0 ? Math.max(...counts) : 1;
              const percent = Math.min(100, (count / maxCount) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-200">{cat.label}</span>
                    </div>
                    <span className="font-mono text-slate-300 font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div 
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Targeted Brands & Origin Hotspots */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            Threat Origins & Infrastructure Hotspots
          </h3>

          <div className="space-y-3">
            {data.topThreatCountries.map((orig, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-200">{orig.country}</p>
                  <p className="text-[11px] font-mono text-slate-400">Geo Code: {orig.code} • Lat: {orig.lat}, Lng: {orig.lng}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-red-400 text-sm">{orig.count}</span>
                  <p className="text-[10px] text-slate-500 font-mono">relays flagged</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 italic">
              ⚖️ Geographic data reflects edge SMTP relay / proxy network topology.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
