/**
 * UNIFIVE World - Crop Overlay Renderer Subsystem
 * Renders outer dark shroud, rule-of-thirds grid, corner brackets, and dimension tags on p5 canvas.
 */
(function (global) {
  'use strict';

  const CropRenderer = {
    drawCropOverlay(item) {
      if (typeof push !== "function") return;
      push();
      translate(item.x + item.w / 2, item.y + item.h / 2);
      rotate(radians(item.rotation || 0));
      scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);

      const nw = item.naturalW || item.w;
      const nh = item.naturalH || item.h;
      const w = item.w;
      const h = item.h;

      const c = item.crop || { x: 0, y: 0, w: nw, h: nh };
      const cx1 = -w / 2 + (c.x / nw) * w;
      const cy1 = -h / 2 + (c.y / nh) * h;
      const cw1 = (c.w / nw) * w;
      const ch1 = (c.h / nh) * h;

      // 1. Darkened outer shroud
      fill(0, 0, 0, 160);
      noStroke();
      rect(-w / 2, -h / 2, w, cy1 - (-h / 2));
      rect(-w / 2, cy1 + ch1, w, (h / 2) - (cy1 + ch1));
      rect(-w / 2, cy1, cx1 - (-w / 2), ch1);
      rect(cx1 + cw1, cy1, (w / 2) - (cx1 + cw1), ch1);

      // 2. Rule of thirds grid
      stroke(255, 255, 255, 70);
      strokeWeight(1);
      line(cx1 + cw1 / 3, cy1, cx1 + cw1 / 3, cy1 + ch1);
      line(cx1 + (cw1 * 2) / 3, cy1, cx1 + (cw1 * 2) / 3, cy1 + ch1);
      line(cx1, cy1 + ch1 / 3, cx1 + cw1, cy1 + ch1 / 3);
      line(cx1, cy1 + (ch1 * 2) / 3, cx1 + cw1, cy1 + (ch1 * 2) / 3);

      // 3. Crop box border
      stroke(121, 247, 167);
      strokeWeight(2);
      noFill();
      rect(cx1, cy1, cw1, ch1);

      // 4. 8 Heavy Corner & Edge Brackets
      stroke(254, 204, 27);
      strokeWeight(3.5);
      strokeCap(SQUARE);
      const bLen = Math.min(16, Math.min(cw1, ch1) / 3);

      // NW
      line(cx1, cy1, cx1 + bLen, cy1);
      line(cx1, cy1, cx1, cy1 + bLen);
      // NE
      line(cx1 + cw1, cy1, cx1 + cw1 - bLen, cy1);
      line(cx1 + cw1, cy1, cx1 + cw1, cy1 + bLen);
      // SE
      line(cx1 + cw1, cy1 + ch1, cx1 + cw1 - bLen, cy1 + ch1);
      line(cx1 + cw1, cy1 + ch1, cx1 + cw1, cy1 + ch1 - bLen);
      // SW
      line(cx1, cy1 + ch1, cx1 + bLen, cy1 + ch1);
      line(cx1, cy1 + ch1, cx1, cy1 + ch1 - bLen);

      // Edges
      line(cx1 + cw1 / 2 - bLen / 2, cy1, cx1 + cw1 / 2 + bLen / 2, cy1);
      line(cx1 + cw1 / 2 - bLen / 2, cy1 + ch1, cx1 + cw1 / 2 + bLen / 2, cy1 + ch1);
      line(cx1, cy1 + ch1 / 2 - bLen / 2, cx1, cy1 + ch1 / 2 + bLen / 2);
      line(cx1 + cw1, cy1 + ch1 / 2 - bLen / 2, cx1 + cw1, cy1 + ch1 / 2 + bLen / 2);

      // 5. Crop Size Tag Badge
      const cropTag = `CROP: ${Math.round(c.w)}x${Math.round(c.h)} PX`;
      textSize(9);
      const tagW = textWidth(cropTag) + 12;
      fill(13, 2, 5, 230);
      stroke(121, 247, 167);
      strokeWeight(1);
      rect(cx1 + cw1 / 2 - tagW / 2, cy1 - 22, tagW, 16);

      fill(121, 247, 167);
      noStroke();
      textAlign(CENTER, CENTER);
      text(cropTag, cx1 + cw1 / 2, cy1 - 14);

      pop();
    }
  };

  global.CropRenderer = CropRenderer;
})(typeof window !== 'undefined' ? window : globalThis);
