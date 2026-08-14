class AudioFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playSiren(durationMs = 3000) {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;

    // Siren pitch sweep (850Hz to 1400Hz)
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.8);
    osc.frequency.linearRampToValueAtTime(850, now + 1.6);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (durationMs / 1000));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (durationMs / 1000));
  }
}

export const audioFX = new AudioFX();