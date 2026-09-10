/**
 * UNIFIVE Engine - Properties Controller Subsystem
 * Aggregator coordinating object inspector form bindings (properties_bindings.js) and DOM UI synchronization (properties_inspector.js).
 */
const PropertiesController = {
  lockAspect: true,
  isUpdatingUI: false,
  virtualControlKey: null,

  init() {
    if (typeof PropertiesBindings !== "undefined") {
      PropertiesBindings.bindAll(this);
    }
    if (typeof CropController !== "undefined") {
      CropController.init();
    }

    const getSel = () => {
      if (typeof WorldObjectsManager !== "undefined") {
        if (typeof WorldObjectsManager.getSelectedItem === "function") return WorldObjectsManager.getSelectedItem();
        if (typeof WorldObjectsManager.getSelected === "function") return WorldObjectsManager.getSelected();
        return WorldObjectsManager.items.find(i => i.id === WorldObjectsManager.selectedId) || null;
      }
      return null;
    };

    const notify = () => {
      if (typeof WorldObjectsManager !== "undefined") {
        if (typeof WorldObjectsManager.queueRender === "function") WorldObjectsManager.queueRender();
        if (typeof WorldObjectsManager.saveHistory === "function") WorldObjectsManager.saveHistory();
        if (typeof LayersController !== "undefined" && typeof LayersController.update === "function") LayersController.update();
        if (typeof LayerTreeView !== "undefined" && typeof LayerTreeView.refresh === "function") LayerTreeView.refresh();
      }
    };

    const ctrlValText = document.getElementById("prop-control-value-text");
    if (ctrlValText) {
      ctrlValText.addEventListener("input", () => {
        if (this.isUpdatingUI) return;
        const item = getSel();
        if (item && item.type === "control") {
          item.value = ctrlValText.value;
          notify();
        }
      });
    }

    const ctrlValSlider = document.getElementById("prop-control-value-slider");
    const ctrlValNum = document.getElementById("prop-control-value-num");
    const setSlider = (v) => {
      if (this.isUpdatingUI) return;
      const n = Math.max(0, Math.min(100, parseInt(v) || 0));
      if (ctrlValSlider && ctrlValSlider.value != n) ctrlValSlider.value = n;
      if (ctrlValNum && ctrlValNum.value != n) ctrlValNum.value = n;
      const item = getSel();
      if (item && item.type === "control") {
        item.value = n;
        notify();
      }
    };
    if (ctrlValSlider) ctrlValSlider.addEventListener("input", (e) => setSlider(e.target.value));
    if (ctrlValNum) ctrlValNum.addEventListener("input", (e) => setSlider(e.target.value));
    // The Props markup uses `.prop-ctrl-val-chip` / `data-val`.  Keep the
    // attribute selector as well so custom control presets can opt in.
    const ctrlPresets = document.querySelectorAll(".prop-ctrl-val-chip, [data-control-slider-preset]");
    ctrlPresets.forEach((el) => {
      el.addEventListener("click", () => {
        const v = el.getAttribute("data-control-slider-preset") ?? el.getAttribute("data-val");
        setSlider(v);
      });
    });

    const ctrlValToggle = document.getElementById("prop-control-value-toggle");
    const ctrlValToggleLabel = document.getElementById("prop-control-value-toggle-label");
    if (ctrlValToggle) {
      ctrlValToggle.addEventListener("change", () => {
        if (this.isUpdatingUI) return;
        const item = getSel();
        if (item && item.type === "control") {
          item.value = ctrlValToggle.checked;
          if (ctrlValToggleLabel) ctrlValToggleLabel.textContent = ctrlValToggle.checked ? "STATE: ON" : "STATE: OFF";
          notify();
        }
      });
    }
  },

  updateFromSelected(item) {
    this.clearVirtualControl();
    if (typeof PropertiesInspector !== "undefined") {
      PropertiesInspector.updateFromSelected(this, item);
    }
  },

  clearVirtualControl() {
    this.virtualControlKey = null;
    const virtualForm = document.getElementById("prop-vcontrol-inspector");
    if (virtualForm) virtualForm.style.display = "none";
  },

  getVirtualControlColorParts(key) {
    const common = [
      { key: "face", label: "Button face", value: "#e8eef7" },
      { key: "border", label: "Border", value: "#facc15" },
      { key: "text", label: "Text / icon", value: "#3b0713" }
    ];
    if (key === "dpad") return [...common, { key: "center", label: "Center box", value: "#cbd5e1" }];
    if (key === "stick") return [...common, { key: "outer", label: "Outer circle", value: "#f1f5f9" }, { key: "inner", label: "Inner circle", value: "#ffffff" }];
    if (key === "actions") return [...common,
      { key: "triangle", label: "Triangle ring", value: "#059669" },
      { key: "circle", label: "Circle ring", value: "#dc2626" },
      { key: "cross", label: "Cross ring", value: "#2563eb" },
      { key: "square", label: "Square ring", value: "#db2777" }
    ];
    return common;
  },

  updateFromVirtualControl(manager, key) {
    const cfg = manager && manager.currentLayout ? manager.currentLayout[key] : null;
    if (!cfg) return;

    this.virtualControlKey = key;
    const emptyView = document.getElementById("prop-empty-state");
    const objectForm = document.getElementById("prop-inspector-form");
    if (emptyView) emptyView.style.display = "none";
    if (objectForm) objectForm.style.display = "none";

    let virtualForm = document.getElementById("prop-vcontrol-inspector");
    if (!virtualForm) {
      const pane = document.getElementById("tab-pane-properties");
      if (!pane) return;
      virtualForm = document.createElement("div");
      virtualForm.id = "prop-vcontrol-inspector";
      virtualForm.className = "config-scroll-area";
      virtualForm.innerHTML = `
        <div class="prop-item-header">
          <div class="prop-thumb-box"><i class="ph ph-game-controller" style="font-size: 2rem;"></i></div>
          <div class="prop-title-group">
            <div class="prop-name-input">VIRTUAL CONTROL</div>
            <div class="prop-id-row"><span id="prop-vcontrol-id" class="prop-id-badge"></span></div>
          </div>
        </div>
        <div class="config-group">
          <div class="config-group-header"><i class="ph ph-arrows-out-cardinal"></i><span>POSITION</span></div>
          <div class="config-two-col">
            <div class="input-labeled"><span class="input-tag">X</span><input id="prop-vcontrol-x" class="input-pixel" type="number" step="1" /></div>
            <div class="input-labeled"><span class="input-tag">Y</span><input id="prop-vcontrol-y" class="input-pixel" type="number" step="1" /></div>
          </div>
        </div>
        <div class="config-group">
          <div class="config-group-header"><i class="ph ph-arrows-out"></i><span>SCALE</span></div>
          <div class="prop-rotation-row">
            <input id="prop-vcontrol-scale" class="range-pixel" type="range" min="50" max="250" step="1" />
            <div class="input-labeled prop-rot-input-wrap"><input id="prop-vcontrol-scale-num" class="input-pixel" type="number" min="50" max="250" step="1" /><span class="input-tag">%</span></div>
          </div>
        </div>
        <div class="config-group">
          <label class="prop-checkbox-label"><input id="prop-vcontrol-visible" class="pixel-checkbox" type="checkbox" /><span class="prop-checkbox-text">VISIBLE IN GAME</span></label>
        </div>
        <div class="config-group">
          <div class="config-group-header"><i class="ph ph-palette"></i><span>COLORS</span></div>
          <div id="prop-vcontrol-colors" class="config-two-col"></div>
        </div>`;
      pane.appendChild(virtualForm);

      const apply = () => {
        const activeKey = this.virtualControlKey;
        const activeCfg = manager.currentLayout[activeKey];
        if (!activeCfg || this.isUpdatingUI) return;
        const x = document.getElementById("prop-vcontrol-x");
        const y = document.getElementById("prop-vcontrol-y");
        const scale = document.getElementById("prop-vcontrol-scale");
        const visible = document.getElementById("prop-vcontrol-visible");
        if (x) activeCfg.x = parseInt(x.value) || 0;
        if (y) activeCfg.y = parseInt(y.value) || 0;
        if (scale) activeCfg.scale = Math.max(0.5, Math.min(2.5, (parseInt(scale.value) || 100) / 100));
        if (visible) activeCfg.visible = visible.checked;
        manager.applyLayout();
        if (typeof VControlState !== "undefined") VControlState.saveLayout(manager);
      };
      ["prop-vcontrol-x", "prop-vcontrol-y", "prop-vcontrol-scale", "prop-vcontrol-scale-num", "prop-vcontrol-visible"].forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener(id === "prop-vcontrol-visible" ? "change" : "input", () => {
          const scale = document.getElementById("prop-vcontrol-scale");
          const scaleNum = document.getElementById("prop-vcontrol-scale-num");
          if (id === "prop-vcontrol-scale" && scaleNum) scaleNum.value = scale.value;
          if (id === "prop-vcontrol-scale-num" && scale) scale.value = scaleNum.value;
          apply();
        });
      });
      virtualForm.addEventListener("input", (event) => {
        const colorKey = event.target.getAttribute("data-vcontrol-color");
        if (!colorKey || !this.virtualControlKey) return;
        const activeCfg = manager.currentLayout[this.virtualControlKey];
        if (!activeCfg) return;
        activeCfg.colors = activeCfg.colors || {};
        activeCfg.colors[colorKey] = event.target.value;
        manager.applyLayout();
        if (typeof VControlState !== "undefined") VControlState.saveLayout(manager);
      });
    }

    this.isUpdatingUI = true;
    virtualForm.style.display = "flex";
    const label = key.replace(/-/g, " ").toUpperCase();
    const id = document.getElementById("prop-vcontrol-id");
    const x = document.getElementById("prop-vcontrol-x");
    const y = document.getElementById("prop-vcontrol-y");
    const scale = document.getElementById("prop-vcontrol-scale");
    const scaleNum = document.getElementById("prop-vcontrol-scale-num");
    const visible = document.getElementById("prop-vcontrol-visible");
    if (id) id.textContent = `CONTROL: ${label}`;
    if (x) x.value = Math.round(cfg.x || 0);
    if (y) y.value = Math.round(cfg.y || 0);
    const percent = Math.round((cfg.scale || 1) * 100);
    if (scale) scale.value = percent;
    if (scaleNum) scaleNum.value = percent;
    if (visible) visible.checked = cfg.visible !== false;
    const colorPanel = document.getElementById("prop-vcontrol-colors");
    if (colorPanel) {
      const colors = cfg.colors || {};
      colorPanel.innerHTML = this.getVirtualControlColorParts(key).map(part => `
        <label class="input-labeled" title="${part.label}">
          <span class="input-tag">${part.label}</span>
          <input class="input-pixel" type="color" data-vcontrol-color="${part.key}" value="${colors[part.key] || part.value}" />
        </label>`).join("");
    }
    this.isUpdatingUI = false;
  }
};
