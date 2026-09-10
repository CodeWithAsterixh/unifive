/**
 * UNIFIVE Engine - UI Event Listeners Coordinator
 */
function initUIEventListeners() {
  if (typeof HeaderActions !== "undefined") HeaderActions.init();
  if (typeof KeyboardShortcuts !== "undefined") KeyboardShortcuts.init();
}
