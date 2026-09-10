/**
 * UNIFIVE Engine - Lifecycle Setup Subsystem
 */
function initLifecycleSetup() {
  if (typeof SplitterController !== "undefined") SplitterController.init();
  if (typeof initUIEventListeners === "function") initUIEventListeners();
}
