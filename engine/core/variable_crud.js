/**
 * UNIFIVE Engine - Variable CRUD Operations Subsystem
 */
const VariableCrud = {
  createVariable(name, scope = "global", initialValue = 0, targetId = null) {
    if (typeof VariableStore === "undefined") return null;
    const cleanName = String(name || "").trim();
    if (!cleanName) return null;

    if (Array.isArray(VariableStore.variables)) {
      const existing = VariableStore.variables.find(v => 
        v.name.toLowerCase() === cleanName.toLowerCase() && 
        (scope === "global" ? v.scope === "global" : (v.scope === "local" && v.targetId === targetId))
      );
      if (existing) return existing;

      const newVar = {
        id: "var_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: cleanName,
        scope: scope,
        targetId: scope === "local" ? targetId : null,
        value: initialValue,
        showWatcher: true
      };
      VariableStore.variables.push(newVar);
      if (VariableStore.saveHistory) VariableStore.saveHistory();
      if (typeof VariableWatchers !== "undefined") VariableWatchers.renderWatchers();
      if (typeof AppModeController !== "undefined" && AppModeController.activeCategory === "variables") {
        AppModeController.selectCategory("variables");
      }
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(560, "square", 0.04, 0.08);
      return newVar;
    } else {
      const val = initialValue !== undefined ? initialValue : 0;
      VariableStore.variables[cleanName] = val;
      if (VariableStore.saveHistory) VariableStore.saveHistory();
      if (typeof VariableWatchers !== "undefined") VariableWatchers.renderWatchers();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(560, "square", 0.04, 0.08);
      return { id: cleanName, name: cleanName, value: val };
    }
  },

  deleteVariable(idOrName) {
    if (typeof VariableStore === "undefined") return;
    if (Array.isArray(VariableStore.variables)) {
      const idx = VariableStore.variables.findIndex(v => v.id === idOrName || v.name === idOrName);
      if (idx >= 0) {
        VariableStore.variables.splice(idx, 1);
        if (VariableStore.saveHistory) VariableStore.saveHistory();
        if (typeof VariableWatchers !== "undefined") VariableWatchers.renderWatchers();
        if (typeof AppModeController !== "undefined" && AppModeController.activeCategory === "variables") {
          AppModeController.selectCategory("variables");
        }
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(320, "square", 0.06, 0.08);
      }
    } else if (idOrName in VariableStore.variables) {
      delete VariableStore.variables[idOrName];
      if (VariableStore.saveHistory) VariableStore.saveHistory();
      if (typeof VariableWatchers !== "undefined") VariableWatchers.renderWatchers();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(320, "square", 0.06, 0.08);
    }
  }
};
