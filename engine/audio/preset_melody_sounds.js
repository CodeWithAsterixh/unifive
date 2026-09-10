/**
 * UNIFIVE Engine - Preset Melody Sounds Subsystem
 */
const PresetMelodySounds = {
  playCoin(soundEngine) {
    soundEngine.playChiptuneTone(987.77, "triangle", 0.08, 0.15);
    setTimeout(() => soundEngine.playChiptuneTone(1318.51, "triangle", 0.2, 0.15), 70);
  },
  playPowerup(soundEngine) {
    const notes = [330, 392, 494, 659];
    for (let i = 0; i < notes.length; i++) {
      const freq = notes[i];
      setTimeout(() => soundEngine.playChiptuneTone(freq, "square", 0.07, 0.12), i * 60);
    }
  }
};
