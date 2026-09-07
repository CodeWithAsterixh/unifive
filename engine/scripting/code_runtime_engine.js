const CodeRuntimeEngine = {
  isRunning: false,
  activeThreads: [],

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  init() {
    const btnRun = document.getElementById("btn-code-run");
    if (btnRun) {
      btnRun.addEventListener("click", () => this.toggleRun());
    }

    // Spacebar listener for 'when [space] key pressed'
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.contentEditable === "true") return;
      if (this.isRunning) {
        const keyName = e.code === "Space" ? "space" : e.key.toLowerCase();
        this.triggerEvent("when_key", keyName);
      }
    });
  },

  toggleRun() {
    if (this.isRunning) {
      this.stopAll();
    } else {
      this.start("when_flag");
    }
  },

  start(trigger = "when_flag", arg = null) {
    this.isRunning = true;
    this.updateRunButtonUI(true);

    SoundEngine.playChiptuneTone(523, "square", 0.08, 0.12);
    setTimeout(() => SoundEngine.playChiptuneTone(659, "square", 0.08, 0.12), 60);
    setTimeout(() => SoundEngine.playChiptuneTone(784, "square", 0.12, 0.15), 120);

    this.triggerEvent(trigger, arg);
  },

  stopAll() {
    this.isRunning = false;
    this.activeThreads = [];
    this.updateRunButtonUI(false);

    document.querySelectorAll(".code-block-item.executing-halo").forEach(el => {
      el.classList.remove("executing-halo");
    });

    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
      WorldObjectsManager.items.forEach(it => {
        if (it.speechBubble) delete it.speechBubble;
      });
    }

    SoundEngine.playChiptuneTone(330, "square", 0.08, 0.12);
    setTimeout(() => SoundEngine.playChiptuneTone(220, "square", 0.12, 0.12), 70);
  },

  updateRunButtonUI(running) {
    const btnRun = document.getElementById("btn-code-run");
    if (!btnRun) return;
    if (running) {
      btnRun.classList.remove("btn-run");
      btnRun.classList.add("btn-stop");
      btnRun.innerHTML = '<i class="ph ph-stop-fill"></i><span>STOP</span>';
    } else {
      btnRun.classList.remove("btn-stop");
      btnRun.classList.add("btn-run");
      btnRun.innerHTML = '<i class="ph ph-play-fill"></i><span>RUN</span>';
    }
  },

  triggerEvent(triggerType, eventArg = null, specificTargetId = null) {
    if (!this.isRunning) return;

    const allTargets = specificTargetId ? [specificTargetId] : Object.keys(AppModeController.objectScripts || {});
    const activeTargetId = AppModeController.getActiveTargetId();
    if (!specificTargetId && !allTargets.includes(activeTargetId)) allTargets.push(activeTargetId);

    allTargets.forEach(targetId => {
      const scripts = AppModeController.objectScripts[targetId] || [];
      const targetItem = typeof WorldObjectsManager !== "undefined"
        ? WorldObjectsManager.items.find(it => it.id === targetId)
        : null;

      scripts.forEach(block => {
        if (this.isEventHatMatch(block, triggerType, eventArg)) {
          this.launchThread(block, targetItem, targetId);
        }
      });
    });
  },

  isEventHatMatch(block, triggerType, eventArg) {
    if (triggerType === "when_flag") {
      if (block.blockId === "when_flag") return true;
      // Allow root orphan command blocks (standalone blocks without a hat) to run on flag start
      if (!block.prevId && !block.blockId.startsWith("when_") && !block.parentCBlockId && !block.parentEBlockId) return true;
    }
    if (triggerType === "when_clicked" && block.blockId === "when_clicked") return true;
    if (triggerType === "when_became_playable" && block.blockId === "when_became_playable") return true;
    if (triggerType === "when_key" && block.blockId === "when_key") {
      const inputVal = this.getBlockInput(block, 0) || "space";
      if (inputVal.toLowerCase() === (eventArg || "").toLowerCase() || inputVal.toLowerCase() === "any") return true;
    }
    if ((triggerType === "when_vcontrol" || triggerType === "when_key") && block.blockId === "when_vcontrol") {
      const inputVal = (this.getBlockInput(block, 0) || "cross").toLowerCase();
      const arg = (eventArg || "").toLowerCase();
      if (inputVal === "any button" || inputVal === "any" || inputVal.includes(arg) || arg.includes(inputVal)) return true;
      if (arg === "space" && (inputVal.includes("cross") || inputVal.includes("jump"))) return true;
      if ((arg === "z" || arg === "attack") && (inputVal.includes("circle") || inputVal.includes("attack"))) return true;
      if (arg === "x" && (inputVal.includes("square") || inputVal.includes("special"))) return true;
      if (arg === "c" && (inputVal.includes("triangle") || inputVal.includes("menu"))) return true;
    }
    if (triggerType === "when_receive" && block.blockId === "when_receive") {
      const msg = this.getBlockInput(block, 0) || "message1";
      if (msg.toLowerCase() === (eventArg || "").toLowerCase()) return true;
    }
    return false;
  },

  runBlockImmediately(block, targetId = null) {
    if (!block) return;
    const tid = targetId || (typeof AppModeController !== "undefined" ? AppModeController.getActiveTargetId() : null);
    const targetItem = typeof WorldObjectsManager !== "undefined" && tid
      ? WorldObjectsManager.items.find(it => it.id === tid)
      : null;

    if (!this.isRunning) {
      this.isRunning = true;
      this.updateRunButtonUI();
    }
    this.launchThread(block, targetItem, tid);
  },

  broadcast(messageName) {
    this.triggerEvent("when_receive", messageName);
  },

  launchThread(rootBlock, targetItem, targetId) {
    const thread = this.runScriptThread(rootBlock, targetItem, targetId);
    this.activeThreads.push(thread);
    thread.finally(() => {
      const idx = this.activeThreads.indexOf(thread);
      if (idx >= 0) this.activeThreads.splice(idx, 1);
    });
  },

  async runScriptThread(rootBlock, targetItem, targetId) {
    let curr = rootBlock;
    const scripts = AppModeController.objectScripts[targetId] || AppModeController.getCurrentScripts();

    while (curr && this.isRunning) {
      const nextId = curr.nextId;
      await this.executeBlock(curr, targetItem);
      if (!this.isRunning) break;

      if (nextId) {
        curr = scripts.find(b => b.id === nextId) || null;
      } else {
        curr = null;
      }
    }
  },

  async executeBlock(block, targetItem) {
    if (!this.isRunning || !block) return;

    const blockEl = AppModeController.getBlockElement(block.id);
    if (blockEl) blockEl.classList.add("executing-halo");

    try {
      switch (block.blockId) {
        // ================= MOTION =================
        case "move_x_steps":
        case "move_steps_x": {
          const steps = Number(this.evalBlockInput(block, 0, targetItem, 10)) || 0;
          if (targetItem) {
            targetItem.x = Math.round(targetItem.x + steps);
            targetItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - targetItem.w, targetItem.x));
          }
          await this.sleep(16);
          break;
        }
        case "move_y_steps":
        case "move_steps_y": {
          const steps = Number(this.evalBlockInput(block, 0, targetItem, 10)) || 0;
          if (targetItem) {
            targetItem.y = Math.round(targetItem.y + steps);
            targetItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - targetItem.h, targetItem.y));
          }
          await this.sleep(16);
          break;
        }
        case "move_steps": {
          const steps = Number(this.evalBlockInput(block, 0, targetItem, 10)) || 10;
          if (targetItem) {
            const rotRad = ((targetItem.rotation || 0) - 90) * Math.PI / 180;
            targetItem.x = Math.round(targetItem.x + steps * Math.cos(rotRad));
            targetItem.y = Math.round(targetItem.y + steps * Math.sin(rotRad));
            targetItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - targetItem.w, targetItem.x));
            targetItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - targetItem.h, targetItem.y));
          }
          await this.sleep(16);
          break;
        }
        case "turn_right": {
          const deg = Number(this.evalBlockInput(block, 0, targetItem, 15)) || 15;
          if (targetItem) {
            targetItem.rotation = Math.round((targetItem.rotation || 0) + deg) % 360;
          }
          await this.sleep(16);
          break;
        }
        case "turn_left": {
          const deg = Number(this.evalBlockInput(block, 0, targetItem, 15)) || 15;
          if (targetItem) {
            targetItem.rotation = Math.round((targetItem.rotation || 0) - deg + 360) % 360;
          }
          await this.sleep(16);
          break;
        }
        case "goto_xy": {
          const gx = Number(this.evalBlockInput(block, 0, targetItem, 0)) || 0;
          const gy = Number(this.evalBlockInput(block, 1, targetItem, 0)) || 0;
          if (targetItem) {
            targetItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - targetItem.w, gx));
            targetItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - targetItem.h, gy));
          }
          await this.sleep(16);
          break;
        }
        case "glide_xy": {
          const secs = Math.max(0.1, Number(this.evalBlockInput(block, 0, targetItem, 1)) || 1);
          const gx = Number(this.evalBlockInput(block, 1, targetItem, 0)) || 0;
          const gy = Number(this.evalBlockInput(block, 2, targetItem, 0)) || 0;
          if (targetItem) {
            const startX = targetItem.x;
            const startY = targetItem.y;
            const targetX = Math.max(0, Math.min(WorldConfig.worldWidth - targetItem.w, gx));
            const targetY = Math.max(0, Math.min(WorldConfig.worldHeight - targetItem.h, gy));
            const durationMs = secs * 1000;
            const startTime = Date.now();

            while (this.isRunning && Date.now() - startTime < durationMs) {
              const progress = Math.min(1, (Date.now() - startTime) / durationMs);
              targetItem.x = Math.round(startX + (targetX - startX) * progress);
              targetItem.y = Math.round(startY + (targetY - startY) * progress);
              await this.sleep(16);
            }
            targetItem.x = targetX;
            targetItem.y = targetY;
          }
          break;
        }
        case "point_dir": {
          const dir = Number(this.evalBlockInput(block, 0, targetItem, 90)) || 90;
          if (targetItem) {
            targetItem.rotation = ((dir % 360) + 360) % 360;
          }
          await this.sleep(16);
          break;
        }
        case "bounce_edge": {
          if (targetItem) {
            let bounced = false;
            if (targetItem.x <= 0 || targetItem.x + targetItem.w >= WorldConfig.worldWidth) {
              targetItem.rotation = (360 - (targetItem.rotation || 0)) % 360;
              targetItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - targetItem.w, targetItem.x));
              bounced = true;
            }
            if (targetItem.y <= 0 || targetItem.y + targetItem.h >= WorldConfig.worldHeight) {
              targetItem.rotation = (180 - (targetItem.rotation || 0) + 360) % 360;
              targetItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - targetItem.h, targetItem.y));
              bounced = true;
            }
            if (bounced) SoundEngine.playChiptuneTone(400, "triangle", 0.04, 0.1);
          }
          await this.sleep(16);
          break;
        }

        // ================= LOOKS =================
        case "say_text": {
          const text = String(this.evalBlockInput(block, 0, targetItem, "Hello!"));
          const secs = Number(this.evalBlockInput(block, 1, targetItem, 2)) || 2;
          if (targetItem) {
            targetItem.speechBubble = {
              text: text,
              expiresAt: Date.now() + secs * 1000
            };
          }
          await this.sleep(secs * 1000);
          break;
        }
        case "switch_costume": {
          const poseName = String(this.evalBlockInput(block, 0, targetItem, "Attack"));
          if (targetItem && targetItem.poses && targetItem.poses[poseName]) {
            SpritePosesController.selectPose(targetItem, poseName, targetItem.poses[poseName]);
          }
          await this.sleep(16);
          break;
        }
        case "next_costume": {
          if (targetItem && targetItem.poses) {
            const poseKeys = Object.keys(targetItem.poses);
            if (poseKeys.length > 0) {
              const curIdx = poseKeys.indexOf(targetItem.currentPose || poseKeys[0]);
              const nextIdx = (curIdx + 1) % poseKeys.length;
              const nextPose = poseKeys[nextIdx];
              SpritePosesController.selectPose(targetItem, nextPose, targetItem.poses[nextPose]);
            }
          }
          await this.sleep(16);
          break;
        }
        case "change_size": {
          const deltaPct = Number(this.evalBlockInput(block, 0, targetItem, 10)) || 10;
          if (targetItem) {
            const factor = (100 + deltaPct) / 100;
            targetItem.w = Math.max(16, Math.round(targetItem.w * factor));
            targetItem.h = Math.max(16, Math.round(targetItem.h * factor));
          }
          await this.sleep(16);
          break;
        }
        case "set_size": {
          const pct = Number(this.evalBlockInput(block, 0, targetItem, 100)) || 100;
          if (targetItem) {
            const nw = targetItem.naturalW || targetItem.w;
            const nh = targetItem.naturalH || targetItem.h;
            targetItem.w = Math.max(16, Math.round(nw * (pct / 100)));
            targetItem.h = Math.max(16, Math.round(nh * (pct / 100)));
          }
          await this.sleep(16);
          break;
        }
        case "move_layer_front": {
          const count = Math.max(1, Math.floor(Number(this.evalBlockInput(block, 0, targetItem, 1)) || 1));
          if (targetItem && typeof WorldObjectsManager !== "undefined") {
            WorldObjectsManager.moveLayerFront(targetItem.id, count);
          }
          await this.sleep(16);
          break;
        }
        case "move_layer_back": {
          const count = Math.max(1, Math.floor(Number(this.evalBlockInput(block, 0, targetItem, 1)) || 1));
          if (targetItem && typeof WorldObjectsManager !== "undefined") {
            WorldObjectsManager.moveLayerBack(targetItem.id, count);
          }
          await this.sleep(16);
          break;
        }
        case "go_to_layer": {
          const dest = String(this.evalBlockInput(block, 0, targetItem, "front")).toLowerCase();
          if (targetItem && typeof WorldObjectsManager !== "undefined") {
            if (dest === "back") {
              WorldObjectsManager.sendToBack(targetItem.id);
            } else {
              WorldObjectsManager.bringToFront(targetItem.id);
            }
          }
          await this.sleep(16);
          break;
        }
        case "show": {
          if (targetItem) targetItem.hidden = false;
          await this.sleep(16);
          break;
        }
        case "hide": {
          if (targetItem) targetItem.hidden = true;
          await this.sleep(16);
          break;
        }
        case "set_vcontrols_visible": {
          const vis = String(this.evalBlockInput(block, 0, targetItem, "show")).toLowerCase();
          if (typeof MobileControlsManager !== "undefined") {
            MobileControlsManager.setGamepadVisibilityMode(vis);
          }
          await this.sleep(16);
          break;
        }
        case "set_vcontrols_customizable": {
          const customEnabled = String(this.evalBlockInput(block, 0, targetItem, "true")).toLowerCase() === "true";
          if (typeof MobileControlsManager !== "undefined") {
            MobileControlsManager.setCustomizationEnabled(customEnabled);
          }
          await this.sleep(16);
          break;
        }

        // ================= SENSING =================
        case "touching_object": {
          const objTarget = String(this.evalBlockInput(block, 0, targetItem, "edge"));
          this.evaluateCondition(`touching ${objTarget}`, targetItem);
          await this.sleep(16);
          break;
        }
        case "touching_solid": {
          this.evaluateCondition("touching solid", targetItem);
          await this.sleep(16);
          break;
        }
        case "distance_to_object": {
          const objTarget = String(this.evalBlockInput(block, 0, targetItem, "hero"));
          const distVal = Number(this.evalBlockInput(block, 1, targetItem, 50)) || 50;
          this.evaluateCondition(`distance to ${objTarget} < ${distVal}`, targetItem);
          await this.sleep(16);
          break;
        }

        // ================= SOUND =================
        case "play_sound": {
          const soundName = String(this.evalBlockInput(block, 0, targetItem, "jump")).toLowerCase();
          SoundEngine.playSoundEffect(soundName);
          await this.sleep(200);
          break;
        }
        case "start_sound": {
          const soundName = String(this.evalBlockInput(block, 0, targetItem, "laser")).toLowerCase();
          SoundEngine.playSoundEffect(soundName);
          await this.sleep(16);
          break;
        }
        case "stop_all_sounds": {
          if (SoundEngine.audioCtx) SoundEngine.audioCtx.suspend().then(() => SoundEngine.audioCtx.resume());
          await this.sleep(16);
          break;
        }
        case "change_volume": {
          await this.sleep(16);
          break;
        }

        // ================= CONTROL =================
        case "wait_secs": {
          const secs = Math.max(0.01, Number(this.evalBlockInput(block, 0, targetItem, 1)) || 1);
          await this.sleep(secs * 1000);
          break;
        }
        case "repeat": {
          const times = Math.max(0, Math.floor(Number(this.evalBlockInput(block, 0, targetItem, 10)) || 10));
          const childId = block.childId;
          if (childId) {
            const scripts = AppModeController.getCurrentScripts();
            const childBlock = scripts.find(b => b.id === childId);
            for (let i = 0; i < times && this.isRunning; i++) {
              if (childBlock) await this.runScriptThread(childBlock, targetItem, targetItem ? targetItem.id : "global_stage");
              await this.sleep(16);
            }
          } else {
            await this.sleep(16);
          }
          break;
        }
        case "forever": {
          const childId = block.childId;
          if (childId) {
            const scripts = AppModeController.getCurrentScripts();
            const childBlock = scripts.find(b => b.id === childId);
            while (this.isRunning) {
              if (childBlock) await this.runScriptThread(childBlock, targetItem, targetItem ? targetItem.id : "global_stage");
              await this.sleep(16);
            }
          } else {
            while (this.isRunning) {
              await this.sleep(50);
            }
          }
          break;
        }
        case "if_then": {
          let isTrue = false;
          if (block.conditionBlock) {
            isTrue = this.evaluateConditionBlock(block.conditionBlock, targetItem);
          } else {
            const condRaw = String(this.evalBlockInput(block, 0, targetItem, "touching edge"));
            isTrue = this.evaluateCondition(condRaw, targetItem);
          }
          if (isTrue && block.childId) {
            const scripts = AppModeController.getCurrentScripts();
            const childBlock = scripts.find(b => b.id === block.childId);
            if (childBlock) await this.runScriptThread(childBlock, targetItem, targetItem ? targetItem.id : "global_stage");
          }
          await this.sleep(16);
          break;
        }
        case "if_else": {
          let isTrue = false;
          if (block.conditionBlock) {
            isTrue = this.evaluateConditionBlock(block.conditionBlock, targetItem);
          } else {
            const condRaw = String(this.evalBlockInput(block, 0, targetItem, "touching edge"));
            isTrue = this.evaluateCondition(condRaw, targetItem);
          }
          const scripts = AppModeController.getCurrentScripts();
          if (isTrue && block.childId_if) {
            const childIf = scripts.find(b => b.id === block.childId_if);
            if (childIf) await this.runScriptThread(childIf, targetItem, targetItem ? targetItem.id : "global_stage");
          } else if (!isTrue && block.childId_else) {
            const childElse = scripts.find(b => b.id === block.childId_else);
            if (childElse) await this.runScriptThread(childElse, targetItem, targetItem ? targetItem.id : "global_stage");
          }
          await this.sleep(16);
          break;
        }
        case "set_playable_char": {
          const chosen = String(this.evalBlockInput(block, 0, targetItem, "this sprite"));
          if (typeof GamePlayerEngine !== "undefined") {
            if (chosen === "this sprite" || !chosen) {
              if (targetItem) GamePlayerEngine.setPlayableCharacter(targetItem.id);
            } else if (chosen === "None" || chosen === "none") {
              GamePlayerEngine.setPlayableCharacter(null);
            } else {
              GamePlayerEngine.setPlayableCharacter(chosen);
            }
          }
          await this.sleep(16);
          break;
        }
        case "set_player_control": {
          const modeVal = String(this.evalBlockInput(block, 0, targetItem, "enabled"));
          if (typeof GamePlayerEngine !== "undefined") {
            GamePlayerEngine.setPlayerControlEnabled(modeVal.toLowerCase() === "enabled");
          }
          await this.sleep(16);
          break;
        }
        case "stop_all": {
          this.stopAll();
          break;
        }

        // ================= VARIABLES =================
        case "set_var": {
          const varName = String(this.evalBlockInput(block, 0, targetItem, "score"));
          const val = this.evalBlockInput(block, 1, targetItem, 0);
          VariableManager.setVariable(varName, val, targetItem ? targetItem.id : null);
          await this.sleep(16);
          break;
        }
        case "change_var": {
          const varName = String(this.evalBlockInput(block, 0, targetItem, "score"));
          const delta = this.evalBlockInput(block, 1, targetItem, 1);
          VariableManager.changeVariable(varName, delta, targetItem ? targetItem.id : null);
          await this.sleep(16);
          break;
        }
        case "show_var": {
          const varName = String(this.evalBlockInput(block, 0, targetItem, "score"));
          VariableManager.toggleWatcher(varName, true);
          await this.sleep(16);
          break;
        }
        case "hide_var": {
          const varName = String(this.evalBlockInput(block, 0, targetItem, "score"));
          VariableManager.toggleWatcher(varName, false);
          await this.sleep(16);
          break;
        }

        // ================= EVENTS =================
        case "broadcast": {
          const msg = String(this.evalBlockInput(block, 0, targetItem, "message1"));
          this.broadcast(msg);
          await this.sleep(16);
          break;
        }

        default:
          await this.sleep(16);
      }
    } finally {
      if (blockEl) blockEl.classList.remove("executing-halo");
    }
  },

  getBlockInput(block, index = 0) {
    const el = AppModeController.getBlockElement(block.id);
    if (el) {
      const inputs = el.querySelectorAll(".code-block-input, .code-block-select");
      if (inputs && inputs[index]) {
        return inputs[index].value || inputs[index].textContent.trim();
      }
    }
    if (block.inputs && block.inputs[index] !== undefined) {
      return block.inputs[index];
    }
    return null;
  },

  evalBlockInput(block, index, targetItem, fallback = "") {
    const raw = this.getBlockInput(block, index);
    if (raw === null || raw === undefined || raw === "") return fallback;
    const trimmed = String(raw).trim();

    const v = VariableManager.getVariable(trimmed, targetItem ? targetItem.id : null);
    if (v) return v.value;

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

      if (targetSpec === "edge") {
        return targetItem.x <= 10 || targetItem.x + targetItem.w >= WorldConfig.worldWidth - 10 ||
               targetItem.y <= 10 || targetItem.y + targetItem.h >= WorldConfig.worldHeight - 10;
      }

      if (targetSpec === "mouse-pointer" || targetSpec === "mouse") {
        const mx = (typeof mouseX !== "undefined" ? mouseX : 0);
        const my = (typeof mouseY !== "undefined" ? mouseY : 0);
        const wx = (mx - WorldConfig.panX) / WorldConfig.zoom;
        const wy = (my - WorldConfig.panY) / WorldConfig.zoom;
        return wx >= targetItem.x && wx <= targetItem.x + targetItem.w &&
               wy >= targetItem.y && wy <= targetItem.y + targetItem.h;
      }

      if (targetSpec === "solid" || targetSpec === "solid object") {
        if (typeof WorldObjectsManager === "undefined") return false;
        return WorldObjectsManager.items.some(other => {
          if (other.id === targetItem.id || other.hidden || !other.isSolid) return false;
          return this.checkOverlap(targetItem, other);
        });
      }

      if (targetSpec === "hero") {
        let hero = null;
        if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.getActivePlayableItem) {
          hero = GamePlayerEngine.getActivePlayableItem();
        }
        if (!hero && typeof WorldObjectsManager !== "undefined") {
          hero = WorldObjectsManager.items.find(it => it.isPlayable);
        }
        if (hero && hero.id !== targetItem.id) {
          return this.checkOverlap(targetItem, hero);
        }
        return false;
      }

      if (targetSpec === "any" || targetSpec === "any object") {
        if (typeof WorldObjectsManager === "undefined") return false;
        return WorldObjectsManager.items.some(other => {
          if (other.id === targetItem.id || other.hidden) return false;
          return this.checkOverlap(targetItem, other);
        });
      }

      // Check specific object name or id
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
          otherX = (mx - WorldConfig.panX) / WorldConfig.zoom;
          otherY = (my - WorldConfig.panY) / WorldConfig.zoom;
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
      const leftVal = this.resolveValue(match[1], targetItem);
      const op = match[2];
      const rightVal = this.resolveValue(match[3], targetItem);

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

  evaluateConditionBlock(condBlock, targetItem) {
    if (!condBlock) return false;
    const bid = condBlock.blockId || condBlock.id;
    const inputs = condBlock.inputs || [];

    // 1. SENSING BOOLEANS
    if (bid === "touching_object") {
      const target = inputs[0] || "edge";
      return this.evaluateCondition(`touching ${target}`, targetItem);
    }
    if (bid === "touching_solid") {
      return this.evaluateCondition("touching solid", targetItem);
    }
    if (bid === "distance_to_object") {
      const target = inputs[0] || "hero";
      const dist = inputs[1] || 50;
      return this.evaluateCondition(`distance to ${target} < ${dist}`, targetItem);
    }
    if (bid === "key_pressed_check") {
      const keyName = inputs[0] || "space";
      return this.evaluateCondition(`key ${keyName} pressed`, targetItem);
    }
    if (bid === "vcontrol_pressed_check") {
      const btnName = inputs[0] || "cross";
      if (typeof MobileControlsManager !== "undefined") {
        return MobileControlsManager.isButtonPressed(btnName);
      }
      return false;
    }
    if (bid === "mouse_down_check") {
      return this.evaluateCondition("mouse down", targetItem);
    }
    if (bid === "is_mobile_sensing") {
      return this.evaluateCondition("is mobile", targetItem);
    }
    if (bid === "is_playable_sensing") {
      return this.evaluateCondition("is playable", targetItem);
    }

    // 2. LOGICAL OPERATOR BOOLEANS (and, or, not)
    if (bid === "op_and" || condBlock.opType === "and") {
      const leftVal = condBlock.leftConditionBlock ? this.evaluateConditionBlock(condBlock.leftConditionBlock, targetItem) : false;
      const rightVal = condBlock.rightConditionBlock ? this.evaluateConditionBlock(condBlock.rightConditionBlock, targetItem) : false;
      return leftVal && rightVal;
    }
    if (bid === "op_or" || condBlock.opType === "or") {
      const leftVal = condBlock.leftConditionBlock ? this.evaluateConditionBlock(condBlock.leftConditionBlock, targetItem) : false;
      const rightVal = condBlock.rightConditionBlock ? this.evaluateConditionBlock(condBlock.rightConditionBlock, targetItem) : false;
      return leftVal || rightVal;
    }
    if (bid === "op_not" || condBlock.opType === "not") {
      const innerVal = condBlock.conditionBlock ? this.evaluateConditionBlock(condBlock.conditionBlock, targetItem) : false;
      return !innerVal;
    }

    // 3. COMPARISON OPERATOR BOOLEANS (>, <, =, contains)
    if (bid === "op_gt" || condBlock.opType === ">") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 50, targetItem)) || 0;
      return l > r;
    }
    if (bid === "op_lt" || condBlock.opType === "<") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 50, targetItem)) || 0;
      return l < r;
    }
    if (bid === "op_eq" || condBlock.opType === "=") {
      const l = this.resolveValue(inputs[0] !== undefined ? inputs[0] : "", targetItem);
      const r = this.resolveValue(inputs[1] !== undefined ? inputs[1] : 50, targetItem);
      return String(l) === String(r);
    }
    if (bid === "op_contains" || condBlock.opType === "contains") {
      const l = String(this.resolveValue(inputs[0] !== undefined ? inputs[0] : "apple", targetItem));
      const r = String(this.resolveValue(inputs[1] !== undefined ? inputs[1] : "a", targetItem));
      return l.includes(r);
    }

    const fallbackCond = inputs[0] || condBlock.name || "true";
    return this.evaluateCondition(fallbackCond, targetItem);
  },

  evaluateReporterBlock(repBlock, targetItem) {
    if (!repBlock) return 0;
    const bid = repBlock.blockId || repBlock.id;
    const inputs = repBlock.inputs || [];

    if (bid === "op_add" || repBlock.opType === "+") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 0, targetItem)) || 0;
      return l + r;
    }
    if (bid === "op_subtract" || repBlock.opType === "-") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 0, targetItem)) || 0;
      return l - r;
    }
    if (bid === "op_multiply" || repBlock.opType === "*") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 0, targetItem)) || 0;
      return l * r;
    }
    if (bid === "op_divide" || repBlock.opType === "/") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 1, targetItem)) || 0;
      return r !== 0 ? l / r : 0;
    }
    if (bid === "op_random" || repBlock.isRandom) {
      const min = Math.ceil(Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 1, targetItem)) || 1);
      const max = Math.floor(Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 10, targetItem)) || 10);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    if (bid === "op_join") {
      const l = String(this.resolveValue(inputs[0] !== undefined ? inputs[0] : "apple", targetItem));
      const r = String(this.resolveValue(inputs[1] !== undefined ? inputs[1] : "banana", targetItem));
      return l + r;
    }
    if (bid === "op_letter_of") {
      const idx = (Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 1, targetItem)) || 1) - 1;
      const str = String(this.resolveValue(inputs[1] !== undefined ? inputs[1] : "apple", targetItem));
      return str[idx] || "";
    }
    if (bid === "op_length_of") {
      const str = String(this.resolveValue(inputs[0] !== undefined ? inputs[0] : "apple", targetItem));
      return str.length;
    }

    return 0;
  },

  resolveValue(identifier, targetItem) {
    if (identifier === null || identifier === undefined) return "";
    if (typeof identifier === "object" && identifier.isReporter) {
      return this.evaluateReporterBlock(identifier, targetItem);
    }
    const str = String(identifier).trim();
    if (targetItem) {
      if (str === "x position" || str === "x") return targetItem.x;
      if (str === "y position" || str === "y") return targetItem.y;
      if (str === "width") return targetItem.w;
      if (str === "height") return targetItem.h;
      if (str === "direction") return targetItem.rotation || 0;
      if (str === "size") return targetItem.scale || 100;
    }
    const v = typeof VariableManager !== "undefined" ? VariableManager.getVariable(str, targetItem ? targetItem.id : null) : null;
    if (v !== null && v !== undefined) return v.value;
    const num = Number(str);
    if (!isNaN(num) && str !== "") return num;
    return str;
  }
};

// ============================================================================
// 10B. U5 COMPILER & COMPRESSION ENGINE (UNIFIVE Creative Package)
// ============================================================================