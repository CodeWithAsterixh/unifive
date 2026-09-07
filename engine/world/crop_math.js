/**
 * UNIFIVE World - Crop Math & Geometry Subsystem
 * Aspect ratios, handle hit detection, and coordinate transformations.
 */
(function (global) {
  'use strict';

  const CropMath = {
    applyAspectPreset(aspect) {
      const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
      if (!item) return;
      const nw = item.naturalW || item.w;
      const nh = item.naturalH || item.h;

      if (!item.crop) {
        item.crop = { x: 0, y: 0, w: nw, h: nh, isCropped: false };
      }

      switch (aspect) {
        case "orig":
          item.crop.x = 0;
          item.crop.y = 0;
          item.crop.w = nw;
          item.crop.h = nh;
          break;
        case "1:1": {
          const size = Math.min(nw, nh);
          item.crop.w = size;
          item.crop.h = size;
          item.crop.x = Math.round((nw - size) / 2);
          item.crop.y = Math.round((nh - size) / 2);
          break;
        }
        case "4:3": {
          let w = nw;
          let h = Math.round(w * 3 / 4);
          if (h > nh) {
            h = nh;
            w = Math.round(h * 4 / 3);
          }
          item.crop.w = w;
          item.crop.h = h;
          item.crop.x = Math.round((nw - w) / 2);
          item.crop.y = Math.round((nh - h) / 2);
          break;
        }
        case "16:9": {
          let w = nw;
          let h = Math.round(w * 9 / 16);
          if (h > nh) {
            h = nh;
            w = Math.round(h * 16 / 9);
          }
          item.crop.w = w;
          item.crop.h = h;
          item.crop.x = Math.round((nw - w) / 2);
          item.crop.y = Math.round((nh - h) / 2);
          break;
        }
      }

      item.crop.isCropped = (item.crop.x > 0 || item.crop.y > 0 || item.crop.w < nw || item.crop.h < nh);
      if (typeof PropertiesController !== "undefined") {
        PropertiesController.updateFromSelected(item);
      }
      if (typeof SoundEngine !== "undefined") {
        SoundEngine.playChiptuneTone(560, "square", 0.05, 0.08);
      }
    },

    getCropTransformTarget(item, wx, wy) {
      if (!item || !item.crop || typeof WorldObjectsManager === "undefined") return null;
      const { lx, ly } = WorldObjectsManager.worldToLocal(item, wx, wy);
      const nw = item.naturalW || item.w;
      const nh = item.naturalH || item.h;

      const cx1 = -item.w / 2 + (item.crop.x / nw) * item.w;
      const cy1 = -item.h / 2 + (item.crop.y / nh) * item.h;
      const cw1 = (item.crop.w / nw) * item.w;
      const ch1 = (item.crop.h / nh) * item.h;

      const zoom = typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1;
      const handleHitDist = 14 / zoom;

      const handles = {
        nw: [cx1, cy1],
        n:  [cx1 + cw1 / 2, cy1],
        ne: [cx1 + cw1, cy1],
        e:  [cx1 + cw1, cy1 + ch1 / 2],
        se: [cx1 + cw1, cy1 + ch1],
        s:  [cx1 + cw1 / 2, cy1 + ch1],
        sw: [cx1, cy1 + ch1],
        w:  [cx1, cy1 + ch1 / 2]
      };

      for (const [key, [hx, hy]] of Object.entries(handles)) {
        if (Math.hypot(lx - hx, ly - hy) <= handleHitDist) {
          return { mode: "crop", handle: key, lx, ly };
        }
      }

      if (lx >= cx1 && lx <= cx1 + cw1 && ly >= cy1 && ly <= cy1 + ch1) {
        return { mode: "crop", handle: "body", lx, ly };
      }

      return null;
    }
  };

  global.CropMath = CropMath;
})(typeof window !== 'undefined' ? window : globalThis);
