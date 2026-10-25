import React from 'react';
import { Radio, CornerUpRight, Plus } from 'lucide-react';

interface ActiveUnitSidebarProps {
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  onOverrideDirectives?: () => void;
  onDispatchSquad?: () => void;
}

export const ActiveUnitSidebar: React.FC<ActiveUnitSidebarProps> = ({
  selectedUnit,
  onSelectUnit,
  onOverrideDirectives,
  onDispatchSquad,
}) => {
  return (
    <aside className="w-[280px] xl:w-[320px] bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-88px)] select-none">
      <div className="p-3.5 space-y-4">
        {/* Active Unit Matrix Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
            Active Field Units
          </span>
          <span className="text-xs text-slate-500 font-medium">
            3 Dispatched
          </span>
        </div>

        {/* Units List */}
        <div className="space-y-2">
          {/* Medic-4 */}
          <div
            onClick={() => onSelectUnit('Medic-4')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedUnit === 'Medic-4'
                ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Medic-4 (MH-01-EMS)</span>
              <span className="text-xs font-medium text-red-600">
                P-1 Urgent
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>En route Marine Drive</span>
              <span className="font-mono font-semibold text-slate-800">ETA 02:40</span>
            </div>
          </div>

          {/* Engine-12 */}
          <div
            onClick={() => onSelectUnit('Engine-12')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedUnit === 'Engine-12'
                ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Engine-12 (MH-02-FB)</span>
              <span className="text-xs font-medium text-amber-600">
                Rerouting
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Worli Corridor Clearance</span>
              <span className="font-mono font-semibold text-slate-800">ETA 05:15</span>
            </div>
          </div>

          {/* Rescue-7 */}
          <div
            onClick={() => onSelectUnit('Rescue-7')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedUnit === 'Rescue-7'
                ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Rescue-7 (MH-SDRF)</span>
              <span className="text-xs font-medium text-emerald-600">
                On Scene
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>South Mumbai Grid 4</span>
              <span className="font-mono font-semibold text-slate-800">Staging</span>
            </div>
          </div>
        </div>

        {/* Tactical Directives */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <div className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
            Operational Actions
          </div>
          <button
            onClick={onOverrideDirectives}
            className="w-full py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <CornerUpRight className="w-3.5 h-3.5" />
            Override Route Directives
          </button>
          <button
            onClick={onDispatchSquad}
            className="w-full py-2 px-3 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            Dispatch Additional Squad
          </button>
        </div>
      </div>

      {/* Active Radio Frequency */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-slate-500 uppercase font-medium">
            Police Wireless Link
          </div>
          <div className="text-xs font-mono font-bold text-slate-800">154.280 MHz (VHF)</div>
        </div>
        <div className="p-2 rounded-md bg-white border border-slate-200 text-blue-600">
          <Radio className="w-4 h-4 text-blue-600" />
        </div>
      </div>
    </aside>
  );
};
