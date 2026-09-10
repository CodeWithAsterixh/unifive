/**
 * UNIFIVE Engine - Variable Store Subsystem
 */
const VariableStore = {
  variables: {},
  init() {
    this.variables = {};
  },
  set(name, value) {
    this.variables[name] = value;
    if (typeof VariableWatchers !== "undefined") VariableWatchers.renderWatchers();
  },
  get(name) {
    return this.variables[name];
  },
  getAll() {
    return Object.assign({}, this.variables);
  },
  saveHistory() {
    if (typeof HistoryManager !== "undefined") HistoryManager.pushState();
  }
};
