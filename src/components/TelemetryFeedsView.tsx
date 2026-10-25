import React, { useState, useEffect } from 'react';
import {
  Activity,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  CloudRain,
  Zap,
  Truck,
  Shield,
  Layers,
} from 'lucide-react';
import { fetchTelemetryHealth } from '../services/apiClient';

export const TelemetryFeedsView: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [activeApiTest, setActiveApiTest] = useState<string | null>(null);
  const [apiOutput, setApiOutput] = useState<any>(null);

  useEffect(() => {
    fetchTelemetryHealth().then(setHealthData).catch(console.error);
  }, []);

  const runApiTest = async (endpoint: string) => {
    setActiveApiTest(endpoint);
    try {
      let url = '/healthz';
      if (endpoint === 'health') url = '/api/v1/telemetry/health';
      if (endpoint === 'ml') url = '/api/v1/telemetry/ml-evaluation';

      const res = await fetch(url);
      const data = await res.json();
      setApiOutput(data);
    } catch (err: any) {
      setApiOutput({ error: err.message });
    }
  };

  const incidents = [
    {
      id: 'INC-104',
      corridor: 'Senapati Bapat Marg (Lower Parel)',
      severity: 'Moderate Delay (+4m)',
      type: 'Waterlogging & Stalled Vehicle',
      time: 'Reported 8 mins ago',
      status: 'Active Warning',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'INC-105',
      corridor: 'Worli Sea Face / Coastal Road',
      severity: 'Clear Flow',
      type: 'Emergency Green Corridor Armed',
      time: 'Signal link established',
      status: 'Optimized',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'INC-106',
      corridor: 'Eastern Freeway (Dockyard Southbound)',
      severity: 'Mild Sluggishness (+2m)',
      type: 'Heavy Port Commercial Traffic',
      time: 'Reported 14 mins ago',
      status: 'Monitored',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Live Network Alerts &amp; System Health
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time ingestion status from Mumbai Traffic Police, IMD Weather, and municipal sensors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              All Ingestion Pipelines Synchronized
            </span>
          </div>
        </div>

        {/* 4 Clean Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Traffic Network Health</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">94.2%</div>
            <p className="text-[11px] text-slate-500">MTP speed sensors nominal across 42 zones</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Signal Preemption</span>
              <Zap className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">88 Armed</div>
            <p className="text-[11px] text-slate-500">Automatic green light corridor links</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Doppler Radar (IMD)</span>
              <CloudRain className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">Clear 28°C</div>
            <p className="text-[11px] text-slate-500">0.0 mm/hr precipitation over Coastal Road</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Active Emergency Fleet</span>
              <Truck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-700">18 Units</div>
            <p className="text-[11px] text-slate-500">3 currently dispatched on active calls</p>
          </div>
        </div>

        {/* Mumbai Road Conditions & Incidents List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Active Mumbai Road Conditions &amp; Hazards
            </h2>
            <span className="text-xs text-slate-500">Live feed updated 30s ago</span>
          </div>

          <div className="divide-y divide-slate-100">
            {incidents.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{item.corridor}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeClass}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {item.type} · <span className="font-medium text-slate-800">{item.severity}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 sm:text-right font-medium">
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Node.js API Sandbox & Health Verification */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Backend System Verification &amp; API Tests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify live Node.js REST API responses directly against the running server on port 3000.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Port 3000 REST
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runApiTest('ml')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                activeApiTest === 'ml'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-blue-700 border-slate-200'
              }`}
            >
              <Play className="w-3 h-3 inline mr-1" />
              Test GET /api/v1/telemetry/ml-evaluation
            </button>

            <button
              onClick={() => runApiTest('health')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                activeApiTest === 'health'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-emerald-700 border-slate-200'
              }`}
            >
              <Play className="w-3 h-3 inline mr-1" />
              Test GET /api/v1/telemetry/health
            </button>

            <button
              onClick={() => runApiTest('healthz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                activeApiTest === 'healthz'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Play className="w-3 h-3 inline mr-1" />
              Test GET /healthz
            </button>
          </div>

          {apiOutput && (
            <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{JSON.stringify(apiOutput, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
