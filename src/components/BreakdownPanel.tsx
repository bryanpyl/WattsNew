import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Appliance, DayUsage, BreakdownTab } from '../types';
import { getLocalDateString, getTrailingDays, getMonthToDateDays, exportToCSV, exportToExcel } from '../utils';
import { Download, ChevronDown, FileText, FileSpreadsheet, Calendar, TrendingUp } from 'lucide-react';

interface BreakdownPanelProps {
  appliances: Appliance[];
  history: DayUsage;
  tariffRate: number;
}

export const BreakdownPanel: React.FC<BreakdownPanelProps> = ({
  appliances,
  history,
  tariffRate
}) => {
  const [activeTab, setActiveTab] = useState<BreakdownTab>('daily');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute date range based on active tab
  const rangeDetails = useMemo(() => {
    const today = new Date();
    let dates: string[] = [];
    let label = '';
    let rangeStr = '';

    if (activeTab === 'daily') {
      const todayStr = getLocalDateString(today);
      dates = [todayStr];
      label = 'Today';
      rangeStr = todayStr;
    } else if (activeTab === 'weekly') {
      dates = getTrailingDays(today, 7);
      label = 'Trailing 7 Days';
      rangeStr = `${dates[0]} to ${dates[dates.length - 1]}`;
    } else if (activeTab === 'monthly') {
      dates = getMonthToDateDays(today);
      label = 'Month-to-Date';
      rangeStr = `${dates[0]} to ${dates[dates.length - 1]}`;
    }

    return { dates, label, rangeStr };
  }, [activeTab]);

  // Aggregate stats per appliance for the selected range
  const aggregatedData = useMemo(() => {
    // If not daily, return mock data as requested
    if (activeTab === 'weekly') {
      const mockList = [
        { name: 'Air Conditioner', wattage: 1500, kwh: 45.2, cost: 45.2 * tariffRate, seconds: 0 },
        { name: 'Refrigerator', wattage: 190, kwh: 15.6, cost: 15.6 * tariffRate, seconds: 0 },
        { name: 'Television', wattage: 120, kwh: 5.4, cost: 5.4 * tariffRate, seconds: 0 },
        { name: 'Washing Machine', wattage: 800, kwh: 4.1, cost: 4.1 * tariffRate, seconds: 0 },
        { name: 'Lights', wattage: 40, kwh: 2.8, cost: 2.8 * tariffRate, seconds: 0 }
      ].sort((a, b) => b.kwh - a.kwh);
      const totalKwh = mockList.reduce((sum, item) => sum + item.kwh, 0);
      const totalCost = mockList.reduce((sum, item) => sum + item.cost, 0);
      return { list: mockList, totalKwh, totalCost, maxKwh: mockList[0].kwh };
    }

    if (activeTab === 'monthly') {
      const mockList = [
        { name: 'Air Conditioner', wattage: 1500, kwh: 185.5, cost: 185.5 * tariffRate, seconds: 0 },
        { name: 'Refrigerator', wattage: 190, kwh: 68.2, cost: 68.2 * tariffRate, seconds: 0 },
        { name: 'Television', wattage: 120, kwh: 21.6, cost: 21.6 * tariffRate, seconds: 0 },
        { name: 'Washing Machine', wattage: 800, kwh: 18.4, cost: 18.4 * tariffRate, seconds: 0 },
        { name: 'Lights', wattage: 40, kwh: 12.5, cost: 12.5 * tariffRate, seconds: 0 },
        { name: 'Computer', wattage: 300, kwh: 9.8, cost: 9.8 * tariffRate, seconds: 0 }
      ].sort((a, b) => b.kwh - a.kwh);
      const totalKwh = mockList.reduce((sum, item) => sum + item.kwh, 0);
      const totalCost = mockList.reduce((sum, item) => sum + item.cost, 0);
      return { list: mockList, totalKwh, totalCost, maxKwh: mockList[0].kwh };
    }

    const dataMap: { [id: string]: { name: string; wattage: number; kwh: number; cost: number; seconds: number } } = {};

    // Initialize map
    appliances.forEach((app) => {
      dataMap[app.id] = {
        name: app.name,
        wattage: app.wattage,
        kwh: 0,
        cost: 0,
        seconds: 0
      };
    });

    // Accumulate from history
    rangeDetails.dates.forEach((dateStr) => {
      const dayData = history[dateStr];
      if (dayData) {
        Object.keys(dayData).forEach((appId) => {
          if (dataMap[appId]) {
            dataMap[appId].kwh += dayData[appId].kwh;
            dataMap[appId].seconds += dayData[appId].seconds;
            dataMap[appId].cost += dayData[appId].kwh * tariffRate;
          }
        });
      }
    });

    // Convert to sorted array (descending by kWh)
    const list = Object.values(dataMap)
      .filter(item => item.kwh > 0 || appliances.find(a => a.name === item.name)?.isOn) // Only show active/used in daily
      .sort((a, b) => b.kwh - a.kwh);

    const totalKwh = list.reduce((sum, item) => sum + item.kwh, 0);
    const totalCost = list.reduce((sum, item) => sum + item.cost, 0);
    const maxKwh = list.length > 0 ? list[0].kwh : 0;

    return { list, totalKwh, totalCost, maxKwh };
  }, [activeTab, appliances, history, tariffRate, rangeDetails]);

  // Build rows for export
  const prepareExportData = () => {
    const reportTitle = "Watt's Up — Home Electricity Consumption Report";
    const reportMeta = [
      ["Title", reportTitle],
      ["Range Type", rangeDetails.label],
      ["Period", rangeDetails.rangeStr],
      ["Tariff Rate", `${tariffRate.toFixed(2)} RM/kWh`],
      []
    ];

    const headers = ["Appliance Name", "Rating (Watts)", "Energy Consumption (kWh)", "Estimated Cost (RM)"];
    
    const itemRows = aggregatedData.list.map(item => [
      item.name,
      item.wattage,
      parseFloat(item.kwh.toFixed(4)),
      parseFloat(item.cost.toFixed(3))
    ]);

    const summaryRows = [
      [],
      ["Grand Total", "", parseFloat(aggregatedData.totalKwh.toFixed(4)), parseFloat(aggregatedData.totalCost.toFixed(3))]
    ];

    return [...reportMeta, headers, ...itemRows, ...summaryRows];
  };

  const handleExportCSV = () => {
    const rows = prepareExportData();
    const filename = `watts-up-${activeTab}-${getLocalDateString(new Date())}.csv`;
    exportToCSV(rows, filename);
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const rows = prepareExportData();
    const filename = `watts-up-${activeTab}-${getLocalDateString(new Date())}.xlsx`;
    const success = exportToExcel(rows, filename, `${activeTab.toUpperCase()} Usage`);
    if (success) {
      setShowExportMenu(false);
    } else {
      alert("Failed to export Excel. Please check if the script library is loaded.");
    }
  };

  const exportMenuContent = (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        className="flex items-center gap-2 text-[10px] font-bold bg-panel-bg hover:bg-panel-hover px-3.5 py-2 rounded border border-border-custom transition-all hover:border-energy-amber focus:outline-none cursor-pointer text-text-main"
      >
        <Download className="w-3.5 h-3.5 text-energy-cyan" />
        <span>EXPORT DATA</span>
        <ChevronDown className="w-3 h-3 transition-transform duration-300" style={{ transform: showExportMenu ? 'rotate(180deg)' : 'none' }} />
      </button>

      {/* Dropdown Box */}
      {showExportMenu && (
        <div className="absolute right-0 mt-2 w-44 bg-panel-bg border border-border-custom rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={handleExportCSV}
            className="w-full text-left px-4 py-2 text-xs font-display font-medium text-text-sub hover:text-text-main hover:bg-panel-hover transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-energy-cyan" />
            <span>Export CSV (.csv)</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="w-full text-left px-4 py-2 text-xs font-display font-medium text-text-sub hover:text-text-main hover:bg-panel-hover transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-energy-green" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Portal */}
      {document.getElementById('subbar-right-portal') && createPortal(
        exportMenuContent,
        document.getElementById('subbar-right-portal')!
      )}
      
      <div className="glass-card overflow-hidden flex flex-col" id="usage-breakdown-panel">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-custom bg-panel-hover/50">
          <div className="flex gap-4">
            {(['daily', 'weekly', 'monthly'] as BreakdownTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'border-b-2 border-energy-amber text-text-main'
                    : 'text-text-sub hover:text-text-main'
                }`}
              >
                {tab} breakdown
              </button>
            ))}
          </div>

          {/* Export Button (Desktop) */}
          <div className="hidden md:block">
            {exportMenuContent}
          </div>
        </div>

      {/* Period Description Banner */}
      <div className="px-6 py-2 bg-app-bg/50 border-b border-border-custom/30 text-[10px] text-text-sub flex items-center gap-1.5 uppercase tracking-wider font-mono">
        <Calendar className="w-3.5 h-3.5 text-energy-cyan" />
        <span>Selected Period: {rangeDetails.rangeStr} ({rangeDetails.label})</span>
      </div>

      {/* Breakdown Items Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {aggregatedData.list.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-text-dim text-sm italic font-sans">
            No energy consumption records found for this period.
          </div>
        ) : (
          aggregatedData.list.map((item) => {
            const percentage =
              aggregatedData.maxKwh > 0 ? (item.kwh / aggregatedData.maxKwh) * 100 : 0;
            const assocAppliance = appliances.find(a => a.name === item.name);
            const isCurrentlyOn = assocAppliance ? assocAppliance.isOn : false;

            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 bg-panel-bg hover:bg-panel-hover transition-all duration-300 rounded-lg border border-border-custom"
                id={`breakdown-row-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-3">
                  {isCurrentlyOn ? (
                    <div className="active-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-border-custom/55" />
                  )}
                  <span className="text-xs font-bold text-text-main">
                    {item.name}
                  </span>
                  <span className="text-[9px] text-text-dim font-mono bg-panel-hover/80 px-1 py-0.2 rounded border border-border-custom/20">
                    {item.wattage}W
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Progress proportion bar */}
                  <div className="w-16 sm:w-24 md:w-28 lg:w-32 h-2 bg-panel-hover rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="bg-energy-amber h-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs w-16 text-right text-text-sub">
                    {item.kwh.toFixed(2)} kWh
                  </span>
                  <span className="font-mono text-xs w-16 text-right text-energy-green font-semibold">
                    RM {item.cost.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Total Aggregates Row */}
      <div className="bg-app-bg px-6 py-4 border-t border-border-custom flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-display text-[10px] text-text-sub font-bold tracking-widest uppercase block mb-1">
            Total Energy Consumption ({rangeDetails.label})
          </span>
          <span className="font-mono text-xl font-bold text-text-main">
            {aggregatedData.totalKwh.toFixed(4)} <span className="text-xs font-semibold text-text-dim">kWh</span>
          </span>
        </div>
        <div className="text-left sm:text-right">
          <span className="font-display text-[10px] text-text-sub font-bold tracking-widest uppercase block mb-1">
            Estimated Cost Total
          </span>
          <span className="font-mono text-xl font-bold text-energy-green drop-shadow-[0_0_8px_rgba(74,222,128,0.1)]">
            RM {aggregatedData.totalCost.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
    </>
  );
};
