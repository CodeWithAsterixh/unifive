/**
 * UNIFIVE Engine - Sound Effects Subsystem
 */
const SoundEffects = {
  playAction(soundEngine, action) {
    switch (action) {
      case "undo": ActionHistorySounds.playUndo(soundEngine); break;
      case "redo": ActionHistorySounds.playRedo(soundEngine); break;
      case "save": ActionSaveSound.playSave(soundEngine); break;
      case "toggle_on": ActionToggleSound.playToggle(soundEngine, true); break;
      case "toggle_off": ActionToggleSound.playToggle(soundEngine, false); break;
      default: soundEngine.playChiptuneTone(440, "square", 0.08, 0.1);
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
        case "jump": PresetSynthSounds.playJump(ctx, t); break;
        case "laser": PresetSynthSounds.playLaser(ctx, t); break;
        case "coin": PresetMelodySounds.playCoin(soundEngine); break;
        case "hit": PresetSynthSounds.playHit(ctx, t); break;
        case "powerup": PresetMelodySounds.playPowerup(soundEngine); break;
        default: soundEngine.playChiptuneTone(440, "square", 0.08, 0.1);
      }
    } catch (e) {
      console.warn("Sound effect error:", e);
    }
  }
};
