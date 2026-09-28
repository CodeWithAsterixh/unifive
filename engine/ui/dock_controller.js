/**
 * UNIFIVE Engine - Dock Controller Subsystem
 */
const DockController = {
  dockPosition: "bottom",
  init() {
    const dock = document.getElementById("floating-dock");
    const handle = document.getElementById("dock-drag-handle");
    if (dock && handle && typeof DockDragHandler !== "undefined") {
      DockDragHandler.initDrag(dock, handle, this);
    }
  },
  setPosition(pos) {
    const dock = document.getElementById("floating-dock");
    if (!dock) return;
    this.dockPosition = pos;
    dock.classList.remove("dock-pos-bottom", "dock-pos-top", "dock-pos-left", "dock-pos-right");
    dock.classList.add("dock-pos-" + pos);
  },
  cyclePosition() {
    const order = ["bottom", "left", "top", "right"];
    const curIdx = order.indexOf(this.dockPosition);
    const nextPos = order[(curIdx + 1) % order.length];
    this.setPosition(nextPos);
  },
  calculateSnapZone(clientX, clientY) {
    if (clientX === undefined || clientY === undefined || isNaN(clientX) || isNaN(clientY)) {
      return this.dockPosition || "bottom";
    }
    const w = window.innerWidth || 800;
    const h = window.innerHeight || 600;
    const dLeft = Math.max(0, clientX);
    const dRight = Math.max(0, w - clientX);
    const dTop = Math.max(0, clientY);
    const dBottom = Math.max(0, h - clientY);
    const minD = Math.min(dLeft, dRight, dTop, dBottom);
    if (minD === dLeft) return "left";
    if (minD === dRight) return "right";
    if (minD === dTop) return "top";
    return "bottom";
  },
  updateSnapZoneHighlight(pos) {
    const indicators = document.getElementById("dock-snap-indicators");
    if (!indicators) return;
    const zones = indicators.querySelectorAll(".dock-snap-zone");
    for (const z of zones) {
      const match = z.getAttribute("data-target") === pos || z.getAttribute("data-zone") === pos || z.classList.contains("snap-" + pos);
      z.classList.toggle("active", match);
      z.classList.toggle("active-zone", match);
    }
  }
};

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => DockController.init());
  } else {
    setTimeout(() => DockController.init(), 0);
  }
}
