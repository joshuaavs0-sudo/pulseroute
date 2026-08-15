import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import EmergencyLogs from './components/EmergencyLogs';
import { getDatabase, ref, push, serverTimestamp } from "firebase/database";
import { app } from "./firebase"; // This connects to your firebase.js file


const db = getDatabase(app);

export default function App() {
  
  const [activeTab, setActiveTab] = useState('corridor');
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedAmb, setSelectedAmb] = useState('AMB-01');
  const [showBedModal, setShowBedModal] = useState(false);
  const [allocatedBed, setAllocatedBed] = useState(null);
  const [alertSent, setAlertSent] = useState(false);
  const [externalAmbulanceAlerts, setExternalAmbulanceAlerts] = useState([
    { id: 'AMB-09', hospital: 'Government General Hospital', status: 'Critical En Route', condition: 'Severe Poly-Trauma' }
  ]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [approvedExternalAmb, setApprovedExternalAmb] = useState(null);
  
  // Patient details including Chief Complaint & Triage Data
  const [patients, setPatients] = useState({
    'AMB-01': { 
      driver: 'R. Sharma', 
      bpm: 84, 
      spo2: 98, 
      bp: '122/80', 
      status: 'Critical Code Red', 
      destination: 'Apollo Central', 
      bay: 'Trauma Bay #02',
      chiefComplaint: 'Acute Myocardial Infarction (STEMI / Heart Attack)',
      triageLevel: 'RED - IMMEDIATE',
      symptoms: 'Severe central chest pressure radiating to left arm, diaphoresis',
      livesSavedCount: 14
    },
    'AMB-02': { 
      driver: 'K. Vijay', 
      bpm: 72, 
      spo2: 99, 
      bp: '118/76', 
      status: 'Stable Inbound', 
      destination: 'Apollo Central', 
      bay: 'Trauma Bay #04',
      chiefComplaint: 'Compound Fracture (Right Tibia & Fibula)',
      triageLevel: 'YELLOW - URGENT',
      symptoms: 'Localized trauma to lower right limb, conscious, stable vitals',
      livesSavedCount: 9
    },
    'AMB-03': { 
      driver: 'S. Ramesh', 
      bpm: 78, 
      spo2: 99, 
      bp: '120/82', 
      status: 'Green Standard Transfer', 
      destination: 'Apollo Central', 
      bay: 'General Ward #01',
      chiefComplaint: 'Post-Operative Routine Check & Observation',
      triageLevel: 'GREEN - STANDARD',
      symptoms: 'Stable post-surgery recovery, vitals within normal parameters',
      livesSavedCount: 11
    }
  });

  const [passCount, setPassCount] = useState(14);
  const [tdoaAngle, setTdoaAngle] = useState(34.2);
  const [countdown, setCountdown] = useState(45);
  const [showEpcrModal, setShowEpcrModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyPhone, setFamilyPhone] = useState('+91 98425 XXXXX');
  
  // New States for V2X Radio Broadcast & GPS Live Tracking
  const [radioActive, setRadioActive] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState({ lat: 13.0475, lng: 80.2452, speedKmH: 64 });
  
  const [logs, setLogs] = useState([
    '[INIT] Smart Corridor network online. Multi-ambulance concurrency manager active.',
    '[SYSTEM] Chief Complaint & Next-of-Kin portals synchronized successfully.'
  ]);

  // Canvas Refs
  const ecgCanvasRef = useRef(null);
  const ecgChartRef = useRef(null);
  const cctvHourlyRef = useRef(null);
  const cctvChartInstance = useRef(null);
  const acousticCanvasRef = useRef(null);
  const acousticChartRef = useRef(null);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  // Emergency countdown timer effect & GPS coordinate simulation
  useEffect(() => {
    let timer;
    if (isEmergency && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        // Simulate real-time GPS movement
        setGpsCoordinates(prev => ({
          lat: Number((prev.lat + 0.0004).toFixed(4)),
          lng: Number((prev.lng + 0.0003).toFixed(4)),
          speedKmH: Math.floor(Math.random() * 15) + 55
        }));
      }, 1000);
    } else if (!isEmergency) {
      setCountdown(45);
      setGpsCoordinates({ lat: 13.0475, lng: 80.2452, speedKmH: 0 });
    }
    return () => clearInterval(timer);
  }, [isEmergency, countdown]);

  // Live ECG Chart Animation
  useEffect(() => {
    if (activeTab === 'vitals' && ecgCanvasRef.current) {
      const ctx = ecgCanvasRef.current.getContext('2d');
      const ecgData = Array(50).fill(20);

      const getBorderColor = () => {
        if (selectedAmb === 'AMB-01') return '#ef4444';
        if (selectedAmb === 'AMB-02') return '#06b6d4';
        return '#22c55e';
      };

      const getBgColor = () => {
        if (selectedAmb === 'AMB-01') return 'rgba(239, 68, 68, 0.08)';
        if (selectedAmb === 'AMB-02') return 'rgba(6, 182, 212, 0.08)';
        return 'rgba(34, 197, 94, 0.08)';
      };

      ecgChartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array(50).fill(''),
          datasets: [{
            data: ecgData,
            borderColor: getBorderColor(),
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.25,
            fill: true,
            backgroundColor: getBgColor()
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { min: 0, max: 100, grid: { color: '#1e293b' } } }
        }
      });

      let tick = 0;
      const interval = setInterval(() => {
        tick++;
        let ecgVal = 20;
        const spikeFreq = selectedAmb === 'AMB-01' ? 10 : selectedAmb === 'AMB-02' ? 14 : 18;
        if (tick % spikeFreq === 0) ecgVal = selectedAmb === 'AMB-01' ? 92 : selectedAmb === 'AMB-02' ? 82 : 70;
        else if (tick % spikeFreq === 1) ecgVal = 8;
        else if (tick % spikeFreq === 2) ecgVal = 40;
        else ecgVal = 20 + Math.random() * 4;

        ecgData.shift();
        ecgData.push(ecgVal);
        ecgChartRef.current?.update('none');
      }, 100);

      return () => {
        clearInterval(interval);
        ecgChartRef.current?.destroy();
      };
    }
  }, [activeTab, selectedAmb]);

  // Hourly volume chart
  useEffect(() => {
    if (activeTab === 'cctv' && cctvHourlyRef.current) {
      const ctx = cctvHourlyRef.current.getContext('2d');
      cctvChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
          datasets: [{ label: 'Passes', data: [1, 2, 1, 3, 0, 2, 5, 2], backgroundColor: '#06b6d4', borderRadius: 4 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { min: 0, max: 8, grid: { color: '#1e293b' } } }
        }
      });

      return () => cctvChartInstance.current?.destroy();
    }
  }, [activeTab]);

  // Acoustic waveform chart
  useEffect(() => {
    if (activeTab === 'acoustic' && acousticCanvasRef.current) {
      const ctx = acousticCanvasRef.current.getContext('2d');
      const acousticData = Array(40).fill(15);

      acousticChartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array(40).fill(''),
          datasets: [{
            data: acousticData,
            borderColor: '#06b6d4',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { min: 0, max: 100, grid: { color: '#1e293b' } } }
        }
      });

      const interval = setInterval(() => {
        const nextVal = isEmergency ? Math.floor(Math.random() * 55) + 40 : Math.floor(Math.random() * 15) + 10;
        acousticData.shift();
        acousticData.push(nextVal);
        acousticChartRef.current?.update('none');
      }, 100);

      return () => {
        clearInterval(interval);
        acousticChartRef.current?.destroy();
      };
    }
  }, [activeTab, isEmergency]);

  const toggleEmergency = () => {
    const newState = !isEmergency;
    setIsEmergency(newState);
    if (newState) {
      setPassCount((prev) => prev + 1);
      setTdoaAngle(18.4);
      setCountdown(45);
      setRadioActive(true);
      addLog('EMERGENCY DISPATCH: Multi-ambulance corridor pre-emption wave activated.');
      addLog('V2X RADIO BROADCAST: Transmitting emergency audio beacon & steering instruction "MOVE TO THE RIGHT" to all nearby vehicles.');
      addLog('V2X CONFLICT MANAGER: Prioritized concurrent arrivals at Apollo Central Hospital.');
    } else {
      setTdoaAngle(34.2);
      setRadioActive(false);
      addLog('CORRIDOR RESET: Standard adaptive traffic signal timings restored.');
    }
  };

  const simulateTachycardia = () => {
    setPatients((prev) => ({
      ...prev,
      [selectedAmb]: { ...prev[selectedAmb], bpm: 142 }
    }));
    addLog(`ALERT: Tachycardia spike detected on ${selectedAmb} (${patients[selectedAmb].driver}). ER Trauma doctor notified.`);
  };

  const reserveBed = (hospital) => {
    alert(`✅ ER Trauma Bay Successfully Pre-Reserved at ${hospital}! Route synchronized.`);
    addLog(`HOSPITAL SYNC: Bay assigned for incoming active unit (${selectedAmb}).`);
  };

  const triggerCameraPass = () => {
    setPassCount((prev) => prev + 1);
    addLog(`CCTV SPOTTER: Emergency vehicle detected. Pass count updated to ${passCount + 1}.`);
  };

  const exportEpcrReport = () => {
    setShowEpcrModal(true);
    addLog(`ePCR EXPORT: Clinical handover summary compiled for patient in ${selectedAmb}.`);
  };

  const currentPatient = patients[selectedAmb];

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 p-3 md:p-6 font-sans relative selection:bg-cyan-500 selection:text-black">
      
      {/* CSS STYLING & ANIMATIONS */}
      <style>{`
        .glass-panel { background: rgba(13, 19, 33, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.07); }
        .glow-red { box-shadow: 0 0 25px rgba(239, 68, 68, 0.35); }
        .glow-cyan { box-shadow: 0 0 25px rgba(6, 182, 212, 0.3); }
        .glow-green { box-shadow: 0 0 25px rgba(34, 197, 94, 0.3); }
        @keyframes pulseGlow { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        .pulse-live { animation: pulseGlow 1.5s infinite ease-in-out; }
        @keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .radar-line { transform-origin: center; animation: radarSweep 4s linear infinite; }
      `}</style>

      {/* TOP HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-5 border-b border-gray-800/80 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-wider uppercase font-mono bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
              PulseRoute <span className="text-xs font-normal px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 ml-2">Smart City Command</span>
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">Central Hub: <span className="text-cyan-300 font-bold">APOLLO TRAUMA CENTER (ZONE-01)</span></p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          
          <div className="px-3.5 py-1.5 rounded-xl glass-panel text-right">
            <div className="text-[10px] uppercase text-gray-400 font-mono flex items-center justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 pulse-live"></span> Active Unit Vitals
            </div>
            <div className="text-xs font-bold text-red-400 font-mono flex items-center justify-end gap-2 mt-0.5">
              <span>{selectedAmb} • BPM: {currentPatient.bpm}</span>
              <span className="text-emerald-400">SpO2: {currentPatient.spo2}%</span>
            </div>
          </div>

          <button
            onClick={() => setShowFamilyModal(true)}
            className="px-4 py-2 rounded-xl glass-panel border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 text-xs font-bold font-mono transition-all flex items-center gap-2"
          >
            🔗 Next-of-Kin Portal
          </button>
          {/* --- NOTIFICATION BELL ICON --- */}
          <div className="relative">
            <button 
              onClick={() => setShowBellDropdown(!showBellDropdown)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl text-cyan-400 relative transition-colors flex items-center justify-center">
              🔔
              {externalAmbulanceAlerts.length > 0 && !approvedExternalAmb && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showBellDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0b1329] border border-slate-700 rounded-xl shadow-2xl p-4 z-50 text-white">
                <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-400">🚨 Emergency Red Alerts (External)</span>
                  <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded font-mono">Live Broadcast</span>
                </div>

                {approvedExternalAmb ? (
                  <div className="text-xs text-emerald-400 bg-emerald-950/40 p-3 rounded-lg border border-emerald-800">
                    ✅ <strong>{approvedExternalAmb} (EXT)</strong> is now active in your queue & hospital network.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {externalAmbulanceAlerts.map((alert, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs">
                        <div className="font-bold text-slate-200 flex justify-between">
                          <span>{alert.id} ({alert.hospital})</span>
                          <span className="text-red-400">{alert.status}</span>
                        </div>
                        <p className="text-slate-400 text-[10px] mt-1">Condition: {alert.condition}</p>
                        <button 
                          onClick={() => {
                            setApprovedExternalAmb(alert.id);
                            setShowBellDropdown(false);
                          }}
                          className="mt-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white py-1.5 rounded font-bold transition-all shadow">
                          Approve & Add as 4th Ambulance
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button 
  onClick={() => setActiveTab('databaseLogs')}
  className={`px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'databaseLogs' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}>
  🗄️ Database Audit Logs
</button>

          <button
            onClick={toggleEmergency}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
              isEmergency
                ? 'bg-gray-800 text-red-400 border border-red-500/80 glow-red'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white glow-red shadow-lg'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            {isEmergency ? 'RESET CORRIDOR' : 'DISPATCH BEACON'}
          </button>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="flex overflow-x-auto border-b border-gray-800/80 mt-5 text-xs font-bold text-gray-400 gap-1 scrollbar-none">
        {[
          { id: 'vitals', label: '🩺 Live Patient Vitals & Triage' },
          { id: 'er', label: '🏥 Hospital Beds & ER' },
          { id: 'fleet', label: '🚑 Ambulance Fleet' },
          { id: 'corridor', label: '🛰️ Traffic Corridor Map' },
          { id: 'cctv', label: '🎥 Traffic Cameras' },
          { id: 'acoustic', label: '🎙️ Siren Acoustic Sensor' },
          { id: 'audit', label: '📋 Regulatory & Insurance Logs' },
          { id: 'drivers', label: '🏆 Drivers Progress & Lives Saved' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 rounded-t-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-cyan-400 text-cyan-300 glass-panel border-x-transparent border-t-transparent'
                : 'hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      

      {/* MAIN CONTENT AREA */}
      <main className="mt-6">

        {/* TAB 1: LIVE PATIENT VITALS & CHIEF COMPLAINT TRIAGE CARD */}
        {activeTab === 'vitals' && (
          <div className="space-y-6">
            
            {/* MULTI-AMBULANCE SWITCHER BAR */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-gray-900/40 to-gray-900/40">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></div>
                <div>
                  <h2 className="text-xs font-bold uppercase text-cyan-300 font-mono">Multi-Ambulance Arrival Queue (Concurrency Manager)</h2>
                  <p className="text-[11px] text-gray-400">Select active inbound unit to view real-time patient data and triage profile:</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedAmb('AMB-01')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    selectedAmb === 'AMB-01'
                      ? 'bg-red-600 text-white shadow-lg glow-red'
                      : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  🚑 AMB-01 (Red)
                </button>
                <button
                  onClick={() => setSelectedAmb('AMB-02')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    selectedAmb === 'AMB-02'
                      ? 'bg-cyan-600 text-white shadow-lg glow-cyan'
                      : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  🚑 AMB-02 (Yellow)
                </button>
                <button
                  onClick={() => setSelectedAmb('AMB-03')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    selectedAmb === 'AMB-03'
                      ? 'bg-green-600 text-white shadow-lg glow-green'
                      : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  🚑 AMB-03 (Green)
                </button>
                {approvedExternalAmb && (
  <button 
    onClick={() => setSelectedAmbulance && setSelectedAmbulance('AMB-04')}
    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg animate-pulse flex items-center gap-2 border border-red-400">
    <span>🚑</span> AMB-04 (EXT) (Red Alert)
  </button>
)}

              </div>
            </div>
            {activeTab === 'databaseLogs' && (
  <div className="mt-4">
    <EmergencyLogs />
  </div>
)}
            
{activeTab === 'databaseLogs' && (
  <div className="mt-4">
    <EmergencyLogs />
  </div>
)}

            {/* PRE-ARRIVAL CHIEF COMPLAINT & TRIAGE CARD */}
            <div className={`glass-panel rounded-2xl p-5 border-l-4 ${
              selectedAmb === 'AMB-01' ? 'border-l-red-500 bg-gradient-to-r from-red-950/20 via-gray-900/60 to-gray-900/60' :
              selectedAmb === 'AMB-02' ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-950/20 via-gray-900/60 to-gray-900/60' :
              'border-l-green-500 bg-gradient-to-r from-green-950/20 via-gray-900/60 to-gray-900/60'
            } space-y-3`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                    selectedAmb === 'AMB-01' ? 'bg-red-950 text-red-400 border border-red-800' :
                    selectedAmb === 'AMB-02' ? 'bg-yellow-950 text-yellow-400 border border-yellow-800' :
                    'bg-green-950 text-green-400 border border-green-800'
                  }`}>
                    {currentPatient.triageLevel}
                  </span>
                  <h2 className="text-xs font-bold uppercase text-gray-200 font-mono tracking-wider">
                    Pre-Arrival Chief Complaint & ER Triage Summary
                  </h2>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono">Target Bay: {currentPatient.bay} ({currentPatient.destination})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Primary Diagnosis / Complaint</span>
                  <div className="text-sm font-bold text-white font-mono">{currentPatient.chiefComplaint}</div>
                </div>
                <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Reported Symptoms & Notes</span>
                  <div className="text-xs text-gray-300">{currentPatient.symptoms}</div>
                </div>
              </div>
            </div>

            {/* PATIENT METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel rounded-2xl p-4">
                <div className="text-xs text-gray-400 uppercase font-mono font-semibold flex justify-between">
                  <span>Heart Rate (ECG)</span>
                  <span className={`pulse-live font-bold ${
                    selectedAmb === 'AMB-01' ? 'text-red-400' : selectedAmb === 'AMB-02' ? 'text-cyan-400' : 'text-green-400'
                  }`}>● {selectedAmb} LIVE</span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={`text-3xl font-black font-mono ${
                    selectedAmb === 'AMB-01' ? 'text-red-400' : selectedAmb === 'AMB-02' ? 'text-cyan-400' : 'text-green-400'
                  }`}>{currentPatient.bpm}</span>
                  <span className="text-xs text-gray-400">BPM</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${
                    selectedAmb === 'AMB-01' ? 'bg-red-500' : selectedAmb === 'AMB-02' ? 'bg-cyan-500' : 'bg-green-500'
                  }`} style={{ width: `${(currentPatient.bpm / 160) * 100}%` }}></div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-4">
                <div className="text-xs text-gray-400 uppercase font-mono font-semibold">Blood Oxygen (SpO2)</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-black font-mono text-emerald-400">{currentPatient.spo2}%</span>
                  <span className="text-xs text-emerald-400 font-bold font-mono">Stable</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-mono">Continuous O2 Feed Active</p>
              </div>

              <div className="glass-panel rounded-2xl p-4">
                <div className="text-xs text-gray-400 uppercase font-mono font-semibold">Blood Pressure</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-bold font-mono text-cyan-400">{currentPatient.bp}</span>
                  <span className="text-xs text-gray-400">mmHg</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-mono">NIBP Telemetry Synchronized</p>
              </div>

              <div className="glass-panel rounded-2xl p-4">
                <div className="text-xs text-gray-400 uppercase font-mono font-semibold">Assigned ER Bay</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-lg font-bold font-mono text-yellow-400">{currentPatient.bay}</span>
                </div>
                <p className="text-[10px] text-emerald-400 mt-2 font-mono">✓ Pre-allocated & Reserved</p>
              </div>
            </div>

            {/* LIVE ECG & TELE-MEDICINE RADIO LINK */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 glass-panel rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h2 className="text-xs font-bold uppercase text-gray-200 font-mono">Lead-II ECG Stream ({selectedAmb})</h2>
                    <p className="text-xs text-gray-400">Driver: <span className="text-white font-semibold">{currentPatient.driver}</span> • Status: <span className="text-red-400">{currentPatient.status}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={exportEpcrReport} className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-xs px-3 py-1.5 rounded-xl font-bold transition-all shadow">
                      📄 Export ePCR Report
                    </button>
                    <button onClick={simulateTachycardia} className="bg-red-950 hover:bg-red-900 border border-red-800/80 text-red-300 text-xs px-3 py-1.5 rounded-xl font-bold transition-all shadow">
                      ⚡ Simulate Spike
                    </button>
                  </div>
                </div>
                <div className="h-60 bg-gray-950/80 border border-gray-800 rounded-xl p-2 relative overflow-hidden">
                  <canvas ref={ecgCanvasRef}></canvas>
                </div>
              </div>

              <div className="lg:col-span-4 glass-panel rounded-2xl p-5 space-y-4">
                <h2 className="text-xs font-bold uppercase text-gray-200 font-mono">ER Voice & Radio Communications</h2>
                <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>● SECURE VOICE LINK</span>
                    <span className="text-[10px] text-gray-500">Opus 24kbps</span>
                  </div>
                  <div className="text-gray-300 text-[11px]">
                    <span className="text-cyan-400 font-bold">[{selectedAmb} - {currentPatient.driver}]:</span> Approaching hospital geofence. Chief complaint confirmed for nursing staff.
                  </div>
                  <div className="text-gray-300 text-[11px]">
                    <span className="text-yellow-400 font-bold">[ER NURSE]:</span> Triage card acknowledged. Specialist team standing by at {currentPatient.bay}.
                  </div>
                </div>
                <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl">
                  <div className="text-[11px] text-cyan-300 font-bold font-mono">Multi-Patient Concurrency Status</div>
                  <div className="text-[10px] text-gray-400 mt-1">Dashboard is independently tracking AMB-01, AMB-02, and AMB-03 with isolated triage summaries.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOSPITAL BEDS & ER */}
        {activeTab === 'er' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase text-gray-200 font-mono">Regional ER & Trauma Bed Availability</h2>
                <span className="text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2.5 py-1 rounded-xl">AUTO-ROUTING ACTIVE</span>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-950/80 border border-cyan-500/50 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 glow-cyan">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Apollo Central Hospital (Primary)
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono">3 AMBULANCES INBOUND</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">AMB-01, AMB-02 & AMB-03 arriving shortly</p>
                    {approvedExternalAmb && (
  <div className="mt-3 bg-cyan-950/40 border border-cyan-800/80 p-3 rounded-xl text-xs text-cyan-300 flex justify-between items-center animate-in fade-in">
    <span>🚑 <strong>{approvedExternalAmb} (EXT)</strong> added as 4th active hospital unit (Integrated into Queue & Vitals).</span>
    <span className="text-[10px] bg-cyan-900 text-cyan-100 px-2 py-0.5 rounded font-mono">Active (EXT)</span>
  </div>
)}
{/* TAB: TRAFFIC CAMERAS (CCTV VISION STREAM) */}
        {activeTab === 'cctv' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-5 space-y-4 border border-cyan-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  <h2 className="text-xs font-bold uppercase text-cyan-300 font-mono tracking-wider">Live Cam-01 (Phone CCTV Stream)</h2>
                </div>
                <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded border border-red-500/20">EDGE NODE ACTIVE</span>
              </div>

              {/* Direct Raw Video Stream Container */}
              <div className="w-full bg-black rounded-xl overflow-hidden border border-gray-800 h-[320px] flex items-center justify-center relative">
                <img 
                  src="http://10.233.246.112:8080/videofeed" 
                  alt="IP Webcam Direct Stream" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex justify-between text-xs font-mono text-gray-400 px-1">
                <span>AI Detection: Emergency Vehicle (98.4%)</span>
                <span className="text-emerald-400">FPS: 30 • 1080p</span>
              </div>
            </div>
          </div>
        )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-emerald-400 font-mono">4 ICU BEDS</div>
                    <button 
  onClick={() => setShowBedModal(true)} 
  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all">
  {allocatedBed ? `Reserved: ${allocatedBed}` : 'Pre-Reserve Bay'}
</button>


{/* --- BED SELECTION POPUP MODAL --- */}
      {showBedModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1329] border border-slate-700 rounded-2xl p-6 max-w-lg w-full text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-cyan-400">Select ICU Bed for Allocation</h3>
              <button 
                onClick={() => setShowBedModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 bg-slate-800 rounded-lg">✕</button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Choose one of the 4 available ICU bays below to lock in the pre-reservation and instantly alert the on-call trauma surgeon.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { name: 'ICU Bay 01 (Central)', status: 'Ready' },
                { name: 'ICU Bay 02 (Trauma)', status: 'Pre-pped' },
                { name: 'ICU Bay 03 (Cardiac)', status: 'Ready' },
                { name: 'ICU Bay 04 (Isolation)', status: 'Sanitized' }
              ].map((bed, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAllocatedBed(bed.name);
                    setAlertSent(true);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${allocatedBed === bed.name ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'}`}>
                  <div className="font-bold flex justify-between items-center">
                    <span>Bed #{idx + 1}</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">{bed.status}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{bed.name}</div>
                </button>
              ))}
            </div>

            {alertSent && (
              <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2 animate-pulse">
                <span>🚨</span> <strong>Doctors Alerted:</strong> Bed successfully assigned. Pager alert and SMS dispatched to Apollo Trauma Team.
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowBedModal(false)}
                className="bg-cyan-600 hover:bg-cyan-500 text-xs px-5 py-2 rounded-xl font-bold transition-all shadow-lg">
                Confirm & Close
              </button>
            </div>
          </div>
        </div>
      )}
                  </div>
                </div>

                <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">Government General Hospital</div>
                    <p className="text-xs text-gray-400 mt-1">4.8 km away • Travel time: 8m 15s</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-yellow-400 font-mono">1 ICU BED</div>
                    <button onClick={() => reserveBed('Govt General')} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-2 rounded-xl font-bold">
                      Select Backup
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase text-gray-200 font-mono mb-2">Hospital Perimeter Radar</h2>
                <p className="text-xs text-gray-400 mb-4">Live tracking of incoming emergency vehicles</p>
                <div className="relative w-48 h-48 mx-auto border-2 border-cyan-800/80 rounded-full flex items-center justify-center overflow-hidden bg-gray-950">
                  <div className="absolute inset-0 border border-cyan-900/40 rounded-full scale-75"></div>
                  <div className="absolute inset-0 border border-cyan-900/30 rounded-full scale-50"></div>
                  <div className="absolute inset-0 radar-line bg-gradient-to-tr from-cyan-500/20 to-transparent"></div>
                  <div className="absolute top-12 left-16 w-3 h-3 bg-red-500 rounded-full glow-red animate-ping"></div>
                  <div className="absolute top-12 left-16 w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-4 h-4 bg-cyan-400 rounded-sm flex items-center justify-center text-[8px] text-black font-bold">H</div>
                </div>
              </div>
              <div className="mt-4 bg-gray-950/80 border border-gray-800 p-3 rounded-xl text-xs font-mono text-emerald-400 text-center font-bold">
                ✓ Multi-Arrival Buffer Ready: Bays Reserved
              </div>
            </div>
          </div>
        )}
        {/* TAB: TRAFFIC CAMERAS (CCTV VISION STREAM) */}
        {activeTab === 'cctv' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-5 space-y-4 border border-cyan-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  <h2 className="text-xs font-bold uppercase text-cyan-300 font-mono tracking-wider">Live Cam-01 (Phone CCTV Stream)</h2>
                </div>
                <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded border border-red-500/20">EDGE NODE ACTIVE</span>
              </div>

              {/* Direct Raw Video Stream Container */}
              <div className="w-full bg-black rounded-xl overflow-hidden border border-gray-800 h-[320px] flex items-center justify-center relative">
                <img 
                  src="http://10.250.196.42:8080/video" 
                  alt="IP Webcam Direct Stream" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex justify-between text-xs font-mono text-gray-400 px-1">
                <span>AI Detection: Emergency Vehicle (98.4%)</span>
                <span className="text-emerald-400">FPS: 30 • 1080p</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AMBULANCE FLEET */}
        {activeTab === 'fleet' && (
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase text-gray-200 font-mono">Active Municipal Fleet Telemetry</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-gray-950/80 border border-red-500/50 rounded-2xl p-4 space-y-3 glow-red">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-red-400 font-mono">AMB-01 (RED ALERT)</span>
                    <div className="text-[11px] text-gray-300 font-semibold mt-1">👨‍✈️ Driver: R. Sharma</div>
                    <div className="text-[10px] text-gray-400">Complaint: Acute Myocardial Infarction</div>
                  </div>
                  <span className="bg-red-950 text-red-300 border border-red-800 text-[10px] px-2.5 py-1 rounded-xl font-mono animate-pulse">DISPATCHED</span>
                </div>
                <div className="text-xs space-y-1.5 font-mono text-gray-300 border-t border-gray-800 pt-3">
                  <div className="flex justify-between"><span>Speed:</span><span className="text-cyan-400">64 km/h</span></div>
                  <div className="flex justify-between"><span>Location:</span><span>Mount Road (J-084)</span></div>
                  <div className="flex justify-between"><span>Battery/Fuel:</span><span className="text-emerald-400">88%</span></div>
                </div>
              </div>

              <div className="bg-gray-950/80 border border-cyan-500/50 rounded-2xl p-4 space-y-3 glow-cyan">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-cyan-400 font-mono">AMB-02 (YELLOW ALERT)</span>
                    <div className="text-[11px] text-gray-300 font-semibold mt-1">👨‍✈️ Driver: K. Vijay</div>
                    <div className="text-[10px] text-gray-400">Complaint: Compound Fracture</div>
                  </div>
                  <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] px-2.5 py-1 rounded-xl font-mono animate-pulse">DISPATCHED</span>
                </div>
                <div className="text-xs space-y-1.5 font-mono text-gray-300 border-t border-gray-800 pt-3">
                  <div className="flex justify-between"><span>Speed:</span><span className="text-cyan-400">58 km/h</span></div>
                  <div className="flex justify-between"><span>Location:</span><span>Anna Salai Corridor</span></div>
                  <div className="flex justify-between"><span>Battery/Fuel:</span><span className="text-emerald-400">92%</span></div>
                </div>
              </div>

              <div className="bg-gray-950/80 border border-green-500/50 rounded-2xl p-4 space-y-3 glow-green">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-green-400 font-mono">AMB-03 (GREEN ALERT)</span>
                    <div className="text-[11px] text-gray-300 font-semibold mt-1">👨‍✈️ Driver: S. Ramesh</div>
                    <div className="text-[10px] text-gray-400">Complaint: Post-Operative Check</div>
                  </div>
                  <span className="bg-green-950 text-green-300 border border-green-800 text-[10px] px-2.5 py-1 rounded-xl font-mono animate-pulse">DISPATCHED</span>
                </div>
                <div className="text-xs space-y-1.5 font-mono text-gray-300 border-t border-gray-800 pt-3">
                  <div className="flex justify-between"><span>Speed:</span><span className="text-cyan-400">45 km/h</span></div>
                  <div className="flex justify-between"><span>Location:</span><span>Guindy Bypass</span></div>
                  <div className="flex justify-between"><span>Battery/Fuel:</span><span className="text-emerald-400">95%</span></div>
                </div>
              </div>

            </div>
          </div>
        )}
        {/* --- 4TH DYNAMIC EXTERNAL AMBULANCE CARD --- */}
{approvedExternalAmb && (
  <div className="bg-[#0b1329] border border-red-500/80 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden animate-in fade-in">
    <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
    <div className="flex justify-between items-center mb-3">
      <span className="text-sm font-bold text-red-400 font-mono">AMB-04 (EXT) (RED ALERT)</span>
      <span className="text-[10px] bg-red-950 text-red-400 px-2.5 py-1 rounded-full border border-red-800 font-mono">DISPATCHED</span>
    </div>
    <div className="text-xs text-slate-300 font-medium mb-1">👨‍✈️ Driver: A. Kumar (External Unit)</div>
    <div className="text-xs text-slate-400 mb-4">Complaint: Severe Poly-Trauma (Govt General Hospital Route)</div>
    
    <div className="space-y-2 text-xs font-mono border-t border-slate-800/80 pt-3">
      <div className="flex justify-between text-slate-300">
        <span className="text-slate-500">Speed:</span>
        <span className="text-cyan-400 font-bold">68 km/h</span>
      </div>
      <div className="flex justify-between text-slate-300">
        <span className="text-slate-500">Location:</span>
        <span className="text-slate-200">GST Road Corridor</span>
      </div>
      <div className="flex justify-between text-slate-300">
        <span className="text-slate-500">Battery/Fuel:</span>
        <span className="text-emerald-400">91%</span>
      </div>
    </div>
  </div>
)}

        {/* TAB 4: TRAFFIC CORRIDOR MAP (WITH TEYNAMPET & V2X RADIO BROADCAST MODULE) */}
        {activeTab === 'corridor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: CONTROLS & METRICS */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel rounded-3xl p-6 space-y-5 border border-cyan-500/20 shadow-xl">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase mb-1">Intersection J-084 Control Panel</div>
                  <h2 className="text-lg font-bold text-white uppercase font-mono">Mount Road Corridor</h2>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center bg-gray-950/80 p-3 rounded-2xl border border-gray-800">
                    <span className="text-gray-400">Signal Status:</span>
                    <span className={`px-2.5 py-1 rounded-xl font-bold ${isEmergency ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                      {isEmergency ? 'GREEN CORRIDOR ACTIVE' : 'RED STOP LOCKED'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-950/80 p-3 rounded-2xl border border-gray-800">
                    <span className="text-gray-400">Phase Timer:</span>
                    <span className="text-cyan-400 font-bold">{isEmergency ? `00:${countdown < 10 ? `0${countdown}` : countdown}s` : '45s (Standby)'}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-950/80 p-3 rounded-2xl border border-gray-800">
                    <span className="text-gray-400">Active Concurrency:</span>
                    <span className="text-white font-bold">3 Units Inbound</span>
                  </div>
                </div>

                {/* V2X RADIO BROADCAST ALERT STATUS BOX */}
                <div className={`p-4 rounded-2xl border transition-all space-y-2 font-mono ${
                  radioActive 
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-lg glow-red' 
                    : 'bg-gray-950/80 border-gray-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full bg-amber-400 ${radioActive ? 'animate-ping' : ''}`}></span>
                      V2X Radio Transmit Alert
                    </span>
                    <span className="text-[10px] text-gray-400">FM 107.9 / DSRC</span>
                  </div>
                  <div className="text-[11px] text-gray-300">
                    {radioActive ? (
                      <span className="text-amber-300 font-bold animate-pulse">
                        📢 BROADCASTING: "EMERGENCY VEHICLE APPROACHING ({selectedAmb}). ALL NEARBY VEHICLES PLEASE MOVE TO THE RIGHT."
                      </span>
                    ) : (
                      <span className="text-gray-500">Radio beacon standby. Triggers automatically on Dispatch Beacon.</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-cyan-950/20 border border-cyan-800/40 rounded-2xl space-y-2">
                  <div className="text-[11px] text-cyan-300 font-bold font-mono">Live V2X Traffic Synchronization</div>
                  <div className="text-[10px] text-gray-400">Clicking "DISPATCH BEACON" at the top triggers signal pre-emption across all 3 lanes and broadcasts urgent steering instructions to surrounding cars via radio.</div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: RESTRUCTURED VISUAL CORRIDOR SIMULATOR WITH TEYNAMPET ZONE STATUS */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="glass-panel rounded-3xl p-6 space-y-4 border border-cyan-500/20 shadow-xl">
                <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-gray-800">
                  <div>
                    <h2 className="text-xs font-bold uppercase text-gray-200 font-mono">Multi-Lane Intersection Pre-Emption View</h2>
                    <p className="text-xs text-gray-400">Dynamic signal transition & ambulance movement simulation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-800/80 border border-gray-700 px-3 py-1 rounded-xl text-cyan-400">V2X MESH ACTIVE</span>
                  </div>
                </div>

                {/* RESTRUCTURED CONTAINER LAYOUT */}
                <div className="relative bg-[#020617] border border-gray-800 rounded-2xl h-80 overflow-hidden flex flex-col justify-between p-4">
                  
                  {/* 3 TRAFFIC LIGHT HEADS (TOP RIGHT OF THE MAP) */}
                  <div className="absolute top-4 right-4 bg-gray-900/90 border border-gray-700/80 rounded-2xl p-2.5 flex gap-2.5 items-center z-30 shadow-lg">
                    {/* Signal 1 */}
                    <div className={`w-5 h-5 rounded-full transition-all duration-500 shadow-md ${isEmergency ? 'bg-emerald-500 glow-green' : 'bg-red-600 glow-red animate-pulse'}`}></div>
                    {/* Signal 2 */}
                    <div className={`w-5 h-5 rounded-full transition-all duration-500 shadow-md ${isEmergency ? 'bg-emerald-500 glow-green' : 'bg-red-600 glow-red animate-pulse'}`}></div>
                    {/* Signal 3 */}
                    <div className={`w-5 h-5 rounded-full transition-all duration-500 shadow-md ${isEmergency ? 'bg-emerald-500 glow-green' : 'bg-red-600 glow-red animate-pulse'}`}></div>
                  </div>

                  {/* CENTRAL JUNCTION NODE */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-cyan-500/60 bg-gray-900/90 flex items-center justify-center z-20 shadow-lg">
                    <span className="text-xs font-bold text-cyan-300 font-mono">J-084</span>
                  </div>

                  {/* ROAD LANES */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-44 bg-gray-900/40 border-y border-gray-800/80 flex flex-col justify-around py-2 pointer-events-none">
                    <div className="w-full border-t border-dashed border-gray-700/50"></div>
                    <div className="w-full border-t border-dashed border-gray-700/50"></div>
                  </div>

                  {/* AMBULANCE 1 (RED) */}
                  <div
                    className="absolute h-9 w-28 bg-red-600 border border-red-300/80 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shadow-xl transition-all duration-1000 z-20"
                    style={{ left: isEmergency ? '62%' : '8%', top: '28%', transform: 'translateY(-50%)' }}
                  >
                    <span>🚑 AMB-01 (Red)</span>
                  </div>

                  {/* AMBULANCE 2 (YELLOW) */}
                  <div
                    className="absolute h-9 w-28 bg-cyan-600 border border-cyan-300/80 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shadow-xl transition-all duration-1000 z-20"
                    style={{ left: isEmergency ? '62%' : '12%', top: '50%', transform: 'translateY(-50%)' }}
                  >
                    <span>🚑 AMB-02 (Yellow)</span>
                  </div>

                  {/* AMBULANCE 3 (GREEN) */}
                  <div
                    className="absolute h-9 w-28 bg-green-600 border border-green-300/80 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shadow-xl transition-all duration-1000 z-20"
                    style={{ left: isEmergency ? '62%' : '16%', top: '72%', transform: 'translateY(-50%)' }}
                  >
                    <span>🚑 AMB-03 (Green)</span>
                  </div>
                  

                  {/* BOTTOM STATUS BAR */}
                  <div className={`mt-auto relative z-20 h-9 rounded-xl flex items-center justify-between px-4 text-xs font-mono transition-all ${
                    isEmergency
                      ? 'bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 glow-green'
                      : 'bg-red-950/90 border border-red-500/80 text-red-300 glow-red'
                  }`}>
                    <span>&lt; &lt;</span>
                    <span className="font-bold">{isEmergency ? '🚦 ALL 3 SIGNALS GREEN >> CORRIDOR CLEAR' : '🛑 ALL 3 SIGNALS RED >> WAITING FOR BEACON'}</span>
                    <span>&gt; &gt;</span>
                  </div>

                </div>
              </div>

              {/* CORRIDOR SECTOR CONGESTION MATRIX (TEYNAMPET & SURROUNDING LOCATIONS) */}
              <div className="glass-panel rounded-3xl p-5 space-y-3 border border-cyan-500/20 shadow-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase text-cyan-300 font-mono">Sector Density & Traffic Flow (Teynampet Corridor)</h3>
                  <span className="text-[10px] text-gray-400 font-mono">Real-time IoT Telemetry</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                  <div className="bg-gray-950/80 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-gray-400">Sector Alpha</div>
                      <div className="text-xs font-bold text-white mt-0.5">Teynampet Junction</div>
                    </div>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">LOW TRAFFIC</span>
                  </div>

                  <div className="bg-gray-950/80 border border-red-500/40 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-gray-400">Sector Beta</div>
                      <div className="text-xs font-bold text-white mt-0.5">Mount Road (J-084)</div>
                    </div>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse">HIGH DENSITY</span>
                  </div>

                  <div className="bg-gray-950/80 border border-cyan-500/40 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-gray-400">Sector Gamma</div>
                      <div className="text-xs font-bold text-white mt-0.5">Alwarpet Approach</div>
                    </div>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">MODERATE</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 5: TRAFFIC CAMERAS */}
        {activeTab === 'cctv' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-bold uppercase text-gray-200 font-mono">CCTV Optical Vehicle Spotter</h2>
                  <p className="text-xs text-gray-400">YOLOv8 Edge Model + License Plate OCR</p>
                </div>
                <button onClick={triggerCameraPass} className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-xs px-3 py-1.5 rounded-xl font-bold shadow">
                  + Simulate Camera Pass
                </button>
              </div>

              <div className="relative bg-gray-950/80 border border-gray-800 rounded-2xl h-64 flex items-center justify-center overflow-hidden">
                <div className="border-2 border-cyan-400 bg-cyan-950/30 rounded-xl p-4 text-center glow-cyan">
                  <div className="text-xs font-mono font-bold text-cyan-300">SPOTTED: AMBULANCE #{selectedAmb}</div>
                  <div className="text-xs font-mono text-emerald-400 mt-1">PLATE: TN-38-E-4012 (98.2%)</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 glass-panel rounded-2xl p-5">
              <h2 className="text-xs font-bold uppercase text-gray-200 font-mono mb-2">24-Hour Emergency Passes</h2>
              <div className="h-56">
                <canvas ref={cctvHourlyRef}></canvas>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SIREN ACOUSTIC SENSOR */}
        {activeTab === 'acoustic' && (
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xs font-bold uppercase text-gray-200 font-mono">3-Mic Acoustic Siren Array Analysis</h2>
                <p className="text-xs text-gray-400">INMP441 MEMS Array • Doppler Filter Active</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-3 py-1 rounded-xl">
                TDoA Angle: {tdoaAngle}°
              </span>
            </div>
            <div className="h-64 bg-gray-950/80 border border-gray-800 rounded-2xl p-2">
              <canvas ref={acousticCanvasRef}></canvas>
            </div>
          </div>
        )}

        {/* TAB 7: REGULATORY & INSURANCE AUDIT LOGS (NEW MODULE) */}
        {activeTab === 'audit' && (
          <div className="glass-panel rounded-3xl p-6 space-y-5 border border-cyan-500/20 shadow-xl">
            <div className="flex justify-between items-center flex-wrap gap-2 border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-sm font-bold uppercase text-cyan-300 font-mono">Regulatory & Insurance Compliance Audit Logs</h2>
                <p className="text-xs text-gray-400">Immutable blockchain-timestamped records for municipal oversight, liability clearance, and green corridor insurance verification.</p>
              </div>
              <button onClick={() => alert('📥 Full Compliance Package exported as encrypted PDF bundle.')} className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs px-4 py-2 rounded-xl font-bold font-mono shadow">
                Export Compliance Bundle
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-gray-950/80 border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">VERIFIED</span>
                    <span className="text-white font-bold">Signal Pre-Emption Event #LOG-8841</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Corridor clearance triggered for unit <span className="text-cyan-400">{selectedAmb}</span> through Intersection J-084.</p>
                </div>
                <div className="text-right text-[11px] text-gray-400">
                  <div>Timestamp: 2026-08-14 16:28:07 IST</div>
                  <div className="text-emerald-400 font-bold">Status: Passed Municipal Check</div>
                </div>
              </div>

              <div className="bg-gray-950/80 border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">AUDIT OK</span>
                    <span className="text-white font-bold">V2X Radio Safety Broadcast Log #BRD-9912</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Automated "MOVE TO THE RIGHT" voice & DSRC data packet transmission verified across sector bands.</p>
                </div>
                <div className="text-right text-[11px] text-gray-400">
                  <div>Timestamp: 2026-08-14 16:25:10 IST</div>
                  <div className="text-cyan-400 font-bold">Status: 100% Packet Delivery</div>
                </div>
              </div>

              <div className="bg-gray-950/80 border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px]">CLEARED</span>
                    <span className="text-white font-bold">Acoustic Doppler Sensor Handshake #DSP-1104</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Siren frequency matched standard 960Hz Yelp pattern. TDoA angle validated at {tdoaAngle}°.</p>
                </div>
                <div className="text-right text-[11px] text-gray-400">
                  <div>Timestamp: 2026-08-14 16:20:45 IST</div>
                  <div className="text-amber-400 font-bold">Status: Validated</div>
                </div>
              </div>

              <div className="bg-gray-950/80 border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">RECORDED</span>
                    <span className="text-white font-bold">Hospital Handover & Bed Pre-Allocation #HSP-4402</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Trauma bay reserved at Apollo Central for inbound patient under triage category <span className="text-red-400">{currentPatient.triageLevel}</span>.</p>
                </div>
                <div className="text-right text-[11px] text-gray-400">
                  <div>Timestamp: 2026-08-14 16:15:00 IST</div>
                  <div className="text-purple-400 font-bold">Status: Confirmed</div>
                </div>
              </div>

              <div className="bg-gray-950/80 border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">INSURANCE</span>
                    <span className="text-white font-bold">Next-of-Kin GPS Tracking Link Generation #KIN-3301</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Encrypted session token generated for family member tracking without exposure of clinical telemetry.</p>
                </div>
                <div className="text-right text-[11px] text-gray-400">
                  <div>Timestamp: 2026-08-14 16:10:22 IST</div>
                  <div className="text-emerald-400 font-bold">Status: Secure & Compliant</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: DRIVERS PROGRESS & LIVES SAVED (NEW MODULE) */}
        {activeTab === 'drivers' && (
          <div className="glass-panel rounded-3xl p-6 space-y-6 border border-cyan-500/20 shadow-xl">
            <div className="flex justify-between items-center flex-wrap gap-2 border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-sm font-bold uppercase text-cyan-300 font-mono">Ambulance Drivers Progress & Lives Saved Leaderboard</h2>
                <p className="text-xs text-gray-400">Recognizing paramedic and driver performance metrics across critical emergency response missions.</p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-xs font-mono text-cyan-300">
                Total City Fleet Lives Saved: <span className="font-bold text-white">34 Lives This Month</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
              
              <div className="bg-gray-950/80 border border-red-500/50 rounded-2xl p-5 space-y-4 glow-red">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-red-400 uppercase font-bold">Lead Paramedic</span>
                    <h3 className="text-base font-bold text-white mt-0.5">R. Sharma</h3>
                    <p className="text-xs text-gray-400">Unit: AMB-01 (Red Alert)</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-950 text-red-400 border border-red-800">RANK #1</span>
                </div>
                <div className="space-y-2 text-xs border-t border-gray-800 pt-3 text-gray-300">
                  <div className="flex justify-between"><span>Lives Saved:</span><span className="text-emerald-400 font-bold text-sm">14 Patients</span></div>
                  <div className="flex justify-between"><span>Avg Response Time:</span><span className="text-cyan-400">4m 12s</span></div>
                  <div className="flex justify-between"><span>Success Rating:</span><span className="text-yellow-400">99.4%</span></div>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
                  <div className="bg-red-500 h-full" style={{ width: '95%' }}></div>
                </div>
              </div>

              <div className="bg-gray-950/80 border border-green-500/50 rounded-2xl p-5 space-y-4 glow-green">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-green-400 uppercase font-bold">Paramedic Officer</span>
                    <h3 className="text-base font-bold text-white mt-0.5">S. Ramesh</h3>
                    <p className="text-xs text-gray-400">Unit: AMB-03 (Green Alert)</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-950 text-green-400 border border-green-800">RANK #2</span>
                </div>
                <div className="space-y-2 text-xs border-t border-gray-800 pt-3 text-gray-300">
                  <div className="flex justify-between"><span>Lives Saved:</span><span className="text-emerald-400 font-bold text-sm">11 Patients</span></div>
                  <div className="flex justify-between"><span>Avg Response Time:</span><span className="text-cyan-400">4m 45s</span></div>
                  <div className="flex justify-between"><span>Success Rating:</span><span className="text-yellow-400">98.9%</span></div>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
                  <div className="bg-green-500 h-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="bg-gray-950/80 border border-cyan-500/50 rounded-2xl p-5 space-y-4 glow-cyan">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-cyan-400 uppercase font-bold">Paramedic Officer</span>
                    <h3 className="text-base font-bold text-white mt-0.5">K. Vijay</h3>
                    <p className="text-xs text-gray-400">Unit: AMB-02 (Yellow Alert)</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">RANK #3</span>
                </div>
                <div className="space-y-2 text-xs border-t border-gray-800 pt-3 text-gray-300">
                  <div className="flex justify-between"><span>Lives Saved:</span><span className="text-emerald-400 font-bold text-sm">9 Patients</span></div>
                  <div className="flex justify-between"><span>Avg Response Time:</span><span className="text-cyan-400">5m 02s</span></div>
                  <div className="flex justify-between"><span>Success Rating:</span><span className="text-yellow-400">97.8%</span></div>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
                  <div className="bg-cyan-500 h-full" style={{ width: '72%' }}></div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ePCR EXPORT MODAL POPUP */}
      {showEpcrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-6 space-y-4 glow-cyan border border-cyan-500/40">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-xs font-bold uppercase text-cyan-300 font-mono">Electronic Patient Care Report ({selectedAmb})</h3>
              <button onClick={() => setShowEpcrModal(false)} className="text-gray-400 hover:text-white font-mono text-sm">✕</button>
            </div>
            <div className="space-y-2 text-xs font-mono text-gray-300">
              <div className="flex justify-between bg-gray-950/80 p-2.5 rounded-xl"><span>Patient ID:</span><span className="text-white font-bold">PR-2026-8841</span></div>
              <div className="flex justify-between bg-gray-950/80 p-2.5 rounded-xl"><span>Assigned Ambulance:</span><span className="text-cyan-400 font-bold">{selectedAmb} ({currentPatient.driver})</span></div>
              <div className="flex justify-between bg-gray-950/80 p-2.5 rounded-xl"><span>Chief Complaint:</span><span className="text-yellow-400 font-bold">{currentPatient.chiefComplaint}</span></div>
              <div className="flex justify-between bg-gray-950/80 p-2.5 rounded-xl"><span>Current Heart Rate:</span><span className="text-red-400 font-bold">{currentPatient.bpm} BPM</span></div>
              <div className="flex justify-between bg-gray-950/80 p-2.5 rounded-xl"><span>Destination Trauma Bay:</span><span className="text-cyan-400 font-bold">Apollo Central - {currentPatient.bay}</span></div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
              <button onClick={() => setShowEpcrModal(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-xl font-bold">Close</button>
              <button onClick={() => { alert('📥 Clinical ePCR Summary Downloaded Successfully!'); setShowEpcrModal(false); }} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-xl font-bold shadow">Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* NEXT-OF-KIN SECURE FAMILY TRACKING PORTAL MODAL (WITH GPS INTEGRATION) */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-6 space-y-4 glow-cyan border border-cyan-500/40">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-xs font-bold uppercase text-cyan-300 font-mono">🔗 Next-of-Kin Secure GPS Family Tracking Portal</h3>
              <button onClick={() => setShowFamilyModal(false)} className="text-gray-400 hover:text-white font-mono text-sm">✕</button>
            </div>
            <div className="space-y-3 text-xs font-mono text-gray-300">
              <p className="text-[11px] text-gray-400">Generate a secure, real-time GPS tracking link for family members. Displays live ambulance coordinates, speed, and ETA without exposing sensitive medical records.</p>
              
              <div className="bg-gray-950/80 p-3 rounded-xl space-y-2 border border-gray-800">
                <span className="text-[10px] text-gray-400 uppercase">Emergency Contact Phone</span>
                <input 
                  type="text" 
                  value={familyPhone} 
                  onChange={(e) => setFamilyPhone(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs" 
                />
              </div>

              <div className="bg-gray-950/80 p-3 rounded-xl space-y-2 border border-cyan-900/40">
                <div className="text-[10px] text-cyan-400 uppercase font-bold">Live GPS Telemetry Feed to Family Portal:</div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-gray-900 p-2 rounded border border-gray-800 text-center">
                    <span className="text-gray-500 block text-[9px]">LAT / LNG</span>
                    <span className="text-white font-bold">{gpsCoordinates.lat}, {gpsCoordinates.lng}</span>
                  </div>
                  <div className="bg-gray-900 p-2 rounded border border-gray-800 text-center">
                    <span className="text-gray-500 block text-[9px]">SPEED</span>
                    <span className="text-emerald-400 font-bold">{gpsCoordinates.speedKmH} km/h</span>
                  </div>
                  <div className="bg-gray-900 p-2 rounded border border-gray-800 text-center">
                    <span className="text-gray-500 block text-[9px]">ETA</span>
                    <span className="text-cyan-400 font-bold">{isEmergency ? `${countdown}s` : 'Standby'}</span>
                  </div>
                </div>
                <div className="text-white text-[11px] bg-gray-900 p-2 rounded border border-gray-800 select-all mt-1">
                  https://pulseroute.live/track/PR-8841-GPS-SECURE
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
              <button onClick={() => setShowFamilyModal(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-xl font-bold">Close</button>
              <button onClick={() => { alert(`📱 Secure GPS Tracking Link Dispatched Successfully via SMS to ${familyPhone}!`); setShowFamilyModal(false); }} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-xl font-bold shadow">Send GPS SMS Link</button>
            </div>
          </div>
        </div>
      )}

      {/* BLACK-BOX AUDIT TERMINAL LOGS */}
      <footer className="mt-6 glass-panel rounded-2xl p-3.5 text-xs font-mono h-28 overflow-y-auto space-y-1 text-gray-400">
        <div className="text-cyan-400 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          [BLACK-BOX AUDIT TERMINAL]
        </div>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </footer>

    </div>
  );
}