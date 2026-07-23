export interface Appliance {
  id: string;
  name: string;
  wattage: number; // user editable
  isOn: boolean;
  runtimeSeconds: number; // current session runtime (accumulates for active run)
  iconName: string; // 'Snowflake', 'Wind', 'Tv', 'Lightbulb', 'Waves', 'Coffee', 'Monitor', 'CookingPot'
  referenceMaxKwh: number; // reference max for card progress bar
}

export interface ApplianceUsage {
  kwh: number;
  seconds: number;
}

export interface DayUsage {
  [dateStr: string]: {
    [applianceId: string]: ApplianceUsage;
  };
}

export interface AppSettings {
  tariffRate: number; // RM/kWh, default 0.30
  theme: 'dark' | 'light';
  appliancesConfig: {
    [id: string]: number; // saved wattages
  };
}

export type BreakdownTab = 'daily' | 'weekly' | 'monthly';
