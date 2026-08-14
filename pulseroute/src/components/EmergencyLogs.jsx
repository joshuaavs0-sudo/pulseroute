import React, { useState } from 'react';

export default function EmergencyLogs() {
  const [logs, setLogs] = useState([
    { id: '1', ambulanceId: 'AMB-01', patientStatus: 'Critical - Cardiac Arrest (Red Alert)', hospital: 'Apollo Trauma Center', timestamp: '04:54:40 AM' },
    { id: '2', ambulanceId: 'AMB-02', patientStatus: 'Moderate - Compound Fracture (Yellow)', hospital: 'Government General Hospital', timestamp: '04:52:10 AM' },
    { id: '3', ambulanceId: 'AMB-03', patientStatus: 'Stable - Post-Operative Check (Green)', hospital: 'Apollo Central', timestamp: '04:45:15 AM' }
  ]);
  const [loading, setLoading] = useState(false);

  const addSampleLog = () => {
    setLoading(true);
    setTimeout(() => {
      const newLog = {
        id: Date.now().toString(),
        ambulanceId: `AMB-0${Math.floor(Math.random() * 4) + 1} (EXT)`,
        patientStatus: 'Critical - Multi-Trauma Incident',
        hospital: 'Apollo Trauma Center',
        timestamp: new Date().toLocaleTimeString()
      };
      setLogs([newLog, ...logs]);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-6 text-white shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Live Database Audit Logs</h3>
          <p className="text-xs text-slate-400">Real-time persistent cloud storage & dispatch telemetry records</p>
        </div>
        <button 
          onClick={addSampleLog}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-500 text-xs px-4 py-2 rounded-lg font-medium transition-all shadow-lg cursor-pointer">
          {loading ? "Syncing..." : "+ Simulate Log"}
        </button>
      </div>

      <div className="bg-[#070b19] border border-slate-800/80 rounded-lg p-4 max-h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No database logs recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-slate-900/80 border border-slate-800 p-3 rounded flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">
                  🚑 <span className="text-cyan-400 font-mono">{log.ambulanceId}</span> - {log.patientStatus} <span className="text-slate-400">({log.hospital})</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}