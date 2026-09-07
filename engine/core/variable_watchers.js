/**
 * UNIFIVE Engine - Variable Watchers Subsystem
 * Canvas HUD rendering, dragging, and hover interaction for active variable watcher pills.
 */
const VariableWatchers = {
  draggedVar: null,
  dragOffset: { x: 0, y: 0 },
  hoveredVar: null,

  toggleWatcher(variables, idOrName, forceState = null) {
    if (!variables) return;
    const v = variables.find(item => item.id === idOrName || item.name.toLowerCase() === String(idOrName).toLowerCase());
    if (v) {
      v.showWatcher = forceState !== null ? forceState : !v.showWatcher;
    }
  },

  drawWatchers(variables) {
    if (!variables) return;
    const visibleVars = variables.filter(v => v.showWatcher);
    if (visibleVars.length === 0) return;

    push();
    resetMatrix();
    textSize(10);
    textAlign(LEFT, CENTER);

    const stageW = (typeof width !== "undefined" ? width : window.innerWidth);
    const stageH = (typeof height !== "undefined" ? height : window.innerHeight);

    visibleVars.forEach((v, idx) => {
      const scopeTag = v.scope === "local" ? " [SPRITE]" : "";
      const label = `${v.name.toUpperCase()}${scopeTag}: ${v.value}`;
      const badgeW = textWidth(label) + 26;
      const badgeH = 22;

      // Default position if not initialized
      if (v.x === undefined || v.x === null) v.x = 12;
      if (v.y === undefined || v.y === null) v.y = 12 + idx * (badgeH + 6);

      // Clamp position within stage canvas
      v.x = Math.max(2, Math.min(stageW - badgeW - 2, v.x));
      v.y = Math.max(2, Math.min(stageH - badgeH - 2, v.y));

      v._renderedBounds = { x: v.x, y: v.y, w: badgeW, h: badgeH };

      const isHovered = this.hoveredVar === v;
      const isDragging = this.draggedVar === v;

      // Badge pill background
      fill(26, 4, 11, 240);
      if (isDragging) {
        stroke(254, 240, 138); // Gold glowing highlight on drag
        strokeWeight(2);
      } else if (isHovered) {
        stroke(251, 146, 60);
        strokeWeight(1.5);
      } else {
        stroke(249, 115, 22);
        strokeWeight(1.5);
      }
      rect(v.x, v.y, badgeW, badgeH, 4);

      // Diamond bullet
      noStroke();
      fill(isDragging ? color(254, 240, 138) : color(249, 115, 22));
      rect(v.x + 7, v.y + badgeH / 2 - 3, 6, 6);

      // Text
      fill(255, 235, 210);
      text(label, v.x + 18, v.y + badgeH / 2);
    });
    pop();
  },

  handleMouseDown(variables, sx, sy) {
    if (!variables) return false;
    const visibleVars = variables.filter(v => v.showWatcher);
    for (let i = visibleVars.length - 1; i >= 0; i--) {
      const v = visibleVars[i];
      if (v._renderedBounds) {
        const b = v._renderedBounds;
        if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) {
          this.draggedVar = v;
          this.dragOffset = { x: sx - v.x, y: sy - v.y };
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(580, "square", 0.03, 0.06);
          return true;
        }
      }
    }
    return false;
  },

  handleMouseMove(variables, sx, sy) {
    if (this.draggedVar) {
      const stageW = (typeof width !== "undefined" ? width : window.innerWidth);
      const stageH = (typeof height !== "undefined" ? height : window.innerHeight);
      const bW = this.draggedVar._renderedBounds ? this.draggedVar._renderedBounds.w : 80;
      const bH = this.draggedVar._renderedBounds ? this.draggedVar._renderedBounds.h : 22;
      this.draggedVar.x = Math.max(2, Math.min(stageW - bW - 2, Math.round(sx - this.dragOffset.x)));
      this.draggedVar.y = Math.max(2, Math.min(stageH - bH - 2, Math.round(sy - this.dragOffset.y)));
      return true;
    }

    if (!variables) return false;
    const visibleVars = variables.filter(v => v.showWatcher);
    let foundHover = null;
    for (let i = visibleVars.length - 1; i >= 0; i--) {
      const v = visibleVars[i];
      if (v._renderedBounds) {
        const b = v._renderedBounds;
        if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) {
          foundHover = v;
          break;
        }
      }
    }
    this.hoveredVar = foundHover;
    return !!foundHover;
  },

  handleMouseUp() {
    if (this.draggedVar) {
      this.draggedVar = null;
      if (typeof AsyncSceneStore !== "undefined" && AsyncSceneStore.saveCurrentScene) {
        AsyncSceneStore.saveCurrentScene();
      }
      return true;
    }
    return false;
  }
};
