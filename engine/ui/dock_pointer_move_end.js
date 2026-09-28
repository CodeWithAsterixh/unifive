/**
 * UNIFIVE Engine - Dock Pointer Move & End Subsystem
 */
const DockPointerMoveEnd = {
  bindMoveEnd(dock, controller, state) {
    function onMove(e) {
      if (!state.isDragging) return;
      const touch = e.touches && e.touches[0];
      const clientX = touch ? touch.clientX : e.clientX;
      const clientY = touch ? touch.clientY : e.clientY;
      if (clientX === undefined || clientY === undefined) return;

      if (!state.hasMoved && Math.hypot(clientX - state.startX, clientY - state.startY) > 5) {
        state.hasMoved = true;
      }

      if (state.hasMoved) {
        dock.style.left = `${clientX - (state.offsetX || 0)}px`;
        dock.style.top = `${clientY - (state.offsetY || 0)}px`;
        dock.style.right = "auto";
        dock.style.bottom = "auto";
        dock.style.transform = "translate(-50%, -50%) scale(1.04)";
      }

      if (e.cancelable) e.preventDefault();
    }

    function onEnd(e) {
      if (!state.isDragging) return;
      state.isDragging = false;
      dock.classList.remove("dock-dragging");

      dock.style.left = "";
      dock.style.top = "";
      dock.style.right = "";
      dock.style.bottom = "";
      dock.style.transform = "";

      if (state.hasMoved) {
        const touch = e.changedTouches && e.changedTouches[0];
        const clientX = touch ? touch.clientX : (e.clientX !== undefined ? e.clientX : state.startX);
        const clientY = touch ? touch.clientY : (e.clientY !== undefined ? e.clientY : state.startY);
        const finalPos = controller.calculateSnapZone(clientX, clientY);
        controller.setPosition(finalPos);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "square", 0.05, 0.08);
      } else {
        controller.cyclePosition();
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "sine", 0.04, 0.07);
      }
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
  }
};
