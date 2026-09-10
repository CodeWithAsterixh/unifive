/**
 * UNIFIVE Scripting - Condition Evaluation Subsystem
 */
const EvalConditions = {
  evaluateCondition(cond, targetItem, evaluator) {
    if (!cond) return false;
    if (typeof cond === "object" && cond.isBooleanBlock) return this.evaluateBooleanBlock(cond, targetItem, evaluator);
    const condStr = String(cond).trim().toLowerCase();

    if (condStr.startsWith("touching")) {
      const targetName = condStr.replace("touching", "").replace(/\?/g, "").trim();
      if (targetName === "edge" || targetName === "bounds") {
        if (!targetItem) return false;
        const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
        const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
        return targetItem.x <= 0 || targetItem.y <= 0 || targetItem.x + targetItem.w >= wWidth || targetItem.y + targetItem.h >= wHeight;
      }
      if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
        for (const it of WorldObjectsManager.items) {
          if (it.id !== targetItem.id && (it.name || "").toLowerCase().includes(targetName) && !it.hidden) {
            if (evaluator.checkOverlap(targetItem, it)) return true;
          }
        }
      }
      return false;
    }

    if (condStr === "key pressed" || condStr === "space pressed") {
      return typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("jump");
    }
    if (condStr.includes("vcontrol")) {
      return typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("jump");
    }
    if (condStr.includes("distance to")) {
      const match = condStr.match(/distance to\s+(.+?)\s*<\s*(\d+)/);
      if (!match || !targetItem || typeof WorldObjectsManager === "undefined") return false;
      const other = WorldObjectsManager.items.find(item => item.id !== targetItem.id && (item.name || "").toLowerCase().includes(match[1].trim()));
      return !!other && Math.hypot(targetItem.x - other.x, targetItem.y - other.y) < Number(match[2]);
    }
    if (condStr === "is mobile" || condStr === "is mobile device") {
      return typeof MobileControlsManager !== "undefined" && MobileControlsManager.isMobile();
    }
    if (condStr === "is playable" || condStr === "is playable hero") {
      return !!targetItem && !!targetItem.isPlayable;
    }
    if (condStr === "mouse down") return typeof mouseIsPressed !== "undefined" ? !!mouseIsPressed : false;
    return false;
  },

  evaluateBooleanBlock(block, targetItem, evaluator) {
    const bid = block.blockId || block.id;
    const inputs = block.inputs || [];
    const r = (idx, fb = 0) => evaluator.resolveValue(inputs[idx] !== undefined ? inputs[idx] : fb, targetItem);

    if (bid === "op_gt" || bid === ">") return Number(r(0, 0)) > Number(r(1, 50));
    if (bid === "op_lt" || bid === "<") return Number(r(0, 0)) < Number(r(1, 50));
    if (bid === "op_equals" || bid === "op_eq" || bid === "=") return String(r(0, 0)) === String(r(1, 50));
    if (bid === "op_and") return !!this.evaluateCondition(inputs[0], targetItem, evaluator) && !!this.evaluateCondition(inputs[1], targetItem, evaluator);
    if (bid === "op_or") return !!this.evaluateCondition(inputs[0], targetItem, evaluator) || !!this.evaluateCondition(inputs[1], targetItem, evaluator);
    if (bid === "op_not") return !this.evaluateCondition(inputs[0], targetItem, evaluator);
    if (bid === "op_contains") return String(r(0, "")).includes(String(r(1, "")));
    return false;
  }
};
