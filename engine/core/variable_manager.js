/**
 * UNIFIVE Engine - Variable Manager Subsystem
 */
const VariableManager = {
  variables: [],

  init() {
    if (typeof VariableWatchers !== "undefined") VariableWatchers.init();
  },

  getVariable(name, targetId) {
    if (!name) return null;
    const clean = String(name).trim().toLowerCase();
    for (const v of this.variables) {
      if ((v.name || "").toLowerCase() === clean) return v;
    }
    return null;
  },

  drawWatchers() {
    if (typeof WatcherRenderer !== "undefined") {
      const dVar = typeof WatcherInteraction !== "undefined" ? WatcherInteraction.draggedVar : null;
      const hVar = typeof WatcherInteraction !== "undefined" ? WatcherInteraction.hoveredVar : null;
      WatcherRenderer.drawWatchers(this.variables, dVar, hVar);
    }
  },

  handleMouseDown(sx, sy) {
    return false;
  }
};
