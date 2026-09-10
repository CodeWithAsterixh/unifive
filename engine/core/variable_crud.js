/**
 * UNIFIVE Engine - Variable CRUD Operations Subsystem
 */
const VariableCrud = {
  createVariable(name, initialValue) {
    if (typeof VariableStore === "undefined") return;
    const cleanName = String(name || "").trim();
    if (!cleanName) return;
    const val = initialValue !== undefined ? initialValue : 0;
    VariableStore.variables[cleanName] = val;
    VariableStore.saveHistory();
    if (typeof VariableWatchers !== "undefined") VariableWatchers.renderWatchers();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(560, "square", 0.04, 0.08);
  },
  deleteVariable(name) {
    if (typeof VariableStore === "undefined") return;
    if (name in VariableStore.variables) {
      delete VariableStore.variables[name];
      VariableStore.saveHistory();
      if (typeof VariableWatchers !== "undefined") VariableWatchers.renderWatchers();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(320, "square", 0.06, 0.08);
    }
  }
};
