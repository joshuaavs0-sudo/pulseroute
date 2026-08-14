import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { AudioLines, Radio, CheckCircle2, Circle, ShieldCheck, Loader2 } from 'lucide-react';

export default function VerificationEngine({ simulationActive }) {
  const [audioVerified, setAudioVerified] = useState(false);
  const [rfVerified, setRfVerified] = useState(false);
  const [freqData, setFreqData] = useState(generateFreqData(false));
  const [rssi, setRssi] = useState(-85);
  const [distance, setDistance] = useState(480);

  useEffect(() => {
    if (simulationActive) {
      setAudioVerified(false);
      setRfVerified(false);
      const audioTimer = setTimeout(() => setAudioVerified(true), 2500);
      const rfTimer = setTimeout(() => setRfVerified(true), 3500);
      return () => {
        clearTimeout(audioTimer);
        clearTimeout(rfTimer);
      };
    } else {
      setAudioVerified(false);
      setRfVerified(false);
    }
  }, [simulationActive]);

  useEffect(() => {
    const tick = setInterval(() => {
      setFreqData(generateFreqData(simulationActive));
    }, 400);
    return () => clearInterval(tick);
  }, [simulationActive]);

  useEffect(() => {
    if (!simulationActive) {
      setRssi(-85);
      setDistance(480);
      return;
    }
    const tick = setInterval(() => {
      setRssi((prev) => Math.max(-52, prev - 3 + Math.random() * 1.5));
      setDistance((prev) => Math.max(220, prev - 12 + Math.random() * 4));
    }, 300);
    return () => clearInterval(tick);
  }, [simulationActive]);

  const bothVerified = audioVerified && rfVerified;
  const confidence = bothVerified ? 98.4 : audioVerified || rfVerified ? 61.2 : 12.0;

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-sm font-bold text-ink tracking-wide flex items-center gap-2">
            <ShieldCheck size={16} className="text-green" />
            DUAL-KEY AI VERIFICATION ENGINE
          </h2>
          <p className="text-[11px] text-mute mt-0.5">
            Two independent signals must both confirm before a corridor is granted
          </p>
        </div>
        <ConfidenceBadge bothVerified={bothVerified} confidence={confidence} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AudioKeyCard verified={audioVerified} active={simulationActive} freqData={freqData} />
        <RfKeyCard verified={rfVerified} active={simulationActive} rssi={rssi} distance={distance} />
        <ExplainabilityPanel
          audioVerified={audioVerified}
          rfVerified={rfVerified}
          bothVerified={bothVerified}
          confidence={confidence}
          active={simulationActive}
        />
      </div>
    </div>
  );
}

function AudioKeyCard({ verified, active, freqData }) {
  return (
    <div className={`rounded-xl border p-4 transition-all duration-500 ${
      verified ? 'border-green/30 bg-green/5' : 'border-border bg-soft'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AudioLines size={15} className={verified ? 'text-green' : 'text-blue'} />
          <span className="text-xs font-semibold text-ink">Key 1 · Acoustic Siren</span>
        </div>
        <StatusIcon verified={verified} active={active} />
      </div>

      <p className="text-[10px] text-mute mb-2 font-data">FFT sweep · 850Hz – 1.5kHz range</p>

      <div className="h-16 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={freqData}>
            <YAxis hide domain={[0, 100]} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={verified ? '#12A150' : '#2559E8'}
              fill={verified ? '#12A150' : '#2559E8'}
              fillOpacity={0.15}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] font-data">
        <span className="text-mute">Rhythm match:</span>
        <span className={verified ? 'text-green font-semibold' : 'text-ink/60'}>
          {verified ? 'CONFIRMED' : active ? 'ANALYZING…' : 'IDLE'}
        </span>
      </div>
    </div>
  );
}

function RfKeyCard({ verified, active, rssi, distance }) {
  return (
    <div className={`rounded-xl border p-4 transition-all duration-500 ${
      verified ? 'border-green/30 bg-green/5' : 'border-border bg-soft'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Radio size={15} className={verified ? 'text-green' : 'text-blue'} />
          <span className="text-xs font-semibold text-ink">Key 2 · ESP-NOW RF</span>
        </div>
        <StatusIcon verified={verified} active={active} />
      </div>

      <p className="text-[10px] text-mute mb-3 font-data">Encrypted hardware telemetry stream</p>

      <div className="space-y-2.5">
        <MetricRow label="Signal (RSSI)" value={`${rssi.toFixed(0)} dBm`} />
        <MetricRow label="Distance Est." value={`~${distance.toFixed(0)}m`} />
        <MetricRow
          label="Packet Validation"
          value={verified ? 'VALID KEY' : active ? 'VERIFYING…' : 'AWAITING'}
          valueColor={verified ? 'text-green' : 'text-ink/60'}
        />
      </div>
    </div>
  );
}

function MetricRow({ label, value, valueColor = 'text-ink' }) {
  return (
    <div className="flex items-center justify-between text-[11px] font-data">
      <span className="text-mute">{label}</span>
      <span className={`font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}

function ExplainabilityPanel({ audioVerified, rfVerified, bothVerified, confidence, active }) {
  const reasoning = useMemo(() => {
    if (bothVerified) {
      return "Confidence: 98.4% — Audio rhythm verified + Valid ESP-NOW encrypted key. Both independent signals agree. Corridor granted.";
    }
    if (audioVerified && !rfVerified) {
      return "Audio siren rhythm confirmed. Waiting on RF hardware key before granting corridor — single-key confirmation is not sufficient.";
    }
    if (!audioVerified && rfVerified) {
      return "RF hardware key validated. Waiting on acoustic rhythm match before granting corridor — single-key confirmation is not sufficient.";
    }
    if (active) {
      return "Emergency vehicle detected approaching. Running dual verification — both acoustic and RF signals must independently confirm.";
    }
    return "System idle. No emergency vehicle currently in range. Trigger a simulation to see the verification sequence.";
  }, [audioVerified, rfVerified, bothVerified, active]);

  return (
    <div className={`rounded-xl border p-4 transition-all duration-500 flex flex-col justify-between ${
      bothVerified ? 'border-green/30 bg-green/5' : 'border-border bg-soft'
    }`}>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={15} className={bothVerified ? 'text-green' : 'text-blue'} />
          <span className="text-xs font-semibold text-ink">AI Decision Explainability</span>
        </div>
        <p className="text-[11px] text-mute leading-relaxed">{reasoning}</p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] font-data mb-1">
          <span className="text-mute">Confidence Score</span>
          <span className={bothVerified ? 'text-green font-bold' : 'text-blue font-bold'}>
            {confidence.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${bothVerified ? 'bg-green' : 'bg-blue'}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ verified, active }) {
  if (verified) return <CheckCircle2 size={16} className="text-green" />;
  if (active) return <Loader2 size={16} className="text-blue animate-spin" />;
  return <Circle size={16} className="text-mute" />;
}

function ConfidenceBadge({ bothVerified, confidence }) {
  return (
    <div className={`px-3 py-1.5 rounded-lg text-xs font-data font-bold ${
      bothVerified ? 'bg-green/10 text-green' : 'bg-soft text-mute'
    }`}>
      {bothVerified ? `CORRIDOR GRANTED · ${confidence.toFixed(1)}%` : 'AWAITING VERIFICATION'}
    </div>
  );
}

function generateFreqData(active) {
  return Array.from({ length: 24 }, (_, i) => ({
    i,
    v: active
      ? 30 + Math.sin(i * 0.8 + Date.now() * 0.002) * 25 + Math.random() * 20
      : 5 + Math.random() * 8,
  }));
}