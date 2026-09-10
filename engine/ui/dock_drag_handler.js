/**
 * UNIFIVE Engine - Dock Drag Handler Subsystem
 */
const DockDragHandler = {
  initDrag(dock, handle, controller) {
    const state = { isDragging: false, startX: 0, startY: 0, hasMoved: false };
    if (typeof DockPointerStart !== "undefined") DockPointerStart.bindStart(handle, dock, controller, state);
    if (typeof DockPointerMoveEnd !== "undefined") DockPointerMoveEnd.bindMoveEnd(dock, controller, state);

    handle.addEventListener("click", () => {
      if (!state.hasMoved) controller.cyclePosition();
    });
  }
};
