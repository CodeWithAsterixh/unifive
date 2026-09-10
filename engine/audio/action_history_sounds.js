/**
 * UNIFIVE Engine - Action History Sounds Subsystem
 */
const ActionHistorySounds = {
  playUndo(soundEngine) {
    soundEngine.playChiptuneTone(320, "square", 0.07, 0.12);
    setTimeout(() => soundEngine.playChiptuneTone(240, "square", 0.09, 0.12), 60);
  },
  playRedo(soundEngine) {
    soundEngine.playChiptuneTone(260, "square", 0.07, 0.12);
    setTimeout(() => soundEngine.playChiptuneTone(390, "square", 0.09, 0.12), 60);
  }
};
