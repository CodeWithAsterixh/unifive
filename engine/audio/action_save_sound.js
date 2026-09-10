/**
 * UNIFIVE Engine - Action Save Sound Subsystem
 */
const ActionSaveSound = {
  playSave(soundEngine) {
    soundEngine.playChiptuneTone(523.25, "square", 0.08, 0.12);
    setTimeout(() => soundEngine.playChiptuneTone(659.25, "square", 0.08, 0.12), 70);
    setTimeout(() => soundEngine.playChiptuneTone(783.99, "square", 0.08, 0.12), 140);
    setTimeout(() => soundEngine.playChiptuneTone(1046.50, "square", 0.18, 0.15), 210);
  }
};
