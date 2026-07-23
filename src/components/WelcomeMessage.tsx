import React, { useState, useEffect } from 'react';
import { Cloud, Sun, Moon, CloudRain, CloudLightning } from 'lucide-react';

interface WelcomeMessageProps {
  firstName: string;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ firstName }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours();
  let greeting = "Good evening";
  if (hour >= 5 && hour < 12) greeting = "Good morning";
  else if (hour >= 12 && hour < 18) greeting = "Good afternoon";

  const dateStr = time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Mock weather selection based on hours (just to make it feel alive)
  const weatherIcons = [
    { icon: Sun, temp: '32°C', desc: 'Sunny', color: 'text-energy-amber' },
    { icon: Cloud, temp: '28°C', desc: 'Mostly Cloudy', color: 'text-text-sub' },
    { icon: CloudRain, temp: '25°C', desc: 'Light Rain', color: 'text-energy-cyan' },
    { icon: CloudLightning, temp: '26°C', desc: 'Thunderstorms', color: 'text-energy-cyan' },
    { icon: Moon, temp: '24°C', desc: 'Clear Night', color: 'text-text-sub' }
  ];
  
  // Pick one deterministically based on hour to not change every second
  const weather = hour >= 19 || hour < 6 ? weatherIcons[4] : weatherIcons[hour % 4];
  const WeatherIcon = weather.icon;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 glass-card mb-6 z-10 relative shadow-sm hover:border-energy-cyan/40 transition-colors">
      <div>
        <h2 className="text-xl md:text-2xl font-display font-bold text-energy-cyan tracking-tight">{greeting}, {firstName}!</h2>
        <p className="text-xs text-text-sub font-mono mt-1">{dateStr} • {timeStr}</p>
      </div>
      <div className="mt-4 md:mt-0 flex items-center gap-3 bg-app-bg px-4 py-2 rounded-xl border border-border-custom/50">
        <WeatherIcon className={`w-5 h-5 ${weather.color}`} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-text-main font-mono leading-none">{weather.temp}</span>
          <span className="text-[10px] text-text-dim uppercase tracking-wider">{weather.desc}</span>
        </div>
      </div>
    </div>
  );
};
