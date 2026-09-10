/**
 * UNIFIVE Engine - Splitter Controller Subsystem
 */
const SplitterController = {
  init() {
    const splitter = document.getElementById("pane-splitter");
    const workspace = document.getElementById("workspace-container") || document.body;
    const controlsPane = document.getElementById("controls-pane");
    const codeToolboxPane = document.getElementById("code-toolbox-pane");
    if (!splitter || !controlsPane) return;

    let isResizing = false;
    const getActivePane = () => document.body.classList.contains("mode-code") ? codeToolboxPane : controlsPane;

    const savedWidth = localStorage.getItem("unifive_canvas_split_width") || localStorage.getItem("unifive_split_width");
    if (savedWidth) controlsPane.style.width = savedWidth;

    splitter.addEventListener("mousedown", (e) => {
      isResizing = true;
      splitter.classList.add("dragging");
      document.body.classList.add("resizing-splitter");
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const rect = workspace.getBoundingClientRect();
      const activePane = getActivePane();
      const minWidth = document.body.classList.contains("mode-code") ? 360 : 220;
      const maxWidth = Math.max(minWidth, rect.width - 200);
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - rect.left));
      if (activePane) activePane.style.width = newWidth + "px";
      if (typeof resizeStageCanvas === "function") resizeStageCanvas();
    });

    window.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        splitter.classList.remove("dragging");
        document.body.classList.remove("resizing-splitter");
        const activePane = getActivePane();
        if (activePane) {
          const key = document.body.classList.contains("mode-code") ? "unifive_code_split_width" : "unifive_canvas_split_width";
          localStorage.setItem(key, activePane.style.width);
        }
        if (typeof resizeStageCanvas === "function") resizeStageCanvas();
      }
    });
  }
};
