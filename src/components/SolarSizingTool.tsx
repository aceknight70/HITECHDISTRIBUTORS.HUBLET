/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sun, ShieldAlert, Cpu, Zap } from 'lucide-react';
import { SolarProduct } from '../types';
import { SOLAR } from '../data';

interface SolarSizingToolProps {
  onAddSolarProduct: (solarId: string, qty: number) => void;
  onNavigate: (roomId: string) => void;
}

interface ApplianceInfo {
  name: string;
  watts: number;
  qty: number;
  hours: number;
}

export default function SolarSizingTool({ onAddSolarProduct, onNavigate }: SolarSizingToolProps) {
  const [customAppliances, setCustomAppliances] = useState<ApplianceInfo[]>([
    { name: 'LED Bulbs', watts: 15, qty: 5, hours: 8 },
    { name: 'Standing Fans', watts: 65, qty: 3, hours: 10 },
    { name: 'Smart TV', watts: 120, qty: 1, hours: 6 },
    { name: 'Refrigerator / Freezer', watts: 250, qty: 1, hours: 24 },
    { name: 'Laptops', watts: 80, qty: 2, hours: 8 }
  ]);

  const [newAppName, setNewAppName] = useState('');
  const [newAppWatts, setNewAppWatts] = useState('');
  const [newAppQty, setNewAppQty] = useState('1');
  const [newAppHours, setNewAppHours] = useState('6');

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [recommendation, setRecommendation] = useState<any | null>(null);

  const addCustomAppliance = () => {
    if (!newAppName || !newAppWatts) return;
    const item: ApplianceInfo = {
      name: newAppName,
      watts: parseFloat(newAppWatts) || 50,
      qty: parseInt(newAppQty) || 1,
      hours: parseFloat(newAppHours) || 4
    };
    setCustomAppliances([...customAppliances, item]);
    setNewAppName('');
    setNewAppWatts('');
  };

  const removeAppliance = (index: number) => {
    setCustomAppliances(customAppliances.filter((_, i) => i !== index));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setRecommendation(null);
    
    // Simulate reassuring wizard states
    const messages = [
      "Analyzing electrical load patterns...",
      "Matching peak surge parameters...",
      "Selecting optimum high-efficiency pure sine wave solar inverters...",
      "Configuring optimal lithium-phosphate / tubular storage cycle rates...",
      "Engineering bespoke solar charge panel counts..."
    ];

    let msgIdx = 0;
    setLoadingMessage(messages[0]);
    const timer = setInterval(() => {
      msgIdx++;
      if (msgIdx < messages.length) {
        setLoadingMessage(messages[msgIdx]);
      }
    }, 1200);

    try {
      const response = await fetch('/api/gemini/solar-sizing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appliances: customAppliances })
      });
      const data = await response.json();
      setRecommendation(data);
    } catch (err) {
      console.error(err);
      // Fallback
      setRecommendation({
        recommendedInverterId: "s4",
        recommendedBatteryId: "s10",
        recommendedPanelId: "s19",
        inverterCount: 1,
        batteryCount: 1,
        panelCount: 3,
        totalPrice: "₦835,000",
        reasoning: "Matched a premium Cworth 1.8KVA hybrid inverter system. Highly efficient for continuous small-appliances load with robust backup battery cycles."
      });
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  const matchedInverter = SOLAR.find(s => s.id === recommendation?.recommendedInverterId);
  const matchedBattery = SOLAR.find(s => s.id === recommendation?.recommendedBatteryId);
  const matchedPanel = SOLAR.find(s => s.id === recommendation?.recommendedPanelId);

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sun className="text-[#F5C518] w-5 h-5" />
        <h3 className="text-sm tracking-widest uppercase font-bold text-[#F5C518]">AI Solar Sizing Specialist</h3>
      </div>
      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
        Enter your routine household appliances or office equipment loads, and let our Gemini-powered intelligent architect tailor the optimum solar power backup combination.
      </p>

      {/* Appliances List */}
      <div className="space-y-2 mb-4">
        {customAppliances.map((app, index) => (
          <div key={index} className="flex justify-between items-center bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs">
            <div>
              <span className="font-semibold text-zinc-200">{app.name}</span>
              <span className="text-zinc-500 block">
                {app.qty}x · {app.watts}W · {app.hours} hrs/day
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[#F5C518]">{(app.watts * app.qty * app.hours / 1000).toFixed(2)} kWh</span>
              <button 
                onClick={() => removeAppliance(index)}
                className="text-red-500 hover:text-red-400 font-bold px-1"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Appliance */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <input 
          type="text" 
          placeholder="Appliance (e.g. Fridge, TV)" 
          className="bg-[#0a0a0a] border border-[#262626] rounded px-2 py-1 text-xs text-[#f5f5f5]"
          value={newAppName}
          onChange={e => setNewAppName(e.target.value)}
        />
        <input 
          type="number" 
          placeholder="Watts" 
          className="bg-[#0a0a0a] border border-[#262626] rounded px-2 py-1 text-xs text-[#f5f5f5]"
          value={newAppWatts}
          onChange={e => setNewAppWatts(e.target.value)}
        />
        <div className="flex gap-2 col-span-2">
          <input 
            type="number" 
            placeholder="Qty" 
            className="w-1/2 bg-[#0a0a0a] border border-[#262626] rounded px-2 py-1 text-xs text-[#f5f5f5]"
            value={newAppQty}
            onChange={e => setNewAppQty(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Hrs/day" 
            className="w-1/2 bg-[#0a0a0a] border border-[#262626] rounded px-2 py-1 text-xs text-[#f5f5f5]"
            value={newAppHours}
            onChange={e => setNewAppHours(e.target.value)}
          />
        </div>
        <button 
          onClick={addCustomAppliance}
          className="col-span-2 py-1.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-xs text-white rounded font-medium transition-colors"
        >
          + Add Appliance Load
        </button>
      </div>

      {/* Trigger Button */}
      <button
        onClick={handleCalculate}
        disabled={loading || customAppliances.length === 0}
        className="w-full py-2.5 bg-gradient-to-r from-[#CC0000] to-[#990000] hover:from-red-600 hover:to-red-700 text-xs font-bold uppercase tracking-wider text-white rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
      >
        {loading ? "Engineering system..." : "Calculate Optimum AI Setup →"}
      </button>

      {/* Loading Block */}
      {loading && (
        <div className="mt-4 p-4 bg-[#0a0a0a] border border-zinc-800 rounded-lg flex flex-col items-center justify-center text-center">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs text-zinc-300 font-mono italic animate-pulse">{loadingMessage}</p>
        </div>
      )}

      {/* Recommendation Results card */}
      {recommendation && (
        <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#262626] rounded-lg">
          <div className="text-center pb-3 border-b border-[#262626] mb-3">
            <span className="text-[10px] uppercase text-zinc-500 tracking-widest font-bold block">Estimated Package Price</span>
            <span className="text-2xl font-mono text-[#F5C518] font-bold">{recommendation.totalPrice}</span>
          </div>

          <div className="space-y-3 mb-4">
            {/* Inverter */}
            {matchedInverter && (
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-zinc-500 uppercase text-[9px] font-bold block">Inverter Recommended (x{recommendation.inverterCount || 1})</span>
                  <span className="text-zinc-200 font-medium">{matchedInverter.n}</span>
                </div>
                <button
                  onClick={() => {
                    onAddSolarProduct(matchedInverter.id, recommendation.inverterCount || 1);
                    alert(`Added ${matchedInverter.n} to solar cart`);
                  }}
                  className="px-2 py-1 bg-[#141414] hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700 rounded transition-colors"
                >
                  + Add
                </button>
              </div>
            )}
            
            {/* Battery */}
            {matchedBattery && (
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-zinc-500 uppercase text-[9px] font-bold block">Battery Bank (x{recommendation.batteryCount || 1})</span>
                  <span className="text-zinc-200 font-medium">{matchedBattery.n}</span>
                </div>
                <button
                  onClick={() => {
                    onAddSolarProduct(matchedBattery.id, recommendation.batteryCount || 1);
                    alert(`Added ${matchedBattery.n} to solar cart`);
                  }}
                  className="px-2 py-1 bg-[#141414] hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700 rounded transition-colors"
                >
                  + Add
                </button>
              </div>
            )}

            {/* Panels */}
            {matchedPanel && (
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-zinc-500 uppercase text-[9px] font-bold block">Solar Panels Array (x{recommendation.panelCount || 1})</span>
                  <span className="text-zinc-200 font-medium">{matchedPanel.n}</span>
                </div>
                <button
                  onClick={() => {
                    onAddSolarProduct(matchedPanel.id, recommendation.panelCount || 1);
                    alert(`Added ${matchedPanel.n} to solar cart`);
                  }}
                  className="px-2 py-1 bg-[#141414] hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700 rounded transition-colors"
                >
                  + Add
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-[#141414] border border-[#262626] rounded text-xs text-zinc-300 leading-relaxed italic">
            "{recommendation.reasoning || recommendation.explanation}"
          </div>

          <button 
            onClick={() => onNavigate('invoice')}
            className="w-full mt-3 py-1.5 bg-[#F5C518] hover:bg-amber-500 text-[#0a0a0a] text-xs font-bold uppercase rounded text-center transition-colors block"
          >
            Review Cart / Generate Invoice →
          </button>
        </div>
      )}
    </div>
  );
}
