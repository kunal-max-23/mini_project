import React, { useState, useEffect } from 'react';
import {
  Navigation,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  RotateCcw,
  Volume2,
  Clock,
  Gauge,
  Zap,
} from 'lucide-react';
import { triggerReroute } from '../services/apiClient';
import { TacticalMumbaiMap } from './TacticalMumbaiMap';

interface ActiveRerouteViewProps {
  onBackToDispatch: () => void;
  selectedVehicle?: string;
}

export const ActiveRerouteView: React.FC<ActiveRerouteViewProps> = ({
  onBackToDispatch,
  selectedVehicle = 'Medic-4',
}) => {
  const [rerouteAccepted, setRerouteAccepted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(370); // ~6 mins 10s
  const [speedKmh, setSpeedKmh] = useState(58);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleAcceptReroute = async () => {
    setRerouteAccepted(true);
    setRemainingSeconds(290); // drops time from ~6m to ~4m 50s!
    await triggerReroute({
      incidentId: 'INC-8492-MUMBAI',
      cause: 'Worli Naka bottleneck - dynamic bypass',
      bypassRouteId: 'ROUTE_DELTA',
    });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      {/* Top Navigation Control Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDispatch}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Planner
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <span className="text-sm font-bold text-slate-900">
              Live Navigation: {selectedVehicle}
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              · En Route to KEM Hospital
            </span>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Clock className="w-4 h-4 text-blue-600" />
            Remaining: <strong className="font-mono text-slate-900">{formatTime(remainingSeconds)}</strong>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Gauge className="w-4 h-4 text-slate-500" />
            Speed: <strong className="font-mono text-slate-900">{speedKmh} km/h</strong>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <Zap className="w-3.5 h-3.5" />
            Green Corridor Active (4/5)
          </div>
        </div>
      </div>

      {/* Main Split: Left Guidance Panel + Right Vector Map */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side Guidance Card & Alerts (380px) */}
        <div className="w-full lg:w-[380px] bg-white border-r border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0 space-y-4">
          <div className="space-y-4">
            {/* Maneuver Guidance Card */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
                <span>NEXT TURN</span>
                <span>IN 350 METERS</span>
              </div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600 rotate-45" />
                Bear Left onto Worli Sea Face
              </div>
              <div className="text-xs text-slate-600">
                Continue for 2.4 km along the sea face corridor. Traffic signals pre-empted.
              </div>
            </div>

            {/* Dynamic Incident & Rerouting Card */}
            {!rerouteAccepted ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Obstruction Ahead (+6m Delay)
                    </h3>
                    <p className="text-xs text-slate-700 mt-1 leading-snug">
                      Sudden waterlogging &amp; collision detected at <strong>Worli Naka / Senapati Bapat Marg</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-amber-200/80 text-xs text-slate-700 space-y-1">
                  <div className="font-semibold text-slate-900">Recommended Dynamic Reroute:</div>
                  <div>Take <strong>Route Delta (Tulsi Pipe Bypass)</strong></div>
                  <div className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Saves 5.2 minutes (+0.9 km distance)
                  </div>
                </div>

                <button
                  onClick={handleAcceptReroute}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Accept Dynamic Bypass
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Bypass Active · Route Delta Engaged
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  Vehicle successfully diverted onto <strong>Tulsi Pipe Road</strong>. ETA revised to 14:28 IST (saving 5.2 minutes).
                </p>
              </div>
            )}

            {/* Turn by turn list */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Upcoming Maneuvers
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span>1. Worli Sea Face exit ramp</span>
                  <span className="font-mono text-slate-500">800m</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span>2. {rerouteAccepted ? 'Tulsi Pipe Road straight' : 'Senapati Bapat Marg'}</span>
                  <span className="font-mono text-slate-500">1.8 km</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span>3. KEM Emergency Trauma Bay</span>
                  <span className="font-mono text-slate-500">Destination</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Dispatch Contact */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500">Police Wireless Dispatch</div>
              <div className="font-semibold text-slate-800">MTP Green Wave Channel 4</div>
            </div>
            <div className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono font-medium text-emerald-700">
              154.28 MHz
            </div>
          </div>
        </div>

        {/* Right Tactical Map Canvas (High-Fidelity Vector Cartography with Live Tracking) */}
        <div className="flex-1 relative flex flex-col h-full overflow-hidden bg-slate-100">
          <TacticalMumbaiMap
            selectedRouteKey={rerouteAccepted ? 'DELTA' : 'ALPHA'}
            isNavigationMode={true}
            rerouteAccepted={rerouteAccepted}
            selectedVehicle={selectedVehicle}
          />
        </div>
      </div>
    </div>
  );
};
