const HistoryManager = {
  undoStack: [],
  redoStack: [],
  maxHistory: 50,

  updateUI() {
    const btnUndo = document.getElementById("btn-undo");
    const btnRedo = document.getElementById("btn-redo");

    if (btnUndo) btnUndo.disabled = this.undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = this.redoStack.length === 0;
  },

  pushState(state) {
    this.undoStack.push(state);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.updateUI();
  },

  undo() {
    if (this.undoStack.length === 0) return null;
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);
    this.updateUI();
    SoundEngine.playAction("undo");

    const prevState = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
    if (prevState && prevState.items) {
      WorldObjectsManager.deserialize(prevState.items);
    } else {
      WorldObjectsManager.deserialize([]);
    }
    if (typeof AsyncSceneStore !== "undefined") {
      AsyncSceneStore.saveCurrentScene();
    }
    return currentState;
  },

  redo() {
    if (this.redoStack.length === 0) return null;
    const stateToRestore = this.redoStack.pop();
    this.undoStack.push(stateToRestore);
    this.updateUI();
    SoundEngine.playAction("redo");

    if (stateToRestore && stateToRestore.items) {
      WorldObjectsManager.deserialize(stateToRestore.items);
    }
    if (typeof AsyncSceneStore !== "undefined") {
      AsyncSceneStore.saveCurrentScene();
    }
    return stateToRestore;
  },

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.updateUI();
  }
};

// ============================================================================
// 8. FULL-SCREEN CANVAS STAGE & RESIZING HELPERS
// ============================================================================