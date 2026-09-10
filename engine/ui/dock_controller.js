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
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dLeft = clientX;
    const dRight = w - clientX;
    const dTop = clientY;
    const dBottom = h - clientY;
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
      z.classList.toggle("active-zone", z.getAttribute("data-zone") === pos);
    }
  }
};
