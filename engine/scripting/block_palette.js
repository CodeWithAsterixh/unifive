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
      { id: "bounce_edge", name: "if on edge, bounce", scope: "sprite", color: "#3b82f6", icon: "ph-arrows-left-right" }
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
      { id: "set_var", name: "set variable", scope: "global", color: "#f97316", icon: "ph-textbox" },
      { id: "change_var", name: "change variable", scope: "global", color: "#f97316", icon: "ph-plus-circle" },
      { id: "show_var", name: "show variable", scope: "global", color: "#f97316", icon: "ph-eye" },
      { id: "hide_var", name: "hide variable", scope: "global", color: "#f97316", icon: "ph-eye-slash" }
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
    let formattedName = String(block.name || block.id)
      .replace(/\((.*?)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    if (block.options) {
      const options = block.options.map(option => `<option value="${option}">${option}</option>`).join("");
      formattedName = formattedName.replace(/\[(.*?)\]/g, `<select class="code-block-select">${options}</select>`);
    } else {
      formattedName = formattedName.replace(/\[(.*?)\]/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    }
    const deleteButton = workspace ? '<button class="code-block-delete-btn" title="Delete Block">x</button>' : "";
    if (block.e_block) {
      element.innerHTML = `<div class="e-block-header"><i class="ph ${block.icon || "ph-git-branch"}"></i><span>${formattedName}</span>${deleteButton}</div><div class="e-block-body e-block-body-if"></div><div class="e-block-divider"><span>else</span></div><div class="e-block-body e-block-body-else"></div><div class="e-block-footer"></div>`;
    } else if (block.c_block) {
      element.innerHTML = `<div class="c-block-header"><i class="ph ${block.icon || "ph-code"}"></i><span>${formattedName}</span>${deleteButton}</div><div class="c-block-body"></div><div class="c-block-footer"></div>`;
    } else {
      element.innerHTML = `<i class="ph ${block.icon || "ph-code"}"></i><span>${formattedName}</span>${deleteButton}`;
    }
    if (!workspace) {
      element.addEventListener("mousedown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        if (typeof BlockDragSnap !== "undefined") BlockDragSnap.startPaletteDrag(block, event);
      });
    }
    return element;
  },

  renderScripts(container, scripts) {
    container.innerHTML = "";
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
