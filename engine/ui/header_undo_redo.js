/**
 * UNIFIVE Engine - Header Undo/Redo Subsystem
 */
const HeaderUndoRedo = {
  bind() {
    const btnUndo = document.getElementById("btn-undo");
    const btnRedo = document.getElementById("btn-redo");

    if (btnUndo) {
      btnUndo.addEventListener("click", () => {
        if (typeof HistoryManager !== "undefined") HistoryManager.undo();
      });
    }

    if (btnRedo) {
      btnRedo.addEventListener("click", () => {
        if (typeof HistoryManager !== "undefined") HistoryManager.redo();
      });
    }
  }
};
