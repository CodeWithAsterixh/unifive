/**
 * UNIFIVE Engine - Watcher Renderer Subsystem
 */
const WatcherRenderer = {
  render() {
    const vars = (typeof VariableManager !== "undefined" && VariableManager.variables) ? VariableManager.variables : [];
    const dVar = typeof WatcherInteraction !== "undefined" ? WatcherInteraction.draggedVar : null;
    const hVar = typeof WatcherInteraction !== "undefined" ? WatcherInteraction.hoveredVar : null;
    this.drawWatchers(vars, dVar, hVar);
  },

  drawWatchers(variables, draggedVar, hoveredVar) {
    if (!variables) return;
    const visibleVars = [];
    for (let i = 0; i < variables.length; i++) {
      if (variables[i].showWatcher) visibleVars.push(variables[i]);
    }
    if (visibleVars.length === 0) return;

    if (typeof push !== "function") return;
    push();
    if (typeof resetMatrix === "function") resetMatrix();
    if (typeof textSize === "function") textSize(10);
    if (typeof textAlign === "function") textAlign(LEFT, CENTER);

    const stageW = (typeof width !== "undefined" ? width : window.innerWidth);
    const stageH = (typeof height !== "undefined" ? height : window.innerHeight);

    for (let idx = 0; idx < visibleVars.length; idx++) {
      const v = visibleVars[idx];
      const scopeTag = v.scope === "local" ? " [SPRITE]" : "";
      const label = (v.name || "").toUpperCase() + scopeTag + ": " + v.value;
      const badgeW = (typeof textWidth === "function" ? textWidth(label) : label.length * 7) + 26;
      const badgeH = 22;

      if (v.x === undefined || v.x === null) v.x = 12;
      if (v.y === undefined || v.y === null) v.y = 12 + idx * (badgeH + 6);

      v.x = Math.max(2, Math.min(stageW - badgeW - 2, v.x));
      v.y = Math.max(2, Math.min(stageH - badgeH - 2, v.y));

      v._renderedBounds = { x: v.x, y: v.y, w: badgeW, h: badgeH };

      const isHovered = (hoveredVar === v);
      const isDragging = (draggedVar === v);

      fill(26, 4, 11, 240);
      if (isDragging) {
        stroke(254, 240, 138);
        strokeWeight(2);
      } else if (isHovered) {
        stroke(251, 146, 60);
        strokeWeight(1.5);
      } else {
        stroke(249, 115, 22);
        strokeWeight(1.5);
      }
      rect(v.x, v.y, badgeW, badgeH, 4);

      noStroke();
      fill(isDragging ? (typeof color === "function" ? color(254, 240, 138) : 255) : (typeof color === "function" ? color(249, 115, 22) : 249));
      rect(v.x + 7, v.y + badgeH / 2 - 3, 6, 6);

      fill(255, 235, 210);
      text(label, v.x + 18, v.y + badgeH / 2);
    }
    pop();
  }
};
