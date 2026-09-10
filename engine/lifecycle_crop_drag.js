/**
 * UNIFIVE Engine - Lifecycle Crop Drag Math Subsystem
 * Handles crop handle drag calculations for all 8 handles + body.
 * Extracted from sketch.js lines 8046-8097.
 */
const LifecycleCropDrag = {
  applyCropMove(handle, startCrop, dlx, dly, nw, nh) {
    let x = startCrop.x, y = startCrop.y, w = startCrop.w, h = startCrop.h;

    switch (handle) {
      case "body":
        x = Math.max(0, Math.min(nw - w, Math.round(startCrop.x + dlx)));
        y = Math.max(0, Math.min(nh - h, Math.round(startCrop.y + dly)));
        break;
      case "se":
        w = Math.max(8, Math.min(nw - x, Math.round(startCrop.w + dlx)));
        h = Math.max(8, Math.min(nh - y, Math.round(startCrop.h + dly)));
        break;
      case "nw": {
        const candX = Math.max(0, Math.min(startCrop.x + startCrop.w - 8, Math.round(startCrop.x + dlx)));
        const candY = Math.max(0, Math.min(startCrop.y + startCrop.h - 8, Math.round(startCrop.y + dly)));
        w = (startCrop.x + startCrop.w) - candX;
        h = (startCrop.y + startCrop.h) - candY;
        x = candX;
        y = candY;
        break;
      }
      case "ne": {
        const candY = Math.max(0, Math.min(startCrop.y + startCrop.h - 8, Math.round(startCrop.y + dly)));
        w = Math.max(8, Math.min(nw - x, Math.round(startCrop.w + dlx)));
        h = (startCrop.y + startCrop.h) - candY;
        y = candY;
        break;
      }
      case "sw": {
        const candX = Math.max(0, Math.min(startCrop.x + startCrop.w - 8, Math.round(startCrop.x + dlx)));
        w = (startCrop.x + startCrop.w) - candX;
        x = candX;
        h = Math.max(8, Math.min(nh - y, Math.round(startCrop.h + dly)));
        break;
      }
      case "e":
        w = Math.max(8, Math.min(nw - x, Math.round(startCrop.w + dlx)));
        break;
      case "w": {
        const candX = Math.max(0, Math.min(startCrop.x + startCrop.w - 8, Math.round(startCrop.x + dlx)));
        w = (startCrop.x + startCrop.w) - candX;
        x = candX;
        break;
      }
      case "s":
        h = Math.max(8, Math.min(nh - y, Math.round(startCrop.h + dly)));
        break;
      case "n": {
        const candY = Math.max(0, Math.min(startCrop.y + startCrop.h - 8, Math.round(startCrop.y + dly)));
        h = (startCrop.y + startCrop.h) - candY;
        y = candY;
        break;
      }
    }

    return { x, y, w, h };
  }
};
