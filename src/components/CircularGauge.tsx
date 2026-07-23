import React, { useMemo } from 'react';

interface CircularGaugeProps {
  totalWattage: number; // current active wattage
  maxWattage?: number; // scale maximum, defaults to 5000
  theme: 'dark' | 'light';
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  totalWattage,
  maxWattage = 5000,
  theme
}) => {
  const clampedWattage = Math.min(Math.max(totalWattage, 0), maxWattage);
  const percentage = clampedWattage / maxWattage;

  // Calculate rotation angle for needle (from -135deg to 135deg, which is a 270-degree sweep)
  const angle = -135 + percentage * 270;

  // Generate tick marks (6 ticks: 0, 1000, 2000, 3000, 4000, 5000)
  const ticks = useMemo(() => {
    const tickCount = 6;
    const items = [];
    for (let i = 0; i < tickCount; i++) {
      const watt = (maxWattage / (tickCount - 1)) * i;
      const pct = i / (tickCount - 1);
      const tickAngle = -135 + pct * 270;
      // Convert angle to cartesian coordinates for tick placement
      // Center of gauge is (120, 120), radius is 90
      const rad = ((tickAngle - 90) * Math.PI) / 180;
      const x1 = 120 + 80 * Math.cos(rad);
      const y1 = 120 + 80 * Math.sin(rad);
      const x2 = 120 + 88 * Math.cos(rad);
      const y2 = 120 + 88 * Math.sin(rad);

      // Text label coordinate
      const lx = 120 + 62 * Math.cos(rad);
      const ly = 120 + 62 * Math.sin(rad);

      items.push({
        watt,
        x1,
        y1,
        x2,
        y2,
        lx,
        ly,
        angle: tickAngle
      });
    }
    return items;
  }, [maxWattage]);

  // Determine current color intensity based on wattage level
  const statusColor = useMemo(() => {
    if (clampedWattage < 1500) return 'var(--accent-cyan)'; // cyan for low/medium
    if (clampedWattage < 3500) return 'var(--accent-amber)'; // amber for moderate/high
    return 'var(--accent-red)'; // red for heavy load
  }, [clampedWattage]);

  return (
    <div className="flex flex-col items-center justify-center p-4 relative" id="live-load-meter-gauge">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 240 240"
        className="w-56 h-56 md:w-64 md:h-64 transition-colors duration-300"
      >
        <defs>
          {/* Subtle glow filter */}
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          {/* Arc gradient */}
          <linearGradient id="arc-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4CC9F0" />
            <stop offset="50%" stopColor="#FFC53D" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
        </defs>

        {/* Background Track Arc (270 degrees sweep)
            Center (120, 120), radius 84, start at 135deg (-135deg offset from top), end at 45deg
            Standard SVG path for arc */}
        <path
          d="M 60.6 179.4 A 84 84 0 1 1 179.4 179.4"
          fill="none"
          stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'}
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Foreground Active Arc (clamped to percentage) */}
        {percentage > 0 && (
          <path
            d="M 60.6 179.4 A 84 84 0 1 1 179.4 179.4"
            fill="none"
            stroke="url(#arc-gradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 396} 396`}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: totalWattage > 0 ? 'url(#gauge-glow)' : 'none'
            }}
          />
        )}

        {/* Tick Marks & Labels */}
        {ticks.map((tick, i) => (
          <g key={i} className="select-none">
            {/* Tick lines */}
            <line
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={
                clampedWattage >= tick.watt && totalWattage > 0
                  ? statusColor
                  : theme === 'dark'
                  ? '#475569'
                  : '#CBD5E1'
              }
              strokeWidth={clampedWattage >= tick.watt && totalWattage > 0 ? '2.5' : '1.5'}
              className="transition-colors duration-300"
            />
            {/* Tick text labels */}
            <text
              x={tick.lx}
              y={tick.ly}
              textAnchor="middle"
              alignmentBaseline="middle"
              className="font-display font-medium text-[9px] fill-text-sub"
              style={{
                fill:
                  clampedWattage >= tick.watt && totalWattage > 0
                    ? statusColor
                    : 'var(--text-secondary)',
                opacity: 0.9,
                fontWeight: clampedWattage >= tick.watt && totalWattage > 0 ? 600 : 500
              }}
            >
              {tick.watt >= 1000 ? `${tick.watt / 1000}k` : tick.watt}
            </text>
          </g>
        ))}

        {/* Central Hub Area */}
        <circle
          cx="120"
          cy="120"
          r="45"
          fill={theme === 'dark' ? '#0F172A' : '#F1F5F9'}
          stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'}
          strokeWidth="3"
        />

        {/* Central Digital Readout */}
        <text
          x="120"
          y="114"
          textAnchor="middle"
          className="font-mono text-[17px] font-bold fill-text-main"
          style={{ transition: 'fill 0.3s ease' }}
        >
          {totalWattage.toLocaleString()}
        </text>
        <text
          x="120"
          y="128"
          textAnchor="middle"
          className="font-display text-[8px] tracking-wider font-semibold uppercase"
          style={{ fill: statusColor }}
        >
          {totalWattage > 0 ? 'ACTIVE LOAD' : 'STDBY LOAD'}
        </text>
        <text
          x="120"
          y="138"
          textAnchor="middle"
          className="font-sans text-[7px] fill-text-dim uppercase tracking-widest"
        >
          Watts (W)
        </text>

        {/* Rotating Needle (Removed as requested) */}
      </svg>
      
      {/* Visual warning for extreme load */}
      {totalWattage >= 4000 && (
        <span className="absolute bottom-1 bg-energy-red/10 text-energy-red border border-energy-red/20 text-[10px] font-display uppercase tracking-widest px-2.5 py-0.5 rounded-full animate-pulse font-semibold">
          High Demand Peak
        </span>
      )}
    </div>
  );
};
