/**
 * UNIFIVE Engine - Mouse Tool & Grid Controller Subsystem
 */
const MouseToolController = {
  activeTool: "select",
  showGrid: true,

  init() {
    this.updateCursor();
    this.syncButtons();

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("#btn-tool-move, #btn-tool-select, #btn-toggle-grid");
      if (!btn) return;
      if (btn.id === "btn-tool-move") this.setTool("move");
      else if (btn.id === "btn-tool-select") this.setTool("select");
      else if (btn.id === "btn-toggle-grid") this.toggleGrid();
    });
  },

  syncButtons() {
    const btnMove = document.getElementById("btn-tool-move");
    const btnSelect = document.getElementById("btn-tool-select");
    if (btnMove) btnMove.classList.toggle("active", this.activeTool === "move");
    if (btnSelect) btnSelect.classList.toggle("active", this.activeTool === "select");
  },

  setTool(tool) {
    this.activeTool = tool;
    this.syncButtons();
    this.updateCursor();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(tool === "select" ? 560 : 440, "square", 0.05, 0.08);
  },

  toggleGrid() {
    this.showGrid = !this.showGrid;
    const btnGrid = document.getElementById("btn-toggle-grid");
    if (btnGrid) btnGrid.classList.toggle("active", this.showGrid);
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(this.showGrid ? 640 : 360, "square", 0.04, 0.08);
  },

  updateCursor() {
    const canvasContainer = document.getElementById("canvas-container");
    if (canvasContainer) {
      canvasContainer.classList.toggle("cursor-move", this.activeTool === "move");
      canvasContainer.classList.toggle("cursor-select", this.activeTool === "select");
    }
  }
};
