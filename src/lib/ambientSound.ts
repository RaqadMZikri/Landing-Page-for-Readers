// Ambient Binaural Drone & Studio Atmosphere Synthesizer using Web Audio API
class AmbientSoundscape {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private noiseNode: AudioBufferSourceNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start() {
    try {
      this.initContext();
      if (!this.ctx) return;

      this.stop(); // Stop any existing

      const now = this.ctx.currentTime;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, now);
      // Gentle fade-in over 2 seconds
      this.masterGain.gain.exponentialRampToValueAtTime(0.18, now + 2);
      this.masterGain.connect(this.ctx.destination);

      // Warm harmonic drones (A=432Hz root, fifth, octave, and sub-octave)
      const freqs = [108, 162, 216, 324];
      this.oscillators = [];

      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Subtle slow pitch drift for organic feeling
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.1 + idx * 0.05, now);
        lfoGain.gain.setValueAtTime(1.2, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        const vol = idx === 0 ? 0.35 : 0.15;
        oscGain.gain.setValueAtTime(vol, now);

        if (panner) {
          panner.pan.setValueAtTime((idx % 2 === 0 ? -0.3 : 0.3), now);
          osc.connect(oscGain);
          oscGain.connect(panner);
          panner.connect(this.masterGain);
        } else {
          osc.connect(oscGain);
          oscGain.connect(this.masterGain);
        }

        osc.start();
        this.oscillators.push(osc);
      });

      // Filtered pink/warm vinyl tape noise
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.05;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, now);

      this.noiseNode.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      this.noiseNode.start();

      this.isRunning = true;
    } catch {
      // Audio context might be blocked prior to user interaction
    }
  }

  public stop() {
    if (!this.ctx || !this.isRunning) return;
    try {
      const now = this.ctx.currentTime;
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      }
      setTimeout(() => {
        this.oscillators.forEach(osc => {
          try { osc.stop(); osc.disconnect(); } catch { /* ignore */ }
        });
        this.oscillators = [];
        if (this.noiseNode) {
          try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch { /* ignore */ }
          this.noiseNode = null;
        }
        this.isRunning = false;
      }, 900);
    } catch {
      this.isRunning = false;
    }
  }

  public isAudioRunning() {
    return this.isRunning;
  }
}

export const soundscape = new AmbientSoundscape();
