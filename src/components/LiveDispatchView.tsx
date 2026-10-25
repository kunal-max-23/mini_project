import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { requestRoutes, confirmRoute } from '../services/apiClient';
import { TacticalMumbaiMap } from './TacticalMumbaiMap';

interface LiveDispatchViewProps {
  onConfirmAndNavigate: (routeId: string) => void;
  selectedVehicle?: string;
}

export const LiveDispatchView: React.FC<LiveDispatchViewProps> = ({
  onConfirmAndNavigate,
  selectedVehicle = 'Medic-4',
}) => {
  // Preset origins and destinations in Mumbai
  const originPresets = [
    { label: 'Nariman Point / Marine Drive', lat: 18.9256, lon: 72.8238 },
    { label: 'Bandra Depot', lat: 19.0596, lon: 72.8295 },
    { label: 'Dadar Fire Station', lat: 19.0178, lon: 72.8478 },
  ];

  const destinationPresets = [
    { label: 'KEM Hospital (Level 1 Trauma, Parel)', lat: 19.0028, lon: 72.8427 },
    { label: 'Lilavati Hospital (Bandra West)', lat: 19.0514, lon: 72.8288 },
    { label: 'Sion Apex Trauma Centre', lat: 19.0354, lon: 72.8601 },
  ];

  const [origin, setOrigin] = useState(originPresets[0].label);
  const [destination, setDestination] = useState(destinationPresets[0].label);
  const [priority, setPriority] = useState<'CRITICAL' | 'URGENT' | 'STANDARD'>('CRITICAL');
  const [greenCorridor, setGreenCorridor] = useState(true);
  const [avoidTunnels, setAvoidTunnels] = useState(true);
  const [selectedRouteKey, setSelectedRouteKey] = useState<'ALPHA' | 'BRAVO' | 'CHARLIE'>('ALPHA');
  const [isLoading, setIsLoading] = useState(false);
  const [routesData, setRoutesData] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchCalculatedRoutes = async () => {
    setIsLoading(true);
    try {
      const currentOrigin = originPresets.find((p) => p.label === origin) || originPresets[0];
      const currentDest = destinationPresets.find((p) => p.label === destination) || destinationPresets[0];

      const data = await requestRoutes({
        origin: { address: origin, lon: currentOrigin.lon, lat: currentOrigin.lat },
        destination: { address: destination, lon: currentDest.lon, lat: currentDest.lat },
        vehicleType: selectedVehicle.includes('Medic') ? 'Ambulance' : (selectedVehicle.includes('Engine') ? 'Fire' : 'Police'),
        priorityLevel: priority === 'CRITICAL' ? 'CODE_3_CRITICAL' : 'CODE_2_URGENT',
        constraints: {
          opticomPreemptIntersections: greenCorridor,
          lowClearanceRestricted: avoidTunnels,
        },
      });
      setRoutesData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculatedRoutes();
  }, [origin, destination, priority, greenCorridor, avoidTunnels, selectedVehicle]);

  const handleStartRoute = async (routeId: string) => {
    await confirmRoute(routeId === 'ALPHA' ? 'ROUTE_ALPHA' : (routeId === 'BRAVO' ? 'ROUTE_BRAVO' : 'ROUTE_CHARLIE'));
    onConfirmAndNavigate(routeId);
  };

  const routes = [
    {
      id: 'ALPHA',
      name: 'Route 1: Coastal Road & Worli Sea Face',
      tag: 'Recommended',
      time: '8 min 24s',
      eta: '14:32 IST',
      distance: '6.8 km',
      confidence: '94% (8.1m – 9.0m range)',
      signals: '5 green corridors armed',
      summary: 'Fastest and most reliable path. Avoids reported waterlogging on Senapati Bapat Marg.',
      color: '#2563eb', // blue
      hazards: [],
    },
    {
      id: 'BRAVO',
      name: 'Route 2: Eastern Freeway Express',
      tag: 'Fastest Raw',
      time: '7 min 48s',
      eta: '14:31 IST',
      distance: '8.2 km',
      confidence: '72% (6.8m – 11.0m range)',
      signals: '2 green corridors armed',
      summary: 'High-speed elevated span, but susceptible to dockyard congestion during rain squalls.',
      color: '#7c3aed', // purple
      hazards: ['Coastal squall warning'],
    },
    {
      id: 'CHARLIE',
      name: 'Route 3: Senapati Bapat Central Arterial',
      tag: 'Delay Risk',
      time: '11 min 15s',
      eta: '14:35 IST',
      distance: '7.1 km',
      confidence: '61% (10.2m – 15.4m range)',
      signals: '3 signals armed',
      summary: 'Heavy congestion and waterlogged lane restriction detected near Lower Parel.',
      color: '#d97706', // amber
      hazards: ['Waterlogging near Lower Parel (+4 min delay)'],
    },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      {/* Left Planning Panel (440px) */}
      <div className="w-full lg:w-[440px] xl:w-[460px] bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto shrink-0 shadow-xs">
        <div className="p-5 space-y-5">
          {/* Section: Origin & Destination */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Emergency Trip Parameters
            </h2>

            {/* Origin Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Origin Point (Station / Dispatch)
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {originPresets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setOrigin(p.label)}
                    className={`text-[11px] px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                      origin === p.label
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label.split('/')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Destination (Hospital / Trauma Center)
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {destinationPresets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setDestination(p.label)}
                    className={`text-[11px] px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                      destination === p.label
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label.split('(')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority & Constraints Controls */}
            <div className="pt-2 grid grid-cols-2 gap-3 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Response Priority
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setPriority('CRITICAL')}
                    className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      priority === 'CRITICAL' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Code 3
                  </button>
                  <button
                    onClick={() => setPriority('URGENT')}
                    className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      priority === 'URGENT' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Code 2
                  </button>
                  <button
                    onClick={() => setPriority('STANDARD')}
                    className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      priority === 'STANDARD' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Code 1
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Signal Preemption
                </label>
                <button
                  onClick={() => setGreenCorridor(!greenCorridor)}
                  className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    greenCorridor
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${greenCorridor ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {greenCorridor ? 'Green Corridor ON' : 'Standard Signals'}
                </button>
              </div>
            </div>
          </div>

          {/* Section: Candidate Routes */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Predicted Route Options
              </h2>
              {isLoading && (
                <span className="text-xs text-blue-600 animate-pulse font-medium">
                  Calculating ML times...
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {routes.map((r) => {
                const isSelected = selectedRouteKey === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRouteKey(r.id as any)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Header: Title and Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="text-xs font-bold text-slate-900">{r.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          r.id === 'ALPHA'
                            ? 'bg-blue-100 text-blue-800'
                            : r.id === 'BRAVO'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.tag}
                      </span>
                    </div>

                    {/* Primary Metrics: Big Time & Distance */}
                    <div className="mt-2 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold font-mono text-slate-900">{r.time}</span>
                        <span className="text-xs text-slate-500">ETA {r.eta}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{r.distance}</span>
                    </div>

                    {/* Context info */}
                    <p className="mt-1.5 text-xs text-slate-600 leading-snug">{r.summary}</p>

                    {/* Metadata tags */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{r.signals}</span>
                      <span className="font-medium text-slate-700">{r.confidence}</span>
                    </div>

                    {/* CTA if Selected */}
                    {isSelected && (
                      <div className="mt-3 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRoute(r.id);
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Start Navigation with {r.name.split(':')[0]}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: AI Routing Explanation */}
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Machine Learning Routing Insight
            </div>
            <p className="leading-relaxed text-slate-600 text-[11px]">
              Gradient-boosted decision trees recommend <strong>Route 1</strong>. While Route 2 is 36 seconds faster in theoretical free-flow, Route 1 has a calibrated <strong>94% arrival confidence</strong> and avoids the active monsoon waterlogging reported near Lower Parel.
            </p>
          </div>
        </div>
      </div>

      {/* Right Map Canvas (Interactive High-Fidelity Tactical Vector Cartography) */}
      <div className="flex-1 relative flex flex-col h-full overflow-hidden bg-slate-100">
        <TacticalMumbaiMap
          selectedRouteKey={selectedRouteKey}
          onSelectRoute={(key) => setSelectedRouteKey(key)}
          selectedVehicle={selectedVehicle}
        />
      </div>
    </div>
  );
};
