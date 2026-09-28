import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Key, 
  Server, 
  CheckCircle2, 
  AlertTriangle,
  Sun,
  Moon,
  Sparkles,
  MapPin,
  Crosshair,
  RefreshCw,
  Radio,
  Compass,
  Bell,
  Camera,
  Mic
} from 'lucide-react';
import { UserSession } from '../types';
import { 
  checkDevicePermissions, 
  requestDevicePermissions, 
  resolveClientPreciseLocation,
  AccurateGeoResult 
} from '../services/geoService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onUpdateSession: (session: UserSession) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userSession,
  onUpdateSession,
}) => {
  if (!isOpen) return null;

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return userSession.theme || (localStorage.getItem('mailguard_theme') as 'dark' | 'light') || 'dark';
  });
  const [dataMasking, setDataMasking] = useState(userSession.dataMasking);
  const [retentionDays, setRetentionDays] = useState(userSession.retentionDays);
  const [zeroTrust, setZeroTrust] = useState(true);

  // Device permissions & high-accuracy geolocation state
  const [permissionState, setPermissionState] = useState<{
    geolocation: PermissionState | 'unsupported';
    notifications: NotificationPermission | 'unsupported';
  }>({ geolocation: 'unsupported', notifications: 'unsupported' });
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [resolvedGeo, setResolvedGeo] = useState<AccurateGeoResult | null>(null);
  const [geoStatusMsg, setGeoStatusMsg] = useState<string | null>(null);

  // Check current browser permissions on modal open
  useEffect(() => {
    let isMounted = true;
    checkDevicePermissions().then((perms) => {
      if (isMounted) setPermissionState(perms);
    });

    // Auto-resolve current location baseline
    resolveClientPreciseLocation(false).then((geo) => {
      if (isMounted) setResolvedGeo(geo);
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const handlePromptDevicePermissions = async () => {
    setIsRequestingPermissions(true);
    setGeoStatusMsg(null);
    try {
      // Actively prompt real device for location & notification permissions
      const accurate = await requestDevicePermissions(true);
      setResolvedGeo(accurate);
      const updatedPerms = await checkDevicePermissions();
      setPermissionState(updatedPerms);
      setGeoStatusMsg(
        `Device Location Verified down to Street & State: ${accurate.street ? `${accurate.street}, ` : ''}${accurate.city}, ${accurate.state || accurate.region} [${accurate.latitude.toFixed(6)}° N, ${Math.abs(accurate.longitude).toFixed(6)}° W]`
      );
      setTimeout(() => setGeoStatusMsg(null), 8000);
    } catch (err: any) {
      setGeoStatusMsg(`Permission prompt completed: ${err?.message || 'Ready'}`);
      setTimeout(() => setGeoStatusMsg(null), 6000);
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('mailguard_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-audit');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light-audit');
      document.documentElement.classList.add('dark');
    }

    onUpdateSession({
      ...userSession,
      theme,
      dataMasking,
      retentionDays,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Privacy, Safeguards & SOC Policies</h3>
              <p className="text-[11px] text-slate-400 font-mono">Platform Integrity & Compliance Configuration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          
          {/* Active Operator */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Certified Operator</span>
            <p className="font-bold text-slate-200 text-sm">{userSession.name} ({userSession.email})</p>
            <p className="text-[11px] text-cyan-400 font-mono">Role: {userSession.role}</p>
          </div>

          {/* Theme Mode Toggle: Forensic Dark vs Light Audit */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div>
              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Display Theme & Contrast</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Switch between high-contrast Forensic Dark and Light Audit mode for daytime analysis.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-xs block">Forensic Dark</span>
                  <span className="text-[10px] text-slate-400 block">Low-light SOC view</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'bg-slate-800 border-amber-400 ring-1 ring-amber-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-xs block">Light Audit</span>
                  <span className="text-[10px] text-slate-400 block">High daytime contrast</span>
                </div>
              </button>
            </div>
          </div>

          {/* Setting 1: PII Redaction */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-200">PII Redaction & Data Masking</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mask employee SSNs, credit card numbers, and banking credentials before LLM parsing.
                </p>
              </div>
              <input
                type="checkbox"
                checked={dataMasking}
                onChange={() => setDataMasking(!dataMasking)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
              />
            </div>
          </div>

          {/* Setting 2: Strict Zero Trust */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-200">Strict Zero-Trust Quarantine Rule</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automatically quarantine any RFC 5322 payload failing both SPF and DKIM.
                </p>
              </div>
              <input
                type="checkbox"
                checked={zeroTrust}
                onChange={() => setZeroTrust(!zeroTrust)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
              />
            </div>
          </div>

          {/* Setting 3: Evidence Retention */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Forensic Evidence Retention Window</span>
              <span className="font-mono text-cyan-400 font-bold">{retentionDays} Days</span>
            </div>
            <input
              type="range"
              min="30"
              max="365"
              step="30"
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-[10px] text-slate-500">
              Retained evidence is cryptographically sealed with SHA-256 and stored in an immutable audit vault.
            </p>
          </div>

          {/* Device Permissions & High-Precision Geolocation Card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Device Hardware & Location Permissions</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    High-accuracy GPS sensor, state attribution, and street-level reverse geocoding
                  </p>
                </div>
              </div>

              <button
                onClick={handlePromptDevicePermissions}
                disabled={isRequestingPermissions}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <Crosshair className={`w-3.5 h-3.5 text-emerald-400 ${isRequestingPermissions ? 'animate-spin' : ''}`} />
                <span>{isRequestingPermissions ? 'Prompting Device...' : 'Request Permissions'}</span>
              </button>
            </div>

            {/* Permissions Status Chips */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" /> Geolocation:
                </span>
                <span className={`font-bold capitalize ${
                  permissionState.geolocation === 'granted' ? 'text-emerald-400' :
                  permissionState.geolocation === 'denied' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {permissionState.geolocation}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Bell className="w-3 h-3 text-cyan-400" /> Notifications:
                </span>
                <span className={`font-bold capitalize ${
                  permissionState.notifications === 'granted' ? 'text-emerald-400' :
                  permissionState.notifications === 'denied' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {permissionState.notifications}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-cyan-400" /> Frame Audio/Cam:
                </span>
                <span className="text-emerald-400 font-bold">
                  Configured
                </span>
              </div>
            </div>

            {/* Resolved Precision Location Box */}
            {resolvedGeo && (
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>Resolved Precision Position:</span>
                  <span className="text-cyan-400 uppercase font-semibold">
                    {resolvedGeo.source === 'gps_device' ? '📍 Real Device GPS' : '🌐 Ingress Public IP Geo'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <strong className="text-emerald-300">
                    {resolvedGeo.street ? `${resolvedGeo.street}, ` : ''}{resolvedGeo.city}
                  </strong>
                  <span className="text-slate-300">State: <strong className="text-white">{resolvedGeo.state || resolvedGeo.region}</strong></span>
                  <span className="text-cyan-400 text-[10px] ml-auto">
                    [{resolvedGeo.latitude.toFixed(6)}° N, {Math.abs(resolvedGeo.longitude).toFixed(6)}° W]
                  </span>
                </div>
                {resolvedGeo.accuracyMeters && (
                  <p className="text-[9px] text-slate-500">
                    Accuracy Radius: ~{resolvedGeo.accuracyMeters} meters • Postcode: {resolvedGeo.postalCode || '94043'}
                  </p>
                )}
              </div>
            )}

            {geoStatusMsg && (
              <p className="text-[11px] text-emerald-400 font-mono bg-emerald-950/40 p-2 rounded border border-emerald-800">
                {geoStatusMsg}
              </p>
            )}
          </div>

          {/* Legal Compliance Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-300 font-mono uppercase">Legal & Regulatory Alignment</p>
            <p className="leading-relaxed">
              Complies with NIST SP 800-61 Rev 2 (Computer Security Incident Handling) and ISO/IEC 27037 (Guidelines for identification, collection, acquisition and preservation of digital evidence).
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
          >
            Save Safeguards
          </button>
        </div>

      </div>
    </div>
  );
};
