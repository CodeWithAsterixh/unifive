/**
 * UNIFIVE Scripting - Runtime Builtins Coordinator
 */
const RuntimeBuiltins = {
  async executeBlock(engine, block, targetItem) {
    if (!engine || !engine.isRunning || !block) return;
    const blockEl = (typeof AppModeController !== "undefined" && typeof AppModeController.getBlockElement === "function") ? AppModeController.getBlockElement(block.id) : null;
    if (blockEl) blockEl.classList.add("executing-halo");

    const evalInput = (idx, fb) => (typeof RuntimeEvaluator !== "undefined" ? RuntimeEvaluator.evalBlockInput(block, idx, targetItem, fb) : fb);

    try {
      const bid = block.blockId || block.id;
      if (bid.startsWith("move_") || bid.startsWith("turn_") || bid.startsWith("goto_") || bid === "glide_xy" || bid === "point_dir" || bid === "bounce_edge") {
        if (typeof BuiltinMotion !== "undefined") await BuiltinMotion.execute(engine, block, targetItem, evalInput);
      } else if (bid.startsWith("say_") || bid === "switch_pose" || bid === "show" || bid === "hide") {
        if (typeof BuiltinLooks !== "undefined") await BuiltinLooks.execute(engine, block, targetItem, evalInput);
      } else if (typeof BuiltinExtended !== "undefined") {
        await BuiltinExtended.execute(engine, block, targetItem, evalInput);
      }
    } finally {
      if (blockEl) blockEl.classList.remove("executing-halo");
    }
  }
};
