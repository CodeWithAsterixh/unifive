/**
 * UNIFIVE Scripting - Block Drag & Drop and Snap Interactivity Subsystem
 * Workspace DOM tree rendering, drag-and-drop movement, snapping, and block deletion.
 */
(function (global) {
  'use strict';

  const BlockDragSnap = {
    createBlockElement(controller, block, isWorkspace = false) {
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
      const activeTargetId = controller.getActiveTargetId();
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
          const nestedEl = this.createBlockElement(controller, condData, false);
          nestedEl.classList.add("nested-condition-block", "boolean-block");
          nestedEl.classList.remove("stack-block");
          nestedEl.querySelectorAll(".code-block-delete-btn").forEach(b => b.remove());

          if (isWorkspace) {
            nestedEl.addEventListener("mousedown", (e) => {
              if (e.target.closest(".nested-block-eject-btn")) return;
              e.stopPropagation();
              e.preventDefault();

              const condToExtract = JSON.parse(JSON.stringify(block.conditionBlock));
              delete block.conditionBlock;

              const dropZone = document.getElementById("code-drop-zone");
              const rect = dropZone ? dropZone.getBoundingClientRect() : { left: 0, top: 0 };
              const worldX = Math.round((e.clientX - rect.left - controller.panX) / controller.zoom);
              const worldY = Math.round((e.clientY - rect.top - controller.panY) / controller.zoom);

              condToExtract.id = condToExtract.id || ("block_" + Date.now() + "_" + Math.floor(Math.random() * 10000));
              condToExtract.x = worldX - 20;
              condToExtract.y = worldY - 10;
              condToExtract.nextId = null;
              condToExtract.prevId = null;
              condToExtract.isBoolean = true;

              const scripts = controller.getCurrentScripts();
              scripts.push(condToExtract);
              this.renderScriptsForActiveTarget(controller);

              const extractedEl = BlockConnectors.getBlockElement(condToExtract.id);
              if (extractedEl) {
                extractedEl.classList.add("dragging");
                controller.draggedPlacedBlock = {
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
              if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(740, "triangle", 0.04, 0.1);
            });

            const ejectBtn = document.createElement("button");
            ejectBtn.className = "nested-block-eject-btn";
            ejectBtn.innerHTML = "✕";
            ejectBtn.title = "Remove Condition Block";
            ejectBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              delete block.conditionBlock;
              this.renderScriptsForActiveTarget(controller);
              if (typeof SoundEngine !== "undefined") SoundEngine.playAction("delete");
            });
            nestedEl.appendChild(ejectBtn);
          }
          slotEl.appendChild(nestedEl);
        }
      }

      // Attach left condition block
      if (block.leftConditionBlock) {
        const slotEl = blockEl.querySelector('.code-condition-slot[data-slot="left"]');
        if (slotEl) {
          slotEl.innerHTML = "";
          const condData = { ...block.leftConditionBlock, isBoolean: true };
          const nestedEl = this.createBlockElement(controller, condData, false);
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
              const worldX = Math.round((e.clientX - rect.left - controller.panX) / controller.zoom);
              const worldY = Math.round((e.clientY - rect.top - controller.panY) / controller.zoom);

              condToExtract.id = condToExtract.id || ("block_" + Date.now() + "_" + Math.floor(Math.random() * 10000));
              condToExtract.x = worldX - 20;
              condToExtract.y = worldY - 10;
              condToExtract.nextId = null;
              condToExtract.prevId = null;
              condToExtract.isBoolean = true;

              const scripts = controller.getCurrentScripts();
              scripts.push(condToExtract);
              this.renderScriptsForActiveTarget(controller);

              const extractedEl = BlockConnectors.getBlockElement(condToExtract.id);
              if (extractedEl) {
                extractedEl.classList.add("dragging");
                controller.draggedPlacedBlock = {
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
              if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(740, "triangle", 0.04, 0.1);
            });

            const ejectBtn = document.createElement("button");
            ejectBtn.className = "nested-block-eject-btn";
            ejectBtn.innerHTML = "✕";
            ejectBtn.title = "Remove Left Condition";
            ejectBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              delete block.leftConditionBlock;
              this.renderScriptsForActiveTarget(controller);
              if (typeof SoundEngine !== "undefined") SoundEngine.playAction("delete");
            });
            nestedEl.appendChild(ejectBtn);
          }
          slotEl.appendChild(nestedEl);
        }
      }

      // Attach right condition block
      if (block.rightConditionBlock) {
        const slotEl = blockEl.querySelector('.code-condition-slot[data-slot="right"]');
        if (slotEl) {
          slotEl.innerHTML = "";
          const condData = { ...block.rightConditionBlock, isBoolean: true };
          const nestedEl = this.createBlockElement(controller, condData, false);
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
              const worldX = Math.round((e.clientX - rect.left - controller.panX) / controller.zoom);
              const worldY = Math.round((e.clientY - rect.top - controller.panY) / controller.zoom);

              condToExtract.id = condToExtract.id || ("block_" + Date.now() + "_" + Math.floor(Math.random() * 10000));
              condToExtract.x = worldX - 20;
              condToExtract.y = worldY - 10;
              condToExtract.nextId = null;
              condToExtract.prevId = null;
              condToExtract.isBoolean = true;

              const scripts = controller.getCurrentScripts();
              scripts.push(condToExtract);
              this.renderScriptsForActiveTarget(controller);

              const extractedEl = BlockConnectors.getBlockElement(condToExtract.id);
              if (extractedEl) {
                extractedEl.classList.add("dragging");
                controller.draggedPlacedBlock = {
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
              if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(740, "triangle", 0.04, 0.1);
            });

            const ejectBtn = document.createElement("button");
            ejectBtn.className = "nested-block-eject-btn";
            ejectBtn.innerHTML = "✕";
            ejectBtn.title = "Remove Right Condition";
            ejectBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              delete block.rightConditionBlock;
              this.renderScriptsForActiveTarget(controller);
              if (typeof SoundEngine !== "undefined") SoundEngine.playAction("delete");
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

      // Save inputs on change
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

    addBlockToWorkspace(controller, blockTemplate, x = 60, y = 60, snapTarget = null) {
      const scripts = controller.getCurrentScripts();
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
          this.renderScriptsForActiveTarget(controller);
          return;
        }
        if (snapTarget.position === "left_condition") {
          snapTarget.target.leftConditionBlock = JSON.parse(JSON.stringify(placedBlock));
          delete snapTarget.target.leftConditionBlock.x;
          delete snapTarget.target.leftConditionBlock.y;
          delete snapTarget.target.leftConditionBlock.nextId;
          delete snapTarget.target.leftConditionBlock.prevId;
          this.renderScriptsForActiveTarget(controller);
          return;
        }
        if (snapTarget.position === "right_condition") {
          snapTarget.target.rightConditionBlock = JSON.parse(JSON.stringify(placedBlock));
          delete snapTarget.target.rightConditionBlock.x;
          delete snapTarget.target.rightConditionBlock.y;
          delete snapTarget.target.rightConditionBlock.nextId;
          delete snapTarget.target.rightConditionBlock.prevId;
          this.renderScriptsForActiveTarget(controller);
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
      this.renderScriptsForActiveTarget(controller);
      if (!snapTarget && typeof SoundEngine !== "undefined") {
        SoundEngine.playChiptuneTone(680, "square", 0.05, 0.08);
      }
    },

    deleteSingleBlock(controller, blockId) {
      const scripts = controller.getCurrentScripts();
      const idx = scripts.findIndex(b => b.id === blockId);
      if (idx === -1) return;

      const block = scripts[idx];
      const prevBlock = block.prevId ? scripts.find(b => b.id === block.prevId) : null;
      const nextBlock = block.nextId ? scripts.find(b => b.id === block.nextId) : null;
      const parentC = block.parentCBlockId ? scripts.find(b => b.id === block.parentCBlockId) : null;
      const parentE = block.parentEBlockId ? scripts.find(b => b.id === block.parentEBlockId) : null;

      if (prevBlock && prevBlock.nextId === block.id) {
        prevBlock.nextId = nextBlock ? nextBlock.id : null;
      }
      if (parentC && parentC.childId === block.id) {
        parentC.childId = nextBlock ? nextBlock.id : null;
      }
      if (parentE) {
        if (parentE.childId_if === block.id) parentE.childId_if = nextBlock ? nextBlock.id : null;
        if (parentE.childId_else === block.id) parentE.childId_else = nextBlock ? nextBlock.id : null;
      }

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

      scripts.splice(idx, 1);
      this.renderScriptsForActiveTarget(controller);
      if (typeof SoundEngine !== "undefined") SoundEngine.playAction("delete");
    },

    renderScriptsForActiveTarget(controller) {
      const workspace = document.getElementById("code-workspace-blocks");
      const emptyState = document.getElementById("code-workspace-empty");
      if (!workspace) return;

      const scripts = controller.getCurrentScripts();
      if (typeof U5Compiler !== "undefined") U5Compiler.updateStats();

      if (scripts.length === 0) {
        workspace.innerHTML = "";
        if (emptyState) emptyState.style.display = "flex";
        return;
      }

      if (emptyState) emptyState.style.display = "none";
      workspace.innerHTML = "";

      scripts.forEach((block) => {
        const blockEl = this.createBlockElement(controller, block, true);
        blockEl.style.left = `${block.x}px`;
        blockEl.style.top = `${block.y}px`;

        const deleteBtn = blockEl.querySelector(".code-block-delete-btn");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.deleteSingleBlock(controller, block.id);
          });
        }

        blockEl.addEventListener("mousedown", (e) => {
          if (e.target.closest(".code-block-delete-btn") || e.target.closest(".code-block-input") || e.target.closest(".code-block-select") || e.target.closest(".nested-block-eject-btn")) {
            return;
          }
          e.stopPropagation();

          const isExtractSingle = e.altKey || e.shiftKey;
          const stack = isExtractSingle ? [block] : BlockConnectors.getConnectedStack(block);
          const stackItems = stack.map(b => {
            const el = BlockConnectors.getBlockElement(b.id);
            return {
              block: b,
              elt: el,
              initialX: b.x,
              initialY: b.y
            };
          });

          controller.draggedPlacedBlock = {
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

      BlockConnectors.layoutConnectedStacks();
      requestAnimationFrame(() => BlockConnectors.layoutConnectedStacks());
    }
  };

  global.BlockDragSnap = BlockDragSnap;
})(typeof window !== 'undefined' ? window : globalThis);
