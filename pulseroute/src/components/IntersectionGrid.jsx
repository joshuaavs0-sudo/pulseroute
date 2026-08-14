import { useState, useEffect } from 'react';
import { Radio, Navigation2, Gauge, MapPin, Radar } from 'lucide-react';

const NODES = [
  { id: 'node-01', name: 'Node-01 · 5th & Main', x: 15, y: 65 },
  { id: 'node-02', name: 'Node-02 · Elm & 8th', x: 50, y: 35 },
  { id: 'node-03', name: 'Node-03 · Hospital Ave', x: 85, y: 55 },
];

// Timeline in ms, relative to simulation start (matches the 8s simulate cycle)
const TIMELINE = [
  { node: 'node-01', activeAt: 500, restoreAt: 3000 },
  { node: 'node-02', activeAt: 2800, restoreAt: 5500 },
  { node: 'node-03', activeAt: 5200, restoreAt: 8000 },
];

export default function IntersectionGrid({ simulationActive }) {
  const [nodeStates, setNodeStates] = useState(getIdleStates());
  const [beacon, setBeacon] = useState({ speed: 0, progress: 0 });

  useEffect(() => {
    if (!simulationActive) {
      setNodeStates(getIdleStates());
      setBeacon({ speed: 0, progress: 0 });
      return;
    }

    setNodeStates(getIdleStates());
    const timers = [];

    TIMELINE.forEach(({ node, activeAt, restoreAt }) => {
      timers.push(setTimeout(() => {
        setNodeStates((prev) => ({ ...prev, [node]: 'active' }));
      }, activeAt));
      timers.push(setTimeout(() => {
        setNodeStates((prev) => ({ ...prev, [node]: 'passed' }));
      }, restoreAt));
    });

    const start = Date.now();
    const beaconTick = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, (elapsed / 8000) * 100);
      const speed = progress < 95 ? 52 + Math.random() * 8 : 0;
      setBeacon({ speed, progress });
    }, 200);
    timers.push(beaconTick);

    return () => timers.forEach((t) => clearTimeout(t) || clearInterval(t));
  }, [simulationActive]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-sm font-bold text-ink tracking-wide flex items-center gap-2">
              <Radar size={16} className="text-green" />
              TACTICAL INTERSECTION GRID
            </h2>
            <p className="text-[11px] text-mute mt-0.5">Live corridor · 3 signalized nodes</p>
          </div>
          <span className={`text-xs font-data font-bold px-3 py-1.5 rounded-lg ${
            simulationActive ? 'bg-green/10 text-green' : 'bg-soft text-mute'
          }`}>
            {simulationActive ? 'CORRIDOR LIVE' : 'STANDBY'}
          </span>
        </div>

        <RoadMap nodeStates={nodeStates} beacon={beacon} active={simulationActive} />
      </div>

      <div className="flex flex-col gap-4">
        <BeaconCard beacon={beacon} active={simulationActive} />
        <NodeList nodeStates={nodeStates} />
      </div>
    </div>
  );
}

function RoadMap({ nodeStates, beacon, active }) {
  return (
    <div className="relative w-full aspect-[16/9] rounded-xl bg-soft border border-border overflow-hidden">
      {/* Radar sweep */}
      {active && (
        <div
          className="absolute top-1/2 left-1/2 w-[140%] aspect-square origin-center radar-sweep"
          style={{
            background: 'conic-gradient(from 0deg, rgba(18,161,80,0.18), transparent 40deg)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* Road path */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={`M ${NODES[0].x} ${NODES[0].y} Q 35 20 ${NODES[1].x} ${NODES[1].y} T ${NODES[2].x} ${NODES[2].y}`}
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />
      </svg>

      {/* Nodes */}
      {NODES.map((node) => (
        <TrafficNode key={node.id} node={node} state={nodeStates[node.id]} />
      ))}

      {/* Ambulance beacon marker */}
      {active && (
        <div
          className="absolute w-4 h-4 -ml-2 -mt-2 transition-all duration-200"
          style={{
            left: `${interpolateBeaconX(beacon.progress)}%`,
            top: `${interpolateBeaconY(beacon.progress)}%`,
          }}
        >
          <div className="w-4 h-4 rounded-full bg-brand ring-4 ring-brand/25 animate-pulse" />
        </div>
      )}
    </div>
  );
}

function interpolateBeaconX(progress) {
  if (progress < 50) return 15 + (progress / 50) * 35;
  return 50 + ((progress - 50) / 50) * 35;
}
function interpolateBeaconY(progress) {
  if (progress < 50) return 65 - (progress / 50) * 30;
  return 35 + ((progress - 50) / 50) * 20;
}

function TrafficNode({ node, state }) {
  const colorMap = {
    idle: { ring: 'ring-border', dot: 'bg-mute', label: 'text-mute' },
    active: { ring: 'ring-green/40', dot: 'bg-green', label: 'text-green' },
    passed: { ring: 'ring-blue/30', dot: 'bg-blue', label: 'text-blue' },
  };
  const c = colorMap[state] || colorMap.idle;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <div className={`w-5 h-5 rounded-full ${c.dot} ring-4 ${c.ring} transition-all duration-500 ${state === 'active' ? 'animate-pulse' : ''}`} />
      <span className={`text-[9px] font-data font-semibold whitespace-nowrap px-1.5 py-0.5 rounded bg-white border border-border ${c.label}`}>
        {node.name}
      </span>
    </div>
  );
}

function BeaconCard({ beacon, active }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <Navigation2 size={15} className="text-brand" />
        <span className="text-xs font-semibold text-ink">Ambulance AMB-102</span>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-data">
          <span className="text-mute flex items-center gap-1"><Gauge size={11} /> Speed</span>
          <span className="font-semibold text-ink">{active ? `${beacon.speed.toFixed(0)} mph` : '—'}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-data">
          <span className="text-mute flex items-center gap-1"><MapPin size={11} /> Destination</span>
          <span className="font-semibold text-ink">City Hospital</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-data">
          <span className="text-mute flex items-center gap-1"><Radio size={11} /> Corridor Progress</span>
          <span className="font-semibold text-brand">{active ? `${beacon.progress.toFixed(0)}%` : '0%'}</span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-3">
        <div
          className="h-full rounded-full bg-brand transition-all duration-200"
          style={{ width: `${beacon.progress}%` }}
        />
      </div>
    </div>
  );
}

function NodeList({ nodeStates }) {
  const labelMap = { idle: 'STANDBY', active: 'ACTIVE JUNCTION', passed: 'PASSED · RESTORED' };
  const colorMap = { idle: 'text-mute', active: 'text-green', passed: 'text-blue' };

  return (
    <div className="bg-white border border-border rounded-2xl p-4 shadow-card">
      <p className="text-xs font-semibold text-ink mb-3">Node Status</p>
      <div className="space-y-2">
        {NODES.map((node) => {
          const state = nodeStates[node.id];
          return (
            <div key={node.id} className="flex items-center justify-between text-[11px]">
              <span className="text-ink/80 font-data">{node.name}</span>
              <span className={`font-data font-semibold ${colorMap[state]}`}>{labelMap[state]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getIdleStates() {
  return { 'node-01': 'idle', 'node-02': 'idle', 'node-03': 'idle' };
}