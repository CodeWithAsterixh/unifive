/**
 * UNIFIVE World - Objects Canvas Renderer Subsystem
 * Depth/Y-sorting, sprites/poses rendering, speech bubbles, and ghost drag previews.
 */
(function (global) {
  'use strict';

  const ObjectsRenderer = {
    getSortedRenderList(items, isPlay = false) {
      if (!items || items.length === 0) return [];
      const isResponsive = typeof WorldConfig !== "undefined" ? (WorldConfig.responsiveLayering !== false) : true;

      if (!isResponsive || !isPlay) {
        return items.slice();
      }

      const list = items.slice();
      const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;

      list.sort((a, b) => {
        const aIsBg = (a.locked && a.y <= 0 && (a.h || 0) >= wHeight * 0.7) || 
                      (a.assetId && (a.assetId.includes("sky") || a.assetId.includes("bg_") || a.assetId.includes("gradient")));
        const bIsBg = (b.locked && b.y <= 0 && (b.h || 0) >= wHeight * 0.7) || 
                      (b.assetId && (b.assetId.includes("sky") || b.assetId.includes("bg_") || b.assetId.includes("gradient")));

        if (aIsBg && !bIsBg) return -1;
        if (!aIsBg && bIsBg) return 1;
        if (aIsBg && bIsBg) return items.indexOf(a) - items.indexOf(b);

        const aFeetY = (a.y || 0) + (a.h || 0);
        const bFeetY = (b.y || 0) + (b.h || 0);

        if (Math.abs(aFeetY - bFeetY) > 1) {
          return aFeetY - bFeetY;
        }

        return items.indexOf(a) - items.indexOf(b);
      });

      return list;
    },

    drawControlVisual(item) {
      const w = item.w;
      const h = item.h;
      const ct = item.controlType || "label";
      const val = item.value;

      noSmooth();

      if (ct === "button") {
        const label = val !== undefined ? String(val) : "BUTTON";
        const bgTop = color(64, 156, 255);
        const bgBot = color(37, 99, 235);
        const r = Math.min(10, h / 3);

        stroke(17, 24, 39);
        strokeWeight(2);

        for (let y = -h / 2; y < h / 2; y++) {
          const t = (y + h / 2) / Math.max(1, h);
          const cx1 = color(
            red(bgTop) * (1 - t) + red(bgBot) * t,
            green(bgTop) * (1 - t) + green(bgBot) * t,
            blue(bgTop) * (1 - t) + blue(bgBot) * t
          );
          stroke(cx1);
          line(-w / 2 + r, y, w / 2 - r, y);
        }

        stroke(17, 24, 39);
        strokeWeight(2);
        noFill();
        rect(-w / 2, -h / 2, w, h, r);

        fill(255, 255, 255, 120);
        noStroke();
        rect(-w / 2 + 3, -h / 2 + 3, w - 6, Math.max(2, h / 3), r, r, 0, 0);

        fill(255, 251, 235);
        stroke(23, 37, 84);
        strokeWeight(1.5);
        textSize(Math.max(10, Math.min(18, Math.floor(h * 0.4))));
        textAlign(CENTER, CENTER);
        text(label, 0, 1);

      } else if (ct === "label") {
        const label = val !== undefined ? String(val) : "Label";
        fill(255, 255, 255, 0);
        noStroke();
        rect(-w / 2, -h / 2, w, h);

        fill(13, 2, 5);
        stroke(173, 32, 77);
        strokeWeight(1.2);
        textSize(Math.max(11, Math.min(22, Math.floor(h * 0.55))));
        textAlign(LEFT, CENTER);
        text(label, -w / 2 + 4, 0);

      } else if (ct === "slider") {
        const pct = Math.max(0, Math.min(100, parseInt(val) || 0));
        const trackH = Math.max(6, Math.floor(h * 0.28));
        const trackY = 0 - trackH / 2;
        const trackL = -w / 2 + 6;
        const trackR = w / 2 - 6;
        const trackW = trackR - trackL;

        stroke(46, 8, 20);
        strokeWeight(2);
        fill(30, 41, 59);
        rect(trackL, trackY, trackW, trackH, trackH / 2);

        const fillW = Math.max(0, (pct / 100) * trackW);
        noStroke();
        const grad1 = color(251, 146, 60);
        const grad2 = color(239, 68, 68);
        for (let x = 0; x < fillW; x++) {
          const t = x / Math.max(1, fillW);
          const cc = color(
            red(grad1) * (1 - t) + red(grad2) * t,
            green(grad1) * (1 - t) + green(grad2) * t,
            blue(grad1) * (1 - t) + blue(grad2) * t
          );
          stroke(cc);
          line(trackL + x, trackY + 2, trackL + x, trackY + trackH - 2);
        }

        const thumbX = trackL + fillW;
        const thumbR = Math.min(12, h * 0.38);
        noStroke();
        fill(254, 204, 27);
        stroke(13, 2, 5);
        strokeWeight(2);
        circle(thumbX, 0, thumbR * 2);
        fill(13, 2, 5);
        noStroke();
        circle(thumbX, 0, Math.max(3, thumbR * 0.35));

        fill(254, 204, 27);
        stroke(13, 2, 5);
        strokeWeight(1);
        textSize(Math.max(9, Math.min(13, Math.floor(h * 0.28))));
        textAlign(CENTER, TOP);
        text(`${pct}%`, 0, h / 2 - Math.max(10, Math.floor(h * 0.28)) - 1);

      } else if (ct === "toggle") {
        const isOn = !!val;
        const pillW = Math.max(40, w - 10);
        const pillH = Math.max(22, Math.floor(h * 0.55));
        const pillX = -pillW / 2;
        const pillY = -pillH / 2;
        const knobR = Math.max(8, Math.floor(pillH * 0.4));
        const knobOffX = pillX + knobR + 2;
        const knobOnX = pillX + pillW - knobR - 2;
        const knobX = isOn ? knobOnX : knobOffX;

        const bgOn = color(34, 197, 94);
        const bgOff = color(75, 85, 99);
        stroke(17, 24, 39);
        strokeWeight(2);
        fill(isOn ? bgOn : bgOff);
        rect(pillX, pillY, pillW, pillH, pillH / 2);

        noStroke();
        fill(255, 255, 255, isOn ? 80 : 50);
        rect(pillX + 2, pillY + 2, pillW - 4, pillH / 3, pillH / 2 - 1, pillH / 2 - 1, 0, 0);

        fill(250, 250, 250);
        stroke(17, 24, 39);
        strokeWeight(2);
        circle(knobX, 0, knobR * 2);
        fill(isOn ? 34 : 156, isOn ? 197 : 163, isOn ? 94 : 175, isOn ? 255 : 255);
        noStroke();
        circle(knobX, 0, Math.max(3, knobR * 0.4));

        fill(isOn ? 255 : 209, isOn ? 255 : 213, isOn ? 255 : 219);
        noStroke();
        textSize(Math.max(9, Math.min(12, Math.floor(h * 0.25))));
        textAlign(CENTER, BOTTOM);
        text(isOn ? "ON" : "OFF", 0, pillY - 3);

      } else if (ct === "textinput") {
        const label = val !== undefined ? String(val) : "";
        const pad = 6;

        fill(248, 250, 252);
        stroke(46, 8, 20);
        strokeWeight(2);
        rect(-w / 2, -h / 2, w, h, 5);

        stroke(203, 213, 225);
        strokeWeight(1);
        line(-w / 2 + 3, h / 2 - 4, w / 2 - 3, h / 2 - 4);
        stroke(15, 23, 42);
        strokeWeight(1);
        line(-w / 2 + 3, -h / 2 + 3, w / 2 - 3, -h / 2 + 3);

        fill(15, 23, 42);
        noStroke();
        textSize(Math.max(11, Math.min(18, Math.floor(h * 0.45))));
        textAlign(LEFT, CENTER);
        const textX = -w / 2 + pad;
        const textMaxW = w - pad * 2;
        let displayText = label;
        const tSize = Math.max(11, Math.min(18, Math.floor(h * 0.45)));
        while (displayText.length > 0 && textWidth(displayText) > textMaxW) {
          displayText = displayText.slice(1);
        }
        if (displayText !== label && displayText.length > 1) {
          displayText = "…" + displayText.slice(1);
        }
        text(displayText, textX, 0);

        const blink = (Math.floor(millis() / 500) % 2 === 0);
        if (blink) {
          const curX = textX + Math.min(textMaxW, textWidth(label));
          const curH = tSize + 2;
          noStroke();
          fill(15, 23, 42);
          rect(curX + 1, -curH / 2, 1.5, curH);
        }

        fill(148, 163, 184);
        noStroke();
        textSize(Math.max(8, 10));
        textAlign(RIGHT, TOP);
        text("TXT", w / 2 - 4, -h / 2 + 3);
      }
    },

    draw(managerOrItems, selectedId, dragState) {
      const manager = Array.isArray(managerOrItems)
        ? { items: managerOrItems, selectedId: selectedId, dragState: dragState, ghostPreview: { active: false } }
        : (managerOrItems || (typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager : { items: [] }));
      if (!manager) return;
      const isPlay = typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying;
      const renderItems = this.getSortedRenderList(manager.items, isPlay);

      for (let i = 0; i < renderItems.length; i++) {
        const item = renderItems[i];

        if (item.hidden) continue;
        if (isPlay && item.hiddenInPlayer) continue;

        push();
        translate(item.x + item.w / 2, item.y + item.h / 2);
        rotate(radians(item.rotation || 0));
        scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);

        if (item.type === "control") {
          ObjectsRenderer.drawControlVisual(item);
        } else if (item.loaded && item.p5Img) {
          if (typeof CropController !== "undefined" && CropController.isActive && item.id === CropController.targetItemId) {
            tint(255, 90);
            image(item.p5Img, -item.w / 2, -item.h / 2, item.w, item.h);
            noTint();
            const nw = item.naturalW || item.w;
            const nh = item.naturalH || item.h;
            const c = item.crop || { x: 0, y: 0, w: nw, h: nh };
            const cx1 = -item.w / 2 + (c.x / nw) * item.w;
            const cy1 = -item.h / 2 + (c.y / nh) * item.h;
            const cw1 = (c.w / nw) * item.w;
            const ch1 = (c.h / nh) * item.h;
            image(item.p5Img, cx1, cy1, cw1, ch1, c.x, c.y, c.w, c.h);
          } else if (item.autoplay && item.frameCount > 1) {
            const animSpeed = item.animSpeed || 100;
            const frameIdx = Math.floor((millis() / animSpeed) % item.frameCount);

            if (item.animType === "frames" && item.p5FrameImgs && item.p5FrameImgs[frameIdx]) {
              const frameImg = item.p5FrameImgs[frameIdx];
              const srcAspect = (frameImg.width && frameImg.height) ? (frameImg.width / frameImg.height) : (item.w / item.h);
              let drawW, drawH;
              if (srcAspect > item.w / item.h) {
                drawW = item.w;
                drawH = item.w / srcAspect;
              } else {
                drawH = item.h;
                drawW = item.h * srcAspect;
              }
              const drawX = -drawW / 2;
              const drawY = item.h / 2 - drawH;
              image(frameImg, drawX, drawY, drawW, drawH);
            } else if (item.p5SheetImg) {
              const fw = item.frameWidth || 128;
              const fh = item.frameHeight || 128;
              const sx = frameIdx * fw;
              const charNatH = item.naturalH || item.h || 70;
              
              if (fh > charNatH && charNatH > 20) {
                const scale = item.h / charNatH;
                const drawW = fw * scale;
                const drawH = fh * scale;
                const drawX = -drawW / 2;
                const drawY = item.h / 2 - drawH;
                image(item.p5SheetImg, drawX, drawY, drawW, drawH, sx, 0, fw, fh);
              } else {
                const srcAspect = fw / fh;
                let drawW, drawH;
                if (srcAspect > item.w / item.h) {
                  drawW = item.w;
                  drawH = item.w / srcAspect;
                } else {
                  drawH = item.h;
                  drawW = item.h * srcAspect;
                }
                const drawX = -drawW / 2;
                const drawY = item.h / 2 - drawH;
                image(item.p5SheetImg, drawX, drawY, drawW, drawH, sx, 0, fw, fh);
              }
            } else if (item.p5Img) {
              image(item.p5Img, -item.w / 2, -item.h / 2, item.w, item.h);
            }
          } else if (item.crop && item.crop.isCropped) {
            image(item.p5Img, -item.w / 2, -item.h / 2, item.w, item.h, item.crop.x, item.crop.y, item.crop.w, item.crop.h);
          } else if (item.p5Img) {
            const isSprite = (item.type === "sprite" || (item.assetId && item.assetId.startsWith("sprite_")) || item.poses);
            if (isSprite && item.p5Img.width && item.p5Img.height) {
              const srcAspect = item.p5Img.width / item.p5Img.height;
              let drawW, drawH;
              if (srcAspect > item.w / item.h) {
                drawW = item.w;
                drawH = item.w / srcAspect;
              } else {
                drawH = item.h;
                drawW = item.h * srcAspect;
              }
              const drawX = -drawW / 2;
              const drawY = item.h / 2 - drawH;
              image(item.p5Img, drawX, drawY, drawW, drawH);
            } else {
              image(item.p5Img, -item.w / 2, -item.h / 2, item.w, item.h);
            }
          }
        } else {
          fill(25, 6, 14, 230);
          stroke(173, 32, 77);
          strokeWeight(2);
          rect(-item.w / 2, -item.h / 2, item.w, item.h);

          fill(254, 204, 27);
          noStroke();
          textSize(10);
          textAlign(CENTER, CENTER);
          text(item.name, 0, 0);
        }
        pop();

        // Render Speech Bubble above sprite if active
        if (item.speechBubble && item.speechBubble.expiresAt > Date.now()) {
          push();
          translate(item.x + item.w / 2, item.y);
          const bubbleText = item.speechBubble.text;
          textSize(11);
          const tw = textWidth(bubbleText);
          const bw = Math.max(50, tw + 20);
          const bh = 26;
          const bx = -bw / 2;
          const by = -bh - 14;

          fill(255, 255, 255, 245);
          stroke(46, 8, 20);
          strokeWeight(2);
          rect(bx, by, bw, bh, 5);

          noStroke();
          fill(255, 255, 255, 245);
          triangle(-5, by + bh - 1, 5, by + bh - 1, 0, by + bh + 8);
          stroke(46, 8, 20);
          strokeWeight(2);
          line(-5, by + bh - 1, 0, by + bh + 8);
          line(5, by + bh - 1, 0, by + bh + 8);

          fill(26, 4, 11);
          noStroke();
          textAlign(CENTER, CENTER);
          text(bubbleText, 0, by + bh / 2);
          pop();
        }

        // Crop Mode Overlay vs Normal Selection Gizmo (Only in Editor Mode)
        if (!isPlay) {
          if (typeof CropController !== "undefined" && CropController.isActive && item.id === CropController.targetItemId) {
            CropController.drawCropOverlay(item);
          } else if (item.id === manager.selectedId) {
            if (typeof ObjectsTransform !== "undefined") { ObjectsTransform.drawGizmo(item); } else if (typeof manager.drawGizmo === "function") { manager.drawGizmo(item); }
          }
        }
      }

      // Drag & Drop Ghost Preview (Only in Editor Mode)
      if (!isPlay && manager.ghostPreview && manager.ghostPreview.active) {
        push();
        const gw = 260;
        const gh = 160;
        const gx = manager.ghostPreview.worldX - gw / 2;
        const gy = manager.ghostPreview.worldY - gh / 2;

        fill(254, 204, 27, 45);
        stroke(254, 204, 27, 220);
        strokeWeight(2);
        drawingContext.setLineDash([6, 4]);
        rect(gx, gy, gw, gh);
        drawingContext.setLineDash([]);

        if (manager.ghostPreview.item) {
          fill(254, 204, 27);
          noStroke();
          textSize(10);
          textAlign(CENTER, CENTER);
          text(`+ DROP: ${manager.ghostPreview.item.name.toUpperCase()}`, gx + gw / 2, gy + gh / 2);
        }
        pop();
      }
    }
  };

  global.ObjectsRenderer = ObjectsRenderer;
})(typeof window !== 'undefined' ? window : globalThis);
