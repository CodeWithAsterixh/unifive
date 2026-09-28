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

      const rect = dock.getBoundingClientRect();
      state.offsetX = clientX - (rect.left + rect.width / 2);
      state.offsetY = clientY - (rect.top + rect.height / 2);

      dock.classList.add("dock-dragging");

      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };

    handle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      onStart(e, e.clientX, e.clientY);
    });
    handle.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length > 0) {
        onStart(e, e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
  }
};

