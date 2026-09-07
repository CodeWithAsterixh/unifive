/**
 * UNIFIVE Engine - Mouse Tool Controller Subsystem
 * Aggregator coordinating mouse selection/pan tools (mouse_tools.js) and floating action dock (dock_controller.js).
 */
const MouseToolController = {
  get activeTool() {
    return typeof MouseTools !== "undefined" ? MouseTools.activeTool : "move";
  },
  set activeTool(val) {
    if (typeof MouseTools !== "undefined") MouseTools.activeTool = val;
  },

  get showGrid() {
    return typeof MouseTools !== "undefined" ? MouseTools.showGrid : true;
  },
  set showGrid(val) {
    if (typeof MouseTools !== "undefined") MouseTools.showGrid = val;
  },

  get dockPosition() {
    return typeof DockController !== "undefined" ? DockController.dockPosition : "bottom";
  },
  set dockPosition(val) {
    if (typeof DockController !== "undefined") DockController.dockPosition = val;
  },

  init() {
    const btnMove = document.getElementById("btn-tool-move");
    const btnSelect = document.getElementById("btn-tool-select");
    const btnGrid = document.getElementById("btn-toggle-grid");

    if (btnMove) btnMove.addEventListener("click", () => this.setTool("move"));
    if (btnSelect) btnSelect.addEventListener("click", () => this.setTool("select"));
    if (btnGrid) btnGrid.addEventListener("click", () => this.toggleGrid());

    if (typeof MouseTools !== "undefined") MouseTools.updateCursor();
    if (typeof DockController !== "undefined") DockController.init();
  },

  setTool(tool) {
    if (typeof MouseTools !== "undefined") MouseTools.setTool(tool);
  },

  toggleGrid() {
    if (typeof MouseTools !== "undefined") MouseTools.toggleGrid();
  }
};