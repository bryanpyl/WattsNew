import React from 'react';
import { Appliance } from '../types';
import { Bolt, Coins, Power } from 'lucide-react';

interface DigitalReadoutsProps {
  todayKwh: number;
  todayCost: number;
  monthCost: number;
  activeAppliances: Appliance[];
}

export const DigitalReadouts: React.FC<DigitalReadoutsProps> = ({
  todayKwh,
  todayCost,
  monthCost,
  activeAppliances
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full" id="lcd-digital-readouts">
      {/* Today's Usage Readout */}
      <div className="glass-card border-b-4 border-energy-amber p-4 md:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 shadow-md relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-[10px] font-bold tracking-widest text-text-sub uppercase">
              Today's Usage
            </span>
            <Bolt className="w-4 h-4 text-energy-amber opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-mono text-3xl md:text-4xl font-bold tracking-tight text-energy-amber amber-glow">
              {todayKwh.toFixed(2)}
            </span>
            <span className="font-mono text-xs text-text-dim font-semibold">kWh</span>
          </div>
        </div>
      </div>

      {/* Today's Estimated Bill Readout */}
      <div className="glass-card border-b-4 border-energy-green p-4 md:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 shadow-md relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-[10px] font-bold tracking-widest text-text-sub uppercase">
              Today's Bill
            </span>
            <Coins className="w-4 h-4 text-energy-green opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-mono text-3xl md:text-4xl font-bold tracking-tight text-energy-green">
              RM {todayCost.toFixed(2)}
            </span>
            <span className="font-mono text-xs text-text-dim font-semibold">RM</span>
          </div>
        </div>
      </div>

      {/* Month's Estimated Bill Readout */}
      <div className="glass-card border-b-4 border-energy-red p-4 md:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 shadow-md relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-[10px] font-bold tracking-widest text-text-sub uppercase">
              Month's Bill
            </span>
            <Coins className="w-4 h-4 text-energy-red opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-mono text-3xl md:text-4xl font-bold tracking-tight text-energy-red">
              RM {monthCost.toFixed(2)}
            </span>
            <span className="font-mono text-xs text-text-dim font-semibold">RM</span>
          </div>
        </div>
      </div>

      {/* Active Appliances Readout */}
      <div className="glass-card border-b-4 border-energy-cyan p-4 md:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 shadow-md relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-[10px] font-bold tracking-widest text-text-sub uppercase">
              Active Units
            </span>
            <Power className="w-4 h-4 text-energy-cyan opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-mono text-3xl md:text-4xl font-bold tracking-tight text-energy-cyan lcd-glow">
              {String(activeAppliances.length).padStart(2, '0')}
            </span>
            <span className="font-mono text-xs text-text-dim font-semibold">units</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5 overflow-hidden max-h-[30px]">
          {activeAppliances.length === 0 ? (
            <span className="text-text-dim font-sans text-xs italic font-medium">
              No active devices
            </span>
          ) : (
            activeAppliances.map((appliance) => (
              <span
                key={appliance.id}
                className="text-[9px] bg-energy-cyan/10 text-energy-cyan px-1.5 py-0.5 rounded uppercase font-semibold"
              >
                {appliance.id === 'washing_machine' ? 'WASH' : appliance.id.toUpperCase()}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
