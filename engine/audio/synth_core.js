/**
 * UNIFIVE Engine - Synth Core Subsystem
 * Web Audio API context management, oscillator synthesis, and tone generation.
 */
const SynthCore = {
  audioCtx: null,
  enabled: true,

  init() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  },

  playChiptuneTone(freq, type, duration, volume) {
    if (!this.enabled) return;
    if (!freq || !type) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      const dur = (typeof duration === "number" && duration > 0) ? duration : 0.08;
      const vol = (typeof volume === "number" && volume > 0) ? volume : 0.1;

      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + dur);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + dur);
    } catch (e) {
      console.warn("8-Bit Audio error:", e);
    }
  }
};
