/**
 * UNIFIVE Scripting - Studio App Mode Controller
 * Orchestrates block palette, drag/snap interactions, visual code connectors, and mode switching.
 */
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
  objectScripts: {},

  get categories() {
    return BlockPalette.categories;
  },

  getActiveTargetId() {
    return BlockPalette.getActiveTargetId();
  },

  getActiveTargetInfo() {
    return BlockPalette.getActiveTargetInfo();
  },

  isBlockAvailableForTarget(block, targetInfo) {
    return BlockPalette.isBlockAvailableForTarget(block, targetInfo);
  },

  getCurrentScripts() {
    const targetId = this.getActiveTargetId();
    if (!this.objectScripts[targetId]) {
      this.objectScripts[targetId] = [];
    }
    return this.objectScripts[targetId];
  },

  getBlockElement(blockId) {
    return BlockConnectors.getBlockElement(blockId);
  },

  getBranchHeight(startBlockId, map) {
    return BlockConnectors.getBranchHeight(startBlockId, map);
  },

  getFullBlockHeight(block, map) {
    return BlockConnectors.getFullBlockHeight(block, map);
  },

  getBlockDimensions(block) {
    return BlockConnectors.getBlockDimensions(block);
  },

  getConnectedStack(rootBlock) {
    return BlockConnectors.getConnectedStack(rootBlock);
  },

  findSnapTarget(draggedBlock, draggedX, draggedY, excludeIds = new Set(), ignoreTargetId = null) {
    return BlockConnectors.findSnapTarget(draggedBlock, draggedX, draggedY, excludeIds, ignoreTargetId);
  },

  showSnapIndicator(snapTarget) {
    return BlockConnectors.showSnapIndicator(snapTarget);
  },

  layoutConnectedStacks() {
    return BlockConnectors.layoutConnectedStacks();
  },

  createBlockElement(block, isWorkspace = false) {
    return BlockDragSnap.createBlockElement(this, block, isWorkspace);
  },

  addBlockToWorkspace(blockTemplate, x = 60, y = 60, snapTarget = null) {
    return BlockDragSnap.addBlockToWorkspace(this, blockTemplate, x, y, snapTarget);
  },

  deleteSingleBlock(blockId) {
    return BlockDragSnap.deleteSingleBlock(this, blockId);
  },

  renderScriptsForActiveTarget() {
    return BlockDragSnap.renderScriptsForActiveTarget(this);
  },

  setMode(mode, force = false) {
    return ModeSwitcher.setMode(this, mode, force);
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
    if (catKey === "variables" && typeof VariableManager !== "undefined") {
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
          if (typeof SoundEngine !== "undefined") {
            SoundEngine.playChiptuneTone(v.showWatcher ? 640 : 360, "square", 0.04, 0.08);
          }
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
            if (typeof SoundEngine !== "undefined") SoundEngine.playAction("delete");
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
              if (typeof SoundEngine !== "undefined") {
                SoundEngine.playChiptuneTone(880, "triangle", 0.04, 0.15);
                setTimeout(() => SoundEngine.playChiptuneTone(1174, "triangle", 0.06, 0.15), 40);
              }
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

  updateTargetBadge() {
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
          <span class="code-obj-coord">World: <strong>${typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth + 'x' + WorldConfig.worldHeight : '2000x1500'}</strong></span>
          <span class="code-obj-coord">Global Scripts</span>
        </div>
      </div>
    `;
    stageCard.addEventListener("click", () => {
      WorldObjectsManager.selectedId = null;
      this.renderObjectsList();
      this.updateTargetBadge();
      if (typeof SoundEngine !== "undefined") SoundEngine.playAction("select");
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
        if (typeof SoundEngine !== "undefined") SoundEngine.playAction("select");
      });

      listEl.appendChild(card);
    });
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
                if (typeof SoundEngine !== "undefined") {
                  SoundEngine.playChiptuneTone(880, "triangle", 0.04, 0.15);
                  setTimeout(() => SoundEngine.playChiptuneTone(1174, "triangle", 0.06, 0.15), 40);
                }
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

          if (isExtractSingle && block.nextId) {
            const nextB = scripts.find(b => b.id === block.nextId);
            if (nextB) {
              nextB.prevId = detachedFromId;
            }
            block.nextId = null;
          }

          dp.detachedFromId = detachedFromId;

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
          if (typeof SoundEngine !== "undefined") SoundEngine.playAction("delete");
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

          if (typeof SoundEngine !== "undefined") {
            SoundEngine.playChiptuneTone(880, "triangle", 0.04, 0.15);
            setTimeout(() => SoundEngine.playChiptuneTone(1174, "triangle", 0.06, 0.15), 40);
          }

          this.renderScriptsForActiveTarget();
        } else {
          for (let i = 0; i < stackItems.length; i++) {
            if (stackItems[i].elt) {
              stackItems[i].elt.classList.remove("dragging", "delete-candidate");
            }
          }
          if (typeof SoundEngine !== "undefined") {
            SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
          }
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
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(600, "sine", 0.05, 0.08);
      });
    }

    // 5. Clear buttons
    const btnClear = document.getElementById("btn-code-clear");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        const scripts = this.getCurrentScripts();
        scripts.length = 0;
        this.renderScriptsForActiveTarget();
        if (typeof SoundEngine !== "undefined") SoundEngine.playAction("delete");
      });
    }

    this.selectCategory("events");
    this.updateWorkspaceTransform();
  }
};