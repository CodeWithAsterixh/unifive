/**
 * UNIFIVE Engine - Dock Pointer Move & End Subsystem
 */
const DockPointerMoveEnd = {
  bindMoveEnd(dock, controller, state) {
    function onMove(e) {
      if (!state.isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      if (Math.hypot(clientX - state.startX, clientY - state.startY) > 8) state.hasMoved = true;
      const newPos = controller.calculateSnapZone(clientX, clientY);
      controller.updateSnapZoneHighlight(newPos);
    }
    function onEnd(e) {
      if (!state.isDragging) return;
      state.isDragging = false;
      dock.classList.remove("dock-dragging");
      const indicators = document.getElementById("dock-snap-indicators");
      if (indicators) {
        indicators.style.display = "none";
        for (const z of indicators.querySelectorAll(".dock-snap-zone")) z.classList.remove("active-zone");
      }
      if (state.hasMoved) {
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const finalPos = controller.calculateSnapZone(clientX, clientY);
        controller.setPosition(finalPos);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "square", 0.05, 0.08);
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);
  }
};
