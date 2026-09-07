/**
 * UNIFIVE Engine - Sound Effects Subsystem
 * Chiptune sound effects: jump, laser, coin, hit, powerup, save, undo, redo, and toggles.
 */
const SoundEffects = {
  playAction(soundEngine, action) {
    switch (action) {
      case "undo":
        soundEngine.playChiptuneTone(320, "square", 0.07, 0.12);
        setTimeout(() => soundEngine.playChiptuneTone(240, "square", 0.09, 0.12), 60);
        break;
      case "redo":
        soundEngine.playChiptuneTone(260, "square", 0.07, 0.12);
        setTimeout(() => soundEngine.playChiptuneTone(390, "square", 0.09, 0.12), 60);
        break;
      case "save":
        soundEngine.playChiptuneTone(523.25, "square", 0.08, 0.12);
        setTimeout(() => soundEngine.playChiptuneTone(659.25, "square", 0.08, 0.12), 70);
        setTimeout(() => soundEngine.playChiptuneTone(783.99, "square", 0.08, 0.12), 140);
        setTimeout(() => soundEngine.playChiptuneTone(1046.50, "square", 0.18, 0.15), 210);
        break;
      case "toggle_on":
        soundEngine.playChiptuneTone(440, "square", 0.06, 0.1);
        setTimeout(() => soundEngine.playChiptuneTone(880, "square", 0.1, 0.12), 60);
        break;
      case "toggle_off":
        soundEngine.playChiptuneTone(600, "square", 0.06, 0.1);
        setTimeout(() => soundEngine.playChiptuneTone(300, "square", 0.1, 0.1), 60);
        break;
      default:
        soundEngine.playChiptuneTone(440, "square", 0.08, 0.1);
    }
  },

  playSoundEffect(soundEngine, name) {
    if (!soundEngine.enabled) return;
    try {
      soundEngine.init();
      const ctx = soundEngine.audioCtx;
      if (!ctx) return;
      const t = ctx.currentTime;
      switch (name) {
        case "jump": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.18);
          break;
        }
        case "laser": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(1200, t);
          osc.frequency.exponentialRampToValueAtTime(120, t + 0.14);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.15);
          break;
        }
        case "coin": {
          soundEngine.playChiptuneTone(987.77, "triangle", 0.08, 0.15);
          setTimeout(() => soundEngine.playChiptuneTone(1318.51, "triangle", 0.2, 0.15), 70);
          break;
        }
        case "hit": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(180, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.13);
          break;
        }
        case "powerup": {
          const notes = [330, 392, 494, 659];
          notes.forEach((freq, idx) => {
            setTimeout(() => soundEngine.playChiptuneTone(freq, "square", 0.07, 0.12), idx * 60);
          });
          break;
        }
        default:
          soundEngine.playChiptuneTone(440, "square", 0.08, 0.1);
      }
    } catch (e) {
      console.warn("Sound effect error:", e);
    }
  }
};
