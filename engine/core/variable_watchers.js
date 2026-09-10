/**
 * UNIFIVE Engine - Variable Watchers Coordinator
 */
const VariableWatchers = {
  renderWatchers() {
    if (typeof WatcherRenderer !== "undefined") WatcherRenderer.render();
  },
  init() {
    if (typeof WatcherInteraction !== "undefined") WatcherInteraction.init();
    this.renderWatchers();
  }
};
