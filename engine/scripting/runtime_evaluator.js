/**
 * UNIFIVE Scripting - Runtime Evaluator Subsystem
 */
const RuntimeEvaluator = {
  getBlockInput(block, index = 0) {
    if (!block) return null;
    const blockId = block.blockId || block.id;
    if (typeof AppModeController !== "undefined" && typeof AppModeController.getBlockElement === "function") {
      const el = AppModeController.getBlockElement(block.id);
      if (!el && blockId) {
        const workspace = document.getElementById("code-workspace-blocks");
        if (workspace) {
          const match = workspace.querySelector(`[data-block-id="${CSS.escape(String(blockId))}"]`);
          if (match) {
            const inputs = match.querySelectorAll(".code-block-input, .code-block-select");
            if (inputs[index]) return inputs[index].value || inputs[index].textContent.trim();
          }
        }
      } else if (el) {
        const inputs = el.querySelectorAll(".code-block-input, .code-block-select");
        if (inputs && inputs[index]) return inputs[index].value || inputs[index].textContent.trim();
      }
    }
    return (block && block.inputs && block.inputs[index] !== undefined) ? block.inputs[index] : null;
  },

  evalBlockInput(block, index, targetItem, fallback = "") {
    const raw = this.getBlockInput(block, index);
    if (raw === null || raw === undefined || raw === "") return fallback;
    const trimmed = String(raw).trim();
    if (typeof VariableManager !== "undefined") {
      const v = VariableManager.getVariable(trimmed, targetItem ? targetItem.id : null);
      if (v) return v.value;
    }
    return trimmed;
  },

  checkOverlap(a, b) {
    if (!a || !b) return false;
    const pad = 2;
    return (a.x < b.x + b.w - pad && a.x + a.w > b.x + pad && a.y < b.y + b.h - pad && a.y + a.h > b.y + pad);
  },

  resolveValue(identifier, targetItem) {
    if (identifier === null || identifier === undefined) return "";
    if (typeof identifier === "object" && identifier.isReporter) {
      return typeof EvalReporters !== "undefined" ? EvalReporters.evaluateReporterBlock(identifier, targetItem, this.resolveValue.bind(this)) : 0;
    }
    const str = String(identifier).trim();
    if (targetItem) {
      if (str === "x position" || str === "x") return targetItem.x;
      if (str === "y position" || str === "y") return targetItem.y;
    }
    const num = Number(str);
    return (!isNaN(num) && str !== "") ? num : str;
  },

  evaluateCondition(cond, targetItem) {
    return typeof EvalConditions !== "undefined" ? EvalConditions.evaluateCondition(cond, targetItem, this) : false;
  }
};
