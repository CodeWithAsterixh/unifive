/**
 * UNIFIVE Engine - Mouse Tools Subsystem
 */
const MouseTools = {
  activeTool: "select",
  init(controller) {
    const btnSelect = document.getElementById("btn-tool-select");
    const btnPan = document.getElementById("btn-tool-pan");
    if (btnSelect) btnSelect.addEventListener("click", () => this.setTool("select"));
    if (btnPan) btnPan.addEventListener("click", () => this.setTool("pan"));
  },
  setTool(tool) {
    this.activeTool = tool;
    const btnSelect = document.getElementById("btn-tool-select");
    const btnPan = document.getElementById("btn-tool-pan");
    if (btnSelect) btnSelect.classList.toggle("active", tool === "select");
    if (btnPan) btnPan.classList.toggle("active", tool === "pan");
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(480, "square", 0.04, 0.08);
  }
};
