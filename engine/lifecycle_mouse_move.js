/**
 * UNIFIVE Engine - Lifecycle Window Mouse Move Subsystem
 * Handles window-level mousemove for object transforms, crop dragging, and canvas panning.
 * Extracted from sketch.js lines 8021-8191.
 */
const LifecycleMouseMove = {
  handleMouseMove(e) {
    const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };

    // 0. Crop Dragging in CROP Mode
    if (typeof CropController !== "undefined" && CropController.cropDragState.isDragging && CropController.targetItemId && typeof mainCanvas !== "undefined" && mainCanvas) {
      const selectedItem = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
      if (selectedItem && selectedItem.crop) {
        const rect = mainCanvas.elt.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const wx = cam.panX + (sx - width / 2) / cam.zoom;
        const wy = cam.panY + (sy - height / 2) / cam.zoom;

        const local = WorldObjectsManager.worldToLocal(selectedItem, wx, wy);
        const ds = CropController.cropDragState;
        const nw = selectedItem.naturalW || selectedItem.w;
        const nh = selectedItem.naturalH || selectedItem.h;
        const scaleX = selectedItem.w / nw;
        const scaleY = selectedItem.h / nh;

        const dlx = (local.lx - ds.startLx) / scaleX;
        const dly = (local.ly - ds.startLy) / scaleY;

        let cx = ds.startCrop.x, cy = ds.startCrop.y, cw = ds.startCrop.w, ch = ds.startCrop.h;
        if (typeof LifecycleCropDrag !== "undefined") {
          const result = LifecycleCropDrag.applyCropMove(ds.handle, ds.startCrop, dlx, dly, nw, nh);
          cx = result.x; cy = result.y; cw = result.w; ch = result.h;
        }

        selectedItem.crop.x = Math.round(cx);
        selectedItem.crop.y = Math.round(cy);
        selectedItem.crop.w = Math.round(cw);
        selectedItem.crop.h = Math.round(ch);
        selectedItem.crop.isCropped = (cx > 0 || cy > 0 || cw < nw || ch < nh);

        if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(selectedItem);
      }
      return;
    }

    // 1. Transforming Selected Item in SELECT Mode
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.dragState.isDragging && WorldObjectsManager.selectedId && typeof mainCanvas !== "undefined" && mainCanvas) {
      if (typeof LifecycleObjectDrag !== "undefined") {
        LifecycleObjectDrag.handleObjectDrag(e, cam);
      }
      return;
    }

    // 2. Canvas World Panning
    if (typeof WorldConfig !== "undefined" && WorldConfig.isPanning) {
      if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
        const dx = (e.clientX - WorldConfig.panStartX) / cam.zoom;
        const dy = (e.clientY - WorldConfig.panStartY) / cam.zoom;
        if (typeof PreviewConfig !== "undefined") {
          PreviewConfig.panX = WorldConfig.startPanX - dx;
          PreviewConfig.panY = WorldConfig.startPanY - dy;
          PreviewConfig.isUserAdjusted = true;
        }
      } else {
        const dx = (e.clientX - WorldConfig.panStartX) / WorldConfig.zoom;
        const dy = (e.clientY - WorldConfig.panStartY) / WorldConfig.zoom;
        WorldConfig.panX = WorldConfig.startPanX - dx;
        WorldConfig.panY = WorldConfig.startPanY - dy;
        WorldConfig.clampPan();
      }
    }
  }
};
