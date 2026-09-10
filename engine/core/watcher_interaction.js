/**
 * UNIFIVE Engine - Watcher Interaction Subsystem
 */
const WatcherInteraction = {
  init() {
    const container = document.getElementById("canvas-variable-watchers");
    if (!container) return;
    let draggedWatcher = null;
    let offset = { x: 0, y: 0 };

    const handlePointerStart = (e) => {
      const pill = e.target.closest(".variable-watcher-pill");
      if (!pill) return;
      draggedWatcher = pill;
      const rect = pill.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      offset.x = clientX - rect.left;
      offset.y = clientY - rect.top;
      pill.classList.add("dragging");
    };

    const handlePointerMove = (e) => {
      if (!draggedWatcher) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const pRect = container.getBoundingClientRect();
      const x = clientX - pRect.left - offset.x;
      const y = clientY - pRect.top - offset.y;
      draggedWatcher.style.left = Math.max(0, Math.min(pRect.width - 60, x)) + "px";
      draggedWatcher.style.top = Math.max(0, Math.min(pRect.height - 30, y)) + "px";
    };

    const handlePointerEnd = () => {
      if (draggedWatcher) {
        draggedWatcher.classList.remove("dragging");
        draggedWatcher = null;
      }
    };

    container.addEventListener("mousedown", handlePointerStart);
    container.addEventListener("touchstart", handlePointerStart, { passive: true });
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("mouseup", handlePointerEnd);
    window.addEventListener("touchend", handlePointerEnd);
  }
};
