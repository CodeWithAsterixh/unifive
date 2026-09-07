const VariableManager = {
  variables: [
    { id: "var_score", name: "score", scope: "global", targetId: null, value: 0, showWatcher: true }
  ],

  init() {
    this.initModalListeners();
  },

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
  },

  toggleWatcher(idOrName, forceState = null) {
    const v = this.variables.find(item => item.id === idOrName || item.name.toLowerCase() === String(idOrName).toLowerCase());
    if (v) {
      v.showWatcher = forceState !== null ? forceState : !v.showWatcher;
    }
  },

  drawWatchers() {
    const visibleVars = this.variables.filter(v => v.showWatcher);
    if (visibleVars.length === 0) return;

    push();
    resetMatrix();
    textSize(10);
    textAlign(LEFT, CENTER);

    const stageW = (typeof width !== "undefined" ? width : window.innerWidth);
    const stageH = (typeof height !== "undefined" ? height : window.innerHeight);

    visibleVars.forEach((v, idx) => {
      const scopeTag = v.scope === "local" ? " [SPRITE]" : "";
      const label = `${v.name.toUpperCase()}${scopeTag}: ${v.value}`;
      const badgeW = textWidth(label) + 26;
      const badgeH = 22;

      // Default position if not initialized
      if (v.x === undefined || v.x === null) v.x = 12;
      if (v.y === undefined || v.y === null) v.y = 12 + idx * (badgeH + 6);

      // Clamp position within stage canvas
      v.x = Math.max(2, Math.min(stageW - badgeW - 2, v.x));
      v.y = Math.max(2, Math.min(stageH - badgeH - 2, v.y));

      v._renderedBounds = { x: v.x, y: v.y, w: badgeW, h: badgeH };

      const isHovered = this.hoveredVar === v;
      const isDragging = this.draggedVar === v;

      // Badge pill background
      fill(26, 4, 11, 240);
      if (isDragging) {
        stroke(254, 240, 138); // Gold glowing highlight on drag
        strokeWeight(2);
      } else if (isHovered) {
        stroke(251, 146, 60);
        strokeWeight(1.5);
      } else {
        stroke(249, 115, 22);
        strokeWeight(1.5);
      }
      rect(v.x, v.y, badgeW, badgeH, 4);

      // Diamond bullet
      noStroke();
      fill(isDragging ? color(254, 240, 138) : color(249, 115, 22));
      rect(v.x + 7, v.y + badgeH / 2 - 3, 6, 6);

      // Text
      fill(255, 235, 210);
      text(label, v.x + 18, v.y + badgeH / 2);
    });
    pop();
  },

  handleMouseDown(sx, sy) {
    const visibleVars = this.variables.filter(v => v.showWatcher);
    for (let i = visibleVars.length - 1; i >= 0; i--) {
      const v = visibleVars[i];
      if (v._renderedBounds) {
        const b = v._renderedBounds;
        if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) {
          this.draggedVar = v;
          this.dragOffset = { x: sx - v.x, y: sy - v.y };
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(580, "square", 0.03, 0.06);
          return true;
        }
      }
    }
    return false;
  },

  handleMouseMove(sx, sy) {
    if (this.draggedVar) {
      const stageW = (typeof width !== "undefined" ? width : window.innerWidth);
      const stageH = (typeof height !== "undefined" ? height : window.innerHeight);
      const bW = this.draggedVar._renderedBounds ? this.draggedVar._renderedBounds.w : 80;
      const bH = this.draggedVar._renderedBounds ? this.draggedVar._renderedBounds.h : 22;
      this.draggedVar.x = Math.max(2, Math.min(stageW - bW - 2, Math.round(sx - this.dragOffset.x)));
      this.draggedVar.y = Math.max(2, Math.min(stageH - bH - 2, Math.round(sy - this.dragOffset.y)));
      return true;
    }

    // Hover check
    const visibleVars = this.variables.filter(v => v.showWatcher);
    let foundHover = null;
    for (let i = visibleVars.length - 1; i >= 0; i--) {
      const v = visibleVars[i];
      if (v._renderedBounds) {
        const b = v._renderedBounds;
        if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) {
          foundHover = v;
          break;
        }
      }
    }
    this.hoveredVar = foundHover;
    return !!foundHover;
  },

  handleMouseUp() {
    if (this.draggedVar) {
      this.draggedVar = null;
      if (typeof AsyncSceneStore !== "undefined" && AsyncSceneStore.saveCurrentScene) {
        AsyncSceneStore.saveCurrentScene();
      }
      return true;
    }
    return false;
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
      SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
    };

    const closeModal = () => {
      if (modal) modal.style.display = "none";
    };

    const submitCreate = () => {
      const name = inputName ? inputName.value.trim() : "";
      if (!name) return;
      const scopeRadio = document.querySelector('input[name="var-scope"]:checked');
      const scope = scopeRadio ? scopeRadio.value : "global";
      const targetId = scope === "local" ? AppModeController.getActiveTargetId() : null;

      this.createVariable(name, scope, 0, targetId);
      closeModal();
      SoundEngine.playChiptuneTone(880, "square", 0.06, 0.12);
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

// ============================================================================
// 11. APP MODE CONTROLLER (Canvas Mode vs Visual Code Mode)
// ============================================================================