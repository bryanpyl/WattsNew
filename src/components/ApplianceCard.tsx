import React, { useState, useEffect } from 'react';
import { Appliance, ApplianceUsage } from '../types';
import { formatHHMMSS } from '../utils';
import {
  Snowflake,
  Wind,
  Tv,
  Lightbulb,
  Waves,
  Coffee,
  Monitor,
  CookingPot
} from 'lucide-react';

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Snowflake,
  Wind,
  Tv,
  Lightbulb,
  Waves,
  Coffee,
  Monitor,
  CookingPot
};

interface ApplianceCardProps {
  appliance: Appliance;
  todayUsage: ApplianceUsage;
  tariffRate: number;
  isSelected: boolean; // micro:bit cycling focus state
  onToggle: (id: string) => void;
  onWattageChange: (id: string, wattage: number) => void;
}

export const ApplianceCard: React.FC<ApplianceCardProps> = ({
  appliance,
  todayUsage,
  tariffRate,
  isSelected,
  onToggle,
  onWattageChange
}) => {
  const IconComponent = iconMap[appliance.iconName] || Lightbulb;
  const kwh = todayUsage ? todayUsage.kwh : 0;
  const seconds = todayUsage ? todayUsage.seconds : 0;
  const cost = kwh * tariffRate;

  // Local state for wattage input to handle typing smoothly
  const [localWattage, setLocalWattage] = useState(appliance.wattage.toString());

  // Keep local state in sync when external state changes (e.g. on reset)
  useEffect(() => {
    setLocalWattage(appliance.wattage.toString());
  }, [appliance.wattage]);

  const handleWattageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalWattage(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 10000) {
      onWattageChange(appliance.id, parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localWattage, 10);
    if (isNaN(parsed) || parsed <= 0 || parsed > 10000) {
      setLocalWattage(appliance.wattage.toString());
    }
  };

  // Progress percentage relative to maximum reference capacity
  const progressPercent = Math.min((kwh / appliance.referenceMaxKwh) * 100, 100);

  return (
    <div
      id={`appliance-card-${appliance.id}`}
      className={`relative bg-panel-bg border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between h-full select-none ${
        appliance.isOn
          ? 'border-energy-amber/50 shadow-[0_0_15px_rgba(255,197,61,0.08)] ring-1 ring-energy-amber/20'
          : 'border-border-custom hover:border-text-dim/40 shadow-sm'
      } ${
        isSelected
          ? 'ring-2 ring-energy-cyan ring-offset-2 ring-offset-app-bg'
          : ''
      }`}
    >
      {/* Bluetooth Selection Indicator */}
      {isSelected && (
        <span className="absolute -top-2.5 -left-2 bg-energy-cyan text-app-bg text-[8px] font-display font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md animate-pulse">
          micro:bit Selected
        </span>
      )}

      {/* Card Header: Icon & Name & Power Indicator */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              appliance.isOn
                ? 'bg-energy-amber/15 text-energy-amber shadow-[0_0_8px_rgba(255,197,61,0.1)]'
                : 'bg-panel-hover text-text-sub'
            }`}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-text-main tracking-wide">
              {appliance.name}
            </h3>
            
            {/* Live HH:MM:SS Timer */}
            <span className="font-mono text-[10px] text-text-dim block mt-0.5">
              Today: {formatHHMMSS(seconds)}
            </span>
          </div>
        </div>

        {/* Pulsing flow dots */}
        <div className="flex items-center gap-0.5 h-6">
          {appliance.isOn ? (
            <div className="flex items-center gap-1 bg-energy-cyan/10 border border-energy-cyan/20 px-2 py-0.5 rounded-md">
              <span className="font-display text-[8px] font-bold text-energy-cyan tracking-wider uppercase">
                Flow
              </span>
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-energy-cyan animate-pulse delay-75" />
                <span className="w-1 h-1 rounded-full bg-energy-cyan animate-pulse delay-150" />
                <span className="w-1 h-1 rounded-full bg-energy-cyan animate-pulse delay-300" />
              </div>
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-text-dim/30" />
          )}
        </div>
      </div>

      {/* Interactive Wattage Field */}
      <div className="mt-4 flex items-center justify-between border-t border-border-custom/40 pt-3">
        <span className="text-xs text-text-sub font-display">Rating:</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={localWattage}
            onChange={handleWattageChange}
            onBlur={handleBlur}
            min="1"
            max="10000"
            className="w-16 bg-panel-hover text-text-main font-mono text-xs px-2 py-1 rounded border border-border-custom/60 focus:outline-none focus:ring-1 focus:ring-energy-amber focus:border-energy-amber text-right"
          />
          <span className="text-xs font-mono text-text-dim">W</span>
        </div>
      </div>

      {/* Progress bar towards estimated maximum load */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-[10px] text-text-dim font-mono mb-1.5">
          <span>Target Limit</span>
          <span>{kwh.toFixed(3)} / {appliance.referenceMaxKwh.toFixed(1)} kWh</span>
        </div>
        <div className="w-full h-1.5 bg-panel-hover rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              appliance.isOn ? 'bg-energy-amber' : 'bg-text-dim/60'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Readout stats row */}
      <div className="mt-4 flex items-center justify-between bg-panel-hover/30 rounded-lg p-2.5 border border-border-custom/30 font-mono text-xs">
        <div className="text-left">
          <span className="text-[10px] text-text-dim block mb-0.5 font-sans uppercase tracking-wider">
            Energy
          </span>
          <span className="text-text-main font-medium">{kwh.toFixed(4)} kWh</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-text-dim block mb-0.5 font-sans uppercase tracking-wider">
            Cost
          </span>
          <span className="text-energy-green font-semibold">RM {cost.toFixed(3)}</span>
        </div>
      </div>

      {/* Main Switch Switch Toggle Button */}
      <button
        onClick={() => onToggle(appliance.id)}
        className={`mt-4 w-full py-2.5 rounded-xl font-display font-semibold text-xs tracking-wider transition-all duration-300 border focus:outline-none flex items-center justify-center gap-1.5 ${
          appliance.isOn
            ? 'bg-energy-amber text-app-bg border-energy-amber hover:bg-energy-amber/90 hover:border-energy-amber shadow-[0_2px_10px_rgba(255,197,61,0.2)]'
            : 'bg-transparent text-text-sub border-border-custom hover:border-text-sub/50 hover:text-text-main'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            appliance.isOn ? 'bg-app-bg animate-ping' : 'bg-text-dim'
          }`}
        />
        {appliance.isOn ? 'TURN OFF' : 'TURN ON'}
      </button>
    </div>
  );
};
