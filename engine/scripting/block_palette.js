/**
 * UNIFIVE Scripting - Block Palette & Category Subsystem
 * Defines block categories, generates palette DOM, and filters blocks by target.
 */
(function (global) {
  'use strict';

  const BlockPalette = {
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
      if (scope === "universal" || scope === "global") return true;
      if (targetInfo.isStage) return scope === "global" || scope === "universal";
      if (targetInfo.isProp) return scope === "global" || scope === "universal" || scope === "object";
      if (targetInfo.isSprite) return true;
      return true;
    },

    renderCategories(activeCategory, onSelect) {
      const listEl = document.getElementById("code-categories-list");
      if (!listEl) return;
      listEl.innerHTML = "";

      const catMeta = [
        { id: "events", name: "EVENTS", color: "#f59e0b" },
        { id: "motion", name: "MOTION", color: "#3b82f6" },
        { id: "looks", name: "LOOKS", color: "#a855f7" },
        { id: "sound", name: "SOUND", color: "#ec4899" },
        { id: "control", name: "CONTROL", color: "#10b981" },
        { id: "sensing", name: "SENSING", color: "#0284c7" },
        { id: "operators", name: "OPERATORS", color: "#22c55e" },
        { id: "variables", name: "VARS", color: "#f97316" }
      ];

      catMeta.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = `code-cat-btn ${cat.id === activeCategory ? "active" : ""}`;
        btn.dataset.category = cat.id;
        btn.title = cat.name;
        btn.style.setProperty("--cat-color", cat.color);

        btn.innerHTML = `
          <span class="code-cat-box" style="background-color: ${cat.color};"></span>
          <span>${cat.name}</span>
        `;

        btn.addEventListener("click", () => {
          if (onSelect) onSelect(cat.id);
        });

        listEl.appendChild(btn);
      });
    },

    renderPaletteBlocks(activeCategory) {
      const listEl = document.getElementById("code-blocks-list");
      const titleEl = document.getElementById("code-palette-title");
      const dotEl = document.getElementById("code-palette-cat-dot");
      const countEl = document.getElementById("code-palette-count");
      if (!listEl) return;

      listEl.innerHTML = "";
      const blocks = this.categories[activeCategory] || [];
      const targetInfo = this.getActiveTargetInfo();

      const catMeta = {
        events: { name: "EVENTS", color: "#f59e0b" },
        motion: { name: "MOTION", color: "#3b82f6" },
        looks: { name: "LOOKS", color: "#a855f7" },
        sound: { name: "SOUND", color: "#ec4899" },
        control: { name: "CONTROL", color: "#10b981" },
        sensing: { name: "SENSING", color: "#0284c7" },
        operators: { name: "OPERATORS", color: "#22c55e" },
        variables: { name: "VARIABLES", color: "#f97316" }
      };

      const meta = catMeta[activeCategory] || { name: activeCategory.toUpperCase(), color: "#f59e0b" };
      if (titleEl) titleEl.textContent = meta.name;
      if (dotEl) dotEl.style.backgroundColor = meta.color;
      if (countEl) countEl.textContent = `${blocks.length} BLOCKS`;

      blocks.forEach(blockDef => {
        const isAvail = this.isBlockAvailableForTarget(blockDef, targetInfo);
        const itemEl = document.createElement("div");
        itemEl.className = `palette-block-wrapper ${!isAvail ? "block-disabled" : ""}`;
        itemEl.title = !isAvail ? `Not applicable to ${targetInfo.name}` : blockDef.name;

        const dom = this.createBlockDOM(blockDef, false);
        itemEl.appendChild(dom);

        if (isAvail) {
          itemEl.setAttribute("draggable", "true");
          itemEl.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", JSON.stringify(blockDef));
            e.dataTransfer.effectAllowed = "copy";
            if (typeof AppModeController !== "undefined") {
              AppModeController.draggedPaletteBlock = blockDef;
            }
          });
        }

        listEl.appendChild(itemEl);
      });
    },

    createBlockDOM(block, isPlaced = false) {
      const container = document.createElement("div");
      const isReporter = !!(block.isReporter || (block.id && block.id.startsWith("op_") && block.isReporter));
      const isBoolean = !!(block.isBoolean || block.boolean || block.color === "#0284c7" || (block.id && block.id.startsWith("op_") && (block.isBoolean || block.opType)));

      let blockClasses = "code-block-item";
      if (block.hat) blockClasses += " hat-block";
      if (block.c_block) blockClasses += " c-block";
      if (block.e_block) blockClasses += " e-block";
      if (block.cap) blockClasses += " cap-block";
      if (isReporter) blockClasses += " reporter-block";
      if (isBoolean) blockClasses += " boolean-block";
      if (isPlaced) blockClasses += " placed-block";

      container.className = blockClasses;
      container.dataset.blockId = block.id || block.blockId;
      container.style.setProperty("--block-color", block.color || "#f59e0b");

      let innerHTML = "";
      if (block.icon) {
        innerHTML += `<i class="ph ${block.icon} code-block-icon"></i>`;
      }

      innerHTML += `<span class="code-block-label">${block.name || ""}</span>`;

      if (isPlaced) {
        innerHTML += `<button class="btn-block-delete" title="Delete Block">✕</button>`;
      }

      container.innerHTML = innerHTML;
      return container;
    },

    renderObjectsList() {
      const listEl = document.getElementById("code-objects-list");
      if (!listEl) return;
      listEl.innerHTML = "";

      const activeId = this.getActiveTargetId();

      // 1. Stage Object (Global)
      const stageEl = document.createElement("div");
      stageEl.className = `code-object-pill ${activeId === "global_stage" ? "active" : ""}`;
      stageEl.dataset.targetId = "global_stage";
      stageEl.innerHTML = `<i class="ph ph-globe"></i><span>STAGE (GLOBAL)</span>`;
      stageEl.addEventListener("click", () => {
        if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.clearSelection();
        if (typeof AppModeController !== "undefined") AppModeController.onTargetChanged("global_stage");
      });
      listEl.appendChild(stageEl);

      // 2. Placed Sprites & Props
      if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
        WorldObjectsManager.items.forEach(item => {
          const pill = document.createElement("div");
          pill.className = `code-object-pill ${activeId === item.id ? "active" : ""}`;
          pill.dataset.targetId = item.id;
          const icon = item.isPlayable ? "ph-crown" : (item.type === "sprite" ? "ph-person-simple-walk" : "ph-cube");
          pill.innerHTML = `<i class="ph ${icon}"></i><span>${item.name || "Object"}</span>`;
          pill.addEventListener("click", () => {
            WorldObjectsManager.selectItem(item.id);
            if (typeof AppModeController !== "undefined") AppModeController.onTargetChanged(item.id);
          });
          listEl.appendChild(pill);
        });
      }
    },

    updateTargetBadge() {
      const badgeEl = document.getElementById("code-current-target-name");
      const iconEl = document.getElementById("code-current-target-icon");
      if (!badgeEl) return;

      const targetInfo = this.getActiveTargetInfo();
      badgeEl.textContent = targetInfo.name.toUpperCase();
      if (iconEl) {
        iconEl.className = targetInfo.isStage ? "ph ph-globe" : (targetInfo.isSprite ? "ph ph-person-simple-walk" : "ph-cube");
      }
    }
  };

  global.BlockPalette = BlockPalette;
})(typeof window !== 'undefined' ? window : globalThis);
