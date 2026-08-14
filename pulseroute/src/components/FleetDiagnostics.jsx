import { useState, useEffect } from 'react';
import { Cpu, Thermometer, HardDrive, Wifi, Ambulance, Flame } from 'lucide-react';

const FLEET = [
  { id: 'AMB-102', type: 'Ambulance', status: 'En Route', dest: 'City Hospital', icon: Ambulance },
  { id: 'FE-04', type: 'Fire Engine', status: 'Standby', dest: 'Station 4', icon: Flame },
];

const NODES = [
  { id: 'ESP-N01', location: '5th & Main' },
  { id: 'ESP-N02', location: 'Elm & 8th' },
  { id: 'ESP-N03', location: 'Hospital Ave' },
];

export default function FleetDiagnostics({ simulationActive }) {
  const [nodeStats, setNodeStats] = useState(
    NODES.reduce((acc, n) => ({ ...acc, [n.id]: { cpu: 22, temp: 34, mem: 41 } }), {})
  );

  useEffect(() => {
    const tick = setInterval(() => {
      setNodeStats((prev) => {
        const next = {};
        for (const n of NODES) {
          const base = simulationActive ? 55 : 20;
          next[n.id] = {
            cpu: Math.min(95, base + Math.random() * 20),
            temp: 32 + (simulationActive ? 8 : 0) + Math.random() * 4,
            mem: Math.min(90, base + 10 + Math.random() * 15),
          };
        }
        return next;
      });
    }, 1200);
    return () => clearInterval(tick);
  }, [simulationActive]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
        <h2 className="font-display text-sm font-bold text-ink tracking-wide flex items-center gap-2 mb-4">
          <Ambulance size={16} className="text-brand" />
          ACTIVE FLEET
        </h2>
        <div className="space-y-3">
          {FLEET.map((v) => {
            const Icon = v.icon;
            const active = v.status === 'En Route';
            return (
              <div key={v.id} className="border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? 'bg-brand/10 text-brand' : 'bg-soft text-mute'}`}>
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{v.id} · {v.type}</p>
                    <p className="text-xs text-mute">{v.dest}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-data font-bold px-2.5 py-1 rounded-full ${active ? 'bg-brand/10 text-brand' : 'bg-soft text-mute'}`}>
                  {active ? (simulationActive ? 'EN ROUTE' : 'STANDBY') : v.status.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
        <h2 className="font-display text-sm font-bold text-ink tracking-wide flex items-center gap-2 mb-4">
          <Cpu size={16} className="text-blue" />
          EDGE MESH HARDWARE
        </h2>
        <div className="space-y-3">
          {NODES.map((n) => {
            const s = nodeStats[n.id];
            return (
              <div key={n.id} className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-sm font-semibold text-ink">{n.id} <span className="text-mute font-normal">· {n.location}</span></p>
                  <Wifi size={13} className="text-blue" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Stat icon={<Cpu size={11} />} label="CPU" value={`${s.cpu.toFixed(0)}%`} />
                  <Stat icon={<Thermometer size={11} />} label="TEMP" value={`${s.temp.toFixed(0)}°C`} />
                  <Stat icon={<HardDrive size={11} />} label="MEM" value={`${s.mem.toFixed(0)}%`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-soft rounded-lg py-2">
      <span className="text-mute">{icon}</span>
      <span className="vitals-badge">{value}</span>
      <span className="text-[9px] text-mute font-data">{label}</span>
    </div>
  );
}