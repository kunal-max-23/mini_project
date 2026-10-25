import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Zap,
  CloudRain,
  Activity,
  AlertTriangle,
  MapPin,
  Shield,
  Eye,
  Info,
  Navigation,
} from 'lucide-react';

export interface TacticalMumbaiMapProps {
  selectedRouteKey: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';
  onSelectRoute?: (key: 'ALPHA' | 'BRAVO' | 'CHARLIE') => void;
  isNavigationMode?: boolean;
  rerouteAccepted?: boolean;
  selectedVehicle?: string;
}

export const TacticalMumbaiMap: React.FC<TacticalMumbaiMapProps> = ({
  selectedRouteKey,
  onSelectRoute,
  isNavigationMode = false,
  rerouteAccepted = false,
  selectedVehicle = 'Medic-4',
}) => {
  // Map View State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapTheme, setMapTheme] = useState<'CAD_LIGHT' | 'SATELLITE' | 'DARK_TRANSIT'>('CAD_LIGHT');

  // Layer Toggles
  const [showTraffic, setShowTraffic] = useState(true);
  const [showRadar, setShowRadar] = useState(false);
  const [showSignals, setShowSignals] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);

  // Vehicle progress animation state for Navigation Mode
  const [navProgress, setNavProgress] = useState(0.42); // 42% along route
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.min(Math.max(z * zoomFactor, 0.7), 2.5));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Color theme definitions
  const theme = {
    CAD_LIGHT: {
      bg: '#f8fafc',
      water: '#e0f2fe',
      waterBorder: '#bae6fd',
      coastGlow: '#dbeafe',
      land: '#ffffff',
      landBorder: '#e2e8f0',
      parks: '#ecfdf5',
      parksBorder: '#a7f3d0',
      roadsLocal: '#f1f5f9',
      roadsMajor: '#cbd5e1',
      roadCasing: '#94a3b8',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      textWater: '#0284c7',
    },
    SATELLITE: {
      bg: '#090d16',
      water: '#071529',
      waterBorder: '#0e2b4d',
      coastGlow: '#0d223a',
      land: '#111827',
      landBorder: '#1f2937',
      parks: '#064e3b',
      parksBorder: '#047857',
      roadsLocal: '#1e293b',
      roadsMajor: '#334155',
      roadCasing: '#475569',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textWater: '#38bdf8',
    },
    DARK_TRANSIT: {
      bg: '#0f172a',
      water: '#0c1b30',
      waterBorder: '#1e3a5f',
      coastGlow: '#172554',
      land: '#1e293b',
      landBorder: '#334155',
      parks: '#062d24',
      parksBorder: '#0d5445',
      roadsLocal: '#334155',
      roadsMajor: '#475569',
      roadCasing: '#64748b',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      textWater: '#38bdf8',
    },
  }[mapTheme];

  return (
    <div
      className="relative w-full h-full select-none overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
      style={{ backgroundColor: theme.bg }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Dynamic Keyframe Animations for Map */}
      <style>{`
        @keyframes flowPulse {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes waterRipple {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        @keyframes radarSweep {
          0% { opacity: 0.25; transform: rotate(0deg); }
          50% { opacity: 0.45; }
          100% { opacity: 0.25; transform: rotate(360deg); }
        }
        .route-flow-active {
          stroke-dasharray: 12, 12;
          animation: flowPulse 1.2s linear infinite;
        }
        .water-wave-anim {
          animation: waterRipple 4s ease-in-out infinite;
        }
      `}</style>

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Map Layer Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200/90 shadow-sm pointer-events-auto text-xs">
          <div className="flex items-center gap-1 pr-2 border-r border-slate-200 font-semibold text-slate-800">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Theme:</span>
          </div>

          <button
            onClick={() => setMapTheme('CAD_LIGHT')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              mapTheme === 'CAD_LIGHT'
                ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tactical Light
          </button>
          <button
            onClick={() => setMapTheme('SATELLITE')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              mapTheme === 'SATELLITE'
                ? 'bg-slate-800 text-white shadow-2xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Satellite Dark
          </button>
        </div>

        {/* Feature Toggles */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200/90 shadow-sm pointer-events-auto text-xs">
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              showTraffic
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Toggle Live Traffic Flow"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Traffic</span>
          </button>

          <button
            onClick={() => setShowSignals(!showSignals)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              showSignals
                ? 'bg-blue-50 text-blue-800 border border-blue-300'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Toggle Green Corridor Preemption Signals"
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Signals</span>
          </button>

          <button
            onClick={() => setShowRadar(!showRadar)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              showRadar
                ? 'bg-sky-50 text-sky-800 border border-sky-300'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Toggle IMD Doppler Monsoon Radar Overlay"
          >
            <CloudRain className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Radar</span>
          </button>
        </div>

        {/* Zoom & Reset Floating Buttons */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-sm pointer-events-auto">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
            className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg text-base font-bold cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.7))}
            className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg text-base font-bold cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
            title="Reset Center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Info Tooltip Banner */}
      {hoveredInfo && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-md backdrop-blur-xs flex items-center gap-2 pointer-events-none animate-fadeIn">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          {hoveredInfo}
        </div>
      )}

      {/* Bottom Floating Legend & Telemetry Bar */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm rounded-xl px-3.5 py-2 text-xs flex flex-wrap items-center gap-3.5 text-slate-700 pointer-events-auto">
          {/* Route 1 */}
          <button
            onClick={() => onSelectRoute && onSelectRoute('ALPHA')}
            className={`flex items-center gap-1.5 font-semibold cursor-pointer transition-opacity ${
              selectedRouteKey === 'ALPHA' ? 'opacity-100 text-blue-700' : 'opacity-60 hover:opacity-90'
            }`}
          >
            <span className="w-3.5 h-1.5 rounded-full bg-[#2563eb]" />
            Route 1 (Coastal Rd)
          </button>

          {/* Route 2 */}
          <button
            onClick={() => onSelectRoute && onSelectRoute('BRAVO')}
            className={`flex items-center gap-1.5 font-semibold cursor-pointer transition-opacity ${
              selectedRouteKey === 'BRAVO' ? 'opacity-100 text-purple-700' : 'opacity-60 hover:opacity-90'
            }`}
          >
            <span className="w-3.5 h-1.5 rounded-full bg-[#7c3aed]" />
            Route 2 (Freeway)
          </button>

          {/* Route 3 */}
          <button
            onClick={() => onSelectRoute && onSelectRoute('CHARLIE')}
            className={`flex items-center gap-1.5 font-semibold cursor-pointer transition-opacity ${
              selectedRouteKey === 'CHARLIE' ? 'opacity-100 text-amber-700' : 'opacity-60 hover:opacity-90'
            }`}
          >
            <span className="w-3.5 h-1.5 rounded-full bg-[#d97706]" />
            Route 3 (Senapati Bapat)
          </button>

          {/* Route Delta if in reroute */}
          {rerouteAccepted && (
            <div className="flex items-center gap-1.5 font-bold text-sky-700">
              <span className="w-3.5 h-1.5 rounded-full bg-[#0284c7]" />
              Route Delta (Bypass Active)
            </div>
          )}

          {/* Hazard */}
          <div className="flex items-center gap-1 text-rose-700 font-semibold pl-2 border-l border-slate-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Hazard: Worli Naka
          </div>
        </div>

        {/* Map Scale Bar */}
        <div className="hidden md:flex items-center gap-2 bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-500 shadow-2xs pointer-events-auto">
          <span>0</span>
          <div className="w-16 h-1 bg-slate-400 relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-700" />
          </div>
          <span>2.5 km</span>
        </div>
      </div>

      {/* Bottom Right Coordinates & Heading */}
      <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 shadow-2xs pointer-events-none">
        <div className="flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>HDG 345° NNW</span>
        </div>
        <span>·</span>
        <span>18.9912° N, 72.8256° E</span>
        <span>·</span>
        <span className="text-emerald-700 font-medium">NavIC Dual-L5 Fix</span>
      </div>

      {/* SVG Vector Map Canvas */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 700"
          className="w-full h-full max-h-[96vh] object-contain transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <defs>
            {/* Ambient Route Glow Filters */}
            <filter id="route-glow-blue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="route-glow-purple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="route-glow-sky" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Linear Gradients for Sea and Coast */}
            <linearGradient id="arabian-sea-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.water} stopOpacity="1" />
              <stop offset="100%" stopColor={theme.coastGlow} stopOpacity="0.85" />
            </linearGradient>

            {/* Coastal Tunnel Pattern */}
            <pattern id="tunnel-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#3b82f6" strokeWidth="2.5" />
            </pattern>

            {/* Radar Cloud Mesh Gradient */}
            <radialGradient id="radar-mesh" cx="45%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.25" />
              <stop offset="85%" stopColor="#818cf8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Base Sea & Water Layer */}
          <rect width="1000" height="700" fill="url(#arabian-sea-grad)" />

          {/* Subtle Water Depth Contour Bands */}
          <path
            d="M 0,0 L 220,0 Q 180,180 150,340 T 110,550 L 50,700 L 0,700 Z"
            fill={theme.waterBorder}
            opacity="0.4"
            className="water-wave-anim"
          />
          <path
            d="M 820,0 L 1000,0 L 1000,700 L 780,700 Q 750,420 820,0 Z"
            fill={theme.waterBorder}
            opacity="0.35"
          />

          {/* 2. Realistic Land Contour of South & Central Mumbai Peninsula */}
          {/* Mumbai Main Landmass */}
          <path
            d="
              M 260,20
              L 740,20
              L 740,160
              Q 760,240 730,340
              Q 720,440 680,520
              L 650,600
              L 400,670
              L 300,670
              L 280,620
              L 270,550
              Q 260,490 220,470
              Q 170,440 210,380
              Q 230,340 220,280
              L 200,240
              Q 230,180 280,170
              L 260,20
              Z
            "
            fill={theme.land}
            stroke={theme.landBorder}
            strokeWidth="2.5"
          />

          {/* Back Bay (Between Marine Drive & Malabar Hill) */}
          <path
            d="
              M 270,550
              Q 230,520 220,470
              Q 240,490 270,550
              Z
            "
            fill="url(#arabian-sea-grad)"
            stroke={theme.waterBorder}
            strokeWidth="1.5"
          />

          {/* Mahim Bay / Mithi Estuary Water Ingress */}
          <path
            d="
              M 200,240
              Q 260,260 280,210
              Q 250,190 200,240
              Z
            "
            fill="url(#arabian-sea-grad)"
            stroke={theme.waterBorder}
            strokeWidth="1.5"
          />

          {/* 3. Parks & Greenery Sanctuaries */}
          {/* Mahalaxmi Racecourse Oval */}
          <g
            onMouseEnter={() => setHoveredInfo('Mahalaxmi Racecourse & Sports Grounds')}
            onMouseLeave={() => setHoveredInfo(null)}
          >
            <ellipse cx="270" cy="380" rx="28" ry="18" fill={theme.parks} stroke={theme.parksBorder} strokeWidth="1.5" transform="rotate(-20 270 380)" />
            <ellipse cx="270" cy="380" rx="20" ry="12" fill="none" stroke={theme.parksBorder} strokeWidth="1" strokeDasharray="3 2" transform="rotate(-20 270 380)" />
            <text x="270" y="383" fill="#047857" fontSize="8" fontWeight="600" textAnchor="middle">
              Racecourse
            </text>
          </g>

          {/* Hanging Gardens & Malabar Hill Reserve */}
          <path
            d="M 190,450 Q 220,440 210,470 Q 180,480 190,450 Z"
            fill={theme.parks}
            stroke={theme.parksBorder}
            strokeWidth="1"
          />
          <text x="202" y="462" fill="#047857" fontSize="7.5" fontWeight="600" textAnchor="middle">
            Hanging Gdns
          </text>

          {/* Oval Maidan / Cross Maidan in South Mumbai */}
          <rect x="295" y="580" width="16" height="42" rx="3" fill={theme.parks} stroke={theme.parksBorder} strokeWidth="1" />
          <text x="303" y="605" fill="#047857" fontSize="7" fontWeight="600" transform="rotate(-90 303 605)" textAnchor="middle">
            Oval Maidan
          </text>

          {/* Shivaji Park in Dadar */}
          <circle cx="310" cy="190" r="14" fill={theme.parks} stroke={theme.parksBorder} strokeWidth="1" />
          <text x="310" y="193" fill="#047857" fontSize="7" fontWeight="600" textAnchor="middle">
            Shivaji Park
          </text>

          {/* 4. Iconic Infrastructure: Bandra-Worli Sea Link (Cable-Stayed Bridge) */}
          <g
            className="cursor-pointer"
            onMouseEnter={() => setHoveredInfo('Bandra-Worli Sea Link (8-Lane Cable-Stayed Viaduct)')}
            onMouseLeave={() => setHoveredInfo(null)}
          >
            {/* Bridge Deck Viaduct */}
            <path
              d="M 215,280 Q 235,240 280,210"
              fill="none"
              stroke="#64748b"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 215,280 Q 235,240 280,210"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Cable-Stayed Pylons & Fan Array */}
            <g transform="translate(235, 245)">
              {/* Twin Pylon Towers */}
              <line x1="-3" y1="12" x2="0" y2="-18" stroke="#334155" strokeWidth="2.5" />
              <line x1="3" y1="12" x2="0" y2="-18" stroke="#334155" strokeWidth="2.5" />
              <circle cx="0" cy="-18" r="2.5" fill="#f59e0b" />
              {/* Cable Stay Lines */}
              <line x1="0" y1="-15" x2="-18" y2="10" stroke="#94a3b8" strokeWidth="0.75" />
              <line x1="0" y1="-12" x2="-12" y2="10" stroke="#94a3b8" strokeWidth="0.75" />
              <line x1="0" y1="-15" x2="18" y2="10" stroke="#94a3b8" strokeWidth="0.75" />
              <line x1="0" y1="-12" x2="12" y2="10" stroke="#94a3b8" strokeWidth="0.75" />
            </g>
            <text x="248" y="235" fill="#475569" fontSize="8" fontWeight="600" transform="rotate(-36 248 235)">
              Sea Link
            </text>
          </g>

          {/* 5. City Road Network Grid */}
          <g stroke={theme.roadsLocal} strokeWidth="1.5" fill="none">
            {/* South Mumbai East-West connecting cross streets */}
            <line x1="260" y1="620" x2="380" y2="620" />
            <line x1="270" y1="560" x2="420" y2="560" />
            <line x1="280" y1="500" x2="480" y2="500" />
            <line x1="260" y1="440" x2="550" y2="440" />
            <line x1="250" y1="360" x2="620" y2="360" />
            <line x1="240" y1="300" x2="650" y2="300" />
            <line x1="260" y1="240" x2="680" y2="240" />
            <line x1="280" y1="180" x2="700" y2="180" />
            <line x1="270" y1="120" x2="710" y2="120" />

            {/* North-South avenues */}
            <line x1="330" y1="50" x2="330" y2="650" />
            <line x1="410" y1="50" x2="410" y2="650" />
            <line x1="490" y1="50" x2="490" y2="650" />
            <line x1="570" y1="50" x2="570" y2="650" />
            <line x1="650" y1="50" x2="650" y2="650" />
          </g>

          {/* 6. Major Primary Arterials with Dual-Casing */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Marine Drive (Queen's Necklace promenade) */}
            <path
              d="M 285,650 L 275,560 Q 270,510 240,490"
              stroke={theme.roadCasing}
              strokeWidth="5"
            />
            <path
              d="M 285,650 L 275,560 Q 270,510 240,490"
              stroke={theme.roadsMajor}
              strokeWidth="3.5"
            />

            {/* Western Railway Corridor Line */}
            <path
              d="M 320,650 L 330,500 L 340,360 L 320,180 L 310,40"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Dr. Babasaheb Ambedkar Road (Central Spine) */}
            <path
              d="M 400,650 L 410,500 L 430,380 L 460,260 L 480,80"
              stroke={theme.roadCasing}
              strokeWidth="4.5"
            />
            <path
              d="M 400,650 L 410,500 L 430,380 L 460,260 L 480,80"
              stroke={theme.roadsMajor}
              strokeWidth="3"
            />

            {/* Eastern Freeway (Elevated Corridor along East Coast) */}
            <path
              d="M 420,660 L 490,620 L 590,520 Q 640,420 630,280 L 610,140"
              stroke={theme.roadCasing}
              strokeWidth="5"
            />
            <path
              d="M 420,660 L 490,620 L 590,520 Q 640,420 630,280 L 610,140"
              stroke={theme.roadsMajor}
              strokeWidth="3.5"
            />

            {/* Senapati Bapat Marg (Lower Parel Corridor) */}
            <path
              d="M 330,500 L 350,420 L 370,330 L 360,240"
              stroke={theme.roadCasing}
              strokeWidth="4.5"
            />
            <path
              d="M 330,500 L 350,420 L 370,330 L 360,240"
              stroke={theme.roadsMajor}
              strokeWidth="3"
            />

            {/* Coastal Road & Worli Sea Face Promenade */}
            <path
              d="M 285,650 L 250,560 Q 210,480 230,420 Q 240,370 215,310 L 220,280"
              stroke={theme.roadCasing}
              strokeWidth="6"
            />
            <path
              d="M 285,650 L 250,560 Q 210,480 230,420 Q 240,370 215,310 L 220,280"
              stroke={theme.roadsMajor}
              strokeWidth="4"
            />
          </g>

          {/* 7. Live Traffic Flow Congestion Overlay (If Enabled) */}
          {showTraffic && (
            <g fill="none" strokeLinecap="round" opacity="0.85">
              {/* Green free-flow on Coastal Road */}
              <path d="M 285,650 L 250,560 Q 210,480 230,420" stroke="#10b981" strokeWidth="2.5" />
              <path d="M 230,420 Q 240,370 215,310" stroke="#10b981" strokeWidth="2.5" />

              {/* Amber slow-down near Haji Ali */}
              <path d="M 230,430 L 270,410" stroke="#f59e0b" strokeWidth="2.5" />

              {/* Red congestion on Senapati Bapat near Lower Parel */}
              <path d="M 350,420 L 370,330" stroke="#ef4444" strokeWidth="3" strokeDasharray="3 2" />

              {/* Green on Eastern Freeway high-span */}
              <path d="M 490,620 L 590,520 Q 640,420 630,280" stroke="#10b981" strokeWidth="2.5" />
            </g>
          )}

          {/* 8. IMD Doppler Monsoon Radar Shimmer Layer (If Enabled) */}
          {showRadar && (
            <g className="pointer-events-none">
              <circle cx="480" cy="340" r="140" fill="url(#radar-mesh)" />
              <circle cx="480" cy="340" r="90" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
              <circle cx="480" cy="340" r="140" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 6" opacity="0.3" />
              <text x="510" y="320" fill="#0284c7" fontSize="9" fontWeight="bold">
                IMD Radar: Coastal Monsoon Mesh (0.0 mm/h)
              </text>
            </g>
          )}

          {/* 9. Candidate Routes (The Visual Heart of the Routing Engine) */}

          {/* ROUTE 3 (Senapati Bapat Marg - Amber) */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectRoute && onSelectRoute('CHARLIE')}
            onMouseEnter={() => setHoveredInfo('Route 3: Senapati Bapat Marg (11m 15s • Delay Risk)')}
            onMouseLeave={() => setHoveredInfo(null)}
          >
            {/* Casing / Glow */}
            <path
              d="M 285,650 L 310,580 L 330,500 L 350,420 L 370,330 L 430,310 L 480,280"
              fill="none"
              stroke="#fef3c7"
              strokeWidth={selectedRouteKey === 'CHARLIE' ? '9' : '4.5'}
              strokeOpacity="0.8"
            />
            {/* Main Path */}
            <path
              d="M 285,650 L 310,580 L 330,500 L 350,420 L 370,330 L 430,310 L 480,280"
              fill="none"
              stroke="#d97706"
              strokeWidth={selectedRouteKey === 'CHARLIE' ? '5.5' : '3'}
              strokeDasharray={selectedRouteKey === 'CHARLIE' ? 'none' : '5,5'}
            />
          </g>

          {/* ROUTE 2 (Eastern Freeway - Purple) */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectRoute && onSelectRoute('BRAVO')}
            onMouseEnter={() => setHoveredInfo('Route 2: Eastern Freeway Express (7m 48s • High Variance)')}
            onMouseLeave={() => setHoveredInfo(null)}
          >
            {/* Casing / Glow */}
            <path
              d="M 285,650 L 420,660 L 490,620 L 590,520 Q 640,420 630,280 L 560,270 L 480,280"
              fill="none"
              stroke="#f3e8ff"
              strokeWidth={selectedRouteKey === 'BRAVO' ? '9' : '4.5'}
              strokeOpacity="0.8"
            />
            {/* Main Path */}
            <path
              d="M 285,650 L 420,660 L 490,620 L 590,520 Q 640,420 630,280 L 560,270 L 480,280"
              fill="none"
              stroke="#7c3aed"
              strokeWidth={selectedRouteKey === 'BRAVO' ? '5.5' : '3'}
              strokeDasharray={selectedRouteKey === 'BRAVO' ? 'none' : '5,5'}
            />
          </g>

          {/* ROUTE 1 (Coastal Road & Worli Sea Face - Vibrant Royal Blue - RECOMMENDED) */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectRoute && onSelectRoute('ALPHA')}
            onMouseEnter={() => setHoveredInfo('Route 1: Coastal Road & Sea Face (8m 24s • RECOMMENDED)')}
            onMouseLeave={() => setHoveredInfo(null)}
          >
            {/* Outer Ambient Glow */}
            <path
              d="M 285,650 L 250,560 Q 210,480 230,420 Q 240,370 215,310 L 250,290 L 370,290 L 480,280"
              fill="none"
              stroke="#93c5fd"
              strokeWidth={selectedRouteKey === 'ALPHA' ? '12' : '6'}
              strokeOpacity={selectedRouteKey === 'ALPHA' ? '0.6' : '0.2'}
              strokeLinecap="round"
              filter="url(#route-glow-blue)"
            />
            {/* Casing */}
            <path
              d="M 285,650 L 250,560 Q 210,480 230,420 Q 240,370 215,310 L 250,290 L 370,290 L 480,280"
              fill="none"
              stroke="#ffffff"
              strokeWidth={selectedRouteKey === 'ALPHA' ? '7' : '4.5'}
              strokeLinecap="round"
            />
            {/* Core Blue Vector */}
            <path
              d="M 285,650 L 250,560 Q 210,480 230,420 Q 240,370 215,310 L 250,290 L 370,290 L 480,280"
              fill="none"
              stroke="#2563eb"
              strokeWidth={selectedRouteKey === 'ALPHA' ? '5' : '3'}
              strokeLinecap="round"
            />
            {/* Animated Flow Pulse Line when Selected */}
            {selectedRouteKey === 'ALPHA' && (
              <path
                d="M 285,650 L 250,560 Q 210,480 230,420 Q 240,370 215,310 L 250,290 L 370,290 L 480,280"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="route-flow-active"
              />
            )}
          </g>

          {/* DYNAMIC REROUTE DELTA (Tulsi Pipe Bypass) */}
          {rerouteAccepted && (
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredInfo('Route Delta: Tulsi Pipe Bypass (Saves 5.2m)')}
              onMouseLeave={() => setHoveredInfo(null)}
            >
              <path
                d="M 230,420 Q 280,410 340,380 L 400,340 L 480,280"
                fill="none"
                stroke="#bae6fd"
                strokeWidth="11"
                strokeOpacity="0.75"
                filter="url(#route-glow-sky)"
              />
              <path
                d="M 230,420 Q 280,410 340,380 L 400,340 L 480,280"
                fill="none"
                stroke="#0284c7"
                strokeWidth="5"
                strokeLinecap="round"
                className="route-flow-active"
              />
            </g>
          )}

          {/* 10. Smart Traffic Preemption Signals (Green Corridor Shields) */}
          {showSignals && (
            <g className="pointer-events-none">
              {/* Intersection 1: Marine Drive onramp */}
              <circle cx="250" cy="560" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              {/* Intersection 2: Haji Ali junction */}
              <circle cx="230" cy="420" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              {/* Intersection 3: Worli Sea Face South */}
              <circle cx="215" cy="310" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              {/* Intersection 4: Dr. Annie Besant Rd */}
              <circle cx="250" cy="290" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              {/* Intersection 5: Lower Parel Flyover receiving */}
              <circle cx="370" cy="290" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {/* 11. Obstruction / Hazard Beacon at Worli Naka / Senapati Bapat Marg */}
          {showHazards && (
            <g
              transform="translate(370, 330)"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredInfo('Obstruction: Senapati Bapat Marg waterlogged lane (+6.4m delay)')}
              onMouseLeave={() => setHoveredInfo(null)}
            >
              <circle cx="0" cy="0" r="16" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.5" className="animate-ping" opacity="0.7" />
              <circle cx="0" cy="0" r="11" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
              {/* Warning Triangle Symbol */}
              <path d="M 0,-5 L 4,3 L -4,3 Z" fill="#ffffff" />
              <rect x="-0.5" y="-1.5" width="1" height="2" fill="#dc2626" />
              <circle cx="0" cy="1.5" r="0.5" fill="#dc2626" />

              {/* Tag Callout */}
              <rect x="15" y="-11" width="128" height="22" rx="4" fill="#ffffff" stroke="#fca5a5" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
              <text x="22" y="4" fill="#991b1b" fontSize="9" fontWeight="bold">
                Waterlogged Section (+6m)
              </text>
            </g>
          )}

          {/* 12. Origin Marker A (Nariman Point / Marine Drive) */}
          <g
            transform="translate(285, 650)"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredInfo('Origin: Nariman Point / Marine Drive Dispatch Stn')}
            onMouseLeave={() => setHoveredInfo(null)}
          >
            <circle cx="0" cy="0" r="22" fill="#10b981" fillOpacity="0.2" className="animate-ping" />
            <circle cx="0" cy="0" r="12" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.2))" />
            <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
              A
            </text>
            <rect x="-65" y="18" width="130" height="24" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.12))" />
            <text x="0" y="34" fill="#0f172a" fontSize="10.5" fontWeight="bold" textAnchor="middle">
              Origin: Nariman Point
            </text>
          </g>

          {/* 13. Destination Marker B (KEM Hospital Apex Trauma Centre, Parel) */}
          <g
            transform="translate(480, 280)"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredInfo('Destination: KEM Hospital Apex Level-1 Trauma Centre')}
            onMouseLeave={() => setHoveredInfo(null)}
          >
            <circle cx="0" cy="0" r="24" fill="#ef4444" fillOpacity="0.2" className="animate-ping" />
            <circle cx="0" cy="0" r="14" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.25))" />
            {/* Hospital White Cross */}
            <rect x="-2.5" y="-8" width="5" height="16" fill="#ffffff" />
            <rect x="-8" y="-2.5" width="16" height="5" fill="#ffffff" />
            <rect x="-75" y="-38" width="150" height="26" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.12))" />
            <text x="0" y="-21" fill="#0f172a" fontSize="11" fontWeight="bold" textAnchor="middle">
              Destination: KEM Trauma
            </text>
          </g>

          {/* 14. Live Emergency Vehicle (In Navigation Mode) */}
          {isNavigationMode && (
            <g
              transform={
                rerouteAccepted
                  ? 'translate(340, 380)' // progressing along Route Delta
                  : 'translate(230, 420)' // at Worli Sea Face on Route Alpha
              }
              className="cursor-pointer"
              onMouseEnter={() => setHoveredInfo(`${selectedVehicle} · Speed: 58 km/h · ETA: 14:32 IST`)}
              onMouseLeave={() => setHoveredInfo(null)}
            >
              {/* Emergency vehicle lightbar glow */}
              <circle cx="0" cy="0" r="20" fill="#2563eb" fillOpacity="0.3" className="animate-ping" />
              <circle cx="0" cy="0" r="12" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.3))" />

              {/* Navigation Directional Arrow */}
              <Navigation className="w-3.5 h-3.5 text-white -rotate-45" />

              {/* Vehicle ID Callout */}
              <rect x="-42" y="16" width="84" height="20" rx="4" fill="#1e293b" stroke="#ffffff" strokeWidth="1" />
              <text x="0" y="30" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                {selectedVehicle} (58 km/h)
              </text>
            </g>
          )}

          {/* Geographic Text Annotations */}
          <g fill={theme.textWater} opacity="0.75" fontWeight="600" letterSpacing="2" className="pointer-events-none">
            <text x="60" y="120" fontSize="15">ARABIAN SEA</text>
            <text x="70" y="490" fontSize="12">Back Bay</text>
            <text x="145" y="270" fontSize="11" letterSpacing="1">Mahim Bay</text>
            <text x="820" y="380" fontSize="13">MUMBAI HARBOUR</text>
          </g>

          {/* Neighborhood Labels on Land */}
          <g fill={theme.textSecondary} fontSize="9" fontWeight="600" opacity="0.85" className="pointer-events-none">
            <text x="270" y="615">Churchgate</text>
            <text x="270" y="530">Marine Lines</text>
            <text x="280" y="470">Girgaon</text>
            <text x="310" y="390">Mahalaxmi</text>
            <text x="235" y="335">Worli Sea Face</text>
            <text x="365" y="350">Lower Parel</text>
            <text x="495" y="255">Parel Medical Hub</text>
            <text x="325" y="170">Dadar West</text>
            <text x="285" y="130">Bandra West</text>
            <text x="590" y="390">Sewri Docks</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
