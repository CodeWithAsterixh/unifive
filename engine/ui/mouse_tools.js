/**
 * UNIFIVE Engine - Mouse Tools Subsystem
 * Pointer tool states (Select vs Pan/Move), grid visibility toggle, and cursor styling.
 */
const MouseTools = {
  activeTool: "move", // "move" | "select"
  showGrid: true,

  setTool(tool) {
    this.activeTool = tool;
    const btnMove = document.getElementById("btn-tool-move");
    const btnSelect = document.getElementById("btn-tool-select");

    if (btnMove) btnMove.classList.toggle("active", tool === "move");
    if (btnSelect) btnSelect.classList.toggle("active", tool === "select");

    this.updateCursor();
    const freqMap = { move: 440, select: 560 };
    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(freqMap[tool] || 440, "square", 0.05, 0.08);
    }
  },

  toggleGrid() {
    this.showGrid = !this.showGrid;
    const btn = document.getElementById("btn-toggle-grid");
    const icon = document.getElementById("grid-icon");

    if (btn) btn.classList.toggle("active", this.showGrid);
    if (icon) icon.className = this.showGrid ? "ph ph-grid-four" : "ph ph-square";

    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(this.showGrid ? 600 : 300, "square", 0.06, 0.08);
    }
  },

  updateCursor() {
    const container = document.getElementById("canvas-container");
    if (container) {
      container.classList.remove("cursor-move", "cursor-select", "panning");
      container.classList.add(`cursor-${this.activeTool}`);
    }
  }
};
