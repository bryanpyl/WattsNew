import { Appliance, DayUsage, AppSettings } from './types';

export const ALL_APPLIANCES: Appliance[] = [
  { id: 'ac', name: 'Air Conditioner', wattage: 1500, isOn: false, runtimeSeconds: 0, iconName: 'Snowflake', referenceMaxKwh: 5.0 },
  { id: 'washing_machine', name: 'Washing Machine', wattage: 800, isOn: false, runtimeSeconds: 0, iconName: 'Waves', referenceMaxKwh: 2.0 },
  { id: 'tv', name: 'Television', wattage: 120, isOn: false, runtimeSeconds: 0, iconName: 'Tv', referenceMaxKwh: 1.0 },
  { id: 'lights', name: 'Lights', wattage: 40, isOn: false, runtimeSeconds: 0, iconName: 'Lightbulb', referenceMaxKwh: 0.5 },
  { id: 'kettle', name: 'Electric Kettle', wattage: 1800, isOn: false, runtimeSeconds: 0, iconName: 'Coffee', referenceMaxKwh: 1.5 },
  { id: 'rice_cooker', name: 'Rice Cooker', wattage: 700, isOn: false, runtimeSeconds: 0, iconName: 'CookingPot', referenceMaxKwh: 1.5 },
  { id: 'computer', name: 'Computer', wattage: 300, isOn: false, runtimeSeconds: 0, iconName: 'Monitor', referenceMaxKwh: 1.5 },
  { id: 'fan', name: 'Fan', wattage: 60, isOn: false, runtimeSeconds: 0, iconName: 'Wind', referenceMaxKwh: 0.5 },
];

export const DEFAULT_APPLIANCES: Appliance[] = ALL_APPLIANCES.slice(0, 4);

// Helper to get local YYYY-MM-DD date string
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format seconds into HH:MM:SS
export function formatHHMMSS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');
}

// Get trailing N date strings (including today)
export function getTrailingDays(today: Date, count: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getTime());
    d.setDate(today.getDate() - i);
    days.push(getLocalDateString(d));
  }
  return days.reverse();
}

// Get month-to-date date strings (from 1st of the current month to today)
export function getMonthToDateDays(today: Date): string[] {
  const days: string[] = [];
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const currentDay = today.getDate();

  for (let d = 1; d <= currentDay; d++) {
    const tempDate = new Date(year, month, d);
    days.push(getLocalDateString(tempDate));
  }
  return days;
}

// Export to CSV helper
export function exportToCSV(rows: any[][], filename: string) {
  const escapeCSV = (val: any) => {
    const text = String(val);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const csvContent = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to Excel using SheetJS helper (window.XLSX)
export function exportToExcel(rows: any[][], filename: string, sheetName: string): boolean {
  const XLSX = (window as any).XLSX;
  if (!XLSX) {
    console.error('SheetJS library (XLSX) is not loaded yet');
    return false;
  }

  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return false;
  }
}
