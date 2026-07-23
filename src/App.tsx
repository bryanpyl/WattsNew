import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CircularGauge } from './components/CircularGauge';
import { DigitalReadouts } from './components/DigitalReadouts';
import { ApplianceCard } from './components/ApplianceCard';
import { BreakdownPanel } from './components/BreakdownPanel';
import { UserProfile } from './components/UserProfile';
import { WelcomeMessage } from './components/WelcomeMessage';
import { DEFAULT_APPLIANCES, ALL_APPLIANCES, getLocalDateString } from './utils';
import { Appliance, DayUsage } from './types';
import { Zap, Sun, Moon, RotateCcw, Cpu, Info, ShieldAlert, LayoutDashboard, BarChart3, Plus, X, Menu, Power, Usb, Radio, HelpCircle, Check } from 'lucide-react';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'breakdown' | 'profile'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mock User
  const mockUser = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'janedoe99@example.com',
    initials: 'JD'
  };

  // 1. Core State
  const [appliances, setAppliances] = useState<Appliance[]>(() => {
    const saved = localStorage.getItem('watts_up_appliances');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((app: Appliance) => ({ ...app, isOn: false }));
      } catch {
        return DEFAULT_APPLIANCES;
      }
    }
    return DEFAULT_APPLIANCES;
  });

  const [history, setHistory] = useState<DayUsage>(() => {
    const saved = localStorage.getItem('watts_up_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [tariffRate, setTariffRate] = useState<number>(() => {
    const saved = localStorage.getItem('watts_up_tariff');
    if (saved) {
      const parsed = parseFloat(saved);
      return isNaN(parsed) ? 0.30 : parsed;
    }
    return 0.30;
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('watts_up_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  // 2. micro:bit Connection State
  const isBluetoothSupported = typeof window !== 'undefined' && typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;
  const isSerialSupported = typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'serial' in navigator;

  const [connectionMode, setConnectionMode] = useState<'usb' | 'bluetooth'>('usb');
  const [microbitStatus, setMicrobitStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'unsupported'>('disconnected');
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [microbitError, setMicrobitError] = useState<string | null>(null);
  const [showMicrobitGuide, setShowMicrobitGuide] = useState(false);

  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);

  // Modals / Confirmation State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close Add Menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };
    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu]);


  // 3. Mutable Refs for safe callback captures inside timers/Web Bluetooth listeners
  const appliancesRef = useRef(appliances);

  useEffect(() => {
    appliancesRef.current = appliances;
  }, [appliances]);

  // Sync theme with Document Attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('watts_up_theme', theme);
  }, [theme]);

  // Save changes to localStorage on state changes
  useEffect(() => {
    localStorage.setItem('watts_up_appliances', JSON.stringify(appliances));
  }, [appliances]);

  useEffect(() => {
    localStorage.setItem('watts_up_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('watts_up_tariff', tariffRate.toString());
  }, [tariffRate]);

  // Periodic Auto-Save Every 20 Seconds & Page Unload Safeguard
  useEffect(() => {
    const autoSave = () => {
      localStorage.setItem('watts_up_appliances', JSON.stringify(appliancesRef.current));
      localStorage.setItem('watts_up_history', JSON.stringify(history));
      localStorage.setItem('watts_up_tariff', tariffRate.toString());
      localStorage.setItem('watts_up_theme', theme);
    };

    const interval = setInterval(autoSave, 20000);
    window.addEventListener('beforeunload', autoSave);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', autoSave);
    };
  }, [history, tariffRate, theme]);

  // 4. Energy Simulation Tick (Runs every second)
  useEffect(() => {
    const timer = setInterval(() => {
      const todayStr = getLocalDateString(new Date());

      setHistory((prevHistory) => {
        const activeApps = appliancesRef.current.filter((app) => app.isOn);
        if (activeApps.length === 0) return prevHistory;

        const dayRecords = prevHistory[todayStr] || {};
        const nextDayRecords = { ...dayRecords };

        activeApps.forEach((app) => {
          const prevUsage = nextDayRecords[app.id] || { kwh: 0, seconds: 0 };
          // watt * seconds / 3600 / 1000 = W / 3,600,000
          const deltaKwh = app.wattage / 3600000;
          nextDayRecords[app.id] = {
            kwh: prevUsage.kwh + deltaKwh,
            seconds: prevUsage.seconds + 1
          };
        });

        return {
          ...prevHistory,
          [todayStr]: nextDayRecords
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 5. Derived Computations (Today's Values)
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);

  const todayUsageDetails = useMemo(() => {
    const usageMap: { [id: string]: { kwh: number; seconds: number } } = {};
    let totalKwh = 0;
    
    appliances.forEach((app) => {
      const record = history[todayStr]?.[app.id] || { kwh: 0, seconds: 0 };
      usageMap[app.id] = record;
      totalKwh += record.kwh;
    });

    return {
      byApplianceId: usageMap,
      totalKwh,
      totalCost: totalKwh * tariffRate
    };
  }, [appliances, history, todayStr, tariffRate]);

  // Total instantaneous wattage across all currently running devices
  const instantaneousWattage = useMemo(() => {
    return appliances
      .filter((app) => app.isOn)
      .reduce((sum, app) => sum + app.wattage, 0);
  }, [appliances]);

  const activeAppliancesList = useMemo(() => {
    return appliances.filter((app) => app.isOn);
  }, [appliances]);

  // 6. Action Handlers
  const handleToggleAppliance = (id: string) => {
    setAppliances((prev) =>
      prev.map((app) => (app.id === id ? { ...app, isOn: !app.isOn } : app))
    );
  };

  const handleWattageChange = (id: string, newWattage: number) => {
    setAppliances((prev) =>
      prev.map((app) => (app.id === id ? { ...app, wattage: newWattage } : app))
    );
  };

  const handleAddAppliance = (app: Appliance) => {
    if (!appliances.find(a => a.id === app.id)) {
      setAppliances(prev => [...prev, { ...app, isOn: false }]);
    }
    setShowAddMenu(false);
  };

  const handleTariffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      setTariffRate(parsed);
    } else if (value === '') {
      setTariffRate(0);
    }
  };

  const handleResetData = () => {
    setAppliances(DEFAULT_APPLIANCES.map((app) => ({ ...app, isOn: false })));
    setHistory({});
    setTariffRate(0.30);
    setShowResetConfirm(false);
  };

  // Mock month cost based on daily average * 30 + today (for demo purposes)
  const estimatedMonthCost = useMemo(() => {
    const pastDaysCost = Object.values(history).reduce<number>((total, dayData) => {
      const dailyCost = Object.values(dayData).reduce<number>((sum, app) => sum + app.kwh * tariffRate, 0);
      return total + dailyCost;
    }, 0);
    // Rough simulation of monthly accumulation if history is sparse
    const numDaysLogged = Object.keys(history).length;
    let projected = pastDaysCost;
    if (numDaysLogged > 0 && numDaysLogged < 30) {
       projected = (pastDaysCost / numDaysLogged) * 30;
    }
    // Add some random base cost to represent existing mock month data if history is empty
    if (numDaysLogged === 0) projected = 250.45 * tariffRate;
    return projected + todayUsageDetails.totalCost;
  }, [history, tariffRate, todayUsageDetails.totalCost]);

  // Determine unadded appliances
  const availableToAdd = ALL_APPLIANCES.filter(a => !appliances.find(active => active.id === a.id));

  // 8. micro:bit Connection Handlers (Web Serial USB & Web Bluetooth)
  const handleButtonAChange = (event: any) => {
    try {
      const value = event.target.value.getUint8(0);
      if (value === 1) { // 1 = pressed
        const list = appliancesRef.current;
        if (list.find(a => a.id === 'ac')) {
          handleToggleAppliance('ac');
        }
      }
    } catch (err) {
      console.error('Error parsing Button A state:', err);
    }
  };

  const handleButtonBChange = (event: any) => {
    try {
      const value = event.target.value.getUint8(0);
      if (value === 1) { // 1 = pressed
        const list = appliancesRef.current;
        if (list.find(a => a.id === 'washing_machine')) {
          handleToggleAppliance('washing_machine');
        }
      }
    } catch (err) {
      console.error('Error parsing Button B state:', err);
    }
  };

  const onDisconnected = () => {
    setMicrobitStatus('disconnected');
    setConnectedDevice(null);
    setConnectedDeviceName(null);
  };

  // USB Serial Connection (For micro:bit plugged in via USB cable)
  const connectMicrobitUSB = async () => {
    if (!isSerialSupported) {
      setMicrobitStatus('unsupported');
      setMicrobitError('Web Serial is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setMicrobitStatus('connecting');
    setMicrobitError(null);

    try {
      let port;
      try {
        // Filter by BBC micro:bit Vendor ID (0x0d28)
        port = await (navigator as any).serial.requestPort({
          filters: [{ usbVendorId: 0x0d28 }]
        });
      } catch (filterErr: any) {
        if (filterErr.name === 'NotFoundError') throw filterErr;
        // Fallback without filter if vendor filter fails or isn't matched
        port = await (navigator as any).serial.requestPort();
      }

      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;

      setConnectedDevice(port);
      setConnectedDeviceName('BBC micro:bit (USB Cable)');
      setMicrobitStatus('connected');

      // Setup reader stream
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable).catch(() => {});
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = '';
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer

              for (const line of lines) {
                const trimmed = line.trim().toUpperCase();
                if (trimmed.includes('BUTTON_A') || trimmed === 'A' || trimmed === '1') {
                  const list = appliancesRef.current;
                  if (list.find(a => a.id === 'ac')) {
                    handleToggleAppliance('ac');
                  }
                } else if (trimmed.includes('BUTTON_B') || trimmed === 'B' || trimmed === '2') {
                  const list = appliancesRef.current;
                  if (list.find(a => a.id === 'washing_machine')) {
                    handleToggleAppliance('washing_machine');
                  }
                }
              }
            }
          }
        } catch (err: any) {
          console.log('Serial stream closed:', err);
        } finally {
          reader.releaseLock();
        }
      })();
    } catch (error: any) {
      console.error('USB Serial connection failed:', error);
      setMicrobitStatus('disconnected');
      if (error.name === 'NotFoundError') {
        setMicrobitError('Connection cancelled or no port selected.');
      } else {
        setMicrobitError(error.message || 'USB Serial connection failed.');
      }
    }
  };

  const disconnectMicrobitUSB = async () => {
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
        serialReaderRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
    } catch (e) {
      console.error('Error closing USB serial port:', e);
    }
    onDisconnected();
  };

  // Web Bluetooth Connection (Wireless)
  const connectMicrobitBluetooth = async () => {
    if (!isBluetoothSupported) {
      setMicrobitStatus('unsupported');
      setMicrobitError('Web Bluetooth is not supported in this browser.');
      return;
    }

    setMicrobitStatus('connecting');
    setMicrobitError(null);

    try {
      const BUTTON_SERVICE_UUID = 'e95d9882-251d-470a-a062-fa1922dfa9a8';
      const BUTTON_A_CHAR_UUID = 'e95dda90-251d-470a-a062-fa1922dfa9a8';
      const BUTTON_B_CHAR_UUID = 'e95dda91-251d-470a-a062-fa1922dfa9a8';

      let device;
      try {
        device = await (navigator as any).bluetooth.requestDevice({
          filters: [
            { namePrefix: 'BBC micro:bit' },
            { namePrefix: 'micro:bit' },
            { services: [BUTTON_SERVICE_UUID] }
          ],
          optionalServices: [BUTTON_SERVICE_UUID]
        });
      } catch (filterErr: any) {
        if (filterErr.name === 'NotFoundError') throw filterErr;
        // Fallback: accept all devices if filter scanning is restricted on domain
        device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [BUTTON_SERVICE_UUID]
        });
      }

      device.addEventListener('gattserverdisconnected', onDisconnected);

      let server;
      try {
        server = await device.gatt.connect();
      } catch (connErr) {
        console.warn('Initial GATT connect retry:', connErr);
        await new Promise((res) => setTimeout(res, 500));
        server = await device.gatt.connect();
      }

      // Wait 500ms to allow Windows Bluetooth GATT handshake to complete on HTTPS origin
      await new Promise((res) => setTimeout(res, 500));

      if (!device.gatt.connected) {
        server = await device.gatt.connect();
      }

      const service = await server.getPrimaryService(BUTTON_SERVICE_UUID);

      // Subscribe to Button A
      const charA = await service.getCharacteristic(BUTTON_A_CHAR_UUID);
      await charA.startNotifications();
      charA.addEventListener('characteristicvaluechanged', handleButtonAChange);

      // Subscribe to Button B
      const charB = await service.getCharacteristic(BUTTON_B_CHAR_UUID);
      await charB.startNotifications();
      charB.addEventListener('characteristicvaluechanged', handleButtonBChange);

      setConnectedDevice(device);
      setConnectedDeviceName(device.name || 'BBC micro:bit (Bluetooth)');
      setMicrobitStatus('connected');
    } catch (error: any) {
      console.error('Web Bluetooth connection failed:', error);
      setMicrobitStatus('disconnected');
      if (error.name === 'NotFoundError') {
        setMicrobitError('Bluetooth connection cancelled.');
      } else if (error.message && error.message.includes('GATT')) {
        setMicrobitError('GATT Disconnected: Ensure "Start Button Service" is in "on start" block & "No Passkey Needed" is set in MakeCode.');
      } else {
        setMicrobitError(`Bluetooth Error (${error.name || 'Error'}): ${error.message || String(error)}`);
      }
    }
  };

  const connectMicrobit = () => {
    if (connectionMode === 'usb') {
      connectMicrobitUSB();
    } else {
      connectMicrobitBluetooth();
    }
  };

  const disconnectMicrobit = () => {
    if (connectionMode === 'usb' || serialPortRef.current) {
      disconnectMicrobitUSB();
    }
    if (connectedDevice && connectedDevice.gatt) {
      if (connectedDevice.gatt.connected) {
        connectedDevice.gatt.disconnect();
      }
      onDisconnected();
    }
  };

  return (
    <div className={`flex min-h-screen bg-app-bg text-text-main relative overflow-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'ambient-glow-dark' : 'ambient-glow-light'
    }`}>
      {/* Mobile Menu Toggle Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed md:relative z-50 w-64 h-screen bg-panel-bg/95 backdrop-blur-xl border-r border-border-custom transition-transform duration-300 flex flex-col ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 flex items-center gap-4 border-b border-border-custom">
          <div className="w-10 h-10 bg-energy-cyan rounded-xl flex items-center justify-center shadow-lg shadow-energy-cyan/20">
            <Zap className="w-5 h-5 text-app-bg" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight text-energy-cyan">
              Watt's Up
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-text-sub font-mono">
              Energy Lab
            </p>
          </div>
        </div>

        <nav className="p-4 flex-1 space-y-2">
          <button
            onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-display font-semibold text-sm ${
              currentView === 'dashboard' 
                ? 'bg-energy-cyan/15 text-energy-cyan border border-energy-cyan/30' 
                : 'text-text-sub hover:text-text-main hover:bg-panel-hover border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => { setCurrentView('breakdown'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-display font-semibold text-sm ${
              currentView === 'breakdown' 
                ? 'bg-energy-cyan/15 text-energy-cyan border border-energy-cyan/30' 
                : 'text-text-sub hover:text-text-main hover:bg-panel-hover border border-transparent'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Usage Breakdown
          </button>
        </nav>

        <div 
          onClick={() => { setCurrentView('profile'); setIsSidebarOpen(false); }}
          className="p-4 border-t border-border-custom flex items-center gap-3 hover:bg-panel-hover cursor-pointer transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-energy-cyan to-energy-amber flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            <span className="font-display font-bold text-app-bg text-sm">{mockUser.initials}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-display font-bold text-sm text-text-main">{mockUser.firstName} {mockUser.lastName}</span>
            <span className="text-[10px] text-text-sub font-mono truncate w-full">{mockUser.email}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10" id="watts-up-container">
        <div className="w-full mx-auto px-4 py-6 md:px-8 md:py-8">
          
          {/* Mobile Header Toggle */}
          <div className="md:hidden flex items-center justify-between mb-6">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-panel-bg rounded-lg border border-border-custom">
              <Menu className="w-5 h-5 text-energy-cyan" />
            </button>
            <span className="font-display font-bold text-energy-cyan">Watt's Up</span>
          </div>

          {currentView !== 'profile' && (
            <>
              <WelcomeMessage firstName={mockUser.firstName} />

              {/* UTILITY HEADER SECTION */}
          <header className="flex items-center justify-between gap-2 sm:gap-4 bg-panel-bg/80 backdrop-blur p-2 sm:p-4 rounded-xl border border-border-custom mb-8" id="app-header">
            <div className="flex items-center gap-2">
              {/* Tariff Configuration */}
              <div className="flex items-center gap-1 sm:gap-2 bg-app-bg border border-border-custom px-2 sm:px-3 py-1.5 rounded-lg">
                <span className="hidden sm:inline text-[10px] font-display font-bold text-text-sub uppercase tracking-wider">
                  Tariff:
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tariffRate}
                    onChange={handleTariffChange}
                    className="w-12 sm:w-14 bg-panel-hover text-energy-green text-xs font-mono font-bold px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-energy-cyan text-right border-none"
                    id="tariff-rate-input"
                  />
                  <span className="text-[10px] font-mono font-semibold text-text-dim">
                    RM/kWh
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* micro:bit Mode Toggle & Pairing Button */}
              <div className="flex items-center gap-1.5 bg-app-bg border border-border-custom p-1 rounded-lg">
                {/* USB Mode Tab */}
                <button
                  onClick={() => setConnectionMode('usb')}
                  disabled={microbitStatus === 'connected' || microbitStatus === 'connecting'}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-display font-medium transition-colors cursor-pointer ${
                    connectionMode === 'usb'
                      ? 'bg-energy-cyan/20 text-energy-cyan font-semibold border border-energy-cyan/30'
                      : 'text-text-sub hover:text-text-main'
                  }`}
                  title="USB Cable (Web Serial API)"
                >
                  <Usb className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">USB Cable</span>
                </button>
                {/* Bluetooth Mode Tab */}
                <button
                  onClick={() => setConnectionMode('bluetooth')}
                  disabled={microbitStatus === 'connected' || microbitStatus === 'connecting'}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-display font-medium transition-colors cursor-pointer ${
                    connectionMode === 'bluetooth'
                      ? 'bg-energy-cyan/20 text-energy-cyan font-semibold border border-energy-cyan/30'
                      : 'text-text-sub hover:text-text-main'
                  }`}
                  title="Bluetooth Wireless (Web Bluetooth API)"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Bluetooth</span>
                </button>

                {/* Connect / Disconnect Action Button */}
                {microbitStatus === 'connected' ? (
                  <button
                    onClick={disconnectMicrobit}
                    className="bg-energy-amber/15 hover:bg-energy-amber/20 border border-energy-amber/30 text-energy-amber font-display font-semibold text-[11px] uppercase tracking-wider px-2 sm:px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ml-1"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <button
                    onClick={connectMicrobit}
                    disabled={microbitStatus === 'connecting'}
                    className="bg-energy-cyan/15 hover:bg-energy-cyan/25 text-energy-cyan border border-energy-cyan/30 font-display font-semibold text-[11px] uppercase tracking-wider px-2 sm:px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ml-1"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>
                      {microbitStatus === 'connecting'
                        ? 'Connecting…'
                        : `Connect (${connectionMode === 'usb' ? 'USB' : 'BLE'})`}
                    </span>
                  </button>
                )}

                {/* Help Guide Button */}
                <button
                  onClick={() => setShowMicrobitGuide(true)}
                  className="p-1.5 text-text-sub hover:text-energy-cyan hover:bg-panel-hover rounded transition-colors cursor-pointer ml-0.5"
                  title="micro:bit Connection Help Guide"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 bg-panel-hover border border-border-custom rounded-lg transition-all text-text-sub hover:text-text-main focus:outline-none cursor-pointer"
                title={`Switch Theme`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-energy-amber" /> : <Moon className="w-4 h-4 text-energy-cyan" />}
              </button>

              {/* Reset All Button */}
              <button
                onClick={() => setShowResetConfirm(true)}
                className="p-2 bg-panel-hover hover:bg-energy-red/10 border border-border-custom hover:border-energy-red/40 text-text-sub hover:text-energy-red rounded-lg transition-all cursor-pointer"
                title="Reset Data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* INLINE MICRO:BIT CONNECTION STATUS SUBBAR */}
          <div className="mb-6 flex flex-wrap gap-3 items-center justify-between" id="microbit-status-subbar">
            {/* Inline Connection Readout */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-panel-bg/40 border border-border-custom/40 px-3 py-1 rounded-lg text-[11px]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    microbitStatus === 'connected'
                      ? 'bg-energy-cyan animate-pulse shadow-[0_0_8px_var(--accent-cyan)]'
                      : microbitStatus === 'connecting'
                      ? 'bg-energy-amber animate-bounce'
                      : 'bg-text-dim/50'
                  }`}
                />
                <span className="font-display font-medium text-text-sub">
                  {microbitStatus === 'connected' ? (
                    <>Connected to <span className="text-energy-cyan font-bold font-mono">{connectedDeviceName}</span></>
                  ) : microbitStatus === 'connecting' ? (
                    `Establishing ${connectionMode === 'usb' ? 'USB Serial' : 'Bluetooth'} link…`
                  ) : (
                    <>
                      micro:bit Disconnected ({connectionMode === 'usb' ? 'USB Mode' : 'Bluetooth Mode'})
                    </>
                  )}
                </span>
              </div>
              {microbitError && (
                <span className="bg-energy-red/10 border border-energy-red/20 text-energy-red text-[10px] font-display font-medium px-2 py-1 rounded-lg">
                  {microbitError}
                </span>
              )}
              <button
                onClick={() => setShowMicrobitGuide(true)}
                className="text-[10px] text-energy-cyan hover:underline font-mono"
              >
                [Setup Instructions & Help]
              </button>
            </div>

            {/* Portal target for export button in mobile view */}
            <div id="subbar-right-portal" className="flex items-center justify-end md:hidden" />
          </div>
          </>
          )}

          {currentView === 'dashboard' ? (
            <>
              {/* HUB SECTION (METER + 4-UP LCD BOXES) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8" id="live-hub-row">
                {/* Gauge Widget */}
                <div className="lg:col-span-4 glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[280px] w-full max-w-sm mx-auto lg:max-w-none">
                  <div className="absolute top-4 left-5 text-[10px] font-bold text-text-sub tracking-widest uppercase">
                    Live Load Meter
                  </div>
                  
                  <div className="mt-6">
                    <CircularGauge totalWattage={instantaneousWattage} theme={theme} />
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2 mt-4 absolute bottom-4 px-4">
                    <div className="flex flex-col items-center p-2 bg-app-bg rounded-lg border border-border-custom/50">
                      <span className="text-[9px] text-text-sub font-semibold tracking-wider">MAX CAP</span>
                      <span className="font-mono text-xs text-text-main font-bold">5000 W</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-app-bg rounded-lg border border-border-custom/50">
                      <span className="text-[9px] text-text-sub font-semibold tracking-wider">EFFICIENCY</span>
                      <span className="font-mono text-xs text-energy-green font-bold">
                        {instantaneousWattage > 0 ? Math.max(85, 98 - Math.floor(instantaneousWattage / 350)) : 100}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 LCD Readouts Panel */}
                <div className="lg:col-span-8 flex items-center justify-center">
                  <DigitalReadouts
                    todayKwh={todayUsageDetails.totalKwh}
                    todayCost={todayUsageDetails.totalCost}
                    monthCost={estimatedMonthCost}
                    activeAppliances={activeAppliancesList}
                  />
                </div>
              </section>

              {/* APPLIANCE GRID */}
              <section className="mb-8" id="appliance-grid-section">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-energy-cyan" />
                    <h2 className="font-display font-bold text-lg text-text-main">
                      Household Appliances
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Turn On/Off All Button */}
                    {appliances.length > 0 && (
                      <button
                        onClick={() => {
                          const isAnyOn = appliances.some(a => a.isOn);
                          setAppliances(prev => prev.map(app => ({ ...app, isOn: !isAnyOn })));
                        }}
                        className="bg-panel-bg hover:bg-panel-hover border border-border-custom text-text-sub hover:text-text-main px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                        title={appliances.some(a => a.isOn) ? "Turn Off All" : "Turn On All"}
                      >
                        <Power className={`w-3.5 h-3.5 ${appliances.some(a => a.isOn) ? 'text-energy-red' : 'text-energy-green'}`} />
                        {appliances.some(a => a.isOn) ? 'Turn Off All' : 'Turn On All'}
                      </button>
                    )}

                    {/* Add Appliance Dropdown */}
                    <div className="relative" ref={addMenuRef}>
                    <button 
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      disabled={availableToAdd.length === 0}
                      className="bg-panel-bg hover:bg-panel-hover border border-border-custom text-text-sub hover:text-text-main px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Unit
                    </button>
                    {showAddMenu && availableToAdd.length > 0 && (
                      <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-panel-bg border border-border-custom rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                        {availableToAdd.map(app => (
                          <button
                            key={app.id}
                            onClick={() => handleAddAppliance(app)}
                            className="w-full text-left px-4 py-2 text-xs font-display font-medium text-text-sub hover:text-text-main hover:bg-panel-hover transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>{app.name}</span>
                            <span className="text-[9px] font-mono text-text-dim">{app.wattage}W</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {appliances.map((app) => (
                    <div key={app.id} className="relative group">
                      <ApplianceCard
                        appliance={app}
                        todayUsage={todayUsageDetails.byApplianceId[app.id]}
                        tariffRate={tariffRate}
                        isSelected={false}
                        onToggle={handleToggleAppliance}
                        onWattageChange={handleWattageChange}
                      />
                      <button 
                        onClick={() => setAppliances(prev => prev.filter(a => a.id !== app.id))}
                        className="absolute -top-2 -right-2 bg-panel-bg hover:bg-energy-red/20 text-text-dim hover:text-energy-red border border-border-custom rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                        title="Remove unit"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : currentView === 'breakdown' ? (
            /* DATA BREAKDOWN TAB */
            <section className="mb-8 h-full flex flex-col" id="consumption-breakdown-section">
              <BreakdownPanel
                appliances={appliances}
                history={history}
                tariffRate={tariffRate}
              />
            </section>
          ) : currentView === 'profile' ? (
            <section className="mb-8 h-full flex flex-col" id="user-profile-section">
              <UserProfile user={mockUser} />
            </section>
          ) : null}

          {/* SCIENTIFIC DISCLAIMER FOOTER */}
          {currentView !== 'profile' && (
            <footer className="mt-12 pt-6 border-t border-border-custom/30 text-center" id="app-footer">
              <div className="inline-flex items-center gap-2 bg-panel-bg/40 border border-border-custom/30 px-5 py-3 rounded-2xl max-w-2xl text-left shadow-sm">
                <Info className="w-5 h-5 text-energy-cyan shrink-0" />
                <p className="text-[11px] text-text-dim font-sans leading-relaxed">
                  <strong>Watt's Up Simulator Notice:</strong> This application acts strictly as an educational learning model. Calculations of kWh consumption and monetary costs are computed via synthetic mathematical models. Physical micro:bit controller features use genuine local Bluetooth services.
                </p>
              </div>
            </footer>
          )}

        </div>
      </main>

      {/* RESET CONFIRMATION MODAL OVERLAY */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="reset-confirm-modal">
          <div className="bg-panel-bg border border-border-custom rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-energy-red mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-display font-bold text-base text-text-main">
                Reset Tracker Data?
              </h3>
            </div>
            <p className="text-text-sub text-xs font-sans leading-relaxed mb-6">
              Are you sure you want to delete all historical logs, restore default appliance wattages, and reset the tariff rate back to 0.30 RM/kWh? This operation is permanent and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 font-display text-xs font-semibold">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="bg-panel-hover text-text-sub hover:text-text-main px-4 py-2 rounded-xl border border-border-custom/40 hover:border-text-dim/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="bg-energy-red text-white hover:bg-energy-red/95 px-4 py-2 rounded-xl transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MICRO:BIT CONNECTION SETUP GUIDE MODAL */}
      {showMicrobitGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" id="microbit-guide-modal">
          <div className="bg-panel-bg border border-border-custom rounded-2xl p-6 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowMicrobitGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-text-dim hover:text-text-main bg-panel-hover rounded-lg border border-border-custom transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-energy-cyan mb-4">
              <Cpu className="w-6 h-6" />
              <h3 className="font-display font-bold text-lg text-text-main">
                micro:bit Connection Guide
              </h3>
            </div>

            <div className="space-y-4 text-xs font-sans leading-relaxed text-text-sub">
              <div className="bg-energy-amber/10 border border-energy-amber/30 p-3 rounded-xl text-energy-amber">
                <p className="font-bold flex items-center gap-2 text-xs">
                  <Info className="w-4 h-4 shrink-0" />
                  Why USB Cable wasn't detected by default:
                </p>
                <p className="mt-1 text-[11px] text-text-main">
                  By default, Web Bluetooth scans exclusively for <strong>wireless BLE signals</strong>. When plugged in via USB cable, the micro:bit communicates using <strong>USB Serial (Web Serial API)</strong>.
                </p>
              </div>

              {/* USB Cable Guide */}
              <div className="bg-panel-hover/50 p-4 rounded-xl border border-border-custom space-y-2">
                <h4 className="font-display font-bold text-sm text-energy-cyan flex items-center gap-2">
                  <Usb className="w-4 h-4" /> Method 1: USB Cable (Recommended for USB)
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                  <li>Connect your micro:bit to your computer using a <strong>USB data cable</strong>.</li>
                  <li>In MakeCode (<a href="https://makecode.microbit.org" target="_blank" rel="noreferrer" className="text-energy-cyan underline">makecode.microbit.org</a>):
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-text-dim font-mono text-[10px]">
                      <li>On <strong>Button A pressed</strong> ➔ Send serial line: <code className="bg-app-bg px-1 rounded text-energy-green">serial.writeLine("BUTTON_A")</code></li>
                      <li>On <strong>Button B pressed</strong> ➔ Send serial line: <code className="bg-app-bg px-1 rounded text-energy-green">serial.writeLine("BUTTON_B")</code></li>
                    </ul>
                  </li>
                  <li>Flash the <code>.hex</code> file to your micro:bit.</li>
                  <li>In this app header, select <strong>USB Cable</strong> mode and click <strong>Connect (USB)</strong>. Select your BBC micro:bit in the browser pop-up.</li>
                </ol>
              </div>

              {/* Bluetooth Guide */}
              <div className="bg-panel-hover/50 p-4 rounded-xl border border-border-custom space-y-2">
                <h4 className="font-display font-bold text-sm text-energy-amber flex items-center gap-2">
                  <Radio className="w-4 h-4" /> Method 2: Wireless Bluetooth (BLE)
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                  <li>In MakeCode, add the <strong>Bluetooth</strong> extension.</li>
                  <li>In your MakeCode <code>on start</code> block, add <code className="bg-app-bg px-1 rounded text-energy-cyan">bluetooth.startButtonService()</code>.</li>
                  <li>In MakeCode <strong>Project Settings</strong> (Gear icon ➔ Project Settings), set <strong>No Passkey Needed</strong> to <code>true</code>.</li>
                  <li>Flash the program and put your micro:bit into pairing mode (hold <strong>Button A + B</strong> and press <strong>Reset</strong> until pattern appears).</li>
                  <li>In this app header, select <strong>Bluetooth</strong> mode and click <strong>Connect (BLE)</strong>.</li>
                </ol>
              </div>

              <div className="bg-panel-hover p-3 rounded-xl text-[10px] text-text-dim flex items-center justify-between">
                <span>Browser compatibility: Chrome, Edge, or Opera on <strong>http://localhost:3000</strong></span>
                <span className="font-mono text-energy-green font-bold">Vite Dev Mode Active</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowMicrobitGuide(false)}
                className="bg-energy-cyan text-app-bg font-display font-bold text-xs px-5 py-2 rounded-xl hover:bg-energy-cyan/90 transition-colors cursor-pointer"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}