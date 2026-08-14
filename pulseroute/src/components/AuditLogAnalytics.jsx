import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Leaf, 
  Terminal, 
  CheckCircle2, 
  Radio, 
  Volume2, 
  Zap 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const INITIAL_LOGS = [
  { id: 1, time: '11:42:01', type: 'system', message: 'PulseRoute Core Node-02 initialized on mesh.' },
  { id: 2, time: '11:42:04', type: 'rf', message: 'Telemetry ping received from AMB-102 (RSSI: -52 dBm).' },
  { id: 3, time: '11:42:08', type: 'audio', message: 'FFT audio spectrum lock: 850Hz-1.5kHz siren signature confirmed.' },
  { id: 4, time: '11:42:10', type: 'corridor', message: 'DUAL-KEY VERIFIED (98.4%). Green Corridor granted at Junction Node-02.' }
];

const METRIC_HISTORY = [
  { time: '11:00', efficiency: 68, waitTimeSaved: 18 },
  { time: '11:10', efficiency: 72, waitTimeSaved: 22 },
  { time: '11:20', efficiency: 75, waitTimeSaved: 28 },
  { time: '11:30', efficiency: 84, waitTimeSaved: 35 },
  { time: '11:40', efficiency: 96, waitTimeSaved: 42 }
];

export default function AuditLogAnalytics({ simulationActive }) {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [co2Saved, setCo2Saved] = useState(142.8);

  useEffect(() => {
    if (simulationActive) {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      const newSimLogs = [
        { id: Date.now() + 1, time: now, type: 'rf', message: 'ESP-NOW Encrypted Packet Lock: AMB-102 within 220m range.' },
        { id: Date.now() + 2, time: now, type: 'audio', message: 'Acoustic siren harmonic sweep matched (Confidence: 98.4%).' },
        { id: Date.now() + 3, time: now, type: 'corridor', message: 'AUTOMATIC OVERRIDE: Node-02 Signal forced to GREEN.' }
      ];
      setLogs(prev => [...newSimLogs, ...prev].slice(0, 15));
      setCo2Saved(prev => parseFloat((prev + 0.4).toFixed(1)));
    }
  }, [simulationActive]);

  useEffect(() => {
    const ticker = setInterval(() => {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      if (Math.random() > 0.6) {
        const sysLog = {
          id: Date.now(),
          time: now,
          type: 'system',
          message: 'Mesh Heartbeat: 18/18 nodes online. Node latency steady at 12ms.'
        };
        setLogs(prev => [sysLog, ...prev].slice(0, 15));
      }
    }, 4500);

    return () => clearInterval(ticker);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* REAL-TIME AUDIT LOG */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
            <h2 className="font-sans text-sm font-bold text-slate-900 tracking-wide flex items-center gap-2">
              <Terminal size={16} className="text-red-600" />
              SYSTEM AUDIT LOG STREAM
            </h2>
            <span className="vitals-badge flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 font-mono text-xs">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5"
              >
                <span className="text-slate-400 text-[10px] pt-0.5 whitespace-nowrap">{log.time}</span>
                <LogTypeBadge type={log.type} />
                <span className="text-slate-800 text-[11px] font-medium leading-tight flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Buffer: 15 events retained</span>
          <span>Crypto Hash: SHA256 Verified</span>
        </div>
      </div>

      {/* IMPACT ANALYTICS & GRAPH */}
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Leaf size={16} />
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ECO IMPACT
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-slate-900">{co2Saved} <span className="text-sm font-normal text-slate-500">kg</span></p>
            <p className="text-xs text-slate-500 font-medium mt-1">Est. Idle CO2 Reduced</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-sky-50 text-sky-600">
                <Clock size={16} />
              </span>
              <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                TIME SAVED
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-slate-900">-42%</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Avg Signal Delay Avoided</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold font-sans text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={15} className="text-red-600" />
              Emergency Transit Efficiency Trend (%)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Past 60 mins</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={METRIC_HISTORY}>
                <defs>
                  <linearGradient id="efficiencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} domain={[50, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', color: '#0F172A' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#DC2626" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#efficiencyGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}

function LogTypeBadge({ type }) {
  switch (type) {
    case 'rf':
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
          <Radio size={10} /> RF
        </span>
      );
    case 'audio':
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
          <Volume2 size={10} /> FFT
        </span>
      );
    case 'corridor':
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
          <Zap size={10} /> CORRIDOR
        </span>
      );
    default:
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
          <CheckCircle2 size={10} /> SYS
        </span>
      );
  }
}