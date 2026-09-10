/**
 * UNIFIVE Engine - Virtual Controls Drag & Resize Subsystem
 */
const VControlResize = {
  init(manager) {
    const groups = document.querySelectorAll(".vcontrol-group");
    for (const groupEl of groups) {
      const groupKey = groupEl.getAttribute("data-group");
      if (!groupKey) continue;
      let resizeHandle = groupEl.querySelector(".vcontrol-resize-handle");
      if (!resizeHandle) {
        resizeHandle = document.createElement("div");
        resizeHandle.className = "vcontrol-resize-handle";
        resizeHandle.setAttribute("data-group", groupKey);
        groupEl.appendChild(resizeHandle);
      }
    }
    this.bindPointerEvents(manager);
  },

  bindPointerEvents(manager) {
    function onEnd() {
      manager.resizingGroup = null;
      manager.draggedGroup = null;
    }
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);
  }
};
