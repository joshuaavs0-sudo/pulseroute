import { WebSocketServer } from 'ws';

// Start a live streaming server on port 8080
const wss = new WebSocketServer({ port: 8080 });

console.log('⚡ PulseRoute Hardware Streamer is running on ws://localhost:8080');

wss.on('connection', (ws) => {
  console.log('React Dashboard connected to Hardware Stream!');

  // Every 1 second, blast fresh live telemetry data to React
  const interval = setInterval(() => {
    const telemetry = {
      timestamp: new Date().toLocaleTimeString(),
      nodeId: 'ESP32-NODE-02',
      rssi: `${Math.floor(Math.random() * (-45 - -65 + 1)) - 65} dBm`,
      fftPeak: `${(1.1 + Math.random() * 0.3).toFixed(2)} kHz`,
      speedKm: Math.floor(60 + Math.random() * 15),
    };

    ws.send(JSON.stringify(telemetry));
  }, 1000);

  ws.on('close', () => clearInterval(interval));
});