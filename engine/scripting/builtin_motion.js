/**
 * UNIFIVE Scripting - Builtin Motion Handlers
 */
const BuiltinMotion = {
  async execute(engine, block, targetItem, evalInput) {
    const bid = block.blockId || block.id;
    if (!targetItem) return;
    const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
    const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;

    if (bid === "move_x_steps" || bid === "move_steps_x") {
      targetItem.x = Math.max(0, Math.min(wWidth - targetItem.w, Math.round(targetItem.x + (Number(evalInput(0, 10)) || 0))));
    } else if (bid === "move_y_steps" || bid === "move_steps_y") {
      targetItem.y = Math.max(0, Math.min(wHeight - targetItem.h, Math.round(targetItem.y + (Number(evalInput(0, 10)) || 0))));
    } else if (bid === "turn_right") {
      targetItem.rotation = Math.round((targetItem.rotation || 0) + (Number(evalInput(0, 15)) || 15)) % 360;
    } else if (bid === "turn_left") {
      targetItem.rotation = Math.round((targetItem.rotation || 0) - (Number(evalInput(0, 15)) || 15) + 360) % 360;
    } else if (bid === "goto_xy") {
      targetItem.x = Math.max(0, Math.min(wWidth - targetItem.w, Number(evalInput(0, 0)) || 0));
      targetItem.y = Math.max(0, Math.min(wHeight - targetItem.h, Number(evalInput(1, 0)) || 0));
    } else if (bid === "move_steps") {
      const steps = Number(evalInput(0, 10)) || 0;
      const angle = ((targetItem.rotation || 0) - 90) * Math.PI / 180;
      targetItem.x = Math.max(0, Math.min(wWidth - targetItem.w, Math.round(targetItem.x + steps * Math.cos(angle))));
      targetItem.y = Math.max(0, Math.min(wHeight - targetItem.h, Math.round(targetItem.y + steps * Math.sin(angle))));
    } else if (bid === "glide_xy") {
      const duration = Math.max(0, Number(evalInput(0, 1)) || 1) * 1000;
      targetItem.x = Math.max(0, Math.min(wWidth - targetItem.w, Number(evalInput(1, targetItem.x)) || targetItem.x));
      targetItem.y = Math.max(0, Math.min(wHeight - targetItem.h, Number(evalInput(2, targetItem.y)) || targetItem.y));
      await engine.sleep(duration);
    } else if (bid === "point_dir") {
      targetItem.rotation = Number(evalInput(0, 90)) || 90;
    } else if (bid === "bounce_edge") {
      if (targetItem.x <= 0 || targetItem.x + targetItem.w >= wWidth) targetItem.flipH = !targetItem.flipH;
      if (targetItem.y <= 0 || targetItem.y + targetItem.h >= wHeight) targetItem.flipV = !targetItem.flipV;
    }
    await engine.sleep(16);
  }
};
