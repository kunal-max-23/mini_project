/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TopNav } from './components/TopNav';
import { LiveDispatchView } from './components/LiveDispatchView';
import { ActiveRerouteView } from './components/ActiveRerouteView';
import { TelemetryFeedsView } from './components/TelemetryFeedsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'planner' | 'navigation' | 'feeds'>('planner');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('Medic-4');
  const [hasActiveAlert, setHasActiveAlert] = useState<boolean>(true);

  const handleConfirmAndNavigate = (routeKey: string) => {
    setActiveTab('navigation');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-['Inter'] antialiased">
      {/* Clean, Single-Row Header */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveAlert={hasActiveAlert}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
      />

      {/* Main Operational View */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'planner' && (
          <LiveDispatchView
            onConfirmAndNavigate={handleConfirmAndNavigate}
            selectedVehicle={selectedVehicle}
          />
        )}

        {activeTab === 'navigation' && (
          <ActiveRerouteView
            onBackToDispatch={() => setActiveTab('planner')}
            selectedVehicle={selectedVehicle}
          />
        )}

        {activeTab === 'feeds' && (
          <TelemetryFeedsView />
        )}
      </main>
    </div>
  );
}
