/**
 * UNIFIVE Engine - Virtual Controls Customizer Subsystem
 */
const VControlCustomizer = {
  bindUI(manager) {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".customizer-tool-btn");
      if (!btn) return;
      const tool = btn.getAttribute("data-tool");
      if (tool === "back") manager.closeCustomizer();
      else if (tool === "reset") {
        manager.currentLayout = JSON.parse(JSON.stringify(manager.defaultLayout));
        manager.applyLayout();
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(659, "triangle", 0.08, 0.15);
      } else {
        this.setCustomizerTool(manager, tool);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(480, "square", 0.03, 0.06);
      }
    });
  },

  setCustomizerTool(manager, toolName) {
    manager.activeCustomizerTool = toolName;
    const btns = document.querySelectorAll(".customizer-tool-btn");
    for (const btn of btns) btn.classList.toggle("active", btn.getAttribute("data-tool") === toolName);
    const resizeBar = document.getElementById("customizer-resize-bar");
    const visBox = document.getElementById("customizer-visibility-box");
    if (resizeBar) resizeBar.style.display = toolName === "resize" ? "flex" : "none";
    if (visBox) visBox.style.display = toolName === "visibility" ? "flex" : "none";
  }
};
