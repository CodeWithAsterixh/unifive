const AppModeController = {
  currentMode: "canvas", // "canvas" | "code"
  panX: 40,
  panY: 40,
  zoom: 1.0,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  draggedPlacedBlock: null,
  activeCategory: "events",

  // Per-object script storage: { [targetId]: [ { id, blockId, name, hat, color, icon, x, y } ] }
  objectScripts: {},

  categories: {
    events: [
      { id: "when_flag", name: "when 🚩 clicked", hat: true, scope: "global", color: "#f59e0b", icon: "ph-flag" },
      { id: "when_key", name: "when [space] key pressed", hat: true, scope: "global", color: "#f59e0b", icon: "ph-keyboard", options: ["space", "up arrow", "down arrow", "left arrow", "right arrow", "any"] },
      { id: "when_vcontrol", name: "when vcontrol [✕ (cross)] button pressed", hat: true, scope: "global", color: "#f59e0b", icon: "ph-game-controller", options: ["✕ (cross)", "◯ (circle)", "□ (square)", "▲ (triangle)", "dpad up", "dpad down", "dpad left", "dpad right", "L shoulder", "R shoulder", "start", "select", "any button"] },
      { id: "when_clicked", name: "when this sprite clicked", hat: true, scope: "object", color: "#f59e0b", icon: "ph-cursor-click" },
      { id: "when_became_playable", name: "when became playable", hat: true, scope: "sprite", color: "#f59e0b", icon: "ph-crown" },
      { id: "broadcast", name: "broadcast [message1]", scope: "global", color: "#f59e0b", icon: "ph-broadcast" },
      { id: "when_receive", name: "when I receive [message1]", hat: true, scope: "global", color: "#f59e0b", icon: "ph-bell-ringing" }
    ],
    motion: [
      { id: "move_x_steps", name: "move (10) steps x", scope: "sprite", color: "#3b82f6", icon: "ph-arrows-left-right" },
      { id: "move_y_steps", name: "move (10) steps y", scope: "sprite", color: "#3b82f6", icon: "ph-arrows-down-up" },
      { id: "turn_right", name: "turn ↻ (15) degrees", scope: "object", color: "#3b82f6", icon: "ph-arrow-clockwise" },
      { id: "turn_left", name: "turn ↺ (15) degrees", scope: "object", color: "#3b82f6", icon: "ph-arrow-counter-clockwise" },
      { id: "goto_xy", name: "go to x: (0) y: (0)", scope: "object", color: "#3b82f6", icon: "ph-crosshair" },
      { id: "glide_xy", name: "glide (1) secs to x: (0) y: (0)", scope: "object", color: "#3b82f6", icon: "ph-paper-plane-tilt" },
      { id: "point_dir", name: "point in direction (90)", scope: "sprite", color: "#3b82f6", icon: "ph-compass" },
      { id: "bounce_edge", name: "if on edge, bounce", scope: "sprite", color: "#3b82f6", icon: "ph-arrows-left-right" }
    ],
    looks: [
      { id: "say_text", name: 'say ["Hello!"] for (2) secs', scope: "sprite", color: "#a855f7", icon: "ph-chat-circle-dots" },
      { id: "switch_costume", name: "switch pose to [Attack]", scope: "sprite", color: "#a855f7", icon: "ph-person-simple-walk" },
      { id: "next_costume", name: "next pose", scope: "sprite", color: "#a855f7", icon: "ph-arrow-fat-right" },
      { id: "change_size", name: "change size by (10)%", scope: "object", color: "#a855f7", icon: "ph-arrows-out-simple" },
      { id: "set_size", name: "set size to (100)%", scope: "object", color: "#a855f7", icon: "ph-frame-corners" },
      { id: "move_layer_front", name: "move (1) layer front", scope: "object", color: "#a855f7", icon: "ph-stack-overflow" },
      { id: "move_layer_back", name: "move (1) layer back", scope: "object", color: "#a855f7", icon: "ph-stack-simple" },
      { id: "go_to_layer", name: "go to [front] layer", scope: "object", color: "#a855f7", icon: "ph-layers-intersect", options: ["front", "back"] },
      { id: "show", name: "show", scope: "object", color: "#a855f7", icon: "ph-eye" },
      { id: "hide", name: "hide", scope: "object", color: "#a855f7", icon: "ph-eye-slash" },
      { id: "set_vcontrols_visible", name: "set virtual controls visibility to [show]", scope: "global", color: "#a855f7", icon: "ph-game-controller", options: ["show", "hide", "auto"] },
      { id: "set_vcontrols_customizable", name: "allow players to customize button layout [true]", scope: "global", color: "#a855f7", icon: "ph-sliders-horizontal", options: ["true", "false"] }
    ],
    sound: [
      { id: "play_sound", name: "play sound [jump] until done", scope: "global", color: "#ec4899", icon: "ph-speaker-high", options: ["jump", "laser", "coin", "hit", "powerup"] },
      { id: "start_sound", name: "start sound [laser]", scope: "global", color: "#ec4899", icon: "ph-play", options: ["jump", "laser", "coin", "hit", "powerup"] },
      { id: "stop_all_sounds", name: "stop all sounds", scope: "global", color: "#ec4899", icon: "ph-stop" },
      { id: "change_volume", name: "change volume by (-10)", scope: "global", color: "#ec4899", icon: "ph-speaker-low" }
    ],
    control: [
      { id: "wait_secs", name: "wait (1) seconds", scope: "global", color: "#10b981", icon: "ph-timer" },
      { id: "repeat", name: "repeat (10) times", c_block: true, scope: "global", color: "#10b981", icon: "ph-repeat" },
      { id: "forever", name: "forever", c_block: true, scope: "global", color: "#10b981", icon: "ph-infinity" },
      { id: "if_then", name: "if <[touching edge]> then", c_block: true, scope: "global", color: "#10b981", icon: "ph-git-fork", isConditionBlock: true },
      { id: "if_else", name: "if <[touching edge]> then", e_block: true, scope: "global", color: "#10b981", icon: "ph-git-branch", isConditionBlock: true },
      { id: "set_playable_char", name: "set playable character to [this sprite]", scope: "sprite", color: "#10b981", icon: "ph-user-focus", isPlayableCharSelector: true },
      { id: "set_player_control", name: "set player control to [enabled]", scope: "global", color: "#10b981", icon: "ph-game-controller", options: ["enabled", "disabled"] },
      { id: "stop_all", name: "stop [all scripts]", cap: true, scope: "global", color: "#10b981", icon: "ph-stop-circle" }
    ],
    sensing: [
      { id: "touching_object", name: "touching [edge]?", isBoolean: true, scope: "object", color: "#0284c7", icon: "ph-intersect", isTouchingSelector: true },
      { id: "touching_solid", name: "touching solid object?", isBoolean: true, scope: "object", color: "#0284c7", icon: "ph-shield-check" },
      { id: "distance_to_object", name: "distance to [hero] < (50)", isBoolean: true, scope: "object", color: "#0284c7", icon: "ph-ruler", isDistanceSelector: true },
      { id: "key_pressed_check", name: "key [space] pressed?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-keyboard", options: ["space", "up arrow", "down arrow", "left arrow", "right arrow", "any"] },
      { id: "vcontrol_pressed_check", name: "vcontrol [✕ (cross)] pressed?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-game-controller", options: ["✕ (cross)", "◯ (circle)", "□ (square)", "▲ (triangle)", "dpad up", "dpad down", "dpad left", "dpad right", "L shoulder", "R shoulder", "start", "select", "any button"] },
      { id: "mouse_down_check", name: "mouse down?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-cursor-click" },
      { id: "is_mobile_sensing", name: "is mobile device?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-device-mobile" },
      { id: "is_playable_sensing", name: "is playable hero?", isBoolean: true, scope: "sprite", color: "#0284c7", icon: "ph-game-controller" }
    ],
    operators: [
      { id: "op_add", name: "( ) + ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-plus", opType: "+" },
      { id: "op_subtract", name: "( ) - ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-minus", opType: "-" },
      { id: "op_multiply", name: "( ) * ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-x", opType: "*" },
      { id: "op_divide", name: "( ) / ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-divide", opType: "/" },
      { id: "op_random", name: "pick random (1) to (10)", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-shuffle", isRandom: true },
      { id: "op_gt", name: "<( ) > (50)>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-caret-right", opType: ">" },
      { id: "op_lt", name: "<( ) < (50)>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-caret-left", opType: "<" },
      { id: "op_eq", name: "<( ) = (50)>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-equals", opType: "=" },
      { id: "op_and", name: "<<> and <>>", isBoolean: true, isLogical: true, scope: "universal", color: "#22c55e", icon: "ph-intersect", opType: "and" },
      { id: "op_or", name: "<<> or <>>", isBoolean: true, isLogical: true, scope: "universal", color: "#22c55e", icon: "ph-circles-three", opType: "or" },
      { id: "op_not", name: "<not <>>", isBoolean: true, isLogical: true, scope: "universal", color: "#22c55e", icon: "ph-prohibit", opType: "not" },
      { id: "op_join", name: "join [apple] [banana]", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-link" },
      { id: "op_letter_of", name: "letter (1) of [apple]", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-text-aa" },
      { id: "op_length_of", name: "length of [apple]", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-ruler" },
      { id: "op_contains", name: "<[apple] contains [a]?>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-magnifying-glass", opType: "contains" }
    ],
    variables: [
      { id: "set_var", name: "set [score] to (0)", scope: "global", color: "#f97316", icon: "ph-textbox", isVarSetter: true },
      { id: "change_var", name: "change [score] by (1)", scope: "global", color: "#f97316", icon: "ph-plus-circle", isVarChanger: true },
      { id: "show_var", name: "show variable [score]", scope: "global", color: "#f97316", icon: "ph-eye", isVarSelector: true },
      { id: "hide_var", name: "hide variable [score]", scope: "global", color: "#f97316", icon: "ph-eye-slash", isVarSelector: true }
    ]
  },

  getActiveTargetId() {
    const sel = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    return sel ? sel.id : "global_stage";
  },

  getActiveTargetInfo() {
    const sel = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (!sel) {
      return { id: "global_stage", name: "Stage (Global)", type: "stage", isStage: true, isSprite: false, isProp: false };
    }
    const isSprite = sel.type === "sprite" || (sel.assetId && sel.assetId.startsWith("sprite_")) || (sel.poses && Object.keys(sel.poses).length > 0) || !!sel.isCharacter || !!sel.isPlayable;
    return {
      id: sel.id,
      name: sel.name || "Object",
      type: isSprite ? "sprite" : (sel.type || "prop"),
      isStage: false,
      isSprite: isSprite,
      isProp: !isSprite
    };
  },

  isBlockAvailableForTarget(block, targetInfo) {
    if (!targetInfo) targetInfo = this.getActiveTargetInfo();
    const scope = block.scope || "global";
    if (scope === "universal" || scope === "global") {
      return true;
    }
    if (targetInfo.isStage) {
      return scope === "global" || scope === "universal";
    }
    if (targetInfo.isProp) {
      return scope === "global" || scope === "universal" || scope === "object";
    }
    if (targetInfo.isSprite) {
      return true;
    }
    return true;
  },

  getCurrentScripts() {
    const targetId = this.getActiveTargetId();
    if (!this.objectScripts[targetId]) {
      this.objectScripts[targetId] = [];
    }
    return this.objectScripts[targetId];
  },

  getBlockElement(blockId) {
    if (!blockId) return null;
    const workspace = document.getElementById("code-workspace-blocks");
    if (workspace) {
      const el = workspace.querySelector(`.code-block-item[data-block-id="${blockId}"]`);
      if (el) return el;
    }
    return document.querySelector(`.code-block-item[data-block-id="${blockId}"]`);
  },

  getBranchHeight(startBlockId, map) {
    if (!startBlockId || !map.has(startBlockId)) return 24;
    let totalH = 0;
    let currId = startBlockId;
    const visited = new Set();
    while (currId && map.has(currId) && !visited.has(currId)) {
      visited.add(currId);
      const b = map.get(currId);
      const bH = this.getFullBlockHeight(b, map);
      totalH += (totalH === 0 ? bH : (bH - 2));
      currId = b.nextId;
    }
    return Math.max(24, totalH);
  },

  getFullBlockHeight(block, map) {
    if (!block) return 34;
    if (block.c_block) {
      const headerH = 34;
      const bodyH = this.getBranchHeight(block.childId, map || new Map());
      const footerH = 14;
      return headerH + bodyH + footerH - 4;
    }
    if (block.e_block) {
      const headerH = 34;
      const ifBodyH = this.getBranchHeight(block.childId_if, map || new Map());
      const dividerH = 26;
      const elseBodyH = this.getBranchHeight(block.childId_else, map || new Map());
      const footerH = 14;
      return headerH + ifBodyH + dividerH + elseBodyH + footerH - 6;
    }
    if (block.hat) return 38;
    return 34;
  },

  getBlockDimensions(block) {
    if (!block) return { w: 140, h: 34 };
    const scripts = this.getCurrentScripts();
    const map = new Map(scripts.map(b => [b.id, b]));
    const h = this.getFullBlockHeight(block, map);
    const el = block.id ? this.getBlockElement(block.id) : null;
    if (el && el.offsetWidth > 0) {
      return { w: el.offsetWidth, h: h };
    }
    const len = (block.name || "").length;
    const estW = Math.max(140, Math.min(270, len * 9 + 40));
    return { w: estW, h: h };
  },

  // Returns all blocks in the connected downstream stack starting from rootBlock
  getConnectedStack(rootBlock) {
    const scripts = this.getCurrentScripts();
    const map = new Map(scripts.map(b => [b.id, b]));
    const stack = [];
    const visited = new Set();

    const collect = (node) => {
      if (!node || visited.has(node.id)) return;
      visited.add(node.id);
      stack.push(node);

      // Collect inside C-block body
      if (node.c_block && node.childId && map.has(node.childId)) {
        collect(map.get(node.childId));
      }

      // Collect inside E-block branches
      if (node.e_block) {
        if (node.childId_if && map.has(node.childId_if)) {
          collect(map.get(node.childId_if));
        }
        if (node.childId_else && map.has(node.childId_else)) {
          collect(map.get(node.childId_else));
        }
      }

      // Collect downstream connected next block
      if (node.nextId && map.has(node.nextId)) {
        collect(map.get(node.nextId));
      }
    };

    collect(rootBlock);
    return stack;
  },

  // Find nearest magnetic snap target near (draggedX, draggedY)
  findSnapTarget(draggedBlock, draggedX, draggedY, excludeIds = new Set(), ignoreTargetId = null) {
    const scripts = this.getCurrentScripts();
    if (!scripts || scripts.length === 0) return null;

    const map = new Map(scripts.map(b => [b.id, b]));
    const draggedDims = this.getBlockDimensions(draggedBlock);
    let bestTarget = null;
    let minDistance = 999999;

    const snapThresholdX = 65;
    const snapThresholdY = 32;

    for (let i = 0; i < scripts.length; i++) {
      const target = scripts[i];
      if (excludeIds.has(target.id)) continue;
      if (draggedBlock.id && target.id === draggedBlock.id) continue;

      const fullTargetH = this.getFullBlockHeight(target, map);

      // If we just detached from this target, ignore snapping back to it while pulling away
      if (ignoreTargetId && target.id === ignoreTargetId) {
        if (Math.hypot(draggedX - target.x, draggedY - target.y) < 55) {
          continue;
        }
      }

      // 1. SNAP INSIDE C-BLOCK MOUTH (Takes priority when dragged over mouth area)
      if (target.c_block && !draggedBlock.hat && !draggedBlock.isBoolean) {
        if (!target.childId && draggedY < target.y + fullTargetH - 14) {
          const snapX = target.x + 16;
          const snapY = target.y + 32;

          const dx = Math.abs(draggedX - snapX);
          const dy = Math.abs(draggedY - snapY);

          if (dx <= 80 && dy <= 45) {
            const dist = dx + dy;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "inside",
                snapX: snapX,
                snapY: snapY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        }
      }

      // 2. SNAP INSIDE DUAL-MOUTH E-BLOCK (IF vs ELSE MOUTHS)
      if (target.e_block && !draggedBlock.hat && !draggedBlock.isBoolean) {
        const ifBodyH = this.getBranchHeight(target.childId_if, map);
        
        // Top If-branch mouth
        if (!target.childId_if && draggedY < target.y + 30 + ifBodyH) {
          const snapIfX = target.x + 16;
          const snapIfY = target.y + 32;
          const dxIf = Math.abs(draggedX - snapIfX);
          const dyIf = Math.abs(draggedY - snapIfY);

          if (dxIf <= 80 && dyIf <= 45) {
            const dist = dxIf + dyIf;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "inside_if",
                snapX: snapIfX,
                snapY: snapIfY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        }

        // Bottom Else-branch mouth
        if (!target.childId_else && draggedY >= target.y + 30 + ifBodyH && draggedY < target.y + fullTargetH - 14) {
          const snapElseX = target.x + 16;
          const snapElseY = target.y + 54 + ifBodyH;
          const dxElse = Math.abs(draggedX - snapElseX);
          const dyElse = Math.abs(draggedY - snapElseY);

          if (dxElse <= 80 && dyElse <= 45) {
            const dist = dxElse + dyElse;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "inside_else",
                snapX: snapElseX,
                snapY: snapElseY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        }
      }

      // 3. SNAP UNDERNEATH TARGET BLOCK (At bottom of regular block or bottom footer of C/E-block)
      if (!target.cap && !draggedBlock.hat && !draggedBlock.isBoolean) {
        // For C-block or E-block, bottom snap is only active near the actual footer bar
        const isMouthContainer = target.c_block || target.e_block;
        const isNearFooterOrRegular = !isMouthContainer || (draggedY >= target.y + fullTargetH - 26);

        if (isNearFooterOrRegular) {
          const snapX = target.x;
          const snapY = target.y + fullTargetH - 2;

          const dx = Math.abs(draggedX - snapX);
          const dy = Math.abs(draggedY - snapY);

          if (dx <= snapThresholdX && dy <= snapThresholdY) {
            const dist = dx + dy;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "bottom",
                snapX: snapX,
                snapY: snapY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        }
      }

      // 4. SNAP ABOVE TARGET BLOCK
      if (!target.hat && !draggedBlock.cap && !draggedBlock.isBoolean) {
        const snapX = target.x;
        const snapY = target.y - draggedDims.h + 2;

        const dx = Math.abs(draggedX - snapX);
        const dy = Math.abs(draggedY - snapY);

        if (dx <= snapThresholdX && dy <= snapThresholdY) {
          const dist = dx + dy;
          if (dist < minDistance) {
            minDistance = dist;
            bestTarget = {
              target: target,
              position: "top",
              snapX: snapX,
              snapY: snapY,
              snapW: draggedDims.w,
              snapH: draggedDims.h
            };
          }
        }
      }

      // 5. SNAP INTO CONDITION SOCKET (For if_then, if_else, logical blocks when dragging boolean blocks)
      const isDraggedBool = !!(draggedBlock.isBoolean || draggedBlock.boolean || draggedBlock.color === "#0284c7" || (draggedBlock.id && draggedBlock.id.startsWith("op_") && (draggedBlock.isBoolean || draggedBlock.opType)));
      if (isDraggedBool) {
        if (target.isConditionBlock || target.c_block || target.e_block) {
          const snapCondX = target.x + 36;
          const snapCondY = target.y + 2;
          const dxCond = Math.abs(draggedX - snapCondX);
          const dyCond = Math.abs(draggedY - snapCondY);

          if (dxCond <= 75 && dyCond <= 32) {
            const dist = dxCond + dyCond;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "condition",
                snapX: snapCondX,
                snapY: snapCondY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        } else if (target.isLogical) {
          if (target.opType === "not") {
            const snapCondX = target.x + 38;
            const snapCondY = target.y + 2;
            const dxCond = Math.abs(draggedX - snapCondX);
            const dyCond = Math.abs(draggedY - snapCondY);

            if (dxCond <= 60 && dyCond <= 32) {
              const dist = dxCond + dyCond;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "condition",
                  snapX: snapCondX,
                  snapY: snapCondY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }
          } else {
            // Left condition socket
            const snapLeftX = target.x + 10;
            const snapLeftY = target.y + 2;
            const dxLeft = Math.abs(draggedX - snapLeftX);
            const dyLeft = Math.abs(draggedY - snapLeftY);

            if (dxLeft <= 45 && dyLeft <= 32) {
              const dist = dxLeft + dyLeft;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "left_condition",
                  snapX: snapLeftX,
                  snapY: snapLeftY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }

            // Right condition socket
            const snapRightX = target.x + 65;
            const snapRightY = target.y + 2;
            const dxRight = Math.abs(draggedX - snapRightX);
            const dyRight = Math.abs(draggedY - snapRightY);

            if (dxRight <= 45 && dyRight <= 32) {
              const dist = dxRight + dyRight;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "right_condition",
                  snapX: snapRightX,
                  snapY: snapRightY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }
          }
        }
      }
    }

    return bestTarget;
  },

  showSnapIndicator(snapTarget) {
    let indicator = document.getElementById("code-snap-ghost-indicator");
    const workspace = document.getElementById("code-workspace-blocks");

    document.querySelectorAll(".snap-target-highlight").forEach(el => {
      el.classList.remove("snap-target-highlight");
    });

    if (!snapTarget) {
      if (indicator) indicator.style.display = "none";
      return;
    }

    if (!indicator && workspace) {
      indicator = document.createElement("div");
      indicator.id = "code-snap-ghost-indicator";
      indicator.className = "code-snap-ghost-indicator";
      workspace.appendChild(indicator);
    }

    if (indicator) {
      indicator.style.left = `${snapTarget.snapX}px`;
      indicator.style.top = `${snapTarget.snapY}px`;
      const isInside = snapTarget.position === "inside" || snapTarget.position === "inside_if" || snapTarget.position === "inside_else";
      indicator.style.width = isInside ? `${Math.max(110, snapTarget.snapW - 20)}px` : `${Math.max(100, snapTarget.snapW)}px`;
      indicator.style.height = isInside ? `26px` : `${Math.max(30, snapTarget.snapH)}px`;
      indicator.style.display = "block";
    }

    if (snapTarget.target && snapTarget.target.id) {
      const targetEl = this.getBlockElement(snapTarget.target.id);
      if (targetEl) {
        if (snapTarget.position === "condition") {
          const slotEl = targetEl.querySelector('.code-condition-slot[data-slot="condition"], .code-condition-slot:not([data-slot])');
          if (slotEl) slotEl.classList.add("snap-target-highlight");
        } else if (snapTarget.position === "left_condition") {
          const slotEl = targetEl.querySelector('.code-condition-slot.left-slot, .code-condition-slot[data-slot="left"]');
          if (slotEl) slotEl.classList.add("snap-target-highlight");
        } else if (snapTarget.position === "right_condition") {
          const slotEl = targetEl.querySelector('.code-condition-slot.right-slot, .code-condition-slot[data-slot="right"]');
          if (slotEl) slotEl.classList.add("snap-target-highlight");
        } else {
          targetEl.classList.add("snap-target-highlight");
        }
      }
    }
  },

  createBlockElement(block, isWorkspace = false) {
    const blockEl = document.createElement("div");
    let blockTypeClass = "stack-block";
    if (block.hat) blockTypeClass = "hat-block";
    else if (block.cap) blockTypeClass = "cap-block";
    else if (block.c_block) blockTypeClass = "c-block";
    else if (block.e_block) blockTypeClass = "e-block";
    else if (block.isReporter || block.reporter) blockTypeClass = "reporter-block";
    else if (block.isBoolean || block.boolean || (block.id && block.id.startsWith("op_") && (block.isBoolean || block.opType === ">" || block.opType === "<" || block.opType === "=" || block.opType === "contains" || block.isLogical))) blockTypeClass = "boolean-block";

    blockEl.className = `code-block-item ${blockTypeClass}`;
    blockEl.style.setProperty("--block-bg", block.color || "#22c55e");
    if (block.id) {
      blockEl.setAttribute("data-block-id", block.id);
    }

    // Dynamic variable dropdown options
    let varOptionsHtml = "";
    if (typeof VariableManager !== "undefined" && VariableManager.variables) {
      varOptionsHtml = VariableManager.variables.map(v => `<option value="${v.name}">${v.name}</option>`).join("");
    }
    if (!varOptionsHtml) varOptionsHtml = '<option value="score">score</option>';

    // Dynamic objects placed on canvas
    const activeTargetId = this.getActiveTargetId();
    const placedObjectNames = [];
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
      WorldObjectsManager.items.forEach(it => {
        if (it.id !== activeTargetId && it.name) {
          placedObjectNames.push(it.name);
        }
      });
    }

    let formattedHtml = block.name;

    if (block.isLogical) {
      if (block.opType === "and" || block.opType === "or") {
        formattedHtml = `
          <span class="code-condition-slot logical-slot left-slot" data-slot="left"></span>
          <span class="logical-op-text">${block.opType}</span>
          <span class="code-condition-slot logical-slot right-slot" data-slot="right"></span>
        `;
      } else if (block.opType === "not") {
        formattedHtml = `
          <span class="logical-op-text">not</span>
          <span class="code-condition-slot logical-slot" data-slot="condition"></span>
        `;
      }
    } else if (block.isVarSetter || block.isVarChanger || block.isVarSelector) {
      formattedHtml = block.name
        .replace(/\[score\]/g, `<select class="code-block-select">${varOptionsHtml}</select>`)
        .replace(/\[(.*?)\]/g, `<select class="code-block-select">${varOptionsHtml}</select>`)
        .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    } else if (block.isTouchingSelector) {
      const touchingOpts = ["edge", "solid", "hero", "mouse-pointer", "any object", ...placedObjectNames];
      const optsHtml = touchingOpts.map(opt => `<option value="${opt}">${opt}</option>`).join("");
      formattedHtml = block.name
        .replace(/\[(.*?)\]/g, `<select class="code-block-select">${optsHtml}</select>`)
        .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    } else if (block.isDistanceSelector) {
      const distOpts = ["hero", "mouse-pointer", "nearest solid", ...placedObjectNames];
      const optsHtml = distOpts.map(opt => `<option value="${opt}">${opt}</option>`).join("");
      formattedHtml = block.name
        .replace(/\[(.*?)\]/g, `<select class="code-block-select">${optsHtml}</select>`)
        .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    } else if (block.isPlayableCharSelector) {
      const charOpts = ["this sprite", "None", ...placedObjectNames];
      const optsHtml = charOpts.map(opt => `<option value="${opt}">${opt}</option>`).join("");
      formattedHtml = block.name
        .replace(/\[(.*?)\]/g, `<select class="code-block-select">${optsHtml}</select>`)
        .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    } else if (block.isConditionBlock) {
      if (block.conditionBlock) {
        formattedHtml = block.name.replace(/<\s*\[?(.*?)\]?\s*>/g, `<span class="code-condition-slot has-nested-block" data-slot="condition"></span>`);
      } else {
        const condOpts = [
          "touching edge",
          "touching solid",
          "touching hero",
          "touching mouse-pointer",
          "touching any object",
          ...placedObjectNames.map(n => `touching ${n}`),
          "distance to hero < 50",
          "key space pressed",
          "key up arrow pressed",
          "key down arrow pressed",
          "key left arrow pressed",
          "key right arrow pressed",
          "mouse down",
          "is mobile",
          "is playable",
          "score > 5",
          "health < 20"
        ];
        const optsHtml = condOpts.map(opt => `<option value="${opt}">${opt}</option>`).join("");
        formattedHtml = block.name
          .replace(/<\s*\[?(.*?)\]?\s*>/g, `<span class="code-condition-slot" data-slot="condition"><select class="code-block-select">${optsHtml}</select></span>`)
          .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
      }
    } else if (block.options) {
      const optsHtml = block.options.map(opt => `<option value="${opt}">${opt}</option>`).join("");
      formattedHtml = block.name
        .replace(/\[(.*?)\]/g, `<select class="code-block-select">${optsHtml}</select>`)
        .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    } else {
      formattedHtml = block.name
        .replace(/^<\s*/, '')
        .replace(/\s*>$/, '')
        .replace(/\((.*?)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>')
        .replace(/\[(.*?)\]/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    }

    if (block.e_block) {
      blockEl.innerHTML = `
        <div class="e-block-header">
          <i class="ph ${block.icon || 'ph-git-branch'}"></i>
          <span>${formattedHtml}</span>
          ${isWorkspace ? '<button class="code-block-delete-btn" title="Delete Block">✕</button>' : ''}
        </div>
        <div class="e-block-body e-block-body-if"></div>
        <div class="e-block-divider">
          <span>else</span>
        </div>
        <div class="e-block-body e-block-body-else"></div>
        <div class="e-block-footer"></div>
      `;
    } else if (block.c_block) {
      blockEl.innerHTML = `
        <div class="c-block-header">
          <i class="ph ${block.icon || 'ph-code'}"></i>
          <span>${formattedHtml}</span>
          ${isWorkspace ? '<button class="code-block-delete-btn" title="Delete Block">✕</button>' : ''}
        </div>
        <div class="c-block-body"></div>
        <div class="c-block-footer"></div>
      `;
    } else {
      blockEl.innerHTML = `
        <i class="ph ${block.icon || 'ph-code'}"></i>
        <span>${formattedHtml}</span>
        ${isWorkspace ? '<button class="code-block-delete-btn" title="Delete Block">✕</button>' : ''}
      `;
    }

    // Attach condition block (single)
    if (block.conditionBlock) {
      const slotEl = blockEl.querySelector('.code-condition-slot[data-slot="condition"], .code-condition-slot:not([data-slot])');
      if (slotEl) {
        slotEl.innerHTML = "";
        const condData = { ...block.conditionBlock, isBoolean: true };
        const nestedEl = this.createBlockElement(condData, false);
        nestedEl.classList.add("nested-condition-block", "boolean-block");
        nestedEl.classList.remove("stack-block");
        nestedEl.querySelectorAll(".code-block-delete-btn").forEach(b => b.remove());

        if (isWorkspace) {
          // Drag nested condition block OUT of socket
          nestedEl.addEventListener("mousedown", (e) => {
            if (e.target.closest(".nested-block-eject-btn")) return;
            e.stopPropagation();
            e.preventDefault();

            const condToExtract = JSON.parse(JSON.stringify(block.conditionBlock));
            delete block.conditionBlock;

            const dropZone = document.getElementById("code-drop-zone");
            const rect = dropZone ? dropZone.getBoundingClientRect() : { left: 0, top: 0 };
            const worldX = Math.round((e.clientX - rect.left - this.panX) / this.zoom);
            const worldY = Math.round((e.clientY - rect.top - this.panY) / this.zoom);

            condToExtract.id = condToExtract.id || ("block_" + Date.now() + "_" + Math.floor(Math.random() * 10000));
            condToExtract.x = worldX - 20;
            condToExtract.y = worldY - 10;
            condToExtract.nextId = null;
            condToExtract.prevId = null;
            condToExtract.isBoolean = true;

            const scripts = this.getCurrentScripts();
            scripts.push(condToExtract);
            this.renderScriptsForActiveTarget();

            const extractedEl = this.getBlockElement(condToExtract.id);
            if (extractedEl) {
              extractedEl.classList.add("dragging");
              this.draggedPlacedBlock = {
                block: condToExtract,
                elt: extractedEl,
                stack: [condToExtract],
                stackItems: [{
                  block: condToExtract,
                  elt: extractedEl,
                  initialX: condToExtract.x,
                  initialY: condToExtract.y
                }],
                stackIds: new Set([condToExtract.id]),
                mouseStartX: e.clientX,
                mouseStartY: e.clientY,
                initialX: condToExtract.x,
                initialY: condToExtract.y,
                detachedFromId: block.id
              };
            }
            SoundEngine.playChiptuneTone(740, "triangle", 0.04, 0.1);
          });

          const ejectBtn = document.createElement("button");
          ejectBtn.className = "nested-block-eject-btn";
          ejectBtn.innerHTML = "✕";
          ejectBtn.title = "Remove Condition Block";
          ejectBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            delete block.conditionBlock;
            this.renderScriptsForActiveTarget();
            SoundEngine.playAction("delete");
          });
          nestedEl.appendChild(ejectBtn);
        }
        slotEl.appendChild(nestedEl);
      }
    }

    // Attach left condition block (for op_and, op_or)
    if (block.leftConditionBlock) {
      const slotEl = blockEl.querySelector('.code-condition-slot[data-slot="left"]');
      if (slotEl) {
        slotEl.innerHTML = "";
        const condData = { ...block.leftConditionBlock, isBoolean: true };
        const nestedEl = this.createBlockElement(condData, false);
        nestedEl.classList.add("nested-condition-block", "boolean-block");
        nestedEl.classList.remove("stack-block");
        nestedEl.querySelectorAll(".code-block-delete-btn").forEach(b => b.remove());

        if (isWorkspace) {
          nestedEl.addEventListener("mousedown", (e) => {
            if (e.target.closest(".nested-block-eject-btn")) return;
            e.stopPropagation();
            e.preventDefault();

            const condToExtract = JSON.parse(JSON.stringify(block.leftConditionBlock));
            delete block.leftConditionBlock;

            const dropZone = document.getElementById("code-drop-zone");
            const rect = dropZone ? dropZone.getBoundingClientRect() : { left: 0, top: 0 };
            const worldX = Math.round((e.clientX - rect.left - this.panX) / this.zoom);
            const worldY = Math.round((e.clientY - rect.top - this.panY) / this.zoom);

            condToExtract.id = condToExtract.id || ("block_" + Date.now() + "_" + Math.floor(Math.random() * 10000));
            condToExtract.x = worldX - 20;
            condToExtract.y = worldY - 10;
            condToExtract.nextId = null;
            condToExtract.prevId = null;
            condToExtract.isBoolean = true;

            const scripts = this.getCurrentScripts();
            scripts.push(condToExtract);
            this.renderScriptsForActiveTarget();

            const extractedEl = this.getBlockElement(condToExtract.id);
            if (extractedEl) {
              extractedEl.classList.add("dragging");
              this.draggedPlacedBlock = {
                block: condToExtract,
                elt: extractedEl,
                stack: [condToExtract],
                stackItems: [{
                  block: condToExtract,
                  elt: extractedEl,
                  initialX: condToExtract.x,
                  initialY: condToExtract.y
                }],
                stackIds: new Set([condToExtract.id]),
                mouseStartX: e.clientX,
                mouseStartY: e.clientY,
                initialX: condToExtract.x,
                initialY: condToExtract.y,
                detachedFromId: block.id
              };
            }
            SoundEngine.playChiptuneTone(740, "triangle", 0.04, 0.1);
          });

          const ejectBtn = document.createElement("button");
          ejectBtn.className = "nested-block-eject-btn";
          ejectBtn.innerHTML = "✕";
          ejectBtn.title = "Remove Left Condition";
          ejectBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            delete block.leftConditionBlock;
            this.renderScriptsForActiveTarget();
            SoundEngine.playAction("delete");
          });
          nestedEl.appendChild(ejectBtn);
        }
        slotEl.appendChild(nestedEl);
      }
    }

    // Attach right condition block (for op_and, op_or)
    if (block.rightConditionBlock) {
      const slotEl = blockEl.querySelector('.code-condition-slot[data-slot="right"]');
      if (slotEl) {
        slotEl.innerHTML = "";
        const condData = { ...block.rightConditionBlock, isBoolean: true };
        const nestedEl = this.createBlockElement(condData, false);
        nestedEl.classList.add("nested-condition-block", "boolean-block");
        nestedEl.classList.remove("stack-block");
        nestedEl.querySelectorAll(".code-block-delete-btn").forEach(b => b.remove());

        if (isWorkspace) {
          nestedEl.addEventListener("mousedown", (e) => {
            if (e.target.closest(".nested-block-eject-btn")) return;
            e.stopPropagation();
            e.preventDefault();

            const condToExtract = JSON.parse(JSON.stringify(block.rightConditionBlock));
            delete block.rightConditionBlock;

            const dropZone = document.getElementById("code-drop-zone");
            const rect = dropZone ? dropZone.getBoundingClientRect() : { left: 0, top: 0 };
            const worldX = Math.round((e.clientX - rect.left - this.panX) / this.zoom);
            const worldY = Math.round((e.clientY - rect.top - this.panY) / this.zoom);

            condToExtract.id = condToExtract.id || ("block_" + Date.now() + "_" + Math.floor(Math.random() * 10000));
            condToExtract.x = worldX - 20;
            condToExtract.y = worldY - 10;
            condToExtract.nextId = null;
            condToExtract.prevId = null;
            condToExtract.isBoolean = true;

            const scripts = this.getCurrentScripts();
            scripts.push(condToExtract);
            this.renderScriptsForActiveTarget();

            const extractedEl = this.getBlockElement(condToExtract.id);
            if (extractedEl) {
              extractedEl.classList.add("dragging");
              this.draggedPlacedBlock = {
                block: condToExtract,
                elt: extractedEl,
                stack: [condToExtract],
                stackItems: [{
                  block: condToExtract,
                  elt: extractedEl,
                  initialX: condToExtract.x,
                  initialY: condToExtract.y
                }],
                stackIds: new Set([condToExtract.id]),
                mouseStartX: e.clientX,
                mouseStartY: e.clientY,
                initialX: condToExtract.x,
                initialY: condToExtract.y,
                detachedFromId: block.id
              };
            }
            SoundEngine.playChiptuneTone(740, "triangle", 0.04, 0.1);
          });

          const ejectBtn = document.createElement("button");
          ejectBtn.className = "nested-block-eject-btn";
          ejectBtn.innerHTML = "✕";
          ejectBtn.title = "Remove Right Condition";
          ejectBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            delete block.rightConditionBlock;
            this.renderScriptsForActiveTarget();
            SoundEngine.playAction("delete");
          });
          nestedEl.appendChild(ejectBtn);
        }
        slotEl.appendChild(nestedEl);
      }
    }

    // Set saved input values if available
    if (isWorkspace && block.inputs && Array.isArray(block.inputs)) {
      setTimeout(() => {
        const inputEls = blockEl.querySelectorAll(".code-block-input, .code-block-select");
        inputEls.forEach((inp, idx) => {
          if (block.inputs[idx] !== undefined) {
            if (inp.tagName === "SELECT") {
              inp.value = block.inputs[idx];
            } else {
              inp.textContent = block.inputs[idx];
            }
          }
        });
      }, 0);
    }

    // Save inputs on change and initialize defaults
    blockEl.querySelectorAll(".code-block-input, .code-block-select").forEach((inp, idx) => {
      if (!block.inputs) block.inputs = [];
      if (block.inputs[idx] === undefined) {
        block.inputs[idx] = inp.value || inp.textContent.trim();
      }
      const save = () => {
        if (!block.inputs) block.inputs = [];
        block.inputs[idx] = inp.value || inp.textContent.trim();
      };
      inp.addEventListener("input", save);
      inp.addEventListener("change", save);
    });

    // Double-click to run block stack immediately in workspace
    if (isWorkspace) {
      blockEl.addEventListener("dblclick", (e) => {
        if (e.target.closest(".code-block-delete-btn, .code-block-input, .code-block-select, .nested-block-eject-btn")) return;
        e.stopPropagation();
        if (typeof CodeRuntimeEngine !== "undefined") {
          CodeRuntimeEngine.runBlockImmediately(block);
        }
      });
    }

    return blockEl;
  },

  init() {
    // 1. Header mode buttons
    const btnCanvas = document.getElementById("btn-mode-canvas");
    const btnCode = document.getElementById("btn-mode-code");

    if (btnCanvas) {
      btnCanvas.addEventListener("click", () => this.setMode("canvas"));
    }
    if (btnCode) {
      btnCode.addEventListener("click", () => this.setMode("code"));
    }

    // 2. Code Toolbox category buttons
    const catButtons = document.querySelectorAll(".code-cat-btn");
    catButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-category");
        this.selectCategory(cat);
      });
    });

    // 3. Infinite Canvas Pan & Drop Interactions
    const dropZone = document.getElementById("code-drop-zone");
    if (dropZone) {
      dropZone.addEventListener("mousedown", (e) => {
        if (e.target.closest(".code-block-item") || e.target.closest("button") || e.target.closest("input") || e.target.closest("select")) {
          return;
        }
        this.isPanning = true;
        this.panStartX = e.clientX - this.panX;
        this.panStartY = e.clientY - this.panY;
        dropZone.classList.add("panning");
      });

      dropZone.addEventListener("wheel", (e) => {
        e.preventDefault();
        const rect = dropZone.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        const newZoom = Math.min(2.5, Math.max(0.35, this.zoom * factor));

        this.panX = mx - (mx - this.panX) * (newZoom / this.zoom);
        this.panY = my - (my - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;
        this.updateWorkspaceTransform();
      }, { passive: false });

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        try {
          const raw = e.dataTransfer.getData("text/plain");
          if (raw) {
            const blockTemplate = JSON.parse(raw);
            const isBool = !!(blockTemplate.isBoolean || blockTemplate.boolean || blockTemplate.color === "#0284c7" || (blockTemplate.id && blockTemplate.id.startsWith("op_") && (blockTemplate.isBoolean || blockTemplate.opType)));
            const hitEl = document.elementFromPoint(e.clientX, e.clientY);
            const condSlot = hitEl ? hitEl.closest(".code-condition-slot") : null;
            const parentBlockEl = hitEl ? (condSlot ? condSlot.closest(".code-block-item") : hitEl.closest(".c-block, .e-block, .boolean-block, .code-block-item")) : null;

            if (isBool && parentBlockEl) {
              const parentId = parentBlockEl.getAttribute("data-block-id");
              const scripts = this.getCurrentScripts();
              const parentBlock = scripts.find(b => b.id === parentId);
              if (parentBlock) {
                const condData = {
                  ...blockTemplate,
                  id: "cond_" + Date.now() + "_" + Math.floor(Math.random() * 1000)
                };
                if (condSlot && condSlot.getAttribute("data-slot") === "left") {
                  parentBlock.leftConditionBlock = condData;
                } else if (condSlot && condSlot.getAttribute("data-slot") === "right") {
                  parentBlock.rightConditionBlock = condData;
                } else {
                  parentBlock.conditionBlock = condData;
                }
                SoundEngine.playChiptuneTone(880, "triangle", 0.04, 0.15);
                setTimeout(() => SoundEngine.playChiptuneTone(1174, "triangle", 0.06, 0.15), 40);
                this.renderScriptsForActiveTarget();
                return;
              }
            }

            const rect = dropZone.getBoundingClientRect();
            const worldCursorX = Math.round((e.clientX - rect.left - this.panX) / this.zoom);
            const worldCursorY = Math.round((e.clientY - rect.top - this.panY) / this.zoom);
            const bDims = this.getBlockDimensions(blockTemplate);
            const worldTopLeftX = worldCursorX - Math.round(bDims.w / 2);
            const worldTopLeftY = worldCursorY - Math.round(bDims.h / 2);

            let snap = this.findSnapTarget(blockTemplate, worldTopLeftX, worldTopLeftY, new Set());
            if (!snap) snap = this.findSnapTarget(blockTemplate, worldCursorX, worldCursorY, new Set());

            this.addBlockToWorkspace(blockTemplate, snap ? snap.snapX : worldTopLeftX, snap ? snap.snapY : worldTopLeftY, snap);
          }
        } catch (err) {}
      });
    }

    // Global mouse move & up listeners for canvas panning & placed block dragging
    window.addEventListener("mousemove", (e) => {
      if (this.isPanning) {
        this.panX = e.clientX - this.panStartX;
        this.panY = e.clientY - this.panStartY;
        this.updateWorkspaceTransform();
      } else if (this.draggedPlacedBlock) {
        const dp = this.draggedPlacedBlock;
        const dx = (e.clientX - dp.mouseStartX) / this.zoom;
        const dy = (e.clientY - dp.mouseStartY) / this.zoom;
        const moveDistSq = dx * dx + dy * dy;

        // Disconnect only after moving past drag threshold (4px)
        if (moveDistSq >= 16 && !dp.hasDisconnected) {
          dp.hasDisconnected = true;
          const block = dp.block;
          const scripts = this.getCurrentScripts();
          const isExtractSingle = dp.isExtractSingle;
          let detachedFromId = null;

          // Disconnect from upstream parent
          if (block.prevId) {
            detachedFromId = block.prevId;
            const parent = scripts.find(b => b.id === block.prevId);
            if (parent && parent.nextId === block.id) {
              parent.nextId = isExtractSingle ? (block.nextId || null) : null;
            }
            block.prevId = null;
          }
          if (block.parentCBlockId) {
            detachedFromId = block.parentCBlockId;
            const parentC = scripts.find(b => b.id === block.parentCBlockId);
            if (parentC && parentC.childId === block.id) {
              parentC.childId = isExtractSingle ? (block.nextId || null) : null;
            }
            block.parentCBlockId = null;
          }
          if (block.parentEBlockId) {
            detachedFromId = block.parentEBlockId;
            const parentE = scripts.find(b => b.id === block.parentEBlockId);
            if (parentE) {
              if (parentE.childId_if === block.id) parentE.childId_if = isExtractSingle ? (block.nextId || null) : null;
              if (parentE.childId_else === block.id) parentE.childId_else = isExtractSingle ? (block.nextId || null) : null;
            }
            block.parentEBlockId = null;
            block.parentEBranch = null;
          }

          // If extracting single block, bridge downstream block to old parent
          if (isExtractSingle && block.nextId) {
            const nextB = scripts.find(b => b.id === block.nextId);
            if (nextB) {
              nextB.prevId = detachedFromId;
            }
            block.nextId = null;
          }

          dp.detachedFromId = detachedFromId;

          // Mark dragging visually
          for (let i = 0; i < dp.stackItems.length; i++) {
            if (dp.stackItems[i].elt) dp.stackItems[i].elt.classList.add("dragging");
          }

          if (detachedFromId) {
            this.layoutConnectedStacks();
          }
        }

        if (dp.hasDisconnected) {
          const stackItems = dp.stackItems;
          const rootBlock = dp.block;

          for (let i = 0; i < stackItems.length; i++) {
            const item = stackItems[i];
            item.block.x = Math.round(item.initialX + dx);
            item.block.y = Math.round(item.initialY + dy);
            if (item.elt) {
              item.elt.style.left = `${item.block.x}px`;
              item.elt.style.top = `${item.block.y}px`;
            }
          }

          const snapTarget = this.findSnapTarget(
            rootBlock,
            rootBlock.x,
            rootBlock.y,
            dp.stackIds,
            dp.detachedFromId
          );
          this.activeSnapTarget = snapTarget;
          this.showSnapIndicator(snapTarget);

          const dropZoneEl = document.getElementById("code-drop-zone");
          if (dropZoneEl) {
            const rect = dropZoneEl.getBoundingClientRect();
            const isOutside = (
              e.clientX < rect.left ||
              e.clientX > rect.right ||
              e.clientY < rect.top ||
              e.clientY > rect.bottom
            );
            for (let i = 0; i < stackItems.length; i++) {
              if (stackItems[i].elt) {
                stackItems[i].elt.classList.toggle("delete-candidate", isOutside);
              }
            }
          }
        }
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        if (dropZone) dropZone.classList.remove("panning");
      }
      if (this.draggedPlacedBlock) {
        const dp = this.draggedPlacedBlock;

        if (!dp.hasDisconnected) {
          for (let i = 0; i < dp.stackItems.length; i++) {
            if (dp.stackItems[i].elt) {
              dp.stackItems[i].elt.classList.remove("dragging", "delete-candidate");
            }
          }
          this.draggedPlacedBlock = null;
          return;
        }

        const dropZoneEl = document.getElementById("code-drop-zone");
        let isOutside = false;
        if (dropZoneEl) {
          const rect = dropZoneEl.getBoundingClientRect();
          isOutside = (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          );
        }

        const stackItems = dp.stackItems;
        const rootBlock = dp.block;

        if (isOutside) {
          const scripts = this.getCurrentScripts();
          const idsToDelete = new Set(stackItems.map(item => item.block.id));
          const remaining = scripts.filter(b => !idsToDelete.has(b.id));
          scripts.length = 0;
          scripts.push(...remaining);
          this.renderScriptsForActiveTarget();
          SoundEngine.playAction("delete");
        } else if (this.activeSnapTarget) {
          const snap = this.activeSnapTarget;
          const shiftX = snap.snapX - rootBlock.x;
          const shiftY = snap.snapY - rootBlock.y;

          for (let i = 0; i < stackItems.length; i++) {
            const item = stackItems[i];
            item.block.x += shiftX;
            item.block.y += shiftY;
            if (item.elt) {
              item.elt.style.left = `${item.block.x}px`;
              item.elt.style.top = `${item.block.y}px`;
              item.elt.classList.remove("dragging", "delete-candidate");
            }
          }

          if (snap.position === "bottom") {
            const target = snap.target;
            const oldNextId = target.nextId;
            target.nextId = rootBlock.id;
            rootBlock.prevId = target.id;

            if (oldNextId) {
              const lastInStack = stackItems[stackItems.length - 1].block;
              lastInStack.nextId = oldNextId;
              const scripts = this.getCurrentScripts();
              const oldChild = scripts.find(b => b.id === oldNextId);
              if (oldChild) oldChild.prevId = lastInStack.id;
            }
          } else if (snap.position === "top") {
            const target = snap.target;
            const lastInStack = stackItems[stackItems.length - 1].block;
            if (target.prevId) {
              const scripts = this.getCurrentScripts();
              const targetParent = scripts.find(b => b.id === target.prevId);
              if (targetParent) {
                targetParent.nextId = rootBlock.id;
                rootBlock.prevId = targetParent.id;
              }
            }
            lastInStack.nextId = target.id;
            target.prevId = lastInStack.id;
          } else if (snap.position === "inside") {
            const oldChildId = snap.target.childId;
            snap.target.childId = rootBlock.id;
            rootBlock.parentCBlockId = snap.target.id;
            if (oldChildId && oldChildId !== rootBlock.id) {
              const lastInStack = stackItems[stackItems.length - 1].block;
              lastInStack.nextId = oldChildId;
              const scripts = this.getCurrentScripts();
              const oldChild = scripts.find(b => b.id === oldChildId);
              if (oldChild) oldChild.prevId = lastInStack.id;
            }
          } else if (snap.position === "inside_if") {
            const oldChildId = snap.target.childId_if;
            snap.target.childId_if = rootBlock.id;
            rootBlock.parentEBlockId = snap.target.id;
            rootBlock.parentEBranch = "if";
            if (oldChildId && oldChildId !== rootBlock.id) {
              const lastInStack = stackItems[stackItems.length - 1].block;
              lastInStack.nextId = oldChildId;
              const scripts = this.getCurrentScripts();
              const oldChild = scripts.find(b => b.id === oldChildId);
              if (oldChild) oldChild.prevId = lastInStack.id;
            }
          } else if (snap.position === "inside_else") {
            const oldChildId = snap.target.childId_else;
            snap.target.childId_else = rootBlock.id;
            rootBlock.parentEBlockId = snap.target.id;
            rootBlock.parentEBranch = "else";
            if (oldChildId && oldChildId !== rootBlock.id) {
              const lastInStack = stackItems[stackItems.length - 1].block;
              lastInStack.nextId = oldChildId;
              const scripts = this.getCurrentScripts();
              const oldChild = scripts.find(b => b.id === oldChildId);
              if (oldChild) oldChild.prevId = lastInStack.id;
            }
          } else if (snap.position === "condition") {
            const target = snap.target;
            target.conditionBlock = JSON.parse(JSON.stringify(rootBlock));
            delete target.conditionBlock.x;
            delete target.conditionBlock.y;
            delete target.conditionBlock.nextId;
            delete target.conditionBlock.prevId;

            const scripts = this.getCurrentScripts();
            const idsToDelete = new Set(stackItems.map(item => item.block.id));
            const remaining = scripts.filter(b => !idsToDelete.has(b.id));
            scripts.length = 0;
            scripts.push(...remaining);
          } else if (snap.position === "left_condition") {
            const target = snap.target;
            target.leftConditionBlock = JSON.parse(JSON.stringify(rootBlock));
            delete target.leftConditionBlock.x;
            delete target.leftConditionBlock.y;
            delete target.leftConditionBlock.nextId;
            delete target.leftConditionBlock.prevId;

            const scripts = this.getCurrentScripts();
            const idsToDelete = new Set(stackItems.map(item => item.block.id));
            const remaining = scripts.filter(b => !idsToDelete.has(b.id));
            scripts.length = 0;
            scripts.push(...remaining);
          } else if (snap.position === "right_condition") {
            const target = snap.target;
            target.rightConditionBlock = JSON.parse(JSON.stringify(rootBlock));
            delete target.rightConditionBlock.x;
            delete target.rightConditionBlock.y;
            delete target.rightConditionBlock.nextId;
            delete target.rightConditionBlock.prevId;

            const scripts = this.getCurrentScripts();
            const idsToDelete = new Set(stackItems.map(item => item.block.id));
            const remaining = scripts.filter(b => !idsToDelete.has(b.id));
            scripts.length = 0;
            scripts.push(...remaining);
          }

          SoundEngine.playChiptuneTone(880, "triangle", 0.04, 0.15);
          setTimeout(() => SoundEngine.playChiptuneTone(1174, "triangle", 0.06, 0.15), 40);

          this.renderScriptsForActiveTarget();
        } else {
          for (let i = 0; i < stackItems.length; i++) {
            if (stackItems[i].elt) {
              stackItems[i].elt.classList.remove("dragging", "delete-candidate");
            }
          }
          SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
          this.renderScriptsForActiveTarget();
        }

        this.showSnapIndicator(null);
        this.activeSnapTarget = null;
        this.draggedPlacedBlock = null;
      }
    });

    // 4. Zoom & Center Controls
    const btnZoomIn = document.getElementById("btn-code-zoom-in");
    const btnZoomOut = document.getElementById("btn-code-zoom-out");
    const btnCenter = document.getElementById("btn-code-center");

    if (btnZoomIn) {
      btnZoomIn.addEventListener("click", () => {
        this.zoom = Math.min(2.5, this.zoom * 1.2);
        this.updateWorkspaceTransform();
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener("click", () => {
        this.zoom = Math.max(0.35, this.zoom / 1.2);
        this.updateWorkspaceTransform();
      });
    }
    if (btnCenter) {
      btnCenter.addEventListener("click", () => {
        this.panX = 40;
        this.panY = 40;
        this.zoom = 1.0;
        this.updateWorkspaceTransform();
        SoundEngine.playChiptuneTone(600, "sine", 0.05, 0.08);
      });
    }

    // 5. Clear buttons
    const btnClear = document.getElementById("btn-code-clear");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        const scripts = this.getCurrentScripts();
        scripts.length = 0;
        this.renderScriptsForActiveTarget();
        SoundEngine.playAction("delete");
      });
    }

    this.selectCategory("events");
    this.updateWorkspaceTransform();
  },

  updateWorkspaceTransform() {
    const workspace = document.getElementById("code-workspace-blocks");
    const dropZone = document.getElementById("code-drop-zone");
    const zoomLabel = document.getElementById("code-zoom-level");

    if (workspace) {
      workspace.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
      workspace.style.transformOrigin = "0 0";
    }

    if (dropZone) {
      const bgSize = 24 * this.zoom;
      dropZone.style.backgroundPosition = `${this.panX}px ${this.panY}px`;
      dropZone.style.backgroundSize = `${bgSize}px ${bgSize}px`;
    }

    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(this.zoom * 100)}%`;
    }
  },

  setMode(mode, force = false) {
    if (!force && this.currentMode === mode) return;
    this.currentMode = mode;

    const btnCanvas = document.getElementById("btn-mode-canvas");
    const btnCode = document.getElementById("btn-mode-code");
    const controlsPane = document.getElementById("controls-pane");
    const codeToolboxPane = document.getElementById("code-toolbox-pane");
    const codeStageLayout = document.getElementById("code-stage-layout");
    const canvasContainer = document.getElementById("canvas-container");
    const stagePane = document.getElementById("stage-pane");
    const codePreviewBox = document.getElementById("code-preview-canvas-box");
    const floatingDock = document.getElementById("floating-dock");
    const cropBar = document.getElementById("floating-crop-bar");
    const spritePanel = document.getElementById("floating-sprite-poses-panel");

    if (btnCanvas) btnCanvas.classList.toggle("active", mode === "canvas");
    if (btnCode) btnCode.classList.toggle("active", mode === "code");

    const mobileBtnCanvas = document.getElementById("btn-mobile-nav-canvas");
    const mobileBtnCode = document.getElementById("btn-mobile-nav-code");
    const mobileBtnPlay = document.getElementById("btn-mobile-nav-play");
    if (mobileBtnCanvas) mobileBtnCanvas.classList.toggle("active", mode === "canvas");
    if (mobileBtnCode) mobileBtnCode.classList.toggle("active", mode === "code");
    if (mobileBtnPlay) mobileBtnPlay.classList.toggle("active", mode === "play");

    if (typeof MobileNavigationController !== "undefined") {
      MobileNavigationController.closeDrawer();
    }

    if (mode === "code") {
      document.body.classList.add("mode-code");
      document.body.classList.remove("mode-canvas");

      // Reset Section 2 preview camera to auto-fit
      PreviewConfig.reset();

      const isMobile = window.innerWidth <= 860;

      // Hide canvas left drawer, show code toolbox
      if (isMobile) {
        if (controlsPane) {
          controlsPane.style.removeProperty("display");
          controlsPane.style.removeProperty("width");
        }
        if (codeToolboxPane) {
          codeToolboxPane.style.removeProperty("display");
          codeToolboxPane.style.removeProperty("width");
        }
      } else {
        if (controlsPane) controlsPane.style.display = "none";
        if (codeToolboxPane) {
          codeToolboxPane.style.display = "flex";
          const savedCodeWidth = localStorage.getItem("unifive_code_split_width");
          codeToolboxPane.style.width = savedCodeWidth && parseInt(savedCodeWidth) >= 360 ? savedCodeWidth : "410px";
        }
      }

      // Show 3-section layout
      if (codeStageLayout) codeStageLayout.style.display = isMobile ? "block" : "flex";

      // Reparent canvas-container to Section 2 preview box
      if (canvasContainer && codePreviewBox) {
        codePreviewBox.appendChild(canvasContainer);
      }

      // Hide floating canvas dock / crop / sprite poses
      if (floatingDock) floatingDock.style.display = "none";
      if (cropBar) cropBar.style.display = "none";
      if (spritePanel) spritePanel.style.display = "none";

      SoundEngine.playChiptuneTone(520, "sine", 0.08, 0.1);

      this.renderObjectsList();
      this.updateTargetBadge();
      this.renderScriptsForActiveTarget();
      this.updateWorkspaceTransform();
    } else {
      document.body.classList.remove("mode-code");
      document.body.classList.add("mode-canvas");

      // Stop scripts execution when returning to canvas mode if needed
      if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
        CodeRuntimeEngine.stopAll();
      }

      const isMobile = window.innerWidth <= 860;

      // Show canvas left drawer, hide code toolbox
      if (isMobile) {
        if (controlsPane) {
          controlsPane.style.removeProperty("display");
          controlsPane.style.removeProperty("width");
        }
        if (codeToolboxPane) {
          codeToolboxPane.style.removeProperty("display");
          codeToolboxPane.style.removeProperty("width");
        }
      } else {
        if (controlsPane) {
          controlsPane.style.display = "flex";
          const savedWidth = localStorage.getItem("unifive_split_width");
          if (savedWidth) controlsPane.style.width = savedWidth;
        }
        if (codeToolboxPane) codeToolboxPane.style.display = "none";
      }

      // Hide 3-section layout
      if (codeStageLayout) codeStageLayout.style.display = "none";

      // Reparent canvas-container back to stage-pane
      if (canvasContainer && stagePane) {
        stagePane.insertBefore(canvasContainer, stagePane.firstChild);
      }

      // Restore floating dock
      if (floatingDock) floatingDock.style.display = "flex";

      // Re-show sprite poses panel if sprite selected
      const sel = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
      if (sel && (sel.type === "sprite" || sel.poses || (sel.assetId && sel.assetId.startsWith("sprite_")))) {
        if (typeof SpritePosesController !== "undefined") {
          SpritePosesController.show(sel);
        }
      }

      WorldConfig.clampPan();
      SoundEngine.playChiptuneTone(440, "sine", 0.08, 0.1);
    }

    // Trigger canvas dimension recalculation & redraw
    setTimeout(() => {
      resizeStageCanvas();
      if (this.currentMode === "canvas") {
        WorldConfig.clampPan();
      }
    }, 60);
  },

  isCodeMode() {
    return this.currentMode === "code";
  },

  selectCategory(catKey) {
    this.activeCategory = catKey;
    const catButtons = document.querySelectorAll(".code-cat-btn");
    catButtons.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-category") === catKey);
    });

    const catDot = document.getElementById("code-palette-cat-dot");
    const catTitle = document.getElementById("code-palette-title");
    const catCount = document.getElementById("code-palette-count");
    const blocksList = document.getElementById("code-blocks-list");

    const targetInfo = this.getActiveTargetInfo();
    const allBlocks = this.categories[catKey] || [];
    const blocks = allBlocks.filter(b => this.isBlockAvailableForTarget(b, targetInfo));

    const catBtn = document.querySelector(`.code-cat-btn[data-category="${catKey}"]`);
    const catColor = catBtn ? catBtn.style.getPropertyValue("--cat-color") : "#f59e0b";

    if (catDot) catDot.style.backgroundColor = catColor;
    if (catTitle) catTitle.textContent = catKey.toUpperCase();
    if (catCount) catCount.textContent = `${blocks.length} ${blocks.length === 1 ? 'BLOCK' : 'BLOCKS'}`;

    if (!blocksList) return;
    blocksList.innerHTML = "";

    // If VARIABLES category: Render + MAKE A VARIABLE button & Variable List
    if (catKey === "variables") {
      const makeVarBtn = document.createElement("button");
      makeVarBtn.className = "btn-make-variable";
      makeVarBtn.innerHTML = '<i class="ph ph-plus-circle"></i><span>MAKE A VARIABLE</span>';
      makeVarBtn.addEventListener("click", () => VariableManager.openModal());
      blocksList.appendChild(makeVarBtn);

      const varsSection = document.createElement("div");
      varsSection.className = "vars-list-section";

      VariableManager.variables.forEach(v => {
        const row = document.createElement("div");
        row.className = "var-item-row";

        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.className = "var-checkbox-custom";
        chk.checked = v.showWatcher;
        chk.title = "Toggle watcher on stage";
        chk.addEventListener("change", (e) => {
          v.showWatcher = e.target.checked;
          SoundEngine.playChiptuneTone(v.showWatcher ? 640 : 360, "square", 0.04, 0.08);
        });

        const pill = document.createElement("div");
        pill.className = "var-reporter-pill";
        pill.textContent = v.name;
        pill.title = `Variable: ${v.name} (Value: ${v.value})`;

        row.appendChild(chk);
        row.appendChild(pill);

        if (v.name !== "score") {
          const delBtn = document.createElement("button");
          delBtn.className = "var-delete-btn";
          delBtn.innerHTML = '<i class="ph ph-trash"></i>';
          delBtn.title = `Delete variable '${v.name}'`;
          delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            VariableManager.deleteVariable(v.id);
            SoundEngine.playAction("delete");
          });
          row.appendChild(delBtn);
        }

        varsSection.appendChild(row);
      });

      blocksList.appendChild(varsSection);
    }

    if (blocks.length === 0 && catKey !== "variables") {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "code-palette-empty-category";
      emptyDiv.innerHTML = `
        <i class="ph ph-prohibit"></i>
        <span>NO <strong>${catKey.toUpperCase()}</strong> BLOCKS</span>
        <small>${targetInfo.isStage ? "Motion & character blocks are not applicable to the global stage backdrop. Select an object or character on the canvas to use them." : "These blocks are only available for animated character sprites."}</small>
      `;
      blocksList.appendChild(emptyDiv);
      return;
    }

    blocks.forEach(block => {
      const blockEl = this.createBlockElement(block, false);

      // Drag block from palette to infinite workspace
      blockEl.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();

        const ghost = this.createBlockElement(block, false);
        ghost.classList.add("code-drag-ghost");
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
        document.body.appendChild(ghost);

        let hasMoved = false;

        const onMove = (moveEv) => {
          hasMoved = true;
          ghost.style.left = `${moveEv.clientX}px`;
          ghost.style.top = `${moveEv.clientY}px`;

          const dropZone = document.getElementById("code-drop-zone");
          if (dropZone) {
            const rect = dropZone.getBoundingClientRect();
            if (
              moveEv.clientX >= rect.left &&
              moveEv.clientX <= rect.right &&
              moveEv.clientY >= rect.top &&
              moveEv.clientY <= rect.bottom
            ) {
              const bDims = this.getBlockDimensions(block);
              const worldCursorX = Math.round((moveEv.clientX - rect.left - this.panX) / this.zoom);
              const worldCursorY = Math.round((moveEv.clientY - rect.top - this.panY) / this.zoom);

              const worldTopLeftX = worldCursorX - Math.round(bDims.w / 2);
              const worldTopLeftY = worldCursorY - Math.round(bDims.h / 2);

              let snap = this.findSnapTarget(block, worldTopLeftX, worldTopLeftY, new Set());
              if (!snap) {
                snap = this.findSnapTarget(block, worldCursorX, worldCursorY, new Set());
              }
              this.activePaletteSnap = snap;
              this.showSnapIndicator(snap);
            } else {
              this.activePaletteSnap = null;
              this.showSnapIndicator(null);
            }
          }
        };

        const onUp = (upEv) => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
          this.showSnapIndicator(null);

          const dropZone = document.getElementById("code-drop-zone");
          if (!dropZone) return;
          const rect = dropZone.getBoundingClientRect();

          if (!hasMoved) {
            const spawnX = Math.round((-this.panX + rect.width / 2 - 80) / this.zoom + (Math.random() * 40 - 20));
            const spawnY = Math.round((-this.panY + rect.height / 2 - 20) / this.zoom + (Math.random() * 40 - 20));
            this.addBlockToWorkspace(block, spawnX, spawnY);
          } else if (
            upEv.clientX >= rect.left &&
            upEv.clientX <= rect.right &&
            upEv.clientY >= rect.top &&
            upEv.clientY <= rect.bottom
          ) {
            if (this.activePaletteSnap) {
              const snap = this.activePaletteSnap;
              this.addBlockToWorkspace(block, snap.snapX, snap.snapY, snap);
              SoundEngine.playChiptuneTone(880, "triangle", 0.04, 0.15);
              setTimeout(() => SoundEngine.playChiptuneTone(1174, "triangle", 0.06, 0.15), 40);
            } else {
              const bDims = this.getBlockDimensions(block);
              const worldX = Math.round((upEv.clientX - rect.left - this.panX) / this.zoom) - Math.round(bDims.w / 2);
              const worldY = Math.round((upEv.clientY - rect.top - this.panY) / this.zoom) - Math.round(bDims.h / 2);
              this.addBlockToWorkspace(block, worldX, worldY);
            }
          }
          this.activePaletteSnap = null;
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      });

      blocksList.appendChild(blockEl);
    });
  },

  addBlockToWorkspace(blockTemplate, x = 60, y = 60, snapTarget = null) {
    const scripts = this.getCurrentScripts();
    const placedBlock = {
      id: "block_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      blockId: blockTemplate.id || blockTemplate.blockId,
      name: blockTemplate.name,
      hat: !!blockTemplate.hat,
      cap: !!blockTemplate.cap,
      c_block: !!blockTemplate.c_block,
      e_block: !!blockTemplate.e_block,
      isReporter: !!(blockTemplate.isReporter || blockTemplate.reporter),
      isBoolean: !!(blockTemplate.isBoolean || blockTemplate.boolean || blockTemplate.color === "#0284c7" || (blockTemplate.id && blockTemplate.id.startsWith("op_") && (blockTemplate.isBoolean || blockTemplate.opType === ">" || blockTemplate.opType === "<" || blockTemplate.opType === "=" || blockTemplate.opType === "contains" || blockTemplate.isLogical))),
      isLogical: !!blockTemplate.isLogical,
      opType: blockTemplate.opType || null,
      isRandom: !!blockTemplate.isRandom,
      isConditionBlock: !!blockTemplate.isConditionBlock,
      isTouchingSelector: !!blockTemplate.isTouchingSelector,
      isDistanceSelector: !!blockTemplate.isDistanceSelector,
      isPlayableCharSelector: !!blockTemplate.isPlayableCharSelector,
      options: blockTemplate.options ? [...blockTemplate.options] : null,
      isVarSetter: !!blockTemplate.isVarSetter,
      isVarChanger: !!blockTemplate.isVarChanger,
      isVarSelector: !!blockTemplate.isVarSelector,
      color: blockTemplate.color,
      icon: blockTemplate.icon,
      x: x,
      y: y,
      inputs: blockTemplate.inputs ? [...blockTemplate.inputs] : [],
      nextId: null,
      prevId: null,
      childId: null,
      childId_if: null,
      childId_else: null
    };

    if (snapTarget && snapTarget.target) {
      if (snapTarget.position === "condition") {
        snapTarget.target.conditionBlock = JSON.parse(JSON.stringify(placedBlock));
        delete snapTarget.target.conditionBlock.x;
        delete snapTarget.target.conditionBlock.y;
        delete snapTarget.target.conditionBlock.nextId;
        delete snapTarget.target.conditionBlock.prevId;
        this.renderScriptsForActiveTarget();
        return;
      }
      if (snapTarget.position === "left_condition") {
        snapTarget.target.leftConditionBlock = JSON.parse(JSON.stringify(placedBlock));
        delete snapTarget.target.leftConditionBlock.x;
        delete snapTarget.target.leftConditionBlock.y;
        delete snapTarget.target.leftConditionBlock.nextId;
        delete snapTarget.target.leftConditionBlock.prevId;
        this.renderScriptsForActiveTarget();
        return;
      }
      if (snapTarget.position === "right_condition") {
        snapTarget.target.rightConditionBlock = JSON.parse(JSON.stringify(placedBlock));
        delete snapTarget.target.rightConditionBlock.x;
        delete snapTarget.target.rightConditionBlock.y;
        delete snapTarget.target.rightConditionBlock.nextId;
        delete snapTarget.target.rightConditionBlock.prevId;
        this.renderScriptsForActiveTarget();
        return;
      }
      if (snapTarget.position === "bottom") {
        const target = snapTarget.target;
        const oldNextId = target.nextId;
        target.nextId = placedBlock.id;
        placedBlock.prevId = target.id;
        if (oldNextId) {
          placedBlock.nextId = oldNextId;
          const oldChild = scripts.find(b => b.id === oldNextId);
          if (oldChild) oldChild.prevId = placedBlock.id;
        }
      } else if (snapTarget.position === "top") {
        const target = snapTarget.target;
        if (target.prevId) {
          const parent = scripts.find(b => b.id === target.prevId);
          if (parent) {
            parent.nextId = placedBlock.id;
            placedBlock.prevId = parent.id;
          }
        }
        placedBlock.nextId = target.id;
        target.prevId = placedBlock.id;
      } else if (snapTarget.position === "inside") {
        const oldChildId = snapTarget.target.childId;
        snapTarget.target.childId = placedBlock.id;
        placedBlock.parentCBlockId = snapTarget.target.id;
        if (oldChildId && oldChildId !== placedBlock.id) {
          placedBlock.nextId = oldChildId;
          const oldChild = scripts.find(b => b.id === oldChildId);
          if (oldChild) oldChild.prevId = placedBlock.id;
        }
      } else if (snapTarget.position === "inside_if") {
        const oldChildId = snapTarget.target.childId_if;
        snapTarget.target.childId_if = placedBlock.id;
        placedBlock.parentEBlockId = snapTarget.target.id;
        placedBlock.parentEBranch = "if";
        if (oldChildId && oldChildId !== placedBlock.id) {
          placedBlock.nextId = oldChildId;
          const oldChild = scripts.find(b => b.id === oldChildId);
          if (oldChild) oldChild.prevId = placedBlock.id;
        }
      } else if (snapTarget.position === "inside_else") {
        const oldChildId = snapTarget.target.childId_else;
        snapTarget.target.childId_else = placedBlock.id;
        placedBlock.parentEBlockId = snapTarget.target.id;
        placedBlock.parentEBranch = "else";
        if (oldChildId && oldChildId !== placedBlock.id) {
          placedBlock.nextId = oldChildId;
          const oldChild = scripts.find(b => b.id === oldChildId);
          if (oldChild) oldChild.prevId = placedBlock.id;
        }
      }
    }

    scripts.push(placedBlock);
    this.renderScriptsForActiveTarget();
    if (!snapTarget) {
      SoundEngine.playChiptuneTone(680, "square", 0.05, 0.08);
    }
  },

  deleteSingleBlock(blockId) {
    const scripts = this.getCurrentScripts();
    const idx = scripts.findIndex(b => b.id === blockId);
    if (idx === -1) return;

    const block = scripts[idx];
    const prevBlock = block.prevId ? scripts.find(b => b.id === block.prevId) : null;
    const nextBlock = block.nextId ? scripts.find(b => b.id === block.nextId) : null;
    const parentC = block.parentCBlockId ? scripts.find(b => b.id === block.parentCBlockId) : null;
    const parentE = block.parentEBlockId ? scripts.find(b => b.id === block.parentEBlockId) : null;

    // Bridge the parent to the next block (or null)
    if (prevBlock && prevBlock.nextId === block.id) {
      prevBlock.nextId = nextBlock ? nextBlock.id : null;
    }
    if (parentC && parentC.childId === block.id) {
      parentC.childId = nextBlock ? nextBlock.id : null;
    }
    if (parentE) {
      if (parentE.childId_if === block.id) {
        parentE.childId_if = nextBlock ? nextBlock.id : null;
      }
      if (parentE.childId_else === block.id) {
        parentE.childId_else = nextBlock ? nextBlock.id : null;
      }
    }

    // Bridge the next block to the parent
    if (nextBlock) {
      nextBlock.prevId = prevBlock ? prevBlock.id : null;
      nextBlock.parentCBlockId = prevBlock ? (prevBlock.parentCBlockId || null) : (parentC ? parentC.id : null);
      nextBlock.parentEBlockId = prevBlock ? (prevBlock.parentEBlockId || null) : (parentE ? parentE.id : null);
      nextBlock.parentEBranch = prevBlock ? (prevBlock.parentEBranch || null) : (parentE ? block.parentEBranch : null);

      if (!prevBlock && !parentC && !parentE) {
        nextBlock.x = block.x;
        nextBlock.y = block.y;
      }
    }

    // Remove ONLY this single block from the scripts array
    scripts.splice(idx, 1);
    this.renderScriptsForActiveTarget();
    SoundEngine.playAction("delete");
  },

  renderScriptsForActiveTarget() {
    const workspace = document.getElementById("code-workspace-blocks");
    const emptyState = document.getElementById("code-workspace-empty");
    if (!workspace) return;

    const scripts = this.getCurrentScripts();
    if (typeof U5Compiler !== "undefined") U5Compiler.updateStats();

    if (scripts.length === 0) {
      workspace.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    workspace.innerHTML = "";

    scripts.forEach((block) => {
      const blockEl = this.createBlockElement(block, true);
      blockEl.style.left = `${block.x}px`;
      blockEl.style.top = `${block.y}px`;

      // Delete single block button
      const deleteBtn = blockEl.querySelector(".code-block-delete-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.deleteSingleBlock(block.id);
        });
      }

      // Drag to move placed block and its connected stack freely anywhere on the canvas
      blockEl.addEventListener("mousedown", (e) => {
        if (e.target.closest(".code-block-delete-btn") || e.target.closest(".code-block-input") || e.target.closest(".code-block-select") || e.target.closest(".nested-block-eject-btn")) {
          return;
        }
        e.stopPropagation();

        const isExtractSingle = e.altKey || e.shiftKey;
        const stack = isExtractSingle ? [block] : this.getConnectedStack(block);
        const stackItems = stack.map(b => {
          const el = this.getBlockElement(b.id);
          return {
            block: b,
            elt: el,
            initialX: b.x,
            initialY: b.y
          };
        });

        this.draggedPlacedBlock = {
          block: block,
          elt: blockEl,
          stack: stack,
          stackItems: stackItems,
          stackIds: new Set(stack.map(b => b.id)),
          mouseStartX: e.clientX,
          mouseStartY: e.clientY,
          initialX: block.x,
          initialY: block.y,
          isExtractSingle: isExtractSingle,
          hasDisconnected: false,
          detachedFromId: null
        };
      });

      workspace.appendChild(blockEl);
    });

    // Automatically align all connected block chains and nested C/E loops flush
    this.layoutConnectedStacks();
    requestAnimationFrame(() => this.layoutConnectedStacks());
  },

  layoutConnectedStacks() {
    const scripts = this.getCurrentScripts();
    if (!scripts || scripts.length === 0) return;

    const map = new Map(scripts.map(b => [b.id, b]));
    const visited = new Set();

    // Find root blocks (blocks with no parent above or enclosing them)
    const roots = scripts.filter(b => !b.prevId && !b.parentCBlockId && !b.parentEBlockId);

    const layoutNode = (node, curX, curY) => {
      if (!node || visited.has(node.id)) return;
      visited.add(node.id);

      curX = typeof curX === "number" && !isNaN(curX) ? curX : 60;
      curY = typeof curY === "number" && !isNaN(curY) ? curY : 60;

      node.x = curX;
      node.y = curY;

      const el = this.getBlockElement(node.id);
      if (el) {
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
      }

      if (node.c_block) {
        const bodyH = this.getBranchHeight(node.childId, map);
        if (el) {
          const bodyEl = el.querySelector(".c-block-body");
          if (bodyEl) {
            bodyEl.style.height = `${bodyH}px`;
            bodyEl.style.minHeight = `${bodyH}px`;
          }
        }
        // Layout inner C-block children
        if (node.childId && map.has(node.childId)) {
          let childNode = map.get(node.childId);
          let childY = curY + 32;
          while (childNode && !visited.has(childNode.id)) {
            layoutNode(childNode, curX + 16, childY);
            const childDims = this.getBlockDimensions(childNode);
            childY += childDims.h - 2;
            childNode = childNode.nextId ? map.get(childNode.nextId) : null;
          }
        }
      } else if (node.e_block) {
        const ifBodyH = this.getBranchHeight(node.childId_if, map);
        const elseBodyH = this.getBranchHeight(node.childId_else, map);
        if (el) {
          const bodyIfEl = el.querySelector(".e-block-body-if");
          if (bodyIfEl) {
            bodyIfEl.style.height = `${ifBodyH}px`;
            bodyIfEl.style.minHeight = `${ifBodyH}px`;
          }
          const bodyElseEl = el.querySelector(".e-block-body-else");
          if (bodyElseEl) {
            bodyElseEl.style.height = `${elseBodyH}px`;
            bodyElseEl.style.minHeight = `${elseBodyH}px`;
          }
        }
        // Layout inner If-branch children
        if (node.childId_if && map.has(node.childId_if)) {
          let childNode = map.get(node.childId_if);
          let childY = curY + 32;
          while (childNode && !visited.has(childNode.id)) {
            layoutNode(childNode, curX + 16, childY);
            const childDims = this.getBlockDimensions(childNode);
            childY += childDims.h - 2;
            childNode = childNode.nextId ? map.get(childNode.nextId) : null;
          }
        }
        // Layout inner Else-branch children
        if (node.childId_else && map.has(node.childId_else)) {
          let childNode = map.get(node.childId_else);
          let childY = curY + 32 + ifBodyH + 24;
          while (childNode && !visited.has(childNode.id)) {
            layoutNode(childNode, curX + 16, childY);
            const childDims = this.getBlockDimensions(childNode);
            childY += childDims.h - 2;
            childNode = childNode.nextId ? map.get(childNode.nextId) : null;
          }
        }
      }

      // Layout downstream connected next block (attached to bottom footer of this block)
      if (node.nextId && map.has(node.nextId)) {
        const nextNode = map.get(node.nextId);
        const fullH = this.getFullBlockHeight(node, map);
        const nextY = curY + fullH - 2;
        layoutNode(nextNode, curX, nextY);
      }
    };

    roots.forEach(root => {
      layoutNode(root, root.x, root.y);
    });

    // Fallback for any unvisited blocks
    scripts.forEach(b => {
      if (!visited.has(b.id)) {
        layoutNode(b, b.x, b.y);
      }
    });
  },

  updateTargetBadge() {
    const targetBadge = document.getElementById("code-target-badge");
    const targetName = document.getElementById("code-target-name");
    const targetIcon = document.getElementById("code-target-icon");

    const sel = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (sel) {
      if (targetName) targetName.textContent = sel.name.toUpperCase();
      if (targetIcon) {
        if (sel.type === "sprite" || (sel.assetId && sel.assetId.startsWith("sprite_"))) {
          targetIcon.className = "ph ph-person-simple-walk";
        } else {
          targetIcon.className = "ph ph-cube";
        }
      }
    } else {
      if (targetName) targetName.textContent = "STAGE (GLOBAL)";
      if (targetIcon) targetIcon.className = "ph ph-globe";
    }

    this.renderScriptsForActiveTarget();
    this.selectCategory(this.activeCategory || "events");
  },

  renderObjectsList() {
    const listEl = document.getElementById("code-objects-list");
    const countBadge = document.getElementById("code-objects-count-badge");
    if (!listEl) return;

    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) {
      listEl.innerHTML = "";
      return;
    }

    const items = WorldObjectsManager.items;
    if (countBadge) countBadge.textContent = `${items.length} ${items.length === 1 ? 'OBJECT' : 'OBJECTS'}`;

    if (items.length === 0) {
      listEl.innerHTML = `
        <div class="code-objects-empty">
          <i class="ph ph-cube"></i>
          <span>No objects on canvas</span>
          <small>Switch to Canvas mode to add sprites and props</small>
        </div>
      `;
      return;
    }

    listEl.innerHTML = "";

    // 1. Stage Card (Global Target)
    const isStageSelected = !WorldObjectsManager.selectedId;
    const stageCard = document.createElement("div");
    stageCard.className = `code-object-card ${isStageSelected ? 'active' : ''}`;
    stageCard.innerHTML = `
      <div class="code-obj-thumb-box" style="background-color: #1e1b4b; display: flex; align-items: center; justify-content: center;">
        <i class="ph ph-globe" style="font-size: 1.3rem; color: #a5b4fc;"></i>
      </div>
      <div class="code-obj-info">
        <div class="code-obj-title-row">
          <span class="code-obj-name">GLOBAL STAGE</span>
          <span class="code-obj-type-tag" style="background-color: #312e81; color: #c7d2fe; border-color: #4338ca;">BACKDROP</span>
        </div>
        <div class="code-obj-coords-row">
          <span class="code-obj-coord">World: <strong>5760x1080</strong></span>
          <span class="code-obj-coord">Global Scripts</span>
        </div>
      </div>
    `;
    stageCard.addEventListener("click", () => {
      WorldObjectsManager.selectedId = null;
      this.renderObjectsList();
      this.updateTargetBadge();
      SoundEngine.playAction("select");
    });
    listEl.appendChild(stageCard);

    // 2. Placed Canvas Items (Sprites & Props)
    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = `code-object-card ${item.id === WorldObjectsManager.selectedId ? 'active' : ''}`;
      card.setAttribute("data-id", item.id);

      const isSprite = item.type === "sprite" || (item.assetId && item.assetId.startsWith("sprite_")) || item.poses;
      const typeLabel = isSprite ? "SPRITE" : (item.type || "PROP");

      card.innerHTML = `
        <div class="code-obj-thumb-box">
          <img class="code-obj-thumb-img" src="${item.thumb || item.src}" alt="${item.name}">
        </div>
        <div class="code-obj-info">
          <div class="code-obj-title-row">
            <span class="code-obj-name" title="${item.name}">${item.name}</span>
            ${item.isPlayable ? '<span class="code-obj-hero-badge" title="Designated Playable Character"><i class="ph ph-crown"></i> HERO</span>' : ''}
            ${item.isSolid ? '<span class="code-obj-solid-badge" title="Solid Obstacle"><i class="ph ph-shield"></i> SOLID</span>' : ''}
            <span class="code-obj-type-tag">${typeLabel}</span>
          </div>
          <div class="code-obj-coords-row">
            <span class="code-obj-coord">X: <strong>${Math.round(item.x)}</strong></span>
            <span class="code-obj-coord">Y: <strong>${Math.round(item.y)}</strong></span>
            <span class="code-obj-coord">L: <strong>#${index + 1}</strong></span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        if (WorldObjectsManager.selectedId === item.id) {
          WorldObjectsManager.selectedId = null;
        } else {
          WorldObjectsManager.selectItem(item.id);
        }
        this.renderObjectsList();
        this.updateTargetBadge();
        SoundEngine.playAction("select");
      });

      listEl.appendChild(card);
    });
  }
};

// ============================================================================
// 12. CODE RUNTIME ENGINE & BLOCK INTERPRETER
// ============================================================================