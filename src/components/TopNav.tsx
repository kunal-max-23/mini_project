import React from 'react';
import { Navigation, Route, AlertCircle, Radio, Shield, Truck } from 'lucide-react';

interface TopNavProps {
  activeTab: 'planner' | 'navigation' | 'feeds';
  setActiveTab: (tab: 'planner' | 'navigation' | 'feeds') => void;
  hasActiveAlert?: boolean;
  selectedVehicle: string;
  onSelectVehicle: (v: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  hasActiveAlert = false,
  selectedVehicle,
  onSelectVehicle,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900 tracking-tight">RapidRoute</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100">
                Mumbai
              </span>
            </div>
            <p className="text-xs text-slate-500">Emergency Vehicle Route Planning &amp; Dispatch</p>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'planner'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Route className="w-4 h-4" />
            Route Planner
          </button>

          <button
            onClick={() => setActiveTab('navigation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === 'navigation'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Navigation className="w-4 h-4" />
            Active Navigation
            {hasActiveAlert && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('feeds')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'feeds'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            Live Alerts &amp; Feeds
          </button>
        </nav>

        {/* Right Controls: Vehicle Selector & Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Active Unit:</span>
            <select
              value={selectedVehicle}
              onChange={(e) => onSelectVehicle(e.target.value)}
              className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Medic-4">🚑 Medic-4 (108 ALS Ambulance)</option>
              <option value="Engine-12">🚒 Engine-12 (101 Heavy Rescue)</option>
              <option value="Patrol-7">🚓 Patrol-7 (112 Police Rapid)</option>
            </select>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live Network
          </div>
        </div>
      </div>
    </header>
  );
};
