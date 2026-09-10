/**
 * UNIFIVE Engine - Dock Pointer Start Subsystem
 */
const DockPointerStart = {
  bindStart(handle, dock, controller, state) {
    const onStart = (e, clientX, clientY) => {
      state.isDragging = true;
      state.startX = clientX;
      state.startY = clientY;
      state.hasMoved = false;
      dock.classList.add("dock-dragging");

      const indicators = document.getElementById("dock-snap-indicators");
      if (indicators) {
        indicators.style.display = "block";
        controller.updateSnapZoneHighlight(controller.dockPosition);
      }
      e.preventDefault();
      e.stopPropagation();
    };

    handle.addEventListener("mousedown", (e) => onStart(e, e.clientX, e.clientY));
    handle.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) onStart(e, e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
  }
};
