/**
 * UNIFIVE Engine - Master Sound Engine Subsystem
 */
const SoundEngine = {
  get enabled() { return typeof SynthCore !== "undefined" ? SynthCore.enabled : false; },
  set enabled(val) { if (typeof SynthCore !== "undefined") SynthCore.enabled = val; },

  init() {
    if (typeof SynthCore !== "undefined") SynthCore.init();
  },

  playChiptuneTone(freq, type, duration, vol) {
    if (typeof SynthCore !== "undefined") SynthCore.playChiptuneTone(freq, type, duration, vol);
  },

  playAction(actionName) {
    if (typeof SoundEffects !== "undefined") SoundEffects.playAction(this, actionName);
  },

  playSound(id) {
    this.playSoundEffect(id);
  },

  playSoundEffect(id) {
    if (typeof SoundEffects !== "undefined") SoundEffects.playSoundEffect(this, id);
  },

  toggle() {
    this.enabled = !this.enabled;
    if (typeof SoundIndicator !== "undefined") SoundIndicator.update();
  }
};
