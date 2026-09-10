/**
 * UNIFIVE Engine - Lifecycle Aggregator
 * Root p5.js lifecycle entry points: setup(), draw(), and windowResized().
 * Delegates to lifecycle_setup.js, lifecycle_draw.js, and lifecycle_events.js.
 */
function setup() {
  // Initialize non-blocking background store (IndexedDB)
  if (typeof AsyncSceneStore !== "undefined") {
    AsyncSceneStore.init().then(() => {
      const activeView = (typeof ViewController !== "undefined" && ViewController.currentView) || "sidefacing";
      AsyncSceneStore.loadSceneToActive(activeView);
    });
  }

  if (typeof WorldConfig !== "undefined") WorldConfig.init();
  const dims = (typeof getStageDimensions === "function") ? getStageDimensions() : { w: window.innerWidth, h: window.innerHeight };
  mainCanvas = createCanvas(dims.w, dims.h);
  if (typeof WorldConfig !== "undefined") WorldConfig.clampPan();
  
  const container = document.getElementById("canvas-container");
  if (container) {
    mainCanvas.parent("canvas-container");
  }
  // Crisp pixel rendering
  noSmooth();
  pixelDensity(1);

  if (typeof initUIEventListeners === "function") initUIEventListeners();
  if (typeof ViewController !== "undefined") ViewController.init();
  if (typeof MobileNavigationController !== "undefined") MobileNavigationController.init();
  if (typeof TabController !== "undefined") TabController.init();
  if (typeof CreatePanelController !== "undefined") CreatePanelController.init();
  if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.init();
  if (typeof PropertiesController !== "undefined") PropertiesController.init();
  if (typeof LayersController !== "undefined") LayersController.init();
  if (typeof ConfigController !== "undefined") ConfigController.init();
  if (typeof SpritePosesController !== "undefined") SpritePosesController.init();
  if (typeof MouseToolController !== "undefined") MouseToolController.init();
  if (typeof SplitterController !== "undefined") SplitterController.init();
  if (typeof AppModeController !== "undefined") AppModeController.init();
  if (typeof VariableManager !== "undefined") VariableManager.init();
  if (typeof CodeRuntimeEngine !== "undefined") CodeRuntimeEngine.init();
  if (typeof U5Compiler !== "undefined") U5Compiler.init();
  if (typeof HistoryManager !== "undefined") HistoryManager.updateUI();
  if (typeof LayersController !== "undefined") LayersController.update();

  // Mouse listeners on canvas
  if (mainCanvas && mainCanvas.elt && typeof bindCanvasEvents === "function") {
    bindCanvasEvents(mainCanvas.elt);
  }
}

function draw() {
  if (typeof drawStageCanvas === "function") {
    drawStageCanvas();
  }
}

function windowResized() {
  if (typeof resizeStageCanvas === "function") {
    resizeStageCanvas();
  }
}
