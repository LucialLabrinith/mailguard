import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Filter, 
  Globe, 
  Zap, 
  Flame, 
  Radio, 
  Layers, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Search, 
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import * as d3 from 'd3';
import { EmailItem } from '../types';

interface ThreatCorrelationChartProps {
  emails: EmailItem[];
  onSelectEmail?: (email: EmailItem) => void;
  onNavigate?: (view: string) => void;
  className?: string;
}

interface DomainCorrelationGroup {
  domain: string;
  count: number;
  threatCount: number;
  avgRiskScore: number;
  maxRiskScore: number;
  earliestDate: Date;
  latestDate: Date;
  color: string;
  campaignPattern?: string;
  isCoordinatedCampaign: boolean;
  emails: EmailItem[];
}

interface PlotPoint {
  id: string;
  email: EmailItem;
  domain: string;
  timestamp: Date;
  timeMs: number;
  riskScore: number;
  threatClassification: string;
  subject: string;
  fromEmail: string;
  color: string;
  isThreat: boolean;
}

// Visual color palette for distinct domains
const DOMAIN_COLORS = [
  '#ef4444', // Red (high threat)
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Emerald
];

export const ThreatCorrelationChart: React.FC<ThreatCorrelationChartProps> = ({
  emails,
  onSelectEmail,
  onNavigate,
  className = '',
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'combined' | 'scatter' | 'line'>('combined');
  const [hoveredPoint, setHoveredPoint] = useState<PlotPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<PlotPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [threatFilter, setThreatFilter] = useState<'all' | 'threats_only'>('all');

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Responsive resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Helper to extract clean domain from email address
  const extractDomain = (emailAddr: string): string => {
    if (!emailAddr) return 'unknown';
    const match = emailAddr.match(/@([^>]+)/);
    return match ? match[1].toLowerCase().trim() : emailAddr.toLowerCase().trim();
  };

  // Helper to parse date
  const parseEmailDate = (dateStr: string, idx: number): Date => {
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
    // Fallback: 14 Sep 2026 spaced across hours
    const base = new Date(2026, 8, 14, 8, 0, 0);
    base.setHours(base.getHours() - (idx * 2));
    return base;
  };

  // Group emails by domain and detect coordinated campaigns
  const domainGroups = useMemo<DomainCorrelationGroup[]>(() => {
    const map = new Map<string, EmailItem[]>();

    emails.forEach((email) => {
      const dom = extractDomain(email.fromEmail);
      if (!map.has(dom)) {
        map.set(dom, []);
      }
      map.get(dom)!.push(email);
    });

    const groups: DomainCorrelationGroup[] = [];
    let colorIdx = 0;

    map.forEach((items, domain) => {
      const threatCount = items.filter(
        e => e.threatClassification !== 'legitimate' || (e.securityRiskScore ?? 0) >= 60
      ).length;
      
      const totalScore = items.reduce((sum, e) => sum + (e.securityRiskScore ?? 0), 0);
      const avgScore = items.length > 0 ? Math.round(totalScore / items.length) : 0;
      const maxScore = Math.max(...items.map(e => e.securityRiskScore ?? 0));

      const parsedDates = items.map((e, idx) => parseEmailDate(e.date, idx).getTime());
      const minDate = new Date(Math.min(...parsedDates));
      const maxDate = new Date(Math.max(...parsedDates));

      // Determine if this indicates a coordinated campaign
      const isLookalike = domain.includes('chase-online') || domain.includes('chase-verify') || domain.includes('exec-corp') || domain.includes('corp-update');
      const isCoordinated = (threatCount >= 2 && items.length >= 2) || (threatCount >= 1 && isLookalike);

      let patternDescription = '';
      if (isLookalike && threatCount >= 2) {
        patternDescription = 'Coordinated Brand Lookalike Impersonation Wave';
      } else if (threatCount >= 2 && items.length >= 3) {
        patternDescription = 'High-Frequency Automated Phishing Spray';
      } else if (threatCount >= 1 && items.length >= 2) {
        patternDescription = 'Targeted Spear-Phishing Multi-Probe Sequence';
      } else if (threatCount >= 1) {
        patternDescription = 'Isolated Adversarial Incursion';
      } else {
        patternDescription = 'Standard Operational Domain Traffic';
      }

      const color = isCoordinated 
        ? DOMAIN_COLORS[colorIdx % DOMAIN_COLORS.length] 
        : threatCount > 0 
          ? '#f59e0b' 
          : '#10b981';

      groups.push({
        domain,
        count: items.length,
        threatCount,
        avgRiskScore: avgScore,
        maxRiskScore: maxScore,
        earliestDate: minDate,
        latestDate: maxDate,
        color,
        campaignPattern: patternDescription,
        isCoordinatedCampaign: isCoordinated,
        emails: items.sort((a, b) => parseEmailDate(a.date, 0).getTime() - parseEmailDate(b.date, 0).getTime()),
      });

      colorIdx++;
    });

    // Sort: Coordinated phishing domains first, then highest threat count, then total count
    return groups.sort((a, b) => {
      if (a.isCoordinatedCampaign !== b.isCoordinatedCampaign) {
        return a.isCoordinatedCampaign ? -1 : 1;
      }
      if (b.threatCount !== a.threatCount) {
        return b.threatCount - a.threatCount;
      }
      return b.count - a.count;
    });
  }, [emails]);

  // Color map per domain
  const domainColorMap = useMemo(() => {
    const map = new Map<string, string>();
    domainGroups.forEach(g => map.set(g.domain, g.color));
    return map;
  }, [domainGroups]);

  // Prepare plot points
  const plotPoints = useMemo<PlotPoint[]>(() => {
    let list: PlotPoint[] = [];

    emails.forEach((email, idx) => {
      const dom = extractDomain(email.fromEmail);
      if (selectedDomain !== 'all' && dom !== selectedDomain) {
        return;
      }

      const isThreat = email.threatClassification !== 'legitimate' || (email.securityRiskScore ?? 0) >= 60;
      if (threatFilter === 'threats_only' && !isThreat) {
        return;
      }

      const dateObj = parseEmailDate(email.date, idx);
      const risk = email.securityRiskScore ?? 50;

      list.push({
        id: email.id,
        email,
        domain: dom,
        timestamp: dateObj,
        timeMs: dateObj.getTime(),
        riskScore: risk,
        threatClassification: email.threatClassification || 'legitimate',
        subject: email.subject || 'No Subject',
        fromEmail: email.fromEmail,
        color: domainColorMap.get(dom) || '#06b6d4',
        isThreat,
      });
    });

    return list.sort((a, b) => a.timeMs - b.timeMs);
  }, [emails, selectedDomain, threatFilter, domainColorMap]);

  // Calculate coordinates and scales for SVG
  const chartHeight = 280;
  const margin = { top: 25, right: 35, bottom: 40, left: 45 };
  const innerWidth = Math.max(300, containerWidth - margin.left - margin.right);
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const minTime = useMemo(() => {
    if (plotPoints.length === 0) return Date.now() - 86400000 * 3;
    return Math.min(...plotPoints.map(p => p.timeMs)) - 1000 * 3600 * 3;
  }, [plotPoints]);

  const maxTime = useMemo(() => {
    if (plotPoints.length === 0) return Date.now();
    return Math.max(...plotPoints.map(p => p.timeMs)) + 1000 * 3600 * 3;
  }, [plotPoints]);

  // X scale: Time
  const getX = (timeMs: number): number => {
    if (maxTime === minTime) return innerWidth / 2;
    return ((timeMs - minTime) / (maxTime - minTime)) * innerWidth;
  };

  // Y scale: Risk Score (0 to 100)
  const getY = (score: number): number => {
    return innerHeight - (Math.max(0, Math.min(100, score)) / 100) * innerHeight;
  };

  // Build connecting lines grouped by domain
  const domainLines = useMemo(() => {
    const linesByDomain: { domain: string; color: string; pathD: string; points: PlotPoint[] }[] = [];

    const grouped = new Map<string, PlotPoint[]>();
    plotPoints.forEach(p => {
      if (!grouped.has(p.domain)) grouped.set(p.domain, []);
      grouped.get(p.domain)!.push(p);
    });

    grouped.forEach((pts, domain) => {
      if (pts.length < 2) return;
      // Sort chronologically
      pts.sort((a, b) => a.timeMs - b.timeMs);

      // Create SVG path string
      let d = '';
      pts.forEach((p, idx) => {
        const x = getX(p.timeMs);
        const y = getY(p.riskScore);
        if (idx === 0) {
          d += `M ${x} ${y}`;
        } else {
          // Smooth curve
          const prev = pts[idx - 1];
          const prevX = getX(prev.timeMs);
          const prevY = getY(prev.riskScore);
          const midX = (prevX + x) / 2;
          d += ` C ${midX} ${prevY}, ${midX} ${y}, ${x} ${y}`;
        }
      });

      linesByDomain.push({
        domain,
        color: domainColorMap.get(domain) || '#06b6d4',
        pathD: d,
        points: pts,
      });
    });

    return linesByDomain;
  }, [plotPoints, domainColorMap, innerWidth, innerHeight, minTime, maxTime]);

  // Detected coordinated campaign clusters
  const coordinatedClusters = useMemo(() => {
    return domainGroups.filter(g => g.isCoordinatedCampaign);
  }, [domainGroups]);

  // Generate 4-5 nice time tick marks
  const timeTicks = useMemo(() => {
    const count = Math.max(3, Math.min(6, Math.floor(innerWidth / 120)));
    const ticks: { timeMs: number; label: string }[] = [];
    const step = (maxTime - minTime) / (count - 1 || 1);

    for (let i = 0; i < count; i++) {
      const t = minTime + i * step;
      const d = new Date(t);
      const label = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      ticks.push({ timeMs: t, label });
    }
    return ticks;
  }, [minTime, maxTime, innerWidth]);

  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4 shadow-xl text-slate-100 ${className}`}>
      
      {/* Header bar: Title, badge, domain stats & view mode switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Domain Threat Correlation & Temporal Campaign Mapping
            </h3>
            {coordinatedClusters.length > 0 && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/90 text-red-300 border border-red-700/80 animate-pulse flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400" />
                {coordinatedClusters.length} Coordinated Campaign Pattern{coordinatedClusters.length > 1 ? 's' : ''} Detected
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            Visually mapping multiple incoming emails from sender domains over time (Scatter Plot &amp; Campaign Velocity Lines)
          </p>
        </div>

        {/* View mode & threat filter toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scatter vs Line vs Combined Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setViewMode('combined')}
              className={`px-2 py-1 rounded transition-colors font-bold ${
                viewMode === 'combined'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setViewMode('scatter')}
              className={`px-2 py-1 rounded transition-colors font-bold ${
                viewMode === 'scatter'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scatter Plot
            </button>
            <button
              onClick={() => setViewMode('line')}
              className={`px-2 py-1 rounded transition-colors font-bold ${
                viewMode === 'line'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Line Graph
            </button>
          </div>

          {/* Threat Only Filter */}
          <button
            onClick={() => setThreatFilter(threatFilter === 'all' ? 'threats_only' : 'all')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-semibold transition-colors ${
              threatFilter === 'threats_only'
                ? 'bg-red-950 text-red-300 border-red-700'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
          >
            <Filter className="w-3 h-3 text-red-400" />
            <span>{threatFilter === 'threats_only' ? 'Threats Only' : 'All Traffic'}</span>
          </button>
        </div>
      </div>

      {/* Coordinated Campaign Highlights Alert Box (if detected) */}
      {coordinatedClusters.length > 0 && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-red-950/60 via-slate-950 to-amber-950/40 border border-red-700/60 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
              <span className="text-xs font-bold text-red-200 font-mono">
                Coordinated Campaign Pattern Identified Across {coordinatedClusters.length} Distinct Sender Domain{coordinatedClusters.length > 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Cluster Signature: Automated Burst &amp; Brand Spoofing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {coordinatedClusters.slice(0, 3).map((grp) => (
              <button
                key={grp.domain}
                onClick={() => setSelectedDomain(selectedDomain === grp.domain ? 'all' : grp.domain)}
                className={`p-2 rounded-lg border text-left transition-all font-mono text-[11px] ${
                  selectedDomain === grp.domain 
                    ? 'bg-red-950/80 border-red-500 ring-1 ring-red-500/40' 
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-400 truncate max-w-[170px]" title={grp.domain}>
                    @{grp.domain}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 text-[9px] border border-red-800 font-bold">
                    {grp.threatCount}/{grp.count} Threat{grp.threatCount > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                  {grp.campaignPattern}
                </p>
                <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
                  <span>Peak Risk: {grp.maxRiskScore}/100</span>
                  <span className="text-cyan-400 font-semibold">
                    {selectedDomain === grp.domain ? 'Isolating' : 'Filter Domain'} →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Domain Selection Pills Strip */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Domain to Isolate Correlation Path:</span>
          </span>
          <span className="text-[10px] text-slate-500">
            {domainGroups.length} Active Domains Detected
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          <button
            onClick={() => setSelectedDomain('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all whitespace-nowrap border ${
              selectedDomain === 'all'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
          >
            All Correlated Domains ({emails.length})
          </button>

          {domainGroups.map((grp) => {
            const isSelected = selectedDomain === grp.domain;
            return (
              <button
                key={grp.domain}
                onClick={() => setSelectedDomain(grp.domain)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-slate-800 text-white border-cyan-400 shadow-xs ring-1 ring-cyan-400/30'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: grp.color }} 
                />
                <span className="truncate max-w-[140px]" title={grp.domain}>
                  @{grp.domain}
                </span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                  grp.threatCount > 0 ? 'bg-red-950 text-red-300' : 'bg-slate-900 text-slate-400'
                }`}>
                  {grp.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Coordinate Chart Area (Scatter Plot & Line Graph) */}
      <div 
        ref={containerRef}
        className="relative bg-slate-950/80 rounded-xl border border-slate-800 p-2 overflow-hidden select-none"
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <svg
          width="100%"
          height={chartHeight}
          className="overflow-visible"
        >
          <defs>
            {/* Risk Zone Gradients */}
            <linearGradient id="risk-zone-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>

            {/* Glowing filter for critical attack points */}
            <filter id="threat-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            
            {/* Background Risk Zones (Critical >= 70, Suspicious 40-69, Clean < 40) */}
            <rect
              x={0}
              y={0}
              width={innerWidth}
              height={innerHeight}
              fill="url(#risk-zone-gradient)"
            />

            {/* Critical Phishing Attack Zone Line at Y=70 */}
            <line
              x1={0}
              y1={getY(70)}
              x2={innerWidth}
              y2={getY(70)}
              stroke="#ef4444"
              strokeDasharray="4,4"
              strokeOpacity="0.45"
            />
            <text
              x={innerWidth - 6}
              y={getY(70) - 4}
              textAnchor="end"
              fill="#ef4444"
              fontSize="9px"
              fontFamily="monospace"
              fontWeight="bold"
              opacity="0.8"
            >
              CRITICAL THREAT THRESHOLD (SCORE &ge; 70)
            </text>

            {/* Suspicious Risk Zone Line at Y=40 */}
            <line
              x1={0}
              y1={getY(40)}
              x2={innerWidth}
              y2={getY(40)}
              stroke="#f59e0b"
              strokeDasharray="3,3"
              strokeOpacity="0.35"
            />
            <text
              x={innerWidth - 6}
              y={getY(40) - 4}
              textAnchor="end"
              fill="#f59e0b"
              fontSize="9px"
              fontFamily="monospace"
              opacity="0.7"
            >
              SUSPICIOUS ZONE (SCORE &ge; 40)
            </text>

            {/* Horizontal Gridlines (0, 25, 50, 75, 100) */}
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick} transform={`translate(0, ${getY(tick)})`}>
                <line
                  x1={0}
                  y1={0}
                  x2={innerWidth}
                  y2={0}
                  stroke="#334155"
                  strokeDasharray="2,3"
                  strokeOpacity="0.3"
                />
                <text
                  x={-8}
                  y={3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9px"
                  fontFamily="monospace"
                >
                  {tick}
                </text>
              </g>
            ))}

            {/* Y-Axis Label */}
            <text
              transform="rotate(-90)"
              x={-innerHeight / 2}
              y={-32}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9px"
              fontFamily="monospace"
              fontWeight="bold"
            >
              RISK SCORE (0 - 100)
            </text>

            {/* X-Axis Vertical Gridlines & Time Labels */}
            {timeTicks.map((t, idx) => {
              const xPos = getX(t.timeMs);
              return (
                <g key={idx} transform={`translate(${xPos}, 0)`}>
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={innerHeight}
                    stroke="#334155"
                    strokeDasharray="2,3"
                    strokeOpacity="0.25"
                  />
                  <text
                    x={0}
                    y={innerHeight + 16}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9px"
                    fontFamily="monospace"
                  >
                    {t.label}
                  </text>
                </g>
              );
            })}

            {/* Connecting Campaign Lines (Rendered in Combined or Line Mode) */}
            {(viewMode === 'combined' || viewMode === 'line') && (
              <g className="campaign-lines">
                {domainLines.map((line) => {
                  const isDimmed = selectedDomain !== 'all' && selectedDomain !== line.domain;
                  const isHighlighted = selectedDomain === line.domain;
                  return (
                    <g key={line.domain} opacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.85}>
                      {/* Glow outline on highlighted lines */}
                      {isHighlighted && (
                        <path
                          d={line.pathD}
                          fill="none"
                          stroke={line.color}
                          strokeWidth={6}
                          strokeOpacity={0.25}
                        />
                      )}
                      <path
                        d={line.pathD}
                        fill="none"
                        stroke={line.color}
                        strokeWidth={isHighlighted ? 3 : 2}
                        strokeDasharray={line.points.some(p => p.isThreat) ? 'none' : '4,3'}
                        className="transition-all duration-200"
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* Scatter Plot Points (Rendered in Combined or Scatter Mode) */}
            {(viewMode === 'combined' || viewMode === 'scatter') && (
              <g className="scatter-points">
                {plotPoints.map((pt) => {
                  const cx = getX(pt.timeMs);
                  const cy = getY(pt.riskScore);
                  const isHovered = hoveredPoint?.id === pt.id;
                  const isSelected = selectedPoint?.id === pt.id;
                  const isDimmed = selectedDomain !== 'all' && selectedDomain !== pt.domain;

                  const radius = isHovered || isSelected ? 8 : pt.isThreat ? 6 : 4.5;

                  return (
                    <g
                      key={pt.id}
                      transform={`translate(${cx}, ${cy})`}
                      className="cursor-pointer transition-all duration-150"
                      opacity={isDimmed ? 0.2 : 1}
                      onMouseEnter={(e) => {
                        setHoveredPoint(pt);
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                          setTooltipPos({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          });
                        }
                      }}
                      onClick={() => {
                        setSelectedPoint(pt);
                        if (onSelectEmail) onSelectEmail(pt.email);
                      }}
                    >
                      {/* Pulse halo on high-risk points */}
                      {pt.isThreat && (
                        <circle
                          r={radius + 4}
                          fill={pt.color}
                          opacity={0.25}
                          className="animate-ping"
                        />
                      )}

                      {/* Main node point */}
                      <circle
                        r={radius}
                        fill={pt.isThreat ? pt.color : '#10b981'}
                        stroke={isHovered || isSelected ? '#ffffff' : '#0f172a'}
                        strokeWidth={isHovered || isSelected ? 2.5 : 1.5}
                        filter={pt.isThreat ? 'url(#threat-glow)' : undefined}
                      />

                      {/* Center dot */}
                      <circle
                        r={radius * 0.4}
                        fill={isHovered || isSelected ? '#ffffff' : '#0f172a'}
                      />
                    </g>
                  );
                })}
              </g>
            )}

          </g>
        </svg>

        {/* Interactive Floating Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              left: `${Math.min(containerWidth - 280, Math.max(10, tooltipPos.x + 12))}px`,
              top: `${Math.max(10, tooltipPos.y - 120)}px`,
            }}
            className="absolute z-30 pointer-events-none p-3 rounded-xl bg-slate-950/95 border border-cyan-500/70 shadow-2xl text-xs font-mono w-64 space-y-1.5 animate-in fade-in duration-100 backdrop-blur-md"
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-bold text-cyan-300 truncate max-w-[160px]">
                @{hoveredPoint.domain}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                hoveredPoint.isThreat 
                  ? 'bg-red-950 text-red-300 border border-red-700' 
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}>
                Risk: {hoveredPoint.riskScore}/100
              </span>
            </div>

            <p className="text-slate-200 text-xs font-sans font-medium line-clamp-2">
              {hoveredPoint.subject}
            </p>

            <div className="text-[10px] text-slate-400 space-y-0.5 pt-0.5">
              <div>Sender: <span className="text-slate-300 truncate block">{hoveredPoint.fromEmail}</span></div>
              <div>Time: <span className="text-slate-300">{hoveredPoint.timestamp.toLocaleString()}</span></div>
              <div>Classification: <strong className="text-red-400 uppercase">{hoveredPoint.threatClassification}</strong></div>
              {hoveredPoint.email.attribution?.campaignName && (
                <div>Campaign: <span className="text-amber-400">{hoveredPoint.email.attribution.campaignName}</span></div>
              )}
            </div>

            <div className="pt-1 text-[9px] text-cyan-400 text-right font-bold">
              Click node to inspect email &rarr;
            </div>
          </div>
        )}

      </div>

      {/* Selected Email Quick Action Bar */}
      {selectedPoint && (
        <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Selected Node: {selectedPoint.id}
              </span>
              <span className="text-xs font-bold text-white truncate max-w-[280px]">
                {selectedPoint.subject}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              From: <strong className="text-slate-300">{selectedPoint.fromEmail}</strong> | Date: <span className="text-slate-300">{selectedPoint.timestamp.toLocaleString()}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onSelectEmail) onSelectEmail(selectedPoint.email);
                if (onNavigate) onNavigate('mail');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-colors shadow-xs"
            >
              <span>Inspect in MailView</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedPoint(null)}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-mono"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] font-mono text-slate-500 border-t border-slate-800/80">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span>Critical Phishing / Fraud (Risk &ge; 70)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Suspicious / Impersonation (Risk 40-69)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Legitimate Baseline Traffic (Risk &lt; 40)</span>
          </span>
        </div>

        <div className="text-slate-400">
          Click any event node to jump to email forensic timeline
        </div>
      </div>

    </div>
  );
};
