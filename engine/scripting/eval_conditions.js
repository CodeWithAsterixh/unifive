/**
 * UNIFIVE Scripting - Condition Evaluation Subsystem
 */
const EvalConditions = {
  evaluateCondition(conditionStr, targetItem, evaluator) {
    if (!conditionStr) return false;
    if (typeof conditionStr === "object" && conditionStr.isBooleanBlock) return this.evaluateBooleanBlock(conditionStr, targetItem, evaluator);
    
    const cond = String(conditionStr).trim();
    const condLower = cond.toLowerCase();
    if (condLower === "true" || condLower === "") return true;
    if (condLower === "false") return false;

    // Mobile sensing
    if (condLower.includes("is mobile") || condLower.includes("mobile device")) {
      return typeof MobileControlsManager !== "undefined" ? MobileControlsManager.isMobile() : false;
    }

    // Playable hero sensing
    if (condLower.includes("is playable") || condLower.includes("playable hero")) {
      if (typeof GamePlayerEngine !== "undefined" && targetItem) {
        return GamePlayerEngine.activePlayableId === targetItem.id;
      }
      return targetItem ? !!targetItem.isPlayable : false;
    }

    // Mouse down sensing
    if (condLower.includes("mouse down") || condLower === "mouse down?") {
      return (typeof mouseIsPressed !== "undefined" && mouseIsPressed) ||
             (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isMouseDown);
    }

    // Key pressed sensing
    if (condLower.includes("key") && condLower.includes("pressed")) {
      const matchKey = condLower.match(/key\s*\[?([a-zA-Z0-9_\s-]+)\]?\s*pressed/);
      let keyName = matchKey ? matchKey[1].trim() : "space";
      if (keyName === "space") {
        return (typeof isSpacePressed !== "undefined" && isSpacePressed) ||
               (typeof keyIsDown !== "undefined" && keyIsDown(32)) ||
               (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.[" "] || GamePlayerEngine.keysPressed?.["space"]));
      }
      if (keyName === "up arrow" || keyName === "up") {
        return (typeof keyIsDown !== "undefined" && (keyIsDown(38) || keyIsDown(87))) ||
               (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowUp"] || GamePlayerEngine.keysPressed?.["w"] || GamePlayerEngine.keysPressed?.["W"]));
      }
      if (keyName === "down arrow" || keyName === "down") {
        return (typeof keyIsDown !== "undefined" && (keyIsDown(40) || keyIsDown(83))) ||
               (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowDown"] || GamePlayerEngine.keysPressed?.["s"] || GamePlayerEngine.keysPressed?.["S"]));
      }
      if (keyName === "left arrow" || keyName === "left") {
        return (typeof keyIsDown !== "undefined" && (keyIsDown(37) || keyIsDown(65))) ||
               (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowLeft"] || GamePlayerEngine.keysPressed?.["a"] || GamePlayerEngine.keysPressed?.["A"]));
      }
      if (keyName === "right arrow" || keyName === "right") {
        return (typeof keyIsDown !== "undefined" && (keyIsDown(39) || keyIsDown(68))) ||
               (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowRight"] || GamePlayerEngine.keysPressed?.["d"] || GamePlayerEngine.keysPressed?.["D"]));
      }
      if (keyName === "any") {
        return (typeof keyIsPressed !== "undefined" && keyIsPressed) ||
               (typeof GamePlayerEngine !== "undefined" && Object.values(GamePlayerEngine.keysPressed || {}).some(Boolean));
      }
    }

    // Touching sensing
    if (condLower.startsWith("touching") || condLower.includes("touching")) {
      if (!targetItem) return false;
      const targetSpec = condLower.replace(/^touching\s*/, "").replace(/\?$/, "").replace(/[\[\]]/g, "").trim();
      const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
      const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;

      if (targetSpec === "edge") {
        return targetItem.x <= 10 || targetItem.x + targetItem.w >= wWidth - 10 ||
               targetItem.y <= 10 || targetItem.y + targetItem.h >= wHeight - 10;
      }

      if (targetSpec === "mouse-pointer" || targetSpec === "mouse") {
        const mx = (typeof mouseX !== "undefined" ? mouseX : 0);
        const my = (typeof mouseY !== "undefined" ? mouseY : 0);
        const panX = typeof WorldConfig !== "undefined" ? WorldConfig.panX : 0;
        const panY = typeof WorldConfig !== "undefined" ? WorldConfig.panY : 0;
        const zoom = typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1.0;
        const wx = (mx - panX) / zoom;
        const wy = (my - panY) / zoom;
        return wx >= targetItem.x && wx <= targetItem.x + targetItem.w &&
               wy >= targetItem.y && wy <= targetItem.y + targetItem.h;
      }

      const checkOverlap = (a, b) => (evaluator && evaluator.checkOverlap) ? evaluator.checkOverlap(a, b) : (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);

      if (targetSpec === "solid" || targetSpec === "solid object") {
        if (typeof WorldObjectsManager === "undefined") return false;
        return WorldObjectsManager.items.some(other => {
          if (other.id === targetItem.id || other.hidden || !other.isSolid) return false;
          return checkOverlap(targetItem, other);
        });
      }

      if (targetSpec === "hero") {
        let hero = (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.getActivePlayableItem) ? GamePlayerEngine.getActivePlayableItem() : null;
        if (!hero && typeof WorldObjectsManager !== "undefined") {
          hero = WorldObjectsManager.items.find(it => it.isPlayable);
        }
        if (hero && hero.id !== targetItem.id) {
          return checkOverlap(targetItem, hero);
        }
        return false;
      }

      if (targetSpec === "any" || targetSpec === "any object") {
        if (typeof WorldObjectsManager === "undefined") return false;
        return WorldObjectsManager.items.some(other => {
          if (other.id === targetItem.id || other.hidden) return false;
          return checkOverlap(targetItem, other);
        });
      }

      if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
        return WorldObjectsManager.items.some(other => {
          if (other.id === targetItem.id || other.hidden) return false;
          const otherName = (other.name || "").toLowerCase();
          if (other.id === targetSpec || otherName === targetSpec || otherName.includes(targetSpec) || targetSpec.includes(otherName)) {
            return checkOverlap(targetItem, other);
          }
          return false;
        });
      }
    }

    // Distance to sensing
    if (condLower.startsWith("distance to") || condLower.includes("distance to")) {
      if (!targetItem) return false;
      const matchDist = condLower.match(/distance\s*to\s*\[?([a-zA-Z0-9_\s-]+)\]?\s*(<|>|<=|>=|==|=)\s*(\d+)/);
      if (matchDist) {
        const targetSpec = matchDist[1].trim();
        const op = matchDist[2];
        const threshold = Number(matchDist[3]);

        let otherX = 0, otherY = 0, found = false;
        if (targetSpec === "mouse-pointer" || targetSpec === "mouse") {
          const mx = (typeof mouseX !== "undefined" ? mouseX : 0);
          const my = (typeof mouseY !== "undefined" ? mouseY : 0);
          const panX = typeof WorldConfig !== "undefined" ? WorldConfig.panX : 0;
          const panY = typeof WorldConfig !== "undefined" ? WorldConfig.panY : 0;
          const zoom = typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1.0;
          otherX = (mx - panX) / zoom;
          otherY = (my - panY) / zoom;
          found = true;
        } else if (targetSpec === "hero") {
          let hero = (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.getActivePlayableItem()) ||
                     (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items.find(it => it.isPlayable));
          if (hero && hero.id !== targetItem.id) {
            otherX = hero.x + hero.w / 2;
            otherY = hero.y + hero.h / 2;
            found = true;
          }
        } else if (typeof WorldObjectsManager !== "undefined") {
          const other = WorldObjectsManager.items.find(it => it.id !== targetItem.id && (it.id === targetSpec || (it.name && it.name.toLowerCase().includes(targetSpec))));
          if (other) {
            otherX = other.x + other.w / 2;
            otherY = other.y + other.h / 2;
            found = true;
          }
        }

        if (found) {
          const cx = targetItem.x + targetItem.w / 2;
          const cy = targetItem.y + targetItem.h / 2;
          const dist = Math.hypot(cx - otherX, cy - otherY);
          if (op === "<") return dist < threshold;
          if (op === ">") return dist > threshold;
          if (op === "<=") return dist <= threshold;
          if (op === ">=") return dist >= threshold;
          if (op === "==" || op === "=") return Math.abs(dist - threshold) < 5;
        }
      }
    }

    const match = cond.match(/^([a-zA-Z0-9_-]+)\s*(>|<|>=|<=|==|=)\s*([a-zA-Z0-9_.-]+)$/);
    if (match) {
      const resolveVal = (id) => (evaluator && evaluator.resolveValue) ? evaluator.resolveValue(id, targetItem) : id;
      const leftVal = resolveVal(match[1]);
      const op = match[2];
      const rightVal = resolveVal(match[3]);

      const lNum = Number(leftVal);
      const rNum = Number(rightVal);

      if (!isNaN(lNum) && !isNaN(rNum)) {
        if (op === ">") return lNum > rNum;
        if (op === "<") return lNum < rNum;
        if (op === ">=") return lNum >= rNum;
        if (op === "<=") return lNum <= rNum;
        if (op === "==" || op === "=") return lNum === rNum;
      } else {
        if (op === "==" || op === "=") return String(leftVal) === String(rightVal);
      }
    }

    return true;
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
