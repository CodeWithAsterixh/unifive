/**
 * UNIFIVE Engine - Save Workspace Subsystem
 */
function saveWorkspace() {
  if (typeof SoundEngine !== "undefined") SoundEngine.playAction("save");
  if (typeof mainCanvas !== "undefined" && mainCanvas) {
    saveCanvas(mainCanvas, "unifive_pixel_workspace", "png");
  }
}
