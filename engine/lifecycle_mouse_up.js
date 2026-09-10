/**
 * UNIFIVE Engine - Lifecycle Window Mouse Up Subsystem
 * Handles window-level mouseup to end drag/pan operations.
 * Extracted from sketch.js lines 8193-8210.
 */
const LifecycleMouseUp = {
  handleMouseUp() {
    if (typeof CropController !== "undefined" && CropController.cropDragState.isDragging) {
      CropController.cropDragState.isDragging = false;
      if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
    }

    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.dragState.isDragging) {
      WorldObjectsManager.dragState.isDragging = false;
      WorldObjectsManager.saveHistory();
      if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
    }

    if (typeof WorldConfig !== "undefined" && WorldConfig.isPanning) {
      WorldConfig.isPanning = false;
      const container = document.getElementById("canvas-container");
      if (container) container.classList.remove("panning");
    }
  }
};
