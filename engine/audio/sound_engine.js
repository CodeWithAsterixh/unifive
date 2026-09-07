/**
 * UNIFIVE Engine - Sound Engine Subsystem
 * Aggregator coordinating audio context synthesis (synth_core.js) and game sound effects (sound_effects.js).
 */
const SoundEngine = {
  enabled: true,

  get audioCtx() {
    return typeof SynthCore !== "undefined" ? SynthCore.audioCtx : null;
  },
  set audioCtx(val) {
    if (typeof SynthCore !== "undefined") SynthCore.audioCtx = val;
  },

  init() {
    if (typeof SynthCore !== "undefined") SynthCore.init();
  },

  playChiptuneTone(freq, type = "square", duration = 0.08, volume = 0.1) {
    if (typeof SynthCore !== "undefined") {
      SynthCore.playChiptuneTone(this.enabled, freq, type, duration, volume);
    }
  },

  playAction(action) {
    if (typeof SoundEffects !== "undefined") {
      SoundEffects.playAction(this, action);
    }
  },

  playSoundEffect(name) {
    if (typeof SoundEffects !== "undefined") {
      SoundEffects.playSoundEffect(this, name);
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    const btn = document.getElementById("btn-sound");
    const icon = document.getElementById("sound-icon");
    const label = document.getElementById("sound-label");

    if (this.enabled) {
      this.playAction("toggle_on");
      if (btn) btn.classList.add("active");
      if (icon) icon.className = "ph ph-speaker-high";
      if (label) label.textContent = "AUDIO: ON";
    } else {
      if (btn) btn.classList.remove("active");
      if (icon) icon.className = "ph ph-speaker-slash";
      if (label) label.textContent = "AUDIO: OFF";
    }
    return this.enabled;
  },

  toggleMute() {
    return this.toggle();
  }
};