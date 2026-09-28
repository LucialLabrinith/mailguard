import React, { useState } from 'react';
import { Globe2, ShieldAlert, AlertTriangle, ArrowUpRight, Filter, Info, Radio, Layers } from 'lucide-react';
import { EmailItem } from '../types';

interface GlobalThreatHeatmapProps {
  emails?: EmailItem[];
  onSelectCountryFilter?: (country: string) => void;
  onNavigateToThreats?: () => void;
}

interface CountryThreatInfo {
  id: string;
  name: string;
  code: string;
  threatCount: number;
  criticalCount: number;
  topVector: string;
  topAsn: string;
  primaryCampaign: string;
  riskScore: number;
  cx: number;
  cy: number;
  r: number;
  fillColor: string;
}

export const GlobalThreatHeatmap: React.FC<GlobalThreatHeatmapProps> = ({
  emails = [],
  onSelectCountryFilter,
  onNavigateToThreats,
}) => {
  const [hoveredCountry, setHoveredCountry] = useState<CountryThreatInfo | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map hotspot nodes for key threat staging infrastructures
  const threatHotspots: CountryThreatInfo[] = [
    {
      id: 'ro',
      name: 'Romania',
      code: 'RO',
      threatCount: 94,
      criticalCount: 68,
      topVector: 'Lookalike Banking Typosquatting',
      topAsn: 'AS44050 (FlokiNET Bulletproof Relay)',
      primaryCampaign: 'CAMP-HYDRA-842 (Chase Impersonation)',
      riskScore: 94,
      cx: 560,
      cy: 165,
      r: 22,
      fillColor: '#ef4444', // Red-500
    },
    {
      id: 'ru',
      name: 'Russia',
      code: 'RU',
      threatCount: 76,
      criticalCount: 52,
      topVector: 'Wire Transfer Fraud & BEC Relays',
      topAsn: 'AS48282 (Sovereign Bulletproof)',
      primaryCampaign: 'NimbleMule BEC Group',
      riskScore: 91,
      cx: 660,
      cy: 130,
      r: 20,
      fillColor: '#ef4444',
    },
    {
      id: 'de',
      name: 'Germany (Tor Exit Nodes)',
      code: 'DE',
      threatCount: 48,
      criticalCount: 26,
      topVector: 'Multi-hop Onion Proxies / Ingestion Bypasses',
      topAsn: 'AS200000 (Tor Exit Aggregator)',
      primaryCampaign: 'ShadowRelay Onion Mesh',
      riskScore: 82,
      cx: 520,
      cy: 155,
      r: 16,
      fillColor: '#f97316', // Orange-500
    },
    {
      id: 'vn',
      name: 'Vietnam',
      code: 'VN',
      threatCount: 32,
      criticalCount: 18,
      topVector: 'Adversarial Prompt Injection & Phish Kits',
      topAsn: 'AS7552 (Viettel Botnet Subnet)',
      primaryCampaign: 'PromptJailbreak-v4',
      riskScore: 86,
      cx: 740,
      cy: 260,
      r: 14,
      fillColor: '#f59e0b', // Amber-500
    },
    {
      id: 'nl',
      name: 'Netherlands',
      code: 'NL',
      threatCount: 28,
      criticalCount: 12,
      topVector: 'Bulletproof Offshore Hosting',
      topAsn: 'AS49981 (CyberHost Europe)',
      primaryCampaign: 'DocuSign Cloned Portals',
      riskScore: 78,
      cx: 505,
      cy: 150,
      r: 13,
      fillColor: '#f59e0b',
    },
    {
      id: 'us',
      name: 'United States',
      code: 'US',
      threatCount: 22,
      criticalCount: 8,
      topVector: 'Compromised Cloud Tenants (AWS/Azure)',
      topAsn: 'AS16509 / AS8075 (Stolen App Registrations)',
      primaryCampaign: 'OAuth Token Consent Abuse',
      riskScore: 68,
      cx: 240,
      cy: 180,
      r: 12,
      fillColor: '#06b6d4', // Cyan-500
    },
    {
      id: 'cn',
      name: 'China',
      code: 'CN',
      threatCount: 19,
      criticalCount: 7,
      topVector: 'Automated Ingestion Scanning Harvesters',
      topAsn: 'AS4134 (Chinanet Backbone)',
      primaryCampaign: 'ScanEngine Recon Mesh',
      riskScore: 64,
      cx: 720,
      cy: 200,
      r: 11,
      fillColor: '#06b6d4',
    },
    {
      id: 'br',
      name: 'Brazil',
      code: 'BR',
      threatCount: 14,
      criticalCount: 4,
      topVector: 'Boleto & Invoice Diverter Trojans',
      topAsn: 'AS28573 (Claro Telecom)',
      primaryCampaign: 'BoletoDiversion-LATAM',
      riskScore: 60,
      cx: 340,
      cy: 330,
      r: 10,
      fillColor: '#10b981', // Emerald-500
    },
  ];

  const filteredHotspots = threatHotspots.filter((item) => {
    if (selectedRegion === 'europe') return ['ro', 'ru', 'de', 'nl'].includes(item.id);
    if (selectedRegion === 'asia') return ['vn', 'cn', 'ru'].includes(item.id);
    if (selectedRegion === 'americas') return ['us', 'br'].includes(item.id);
    return true;
  });

  const handleCountryClick = (country: CountryThreatInfo) => {
    if (onSelectCountryFilter) {
      onSelectCountryFilter(country.name);
    } else if (onNavigateToThreats) {
      onNavigateToThreats();
    }
  };

  const handleMouseMove = (e: React.MouseEvent, country: CountryThreatInfo) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredCountry(country);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Global Threat Origin Heatmap</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                Active Origin Attribution
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive SVG mapping of incoming adversary infrastructure, bulletproof hosting ASNs, and proxy gateways.
            </p>
          </div>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {[
            { id: 'all', label: 'Global' },
            { id: 'europe', label: 'Europe' },
            { id: 'asia', label: 'Asia' },
            { id: 'americas', label: 'Americas' },
          ].map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedRegion === region.id
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {region.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="relative w-full aspect-[2/1] min-h-[280px] sm:min-h-[340px] bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
        
        {/* Subtle Map Coordinate Grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <svg
          viewBox="0 0 960 480"
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Radial glow filter */}
            <filter id="threat-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Stylized World Continent Outlines */}
          <g className="fill-slate-800/40 stroke-slate-700/60 stroke-[1.2]">
            {/* North America */}
            <path d="M 120 80 Q 220 70 280 120 Q 320 180 250 240 Q 180 260 140 190 Q 100 130 120 80 Z" />
            {/* Greenland */}
            <path d="M 340 50 Q 390 40 400 70 Q 380 95 330 80 Z" />
            {/* South America */}
            <path d="M 280 270 Q 350 280 370 340 Q 340 430 300 440 Q 260 380 270 310 Z" />
            {/* Europe */}
            <path d="M 470 110 Q 560 100 580 150 Q 550 190 480 180 Q 450 150 470 110 Z" />
            {/* Africa */}
            <path d="M 460 200 Q 560 210 570 290 Q 540 380 490 390 Q 440 300 450 240 Z" />
            {/* Asia */}
            <path d="M 590 100 Q 750 90 840 140 Q 860 220 780 270 Q 670 260 600 200 Z" />
            {/* Australia */}
            <path d="M 760 330 Q 840 330 860 380 Q 820 420 750 400 Q 730 360 760 330 Z" />
          </g>

          {/* Connection Lines from Threat Origin Hotspots to Simulated SOC Target (US/Europe) */}
          <g className="stroke-red-500/25 stroke-dasharray-[4,4] stroke-[1]">
            <line x1="560" y1="165" x2="240" y2="180" className="animate-pulse" />
            <line x1="660" y1="130" x2="240" y2="180" className="animate-pulse" />
            <line x1="740" y1="260" x2="240" y2="180" className="animate-pulse" />
            <line x1="520" y1="155" x2="505" y2="150" />
          </g>

          {/* Threat Nodes / Hotspot Rings */}
          {filteredHotspots.map((country) => {
            const isHovered = hoveredCountry?.id === country.id;

            return (
              <g
                key={country.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => handleCountryClick(country)}
                onMouseEnter={(e) => {
                  setHoveredCountry(country);
                  setTooltipPos({ x: country.cx, y: country.cy });
                }}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                {/* Outer animated pulse wave */}
                <circle
                  cx={country.cx}
                  cy={country.cy}
                  r={country.r * 1.6}
                  fill={country.fillColor}
                  opacity="0.15"
                  className="animate-ping"
                  style={{ animationDuration: '3s' }}
                />

                {/* Second glow halo */}
                <circle
                  cx={country.cx}
                  cy={country.cy}
                  r={country.r * (isHovered ? 1.4 : 1.2)}
                  fill={country.fillColor}
                  opacity={isHovered ? '0.4' : '0.2'}
                  filter="url(#threat-glow)"
                />

                {/* Core Threat Node */}
                <circle
                  cx={country.cx}
                  cy={country.cy}
                  r={country.r * (isHovered ? 0.9 : 0.7)}
                  fill={country.fillColor}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? '2' : '1'}
                  className="transition-all duration-200"
                />

                {/* Label */}
                <text
                  x={country.cx}
                  y={country.cy + country.r + 12}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-bold transition-all ${
                    isHovered ? 'fill-white' : 'fill-slate-300'
                  }`}
                >
                  {country.code} ({country.threatCount})
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Hover Tooltip Card */}
        {hoveredCountry && (
          <div
            className="absolute z-20 pointer-events-none p-3.5 rounded-xl bg-slate-900/95 border border-red-500/50 shadow-2xl backdrop-blur-md text-xs w-72 space-y-2 transform -translate-x-1/2 -translate-y-full transition-all duration-150"
            style={{
              left: `${Math.min(Math.max(tooltipPos.x, 150), 800) / 9.6}%`,
              top: `${Math.max(tooltipPos.y / 4.8, 25)}%`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span className="text-sm">📍</span>
                <span>{hoveredCountry.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">
                  {hoveredCountry.code}
                </span>
              </div>
              <span className="text-[10px] font-mono text-red-400 font-bold">
                Risk Score: {hoveredCountry.riskScore}/100
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Intercepted Threats:</span>
                <strong className="text-red-400 font-mono">{hoveredCountry.threatCount} emails</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Critical Severity:</span>
                <strong className="text-red-300 font-mono">{hoveredCountry.criticalCount} payloads</strong>
              </div>
              <div className="pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 block text-[10px] font-mono">Primary Attack Vector:</span>
                <span className="text-amber-300 font-medium">{hoveredCountry.topVector}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">Autonomous System (ASN):</span>
                <span className="text-cyan-400 font-mono text-[10px]">{hoveredCountry.topAsn}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">Correlated Campaign:</span>
                <span className="text-slate-200 text-[10px] font-mono">{hoveredCountry.primaryCampaign}</span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800 text-[10px] font-mono text-cyan-400 flex items-center justify-between">
              <span>Click node to filter mailbox</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Legend & Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {threatHotspots.slice(0, 4).map((country) => (
          <div
            key={country.id}
            onClick={() => handleCountryClick(country)}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all text-xs space-y-1 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                {country.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                {country.threatCount}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 truncate">{country.topAsn}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
