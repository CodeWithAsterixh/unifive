/**
 * UNIFIVE Engine - Action Toggle Sound Subsystem
 */
const ActionToggleSound = {
  playToggle(soundEngine, isOn) {
    if (isOn) {
      soundEngine.playChiptuneTone(440, "square", 0.06, 0.1);
      setTimeout(() => soundEngine.playChiptuneTone(880, "square", 0.1, 0.12), 60);
    } else {
      soundEngine.playChiptuneTone(600, "square", 0.06, 0.1);
      setTimeout(() => soundEngine.playChiptuneTone(300, "square", 0.1, 0.1), 60);
    }
  }
};
