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

    draw(manager) {
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

        if (item.loaded && item.p5Img) {
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
            manager.drawGizmo(item);
          }
        }
      }

      // Drag & Drop Ghost Preview (Only in Editor Mode)
      if (!isPlay && manager.ghostPreview.active) {
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
