/**
 * UNIFIVE Engine - Header Actions Subsystem
 */
const HeaderActions = {
  init() {
    if (typeof HeaderUndoRedo !== "undefined") HeaderUndoRedo.bind();
    if (typeof HeaderSoundFullscreen !== "undefined") HeaderSoundFullscreen.bind();
  }
};
