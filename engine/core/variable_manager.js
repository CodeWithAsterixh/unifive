/**
 * UNIFIVE Engine - Variable Manager Aggregator
 * Central controller coordinating variable state (variable_store.js) and stage HUD watchers (variable_watchers.js).
 */
const VariableManager = {
  get variables() {
    return typeof VariableStore !== "undefined" ? VariableStore.variables : [];
  },
  set variables(val) {
    if (typeof VariableStore !== "undefined") VariableStore.variables = val;
  },

  get draggedVar() {
    return typeof VariableWatchers !== "undefined" ? VariableWatchers.draggedVar : null;
  },
  get hoveredVar() {
    return typeof VariableWatchers !== "undefined" ? VariableWatchers.hoveredVar : null;
  },

  init() {
    this.initModalListeners();
  },

  getVariable(name, targetId = null) {
    return typeof VariableStore !== "undefined" ? VariableStore.getVariable(name, targetId) : null;
  },

  setVariable(name, val, targetId = null) {
    return typeof VariableStore !== "undefined" ? VariableStore.setVariable(name, val, targetId) : val;
  },

  changeVariable(name, delta, targetId = null) {
    return typeof VariableStore !== "undefined" ? VariableStore.changeVariable(name, delta, targetId) : 0;
  },

  createVariable(name, scope = "global", initialVal = 0, targetId = null) {
    return typeof VariableStore !== "undefined" ? VariableStore.createVariable(name, scope, initialVal, targetId) : null;
  },

  deleteVariable(id) {
    if (typeof VariableStore !== "undefined") VariableStore.deleteVariable(id);
  },

  toggleWatcher(idOrName, forceState = null) {
    if (typeof VariableWatchers !== "undefined") VariableWatchers.toggleWatcher(this.variables, idOrName, forceState);
  },

  drawWatchers() {
    if (typeof VariableWatchers !== "undefined") VariableWatchers.drawWatchers(this.variables);
  },

  handleMouseDown(sx, sy) {
    return typeof VariableWatchers !== "undefined" ? VariableWatchers.handleMouseDown(this.variables, sx, sy) : false;
  },

  handleMouseMove(sx, sy) {
    return typeof VariableWatchers !== "undefined" ? VariableWatchers.handleMouseMove(this.variables, sx, sy) : false;
  },

  handleMouseUp() {
    return typeof VariableWatchers !== "undefined" ? VariableWatchers.handleMouseUp() : false;
  },

  initModalListeners() {
    const modal = document.getElementById("modal-make-variable");
    const inputName = document.getElementById("input-new-var-name");
    const btnClose = document.getElementById("btn-close-var-modal");
    const btnCancel = document.getElementById("btn-cancel-var-modal");
    const btnCreate = document.getElementById("btn-create-var-modal");

    const openModal = () => {
      if (modal) modal.style.display = "flex";
      if (inputName) {
        inputName.value = "";
        setTimeout(() => inputName.focus(), 50);
      }
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
    };

    const closeModal = () => {
      if (modal) modal.style.display = "none";
    };

    const submitCreate = () => {
      const name = inputName ? inputName.value.trim() : "";
      if (!name) return;
      const scopeRadio = document.querySelector('input[name="var-scope"]:checked');
      const scope = scopeRadio ? scopeRadio.value : "global";
      const targetId = scope === "local" && typeof AppModeController !== "undefined" ? AppModeController.getActiveTargetId() : null;

      this.createVariable(name, scope, 0, targetId);
      closeModal();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(880, "square", 0.06, 0.12);
    };

    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);
    if (btnCreate) btnCreate.addEventListener("click", submitCreate);
    if (inputName) {
      inputName.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submitCreate();
        if (e.key === "Escape") closeModal();
      });
    }

    this.openModal = openModal;
    this.closeModal = closeModal;
  }
};