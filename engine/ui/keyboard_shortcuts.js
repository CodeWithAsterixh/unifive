/**
 * UNIFIVE Engine - Keyboard Shortcuts Subsystem
 */
if (typeof window !== "undefined" && typeof window.isSpacePressed === "undefined") {
  window.isSpacePressed = false;
}

const KeyboardShortcuts = {
  init() {
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Space") {
        window.isSpacePressed = true;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (typeof HistoryManager !== "undefined") HistoryManager.redo();
        } else {
          if (typeof HistoryManager !== "undefined") HistoryManager.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (typeof HistoryManager !== "undefined") HistoryManager.redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (typeof saveWorkspace === "function") saveWorkspace();
      } else if (e.key.toLowerCase() === "v" && !e.ctrlKey && !e.metaKey) {
        if (typeof ViewController !== "undefined") ViewController.toggleView();
      } else if ((e.key.toLowerCase() === "m" || e.key.toLowerCase() === "h") && !e.ctrlKey && !e.metaKey) {
        if (typeof MouseToolController !== "undefined") MouseToolController.setTool("move");
      } else if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey) {
        if (typeof MouseToolController !== "undefined") MouseToolController.setTool("select");
      } else if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey) {
        if (typeof MouseToolController !== "undefined") MouseToolController.toggleGrid();
      } else if (e.key.toLowerCase() === "p") {
        if (typeof AppModeController !== "undefined") AppModeController.setMode("play");
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        window.isSpacePressed = false;
      }
    });
  }
};
