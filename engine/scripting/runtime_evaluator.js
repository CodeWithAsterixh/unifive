/**
 * UNIFIVE Scripting - Runtime Evaluator Subsystem
 * Evaluates reporters, sensing booleans, operator logic, and variable values.
 */
(function (global) {
  'use strict';

  const RuntimeEvaluator = {
    getBlockInput(block, index = 0) {
      if (typeof AppModeController !== "undefined" && typeof AppModeController.getBlockElement === "function") {
        const el = AppModeController.getBlockElement(block.id);
        if (el) {
          const inputs = el.querySelectorAll(".code-block-input, .code-block-select");
          if (inputs && inputs[index]) {
            return inputs[index].value || inputs[index].textContent.trim();
          }
        }
      }
      if (block && block.inputs && block.inputs[index] !== undefined) {
        return block.inputs[index];
      }
      return null;
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
      return (
        a.x < b.x + b.w - pad &&
        a.x + a.w > b.x + pad &&
        a.y < b.y + b.h - pad &&
        a.y + a.h > b.y + pad
      );
    },

    resolveValue(identifier, targetItem) {
      if (identifier === null || identifier === undefined) return "";
      if (typeof identifier === "object" && identifier.isReporter) {
        return this.evaluateReporterBlock(identifier, targetItem);
      }
      const str = String(identifier).trim();
      if (targetItem) {
        switch (str) {
          case "x position":
          case "x": return targetItem.x;
          case "y position":
          case "y": return targetItem.y;
          case "width": return targetItem.w;
          case "height": return targetItem.h;
          case "direction": return targetItem.rotation || 0;
          case "size": return targetItem.scale || 100;
        }
      }
      const v = typeof VariableManager !== "undefined" ? VariableManager.getVariable(str, targetItem ? targetItem.id : null) : null;
      if (v !== null && v !== undefined) return v.value;
      const num = Number(str);
      if (!isNaN(num) && str !== "") return num;
      return str;
    },

    evaluateReporterBlock(repBlock, targetItem) {
      if (!repBlock) return 0;
      const bid = repBlock.blockId || repBlock.id;
      const inputs = repBlock.inputs || [];

      switch (bid) {
        case "op_add":
        case "+": {
          const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
          const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 0, targetItem)) || 0;
          return l + r;
        }
        case "op_subtract":
        case "-": {
          const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
          const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 0, targetItem)) || 0;
          return l - r;
        }
        case "op_multiply":
        case "*": {
          const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
          const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 0, targetItem)) || 0;
          return l * r;
        }
        case "op_divide":
        case "/": {
          const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
          const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 1, targetItem)) || 0;
          return r !== 0 ? l / r : 0;
        }
        case "op_random": {
          const min = Math.ceil(Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 1, targetItem)) || 1);
          const max = Math.floor(Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 10, targetItem)) || 10);
          return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        case "op_join": {
          const l = String(this.resolveValue(inputs[0] !== undefined ? inputs[0] : "apple", targetItem));
          const r = String(this.resolveValue(inputs[1] !== undefined ? inputs[1] : "banana", targetItem));
          return l + r;
        }
        case "op_letter_of": {
          const idx = (Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 1, targetItem)) || 1) - 1;
          const str = String(this.resolveValue(inputs[1] !== undefined ? inputs[1] : "apple", targetItem));
          return str[idx] || "";
        }
        case "op_length_of": {
          const str = String(this.resolveValue(inputs[0] !== undefined ? inputs[0] : "apple", targetItem));
          return str.length;
        }
        default:
          return 0;
      }
    },

    evaluateConditionBlock(condBlock, targetItem) {
      if (!condBlock) return false;
      const bid = condBlock.blockId || condBlock.id;
      const inputs = condBlock.inputs || [];

      switch (bid) {
        // 1. SENSING BOOLEANS
        case "touching_object": {
          const target = inputs[0] || "edge";
          return this.evaluateCondition(`touching ${target}`, targetItem);
        }
        case "touching_solid":
          return this.evaluateCondition("touching solid", targetItem);
        case "distance_to_object": {
          const target = inputs[0] || "hero";
          const dist = inputs[1] || 50;
          return this.evaluateCondition(`distance to ${target} < ${dist}`, targetItem);
        }
        case "key_pressed_check": {
          const keyName = inputs[0] || "space";
          return this.evaluateCondition(`key ${keyName} pressed`, targetItem);
        }
        case "vcontrol_pressed_check": {
          const btnName = inputs[0] || "cross";
          return typeof MobileControlsManager !== "undefined" ? MobileControlsManager.isButtonPressed(btnName) : false;
        }
        case "mouse_down_check":
          return this.evaluateCondition("mouse down", targetItem);
        case "is_mobile_sensing":
          return this.evaluateCondition("is mobile", targetItem);
        case "is_playable_sensing":
          return this.evaluateCondition("is playable", targetItem);

        // 2. LOGICAL OPERATOR BOOLEANS (and, or, not)
        case "op_and": {
          const leftVal = condBlock.leftConditionBlock ? this.evaluateConditionBlock(condBlock.leftConditionBlock, targetItem) : false;
          const rightVal = condBlock.rightConditionBlock ? this.evaluateConditionBlock(condBlock.rightConditionBlock, targetItem) : false;
          return leftVal && rightVal;
        }
        case "op_or": {
          const leftVal = condBlock.leftConditionBlock ? this.evaluateConditionBlock(condBlock.leftConditionBlock, targetItem) : false;
          const rightVal = condBlock.rightConditionBlock ? this.evaluateConditionBlock(condBlock.rightConditionBlock, targetItem) : false;
          return leftVal || rightVal;
        }
        case "op_not": {
          const innerVal = condBlock.conditionBlock ? this.evaluateConditionBlock(condBlock.conditionBlock, targetItem) : false;
          return !innerVal;
        }

        // 3. COMPARISON OPERATOR BOOLEANS (>, <, =, contains)
        case "op_gt": {
          const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
          const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 50, targetItem)) || 0;
          return l > r;
        }
        case "op_lt": {
          const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
          const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 50, targetItem)) || 0;
          return l < r;
        }
        case "op_eq": {
          const l = this.resolveValue(inputs[0] !== undefined ? inputs[0] : "", targetItem);
          const r = this.resolveValue(inputs[1] !== undefined ? inputs[1] : 50, targetItem);
          return String(l) === String(r);
        }
        case "op_contains": {
          const l = String(this.resolveValue(inputs[0] !== undefined ? inputs[0] : "apple", targetItem));
          const r = String(this.resolveValue(inputs[1] !== undefined ? inputs[1] : "a", targetItem));
          return l.includes(r);
        }
        default: {
          const fallbackCond = inputs[0] || condBlock.name || "true";
          return this.evaluateCondition(fallbackCond, targetItem);
        }
      }
    },

    evaluateCondition(conditionStr, targetItem) {
      const cond = (conditionStr || "").trim();
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
        switch (keyName) {
          case "space":
            return (typeof isSpacePressed !== "undefined" && isSpacePressed) ||
                   (typeof keyIsDown !== "undefined" && keyIsDown(32)) ||
                   (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.[" "] || GamePlayerEngine.keysPressed?.["space"]));
          case "up arrow":
          case "up":
            return (typeof keyIsDown !== "undefined" && (keyIsDown(38) || keyIsDown(87))) ||
                   (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowUp"] || GamePlayerEngine.keysPressed?.["w"] || GamePlayerEngine.keysPressed?.["W"]));
          case "down arrow":
          case "down":
            return (typeof keyIsDown !== "undefined" && (keyIsDown(40) || keyIsDown(83))) ||
                   (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowDown"] || GamePlayerEngine.keysPressed?.["s"] || GamePlayerEngine.keysPressed?.["S"]));
          case "left arrow":
          case "left":
            return (typeof keyIsDown !== "undefined" && (keyIsDown(37) || keyIsDown(65))) ||
                   (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowLeft"] || GamePlayerEngine.keysPressed?.["a"] || GamePlayerEngine.keysPressed?.["A"]));
          case "right arrow":
          case "right":
            return (typeof keyIsDown !== "undefined" && (keyIsDown(39) || keyIsDown(68))) ||
                   (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowRight"] || GamePlayerEngine.keysPressed?.["d"] || GamePlayerEngine.keysPressed?.["D"]));
          case "any":
            return (typeof keyIsPressed !== "undefined" && keyIsPressed) ||
                   (typeof GamePlayerEngine !== "undefined" && Object.values(GamePlayerEngine.keysPressed || {}).some(Boolean));
        }
      }

      // Virtual control button sensing
      if (condLower.includes("vcontrol") && condLower.includes("pressed")) {
        const matchBtn = condLower.match(/vcontrol\s*\[?([^\]]+)\]?\s*pressed/);
        const btnQuery = matchBtn ? matchBtn[1].trim().toLowerCase() : "cross";
        if (typeof MobileControlsManager !== "undefined") {
          return MobileControlsManager.isButtonPressed(btnQuery);
        }
        return false;
      }

      // Touching sensing
      if (condLower.startsWith("touching") || condLower.includes("touching")) {
        if (!targetItem) return false;
        const targetSpec = condLower.replace(/^touching\s*/, "").replace(/\?$/, "").replace(/[\[\]]/g, "").trim();

        switch (targetSpec) {
          case "edge": {
            const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
            const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
            return targetItem.x <= 10 || targetItem.x + targetItem.w >= wWidth - 10 ||
                   targetItem.y <= 10 || targetItem.y + targetItem.h >= wHeight - 10;
          }
          case "mouse-pointer":
          case "mouse": {
            const mx = (typeof mouseX !== "undefined" ? mouseX : 0);
            const my = (typeof mouseY !== "undefined" ? mouseY : 0);
            const panX = typeof WorldConfig !== "undefined" ? WorldConfig.panX : 0;
            const panY = typeof WorldConfig !== "undefined" ? WorldConfig.panY : 0;
            const zoom = typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1;
            const wx = (mx - panX) / zoom;
            const wy = (my - panY) / zoom;
            return wx >= targetItem.x && wx <= targetItem.x + targetItem.w &&
                   wy >= targetItem.y && wy <= targetItem.y + targetItem.h;
          }
          case "solid":
          case "solid object": {
            if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return false;
            return WorldObjectsManager.items.some(other => {
              if (other.id === targetItem.id || other.hidden || !other.isSolid) return false;
              return this.checkOverlap(targetItem, other);
            });
          }
          case "hero": {
            let hero = null;
            if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.getActivePlayableItem) {
              hero = GamePlayerEngine.getActivePlayableItem();
            }
            if (!hero && typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
              hero = WorldObjectsManager.items.find(it => it.isPlayable);
            }
            if (hero && hero.id !== targetItem.id) {
              return this.checkOverlap(targetItem, hero);
            }
            return false;
          }
          case "any":
          case "any object": {
            if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return false;
            return WorldObjectsManager.items.some(other => {
              if (other.id === targetItem.id || other.hidden) return false;
              return this.checkOverlap(targetItem, other);
            });
          }
          default: {
            if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
              return WorldObjectsManager.items.some(other => {
                if (other.id === targetItem.id || other.hidden) return false;
                const otherName = (other.name || "").toLowerCase();
                if (other.id === targetSpec || otherName === targetSpec || otherName.includes(targetSpec) || targetSpec.includes(otherName)) {
                  return this.checkOverlap(targetItem, other);
                }
                return false;
              });
            }
          }
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
          switch (targetSpec) {
            case "mouse-pointer":
            case "mouse": {
              const mx = (typeof mouseX !== "undefined" ? mouseX : 0);
              const my = (typeof mouseY !== "undefined" ? mouseY : 0);
              const panX = typeof WorldConfig !== "undefined" ? WorldConfig.panX : 0;
              const panY = typeof WorldConfig !== "undefined" ? WorldConfig.panY : 0;
              const zoom = typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1;
              otherX = (mx - panX) / zoom;
              otherY = (my - panY) / zoom;
              found = true;
              break;
            }
            case "hero": {
              let hero = (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.getActivePlayableItem()) ||
                         (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items.find(it => it.isPlayable));
              if (hero && hero.id !== targetItem.id) {
                otherX = hero.x + hero.w / 2;
                otherY = hero.y + hero.h / 2;
                found = true;
              }
              break;
            }
            default: {
              if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
                const other = WorldObjectsManager.items.find(it => it.id !== targetItem.id && (it.id === targetSpec || (it.name && it.name.toLowerCase().includes(targetSpec))));
                if (other) {
                  otherX = other.x + other.w / 2;
                  otherY = other.y + other.h / 2;
                  found = true;
                }
              }
              break;
            }
          }

          if (found) {
            const cx = targetItem.x + targetItem.w / 2;
            const cy = targetItem.y + targetItem.h / 2;
            const dist = Math.hypot(cx - otherX, cy - otherY);
            switch (op) {
              case "<": return dist < threshold;
              case ">": return dist > threshold;
              case "<=": return dist <= threshold;
              case ">=": return dist >= threshold;
              case "==":
              case "=": return Math.abs(dist - threshold) < 5;
              default: return false;
            }
          }
        }
      }

      const match = cond.match(/^([a-zA-Z0-9_-]+)\s*(>|<|>=|<=|==|=)\s*([a-zA-Z0-9_.-]+)$/);
      if (match) {
        const leftVal = this.resolveValue(match[1], targetItem);
        const op = match[2];
        const rightVal = this.resolveValue(match[3], targetItem);

        const lNum = Number(leftVal);
        const rNum = Number(rightVal);

        if (!isNaN(lNum) && !isNaN(rNum)) {
          switch (op) {
            case ">": return lNum > rNum;
            case "<": return lNum < rNum;
            case ">=": return lNum >= rNum;
            case "<=": return lNum <= rNum;
            case "==":
            case "=": return lNum === rNum;
            default: return false;
          }
        } else {
          switch (op) {
            case "==":
            case "=": return String(leftVal) === String(rightVal);
            default: return false;
          }
        }
      }

      return true;
    }
  };

  global.RuntimeEvaluator = RuntimeEvaluator;
})(typeof window !== 'undefined' ? window : globalThis);
