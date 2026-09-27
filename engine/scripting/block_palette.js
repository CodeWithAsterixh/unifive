/**
 * UNIFIVE Scripting - Block Palette Subsystem
 */
const BlockPalette = {
  activeCategory: "events",
  categories: {
    events: [
      { id: "when_flag", name: "when flag clicked", hat: true, scope: "global", color: "#f59e0b", icon: "ph-flag" },
      { id: "when_key", name: "when [space] key pressed", hat: true, scope: "global", color: "#f59e0b", icon: "ph-keyboard", options: ["space", "up arrow", "down arrow", "left arrow", "right arrow", "any"] },
      { id: "when_vcontrol", name: "when vcontrol [cross] button pressed", hat: true, scope: "global", color: "#f59e0b", icon: "ph-game-controller", options: ["cross", "circle", "square", "triangle", "dpad up", "dpad down", "dpad left", "dpad right", "L shoulder", "R shoulder", "start", "select", "any button"] },
      { id: "when_clicked", name: "when this sprite clicked", hat: true, scope: "object", color: "#f59e0b", icon: "ph-cursor-click" },
      { id: "when_became_playable", name: "when became playable", hat: true, scope: "sprite", color: "#f59e0b", icon: "ph-crown" },
      { id: "broadcast", name: "broadcast [message1]", scope: "global", color: "#f59e0b", icon: "ph-broadcast" },
      { id: "when_receive", name: "when I receive [message1]", hat: true, scope: "global", color: "#f59e0b", icon: "ph-bell-ringing" }
    ],
    motion: [
      { id: "move_x_steps", name: "move (10) steps x", scope: "sprite", color: "#3b82f6", icon: "ph-arrows-left-right" },
      { id: "move_y_steps", name: "move (10) steps y", scope: "sprite", color: "#3b82f6", icon: "ph-arrows-down-up" },
      { id: "turn_right", name: "turn right (15) degrees", scope: "object", color: "#3b82f6", icon: "ph-arrow-clockwise" },
      { id: "turn_left", name: "turn left (15) degrees", scope: "object", color: "#3b82f6", icon: "ph-arrow-counter-clockwise" },
      { id: "goto_xy", name: "go to x: (0) y: (0)", scope: "object", color: "#3b82f6", icon: "ph-crosshair" },
      { id: "glide_xy", name: "glide (1) secs to x: (0) y: (0)", scope: "object", color: "#3b82f6", icon: "ph-paper-plane-tilt" },
      { id: "point_dir", name: "point in direction (90)", scope: "sprite", color: "#3b82f6", icon: "ph-compass" },
      { id: "bounce_edge", name: "if on edge, bounce", scope: "sprite", color: "#3b82f6", icon: "ph-arrows-left-right" },
      { id: "set_speed", name: "set speed to (6.5)", scope: "sprite", color: "#3b82f6", icon: "ph-gauge" },
      { id: "change_speed", name: "change speed by (1)", scope: "sprite", color: "#3b82f6", icon: "ph-trend-up" },
      { id: "set_weight", name: "set weight to (1.0)", scope: "sprite", color: "#3b82f6", icon: "ph-scales" },
      { id: "set_velocity", name: "set velocity x: (0) y: (0)", scope: "sprite", color: "#3b82f6", icon: "ph-speedometer" },
      { id: "set_jump_force", name: "set jump force to (12)", scope: "sprite", color: "#3b82f6", icon: "ph-arrow-fat-lines-up" },
      { id: "set_gravity", name: "set gravity to (0.65)", scope: "sprite", color: "#3b82f6", icon: "ph-arrow-fat-lines-down" },
      { id: "set_friction", name: "set friction to (0.82)", scope: "sprite", color: "#3b82f6", icon: "ph-activity" }
    ],
    looks: [
      { id: "say_for_secs", name: "say [Hello!] for (2) secs", scope: "sprite", color: "#a855f7", icon: "ph-chat-circle-dots" },
      { id: "say_text", name: "say [Hello!] for (2) secs", scope: "sprite", color: "#a855f7", icon: "ph-chat-circle-dots" },
      { id: "switch_pose", name: "switch pose to [Attack]", scope: "sprite", color: "#a855f7", icon: "ph-person-simple-walk" },
      { id: "switch_costume", name: "switch costume to [Attack]", scope: "sprite", color: "#a855f7", icon: "ph-person-simple-walk" },
      { id: "next_costume", name: "next costume", scope: "sprite", color: "#a855f7", icon: "ph-arrow-fat-right" },
      { id: "change_size", name: "change size by (10)%", scope: "object", color: "#a855f7", icon: "ph-arrows-out-simple" },
      { id: "set_size", name: "set size to (100)%", scope: "object", color: "#a855f7", icon: "ph-frame-corners" },
      { id: "move_layer_front", name: "move (1) layer front", scope: "object", color: "#a855f7", icon: "ph-stack-overflow" },
      { id: "move_layer_back", name: "move (1) layer back", scope: "object", color: "#a855f7", icon: "ph-stack-simple" },
      { id: "go_to_layer", name: "go to [front] layer", scope: "object", color: "#a855f7", icon: "ph-layers-intersect", options: ["front", "back"] },
      { id: "show", name: "show", scope: "object", color: "#a855f7", icon: "ph-eye" },
      { id: "hide", name: "hide", scope: "object", color: "#a855f7", icon: "ph-eye-slash" },
      { id: "set_vcontrols_visible", name: "set virtual controls visibility to [show]", scope: "global", color: "#a855f7", icon: "ph-game-controller", options: ["show", "hide", "auto"] },
      { id: "set_vcontrols_customizable", name: "allow virtual control customization [true]", scope: "global", color: "#a855f7", icon: "ph-sliders-horizontal", options: ["true", "false"] }
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
      { id: "touching_solid", name: "touching solid", isBoolean: true, scope: "object", color: "#0284c7", icon: "ph-shield-check" },
      { id: "distance_to_object", name: "distance to [hero] < (50)", isBoolean: true, scope: "object", color: "#0284c7", icon: "ph-ruler", isDistanceSelector: true },
      { id: "key_pressed_check", name: "key [space] pressed?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-keyboard", options: ["space", "up arrow", "down arrow", "left arrow", "right arrow", "any"] },
      { id: "vcontrol_pressed_check", name: "vcontrol [cross] pressed?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-game-controller", options: ["cross", "circle", "square", "triangle", "dpad up", "dpad down", "dpad left", "dpad right", "L shoulder", "R shoulder", "start", "select", "any button"] },
      { id: "mouse_down_check", name: "mouse down?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-cursor-click" },
      { id: "is_mobile_sensing", name: "is mobile device?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-device-mobile" },
      { id: "is_playable_sensing", name: "is playable hero?", isBoolean: true, scope: "sprite", color: "#0284c7", icon: "ph-game-controller" }
    ],
    operators: [
      { id: "op_add", name: "( ) + ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-plus" },
      { id: "op_subtract", name: "( ) - ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-minus" },
      { id: "op_multiply", name: "( ) * ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-x" },
      { id: "op_divide", name: "( ) / ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-divide" },
      { id: "op_random", name: "pick random (1) to (10)", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-shuffle" },
      { id: "op_gt", name: "<( ) > (50)>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-caret-right" },
      { id: "op_lt", name: "<( ) < (50)>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-caret-left" },
      { id: "op_eq", name: "<( ) = (50)>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-equals" },
      { id: "op_and", name: "<<> and <>>", isBoolean: true, isLogical: true, scope: "universal", color: "#22c55e", icon: "ph-intersect" },
      { id: "op_or", name: "<<> or <>>", isBoolean: true, isLogical: true, scope: "universal", color: "#22c55e", icon: "ph-circles-three" },
      { id: "op_not", name: "<not <>>", isBoolean: true, isLogical: true, scope: "universal", color: "#22c55e", icon: "ph-prohibit" },
      { id: "op_join", name: "join [apple] [banana]", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-link" },
      { id: "op_letter_of", name: "letter (1) of [apple]", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-text-aa" },
      { id: "op_length_of", name: "length of [apple]", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-ruler" },
      { id: "op_contains", name: "<[apple] contains [a]>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-magnifying-glass" }
    ],
    variables: [
      { id: "set_var", name: "set [score] to (0)", scope: "global", color: "#f97316", icon: "ph-textbox" },
      { id: "change_var", name: "change [score] by (1)", scope: "global", color: "#f97316", icon: "ph-plus-circle" },
      { id: "show_var", name: "show variable [score]", scope: "global", color: "#f97316", icon: "ph-eye" },
      { id: "hide_var", name: "hide variable [score]", scope: "global", color: "#f97316", icon: "ph-eye-slash" }
    ]
  },

  init() {
    const catBtns = document.querySelectorAll(".code-cat-btn");
    for (const btn of catBtns) {
      btn.addEventListener("click", () => {
        for (const b of catBtns) b.classList.remove("active");
        btn.classList.add("active");
        this.activeCategory = btn.getAttribute("data-category");
        this.renderCategoryBlocks(this.activeCategory);
      });
    }
    this.renderCategoryBlocks(this.activeCategory);
  },

  getActiveTargetId() {
    const selected = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    return selected ? selected.id : "global_stage";
  },

  getActiveTargetInfo() {
    const selected = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (!selected) {
      return { id: "global_stage", name: "Stage (Global)", type: "stage", isStage: true, isSprite: false, isProp: false };
    }
    const isSprite = selected.type === "sprite" ||
      (selected.assetId && selected.assetId.startsWith("sprite_")) ||
      (selected.poses && Object.keys(selected.poses).length > 0) ||
      !!selected.isCharacter || !!selected.isPlayable;
    return {
      id: selected.id,
      name: selected.name || "Object",
      type: isSprite ? "sprite" : (selected.type || "prop"),
      isStage: false,
      isSprite,
      isProp: !isSprite
    };
  },

  isBlockAvailableForTarget(block, targetInfo = this.getActiveTargetInfo()) {
    const scope = block.scope || "global";
    if (scope === "global" || scope === "universal") return true;
    if (targetInfo.isStage) return false;
    if (targetInfo.isProp) return scope === "object";
    return true;
  },

  getBlockOptions(block) {
    if (block.options && Array.isArray(block.options)) return block.options;
    
    // Dynamic sprite poses
    if (block.id === "switch_pose" || block.id === "switch_costume") {
      const selected = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
      if (selected && selected.poses && Object.keys(selected.poses).length > 0) {
        return Object.keys(selected.poses);
      }
      return ["Idle", "Walk", "Jump", "Attack", "Hurt", "Dead"];
    }

    // Dynamic playable character names
    if (block.id === "set_playable_char" || block.isPlayableCharSelector) {
      const items = (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) ? WorldObjectsManager.items : [];
      const spriteNames = items.filter(i => i.type === "sprite" || (i.poses && Object.keys(i.poses).length > 0)).map(i => i.name || "Sprite");
      return spriteNames.length > 0 ? ["this sprite", ...spriteNames] : ["this sprite"];
    }

    // Dynamic objects for touching / distance
    if (block.id === "touching_object" || block.id === "distance_to_object" || block.isTouchingSelector || block.isDistanceSelector) {
      const items = (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) ? WorldObjectsManager.items : [];
      const itemNames = items.map(i => i.name || "Object");
      return ["edge", "solid", "mouse-pointer", ...itemNames];
    }

    // Dynamic variable names
    if (block.id && block.id.endsWith("_var")) {
      const vars = (typeof VariableManager !== "undefined" && VariableManager.variables) ? VariableManager.variables : [];
      const varNames = vars.map(v => v.name);
      return varNames.length > 0 ? varNames : ["score", "coins", "lives"];
    }

    return null;
  },

  createBlockElement(block, workspace = false) {
    const element = document.createElement("div");
    let blockType = "stack-block";
    if (block.hat) blockType = "hat-block";
    else if (block.cap) blockType = "cap-block";
    else if (block.c_block) blockType = "c-block";
    else if (block.e_block) blockType = "e-block";
    else if (block.isReporter || block.reporter) blockType = "reporter-block";
    else if (block.isBoolean || block.boolean) blockType = "boolean-block";
    element.className = `code-block-item ${blockType}`;
    element.dataset.blockId = block.id;
    element.style.setProperty("--block-bg", block.color || "#2563eb");

    const blockOptions = this.getBlockOptions(block);
    let inputIdx = 0;
    let formattedName = String(block.name || block.id);

    // 1. Replace (param) number/text fields
    formattedName = formattedName.replace(/\((.*?)\)/g, (match, defaultVal) => {
      const currentVal = (block.inputs && block.inputs[inputIdx] !== undefined) ? block.inputs[inputIdx] : defaultVal;
      inputIdx++;
      return `<span class="code-block-input" contenteditable="true" spellcheck="false">${currentVal}</span>`;
    });

    // 2. Replace [option] dropdowns or editable text
    if (blockOptions && blockOptions.length > 0) {
      formattedName = formattedName.replace(/\[(.*?)\]/g, (match, defaultVal) => {
        const currentVal = (block.inputs && block.inputs[inputIdx] !== undefined) ? block.inputs[inputIdx] : defaultVal;
        inputIdx++;
        const optsList = blockOptions.includes(currentVal) ? blockOptions : [currentVal, ...blockOptions];
        const optionsHtml = optsList.map(option => {
          const selected = String(option) === String(currentVal) ? ' selected="selected"' : '';
          return `<option value="${option}"${selected}>${option}</option>`;
        }).join("");
        return `<select class="code-block-select">${optionsHtml}</select>`;
      });
    } else {
      formattedName = formattedName.replace(/\[(.*?)\]/g, (match, defaultVal) => {
        const currentVal = (block.inputs && block.inputs[inputIdx] !== undefined) ? block.inputs[inputIdx] : defaultVal;
        inputIdx++;
        return `<span class="code-block-input" contenteditable="true" spellcheck="false">${currentVal}</span>`;
      });
    }

    const deleteButton = workspace ? '<button class="code-block-delete-btn" title="Delete Block">x</button>' : "";
    if (block.e_block) {
      element.innerHTML = `<div class="e-block-header"><i class="ph ${block.icon || "ph-git-branch"}"></i><span>${formattedName}</span>${deleteButton}</div><div class="e-block-body e-block-body-if"></div><div class="e-block-divider"><span>else</span></div><div class="e-block-body e-block-body-else"></div><div class="e-block-footer"></div>`;
    } else if (block.c_block) {
      element.innerHTML = `<div class="c-block-header"><i class="ph ${block.icon || "ph-code"}"></i><span>${formattedName}</span>${deleteButton}</div><div class="c-block-body"></div><div class="c-block-footer"></div>`;
    } else {
      element.innerHTML = `<i class="ph ${block.icon || "ph-code"}"></i><span>${formattedName}</span>${deleteButton}`;
    }

    // Bind input change and sync
    const inputs = element.querySelectorAll(".code-block-input, .code-block-select");
    inputs.forEach((inp, idx) => {
      inp.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });
      const syncInput = () => {
        if (!block.inputs) block.inputs = [];
        block.inputs[idx] = (inp.tagName === "SELECT" || inp.value !== undefined) ? inp.value : inp.textContent.trim();
      };
      inp.addEventListener("input", syncInput);
      inp.addEventListener("change", syncInput);
      inp.addEventListener("blur", syncInput);
    });

    if (!workspace) {
      let startX = 0;
      let startY = 0;
      let isDragging = false;
      let onMouseMove = null;
      let onMouseUp = null;

      element.addEventListener("mousedown", (event) => {
        if (event.button !== 0) return;
        if (event.target.closest(".code-block-input, .code-block-select, select, input, option")) {
          return;
        }
        event.preventDefault();
        startX = event.clientX;
        startY = event.clientY;
        isDragging = false;

        onMouseMove = (e) => {
          const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
          if (dist > 4 && !isDragging) {
            isDragging = true;
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            if (typeof BlockDragSnap !== "undefined") {
              BlockDragSnap.startPaletteDrag(block, e, element);
            }
          }
        };

        onMouseUp = (e) => {
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
          if (!isDragging) {
            this.executePaletteBlock(block, element);
          }
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      });
    }

    return element;
  },

  async executePaletteBlock(block, element) {
    if (!block) return;
    
    // 1. Flash executing halo
    if (element) {
      element.classList.add("executing-halo");
      setTimeout(() => element.classList.remove("executing-halo"), 300);
    }
    
    // 2. Extract inputs directly from DOM
    const inputEls = element ? Array.from(element.querySelectorAll(".code-block-input, .code-block-select")) : [];
    const inputs = inputEls.map(el => (el.tagName === "SELECT" || el.value !== undefined) ? el.value : el.textContent.trim());
    
    const blockToRun = {
      ...block,
      blockId: block.id,
      inputs: inputs.length > 0 ? inputs : (block.inputs || [])
    };
    
    // 3. Resolve active target
    let targetItem = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (!targetItem && typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items.length > 0) {
      targetItem = WorldObjectsManager.items.find(i => i.isPlayable) || WorldObjectsManager.items.find(i => i.type === "sprite") || WorldObjectsManager.items[0];
      if (targetItem && WorldObjectsManager.selectItem) WorldObjectsManager.selectItem(targetItem.id);
    }
    const targetId = targetItem ? targetItem.id : "global_stage";
    
    const evalInput = (idx, fb) => {
      if (blockToRun.inputs && blockToRun.inputs[idx] !== undefined && blockToRun.inputs[idx] !== "") {
        return blockToRun.inputs[idx];
      }
      return fb;
    };
    
    const bid = block.id;
    
    // 4. Handle events/hat blocks
    if (bid === "when_flag") {
      if (typeof CodeRuntimeEngine !== "undefined") {
        CodeRuntimeEngine.start("when_flag");
      }
      return;
    }
    
    if (bid === "when_key") {
      const key = evalInput(0, "space");
      if (typeof CodeRuntimeEngine !== "undefined") {
        CodeRuntimeEngine.triggerEvent("when_key", key);
      }
      if (typeof SoundEngine !== "undefined") {
        SoundEngine.playChiptuneTone(520, "sine", 0.04, 0.08);
      }
      return;
    }
    
    if (bid === "when_vcontrol") {
      const btn = evalInput(0, "cross");
      if (typeof CodeRuntimeEngine !== "undefined") {
        CodeRuntimeEngine.triggerEvent("when_vcontrol", btn);
      }
      if (typeof SoundEngine !== "undefined") {
        SoundEngine.playChiptuneTone(560, "sine", 0.04, 0.08);
      }
      return;
    }
    
    if (bid === "when_clicked") {
      if (typeof CodeRuntimeEngine !== "undefined") {
        CodeRuntimeEngine.triggerEvent("when_clicked", null, targetId);
      }
      return;
    }
    
    if (bid === "when_became_playable") {
      if (typeof CodeRuntimeEngine !== "undefined") {
        CodeRuntimeEngine.triggerEvent("when_became_playable", null, targetId);
      }
      return;
    }
    
    if (bid === "when_receive" || bid === "broadcast") {
      const msg = evalInput(0, "message1");
      if (typeof CodeRuntimeEngine !== "undefined") {
        CodeRuntimeEngine.triggerEvent("when_receive", msg);
      }
      if (typeof SoundEngine !== "undefined") {
        SoundEngine.playChiptuneTone(600, "square", 0.04, 0.08);
      }
      return;
    }
    
    // 5. Execute action blocks
    const mockEngine = {
      isRunning: true,
      sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      },
      stopAll() {
        if (typeof CodeRuntimeEngine !== "undefined") CodeRuntimeEngine.stopAll();
      }
    };
    
    try {
      if (bid.startsWith("move_") || bid.startsWith("turn_") || bid.startsWith("goto_") || bid === "glide_xy" || bid === "point_dir" || bid === "bounce_edge" || bid.startsWith("set_") || bid.startsWith("change_")) {
        if (typeof BuiltinMotion !== "undefined") {
          await BuiltinMotion.execute(mockEngine, blockToRun, targetItem, evalInput);
        }
      }
      if (bid.startsWith("say_") || bid === "switch_pose" || bid === "switch_costume" || bid === "next_costume" || bid === "show" || bid === "hide") {
        if (typeof BuiltinLooks !== "undefined") {
          await BuiltinLooks.execute(mockEngine, blockToRun, targetItem, evalInput);
        }
      }
      if (typeof BuiltinExtended !== "undefined") {
        await BuiltinExtended.execute(mockEngine, blockToRun, targetItem, evalInput);
      }
      
      if (block.isReporter || block.isBoolean) {
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(540, "sine", 0.04, 0.08);
        }
      }
    } catch (err) {
      console.warn("Error running palette block:", err);
    }
  },

  getBlockHeight(block) {
    if (!block) return 34;
    if (block.hat) return 38;
    if (block.c_block) return 78;
    if (block.e_block) return 130;
    return 34;
  },

  layoutScripts(scripts) {
    if (!Array.isArray(scripts) || scripts.length === 0) return;
    const blockMap = new Map();
    scripts.forEach(b => blockMap.set(b.id, b));

    // Find all root blocks (blocks with no prevId, or whose prevId is not in the current scripts)
    const roots = scripts.filter(b => !b.prevId || !blockMap.has(b.prevId));

    const layoutChain = (startBlock, startX, startY) => {
      let current = startBlock;
      let currX = startX;
      let currY = startY;
      const visited = new Set();

      while (current && !visited.has(current.id)) {
        visited.add(current.id);
        current.x = currX;
        current.y = currY;

        const h = this.getBlockHeight(current);
        currY += h;

        if (current.nextId && blockMap.has(current.nextId)) {
          const nextBlock = blockMap.get(current.nextId);
          nextBlock.prevId = current.id;
          current = nextBlock;
        } else {
          current = null;
        }
      }
    };

    roots.forEach(root => {
      const rx = root.x !== undefined ? root.x : 40;
      const ry = root.y !== undefined ? root.y : 40;
      layoutChain(root, rx, ry);
    });
  },

  renderScripts(container, scripts) {
    container.innerHTML = "";
    if (!Array.isArray(scripts)) return;
    this.layoutScripts(scripts);
    scripts.forEach(block => {
      const element = this.createBlockElement(block, true);
      element.style.position = "absolute";
      element.style.left = (block.x || 0) + "px";
      element.style.top = (block.y || 0) + "px";
      container.appendChild(element);
    });
  },
  renderCategoryBlocks(catId) {
    const container = document.getElementById("code-blocks-list");
    if (!container) return;
    const targetInfo = this.getActiveTargetInfo();
    const blocks = (this.categories[catId] || []).filter(block => this.isBlockAvailableForTarget(block, targetInfo));
    const count = document.getElementById("code-palette-count");
    const title = document.getElementById("code-palette-title");
    if (count) count.textContent = `${blocks.length} ${blocks.length === 1 ? "BLOCK" : "BLOCKS"}`;
    if (title) title.textContent = catId.toUpperCase();
    container.innerHTML = "";
    if (blocks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "code-palette-empty-category";
      empty.innerHTML = `<i class="ph ph-prohibit"></i><span>NO <strong>${catId.toUpperCase()}</strong> BLOCKS</span><small>${targetInfo.isStage ? "Select an object or character to use these blocks." : "These blocks are only available to animated character sprites."}</small>`;
      container.appendChild(empty);
      return;
    }
    blocks.forEach(block => container.appendChild(this.createBlockElement(block)));
  }
};
