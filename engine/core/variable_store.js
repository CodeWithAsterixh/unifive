/**
 * UNIFIVE Engine - Variable Store Subsystem
 * Data repository for global and sprite-scoped variables, value accessors, and mutations.
 */
const VariableStore = {
  variables: [
    { id: "var_score", name: "score", scope: "global", targetId: null, value: 0, showWatcher: true }
  ],

  getVariable(name, targetId = null) {
    if (!name) return null;
    const cleanName = String(name).toLowerCase().trim();
    // 1. Try local sprite variable first
    if (targetId) {
      const local = this.variables.find(v => v.name.toLowerCase() === cleanName && v.scope === "local" && v.targetId === targetId);
      if (local) return local;
    }
    // 2. Try global variable
    const global = this.variables.find(v => v.name.toLowerCase() === cleanName && v.scope === "global");
    if (global) return global;

    return this.variables.find(v => v.name.toLowerCase() === cleanName) || null;
  },

  setVariable(name, val, targetId = null) {
    let v = this.getVariable(name, targetId);
    if (!v) {
      v = this.createVariable(name, "global", val);
    }
    const num = Number(val);
    v.value = (!isNaN(num) && String(val).trim() !== "") ? num : val;
    return v.value;
  },

  changeVariable(name, delta, targetId = null) {
    let v = this.getVariable(name, targetId);
    if (!v) {
      v = this.createVariable(name, "global", 0);
    }
    const curNum = Number(v.value) || 0;
    const deltaNum = Number(delta) || 0;
    v.value = curNum + deltaNum;
    return v.value;
  },

  createVariable(name, scope = "global", initialVal = 0, targetId = null) {
    const trimmed = (name || "").trim();
    if (!trimmed) return null;

    const existing = this.variables.find(v => 
      v.name.toLowerCase() === trimmed.toLowerCase() && 
      (scope === "global" ? v.scope === "global" : (v.scope === "local" && v.targetId === targetId))
    );
    if (existing) return existing;

    const newVar = {
      id: "var_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      name: trimmed,
      scope: scope,
      targetId: scope === "local" ? targetId : null,
      value: initialVal,
      showWatcher: true
    };
    this.variables.push(newVar);

    if (typeof AppModeController !== "undefined" && AppModeController.activeCategory === "variables") {
      AppModeController.selectCategory("variables");
    }
    return newVar;
  },

  deleteVariable(id) {
    const idx = this.variables.findIndex(v => v.id === id);
    if (idx >= 0) {
      this.variables.splice(idx, 1);
      if (typeof AppModeController !== "undefined" && AppModeController.activeCategory === "variables") {
        AppModeController.selectCategory("variables");
      }
    }
  }
};
