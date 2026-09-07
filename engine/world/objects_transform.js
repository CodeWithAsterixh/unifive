/**
 * UNIFIVE World - Objects Transform & Gizmo Subsystem
 * Coordinate conversions, transform handles hit testing, and canvas bounding box gizmos.
 */
(function (global) {
  'use strict';

  const ObjectsTransform = {
    worldToLocal(item, wx, wy) {
      const cx = item.x + item.w / 2;
      const cy = item.y + item.h / 2;
      const dx = wx - cx;
      const dy = wy - cy;
      const rad = -(item.rotation || 0) * Math.PI / 180;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      return { lx, ly, cx, cy };
    },

    getTransformTarget(item, wx, wy) {
      if (!item) return null;

      if (item.locked) {
        const { lx, ly } = this.worldToLocal(item, wx, wy);
        const hw = item.w / 2;
        const hh = item.h / 2;
        if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) {
          return { mode: "locked_only", handle: null };
        }
        return null;
      }

      if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
        const { lx, ly } = this.worldToLocal(item, wx, wy);
        const hw = item.w / 2;
        const hh = item.h / 2;
        if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) {
          return { mode: "select_only", handle: null };
        }
        return null;
      }

      const { lx, ly } = this.worldToLocal(item, wx, wy);
      const hw = item.w / 2;
      const hh = item.h / 2;
      const zoom = typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1;
      const handleHitDist = 12 / zoom;

      // 1. Rotation Handle at top: (0, -hh - 24)
      if (Math.hypot(lx - 0, ly - (-hh - 24)) <= handleHitDist + 4) {
        return { mode: "rotate", handle: "rot" };
      }

      // 2. 8 Resize Handles
      const handles = {
        nw: [-hw, -hh],
        n:  [0, -hh],
        ne: [hw, -hh],
        e:  [hw, 0],
        se: [hw, hh],
        s:  [0, hh],
        sw: [-hw, hh],
        w:  [-hw, 0]
      };

      for (const [key, [hx, hy]] of Object.entries(handles)) {
        if (Math.hypot(lx - hx, ly - hy) <= handleHitDist) {
          return { mode: "resize", handle: key };
        }
      }

      // 3. Item Body
      if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) {
        return { mode: "move", handle: null };
      }

      return null;
    },

    drawGizmo(item) {
      if (typeof push !== "function") return;
      push();
      translate(item.x + item.w / 2, item.y + item.h / 2);
      rotate(radians(item.rotation || 0));

      const w = item.w;
      const h = item.h;

      if (item.locked) {
        stroke(239, 68, 68);
        strokeWeight(2);
        noFill();
        rect(-w / 2, -h / 2, w, h);

        const tagText = `🔒 ${item.name.toUpperCase()} (LOCKED)`;
        textSize(9);
        const tagW = textWidth(tagText) + 14;
        fill(13, 2, 5, 230);
        stroke(239, 68, 68);
        strokeWeight(1);
        rect(-tagW / 2, Math.min(-h / 2 - 28, -h / 2 - 32), tagW, 16);

        fill(255, 120, 120);
        noStroke();
        textAlign(CENTER, CENTER);
        text(tagText, 0, Math.min(-h / 2 - 20, -h / 2 - 24));
        pop();
        return;
      }

      // 1. Selection Bounding Box
      stroke(254, 204, 27);
      strokeWeight(2);
      noFill();
      rect(-w / 2, -h / 2, w, h);

      // 2. Rotation Stalk & Circle Handle
      stroke(254, 204, 27);
      strokeWeight(1.5);
      line(0, -h / 2, 0, -h / 2 - 24);

      fill(254, 204, 27);
      stroke(13, 2, 5);
      strokeWeight(1.5);
      circle(0, -h / 2 - 24, 12);
      fill(13, 2, 5);
      noStroke();
      circle(0, -h / 2 - 24, 4);

      // 3. 8 Resize Handles
      const handles = [
        [-w/2, -h/2], [0, -h/2], [w/2, -h/2],
        [w/2, 0], [w/2, h/2], [0, h/2],
        [-w/2, h/2], [-w/2, 0]
      ];
      const hs = 8;
      fill(254, 204, 27);
      stroke(13, 2, 5);
      strokeWeight(1.5);
      handles.forEach(([hx, hy]) => {
        rect(hx - hs / 2, hy - hs / 2, hs, hs);
      });

      // 4. Dimension & Rotation Info Tag
      const tagText = `${item.name.toUpperCase()} | ${Math.round(w)}x${Math.round(h)} | ${Math.round(item.rotation || 0)}°`;
      textSize(9);
      const tagW = textWidth(tagText) + 12;
      fill(13, 2, 5, 230);
      stroke(254, 204, 27);
      strokeWeight(1);
      rect(-tagW / 2, Math.min(-h / 2 - 38, -h / 2 - 42), tagW, 16);

      fill(254, 204, 27);
      noStroke();
      textAlign(CENTER, CENTER);
      text(tagText, 0, Math.min(-h / 2 - 30, -h / 2 - 34));
      pop();
    }
  };

  global.ObjectsTransform = ObjectsTransform;
})(typeof window !== 'undefined' ? window : globalThis);
