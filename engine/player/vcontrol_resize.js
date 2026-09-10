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
    const groups = document.querySelectorAll(".vcontrol-group");
    const selectGroup = (groupEl) => {
      document.querySelectorAll(".vcontrol-group.selected-for-edit").forEach(el => el.classList.remove("selected-for-edit"));
      groupEl.classList.add("selected-for-edit");
      manager.selectedGroup = groupEl.getAttribute("data-group");
      if (typeof PropertiesController !== "undefined") {
        PropertiesController.updateFromVirtualControl(manager, manager.selectedGroup);
      }
    };

    for (const groupEl of groups) {
      groupEl.addEventListener("pointerdown", (event) => {
        if (!manager.isDraggable()) return;
        const groupKey = groupEl.getAttribute("data-group");
        const cfg = manager.currentLayout && manager.currentLayout[groupKey];
        if (!groupKey || !cfg) return;

        event.preventDefault();
        event.stopPropagation();
        selectGroup(groupEl);
        groupEl.setPointerCapture?.(event.pointerId);

        if (event.target.closest(".vcontrol-resize-handle")) {
          manager.resizingGroup = {
            key: groupKey,
            startX: event.clientX,
            startY: event.clientY,
            startScale: cfg.scale || 1
          };
          groupEl.classList.add("resizing");
        } else if (manager.activeCustomizerTool === "move" || manager.editorPreviewVisible) {
          manager.draggedGroup = {
            key: groupKey,
            startX: event.clientX,
            startY: event.clientY,
            startControlX: cfg.x || 0,
            startControlY: cfg.y || 0,
            anchor: cfg.anchor || "top-left"
          };
          groupEl.classList.add("dragging");
        }
      });
    }

    window.addEventListener("pointermove", (event) => {
      if (manager.resizingGroup) {
        const state = manager.resizingGroup;
        const cfg = manager.currentLayout[state.key];
        const delta = (event.clientX - state.startX) + (event.clientY - state.startY);
        cfg.scale = Math.max(0.5, Math.min(2.5, Math.round((state.startScale + delta / 180) * 100) / 100));
        manager.applyLayout();
        const label = document.getElementById("customizer-resize-label");
        if (label) label.textContent = `Scale: ${Math.round(cfg.scale * 100)}%`;
      } else if (manager.draggedGroup) {
        const state = manager.draggedGroup;
        const cfg = manager.currentLayout[state.key];
        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        const rightAnchored = state.anchor === "top-right" || state.anchor === "bottom-right";
        const bottomAnchored = state.anchor === "bottom-left" || state.anchor === "bottom-right" || state.anchor === "bottom-center";
        cfg.x = Math.round(state.startControlX + (rightAnchored ? -dx : dx));
        cfg.y = Math.round(state.startControlY + (bottomAnchored ? -dy : dy));
        manager.applyLayout();
      }
    });

    function onEnd() {
      if (manager.resizingGroup || manager.draggedGroup) {
        if (typeof VControlState !== "undefined") VControlState.saveLayout(manager);
        manager.applyLayout();
      }
      document.querySelectorAll(".vcontrol-group.dragging, .vcontrol-group.resizing").forEach(el => el.classList.remove("dragging", "resizing"));
      manager.resizingGroup = null;
      manager.draggedGroup = null;
    }
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);
  }
};
