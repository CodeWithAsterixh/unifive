const MouseToolController = {
  activeTool: "move", // "move" | "select"
  showGrid: true,
  dockPosition: "bottom", // "bottom" | "top" | "left" | "right"

  init() {
    const btnMove = document.getElementById("btn-tool-move");
    const btnSelect = document.getElementById("btn-tool-select");
    const btnGrid = document.getElementById("btn-toggle-grid");

    if (btnMove) {
      btnMove.addEventListener("click", () => this.setTool("move"));
    }
    if (btnSelect) {
      btnSelect.addEventListener("click", () => this.setTool("select"));
    }
    if (btnGrid) {
      btnGrid.addEventListener("click", () => this.toggleGrid());
    }

    this.updateCursor();
    this.initDockSnapping();
  },

  initDockSnapping() {
    const dock = document.getElementById("floating-dock");
    if (!dock) return;

    // Load saved position
    const saved = localStorage.getItem("u5_dock_position");
    if (saved && ["bottom", "top", "left", "right"].includes(saved)) {
      this.setDockPosition(saved);
    } else {
      this.setDockPosition("bottom");
    }

    // Drag / Snap Handle
    const handle = document.getElementById("dock-drag-handle");
    if (!handle) return;

    let isDraggingDock = false;
    let startX = 0;
    let startY = 0;
    let hasMovedSignificantly = false;

    const onStart = (e, clientX, clientY) => {
      isDraggingDock = true;
      startX = clientX;
      startY = clientY;
      hasMovedSignificantly = false;
      dock.classList.add("dock-dragging");

      const indicators = document.getElementById("dock-snap-indicators");
      if (indicators) {
        indicators.style.display = "block";
        this.updateSnapZoneHighlight(this.dockPosition);
      }

      e.preventDefault();
      e.stopPropagation();
    };

    handle.addEventListener("mousedown", (e) => onStart(e, e.clientX, e.clientY));
    handle.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) onStart(e, e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    // Click on handle cycles snap position clockwise (Bottom -> Left -> Top -> Right -> Bottom)
    handle.addEventListener("click", (e) => {
      if (!hasMovedSignificantly) {
        this.cycleDockPosition();
      }
    });

    const onMove = (clientX, clientY) => {
      if (!isDraggingDock) return;
      if (Math.hypot(clientX - startX, clientY - startY) > 8) {
        hasMovedSignificantly = true;
      }

      const stagePane = document.getElementById("stage-pane");
      const rect = stagePane ? stagePane.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

      const relX = (clientX - rect.left) / Math.max(1, rect.width);
      const relY = (clientY - rect.top) / Math.max(1, rect.height);

      // Determine closest snap anchor based on cursor quadrant / proximity to stage edges
      const distTop = relY;
      const distBottom = 1 - relY;
      const distLeft = relX;
      const distRight = 1 - relX;

      const minDist = Math.min(distTop, distBottom, distLeft, distRight);
      let target = "bottom";
      if (minDist === distTop) target = "top";
      else if (minDist === distBottom) target = "bottom";
      else if (minDist === distLeft) target = "left";
      else if (minDist === distRight) target = "right";

      this.updateSnapZoneHighlight(target);

      if (target !== this.dockPosition) {
        this.setDockPosition(target);
      }
    };

    const onEnd = () => {
      if (isDraggingDock) {
        isDraggingDock = false;
        dock.classList.remove("dock-dragging");
        const indicators = document.getElementById("dock-snap-indicators");
        if (indicators) indicators.style.display = "none";
        this.saveDockPosition();
      }
    };

    window.addEventListener("mousemove", (e) => {
      if (isDraggingDock) onMove(e.clientX, e.clientY);
    });

    window.addEventListener("touchmove", (e) => {
      if (isDraggingDock && e.touches.length > 0) {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);
  },

  updateSnapZoneHighlight(activeZone) {
    document.querySelectorAll(".dock-snap-zone").forEach(zone => {
      const isAct = zone.getAttribute("data-target") === activeZone;
      zone.classList.toggle("active", isAct);
    });
  },

  cycleDockPosition() {
    const positions = ["bottom", "left", "top", "right"];
    const nextIdx = (positions.indexOf(this.dockPosition) + 1) % positions.length;
    this.setDockPosition(positions[nextIdx]);
    this.saveDockPosition();
    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(520 + nextIdx * 70, "square", 0.03, 0.06);
    }
  },

  setDockPosition(pos) {
    if (!["bottom", "top", "left", "right"].includes(pos)) pos = "bottom";
    this.dockPosition = pos;
    const dock = document.getElementById("floating-dock");
    if (!dock) return;

    dock.classList.remove("dock-pos-bottom", "dock-pos-top", "dock-pos-left", "dock-pos-right");
    dock.classList.add(`dock-pos-${pos}`);

    const dragIcon = document.getElementById("dock-drag-icon");
    if (dragIcon) {
      dragIcon.className = (pos === "left" || pos === "right") ? "ph ph-dots-six" : "ph ph-dots-six-vertical";
    }
  },

  saveDockPosition() {
    try {
      localStorage.setItem("u5_dock_position", this.dockPosition);
    } catch (err) {
      console.warn("Failed to save dock position:", err);
    }
  },

  setTool(tool) {
    this.activeTool = tool;
    const btnMove = document.getElementById("btn-tool-move");
    const btnSelect = document.getElementById("btn-tool-select");

    if (btnMove) btnMove.classList.toggle("active", tool === "move");
    if (btnSelect) btnSelect.classList.toggle("active", tool === "select");

    this.updateCursor();
    const freqMap = { move: 440, select: 560 };
    SoundEngine.playChiptuneTone(freqMap[tool] || 440, "square", 0.05, 0.08);
  },

  toggleGrid() {
    this.showGrid = !this.showGrid;
    const btn = document.getElementById("btn-toggle-grid");
    const icon = document.getElementById("grid-icon");

    if (btn) btn.classList.toggle("active", this.showGrid);
    if (icon) icon.className = this.showGrid ? "ph ph-grid-four" : "ph ph-square";

    SoundEngine.playChiptuneTone(this.showGrid ? 600 : 300, "square", 0.06, 0.08);
  },

  updateCursor() {
    const container = document.getElementById("canvas-container");
    if (container) {
      container.classList.remove("cursor-move", "cursor-select", "panning");
      container.classList.add(`cursor-${this.activeTool}`);
    }
  }
};

// ============================================================================
// 3. 8-BIT CHIPTUNE SOUND ENGINE (Web Audio API)
// ============================================================================