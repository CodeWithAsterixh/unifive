/**
 * UNIFIVE Engine - Properties Controller Subsystem
 * Aggregator coordinating object inspector form bindings (properties_bindings.js) and DOM UI synchronization (properties_inspector.js).
 */
const PropertiesController = {
  lockAspect: true,
  isUpdatingUI: false,
  virtualControlKey: null,
  virtualControlPartKey: null,

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
    this.virtualControlPartKey = null;
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

  updateFromVirtualControl(manager, key, partKey = null) {
    const cfg = manager && manager.currentLayout ? manager.currentLayout[key] : null;
    if (!cfg) return;
    const partDefinition = partKey && typeof VControlState !== "undefined" ? VControlState.getPart(key, partKey) : null;
    const partCfg = partDefinition ? ((cfg.parts || {})[partKey] || {}) : null;

    this.virtualControlKey = key;
    this.virtualControlPartKey = partDefinition ? partKey : null;
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
        <div class="config-group" id="prop-vcontrol-position-group">
          <div class="config-group-header"><i class="ph ph-arrows-out-cardinal"></i><span>POSITION</span></div>
          <div class="config-two-col">
            <div class="input-labeled"><span class="input-tag">X</span><input id="prop-vcontrol-x" class="input-pixel" type="number" step="1" /></div>
            <div class="input-labeled"><span class="input-tag">Y</span><input id="prop-vcontrol-y" class="input-pixel" type="number" step="1" /></div>
          </div>
          <div class="size-presets prop-rotation-presets" style="margin-top: 8px;"><button class="preset-chip" data-vcontrol-preset="reset-x">Reset X</button><button class="preset-chip" data-vcontrol-preset="reset-y">Reset Y</button></div>
        </div>
          <div class="config-group prop-vcontrol-section" id="prop-vcontrol-scale-group">
          <div class="config-group-header"><i class="ph ph-arrows-out"></i><span>SCALE</span></div>
          <div class="prop-rotation-row">
            <input id="prop-vcontrol-scale" class="range-pixel" type="range" min="50" max="250" step="1" />
            <div class="input-labeled prop-rot-input-wrap"><input id="prop-vcontrol-scale-num" class="input-pixel" type="number" min="50" max="250" step="1" /><span class="input-tag">%</span></div>
          </div>
          <div class="size-presets prop-rotation-presets" style="margin-top: 8px;"><button class="preset-chip" data-vcontrol-preset="scale" data-value="75">75%</button><button class="preset-chip" data-vcontrol-preset="scale" data-value="100">100%</button><button class="preset-chip" data-vcontrol-preset="scale" data-value="125">125%</button></div>
        </div>
          <div class="config-group prop-vcontrol-section" id="prop-vcontrol-visibility-group">
          <label class="prop-checkbox-label"><input id="prop-vcontrol-visible" class="pixel-checkbox" type="checkbox" /><span id="prop-vcontrol-visible-label" class="prop-checkbox-text">SHOW CONTROL IN GAME</span></label>
        </div>
        <div class="config-group prop-vcontrol-section" id="prop-vcontrol-content-group" style="display: none;">
          <div class="config-group-header"><i class="ph ph-text-t"></i><span>PART CONTENT</span></div>
          <div class="input-labeled"><span class="input-tag">MODE</span><select id="prop-vcontrol-content-mode" class="input-pixel"><option value="icon">Built-in icon / label</option><option value="text">Custom text</option><option value="image">Image URL</option></select></div>
          <div id="prop-vcontrol-icon-wrap" class="input-labeled" style="margin-top: 8px;"><span class="input-tag">ICON</span><select id="prop-vcontrol-icon" class="input-pixel"><option value="caret-up">Up caret</option><option value="caret-left">Left caret</option><option value="caret-right">Right caret</option><option value="caret-down">Down caret</option><option value="circle">Circle</option><option value="x">Cross</option><option value="square">Square</option><option value="triangle">Triangle</option><option value="star">Star</option></select></div>
          <div id="prop-vcontrol-text-wrap" class="input-labeled" style="margin-top: 8px; display: none;"><span class="input-tag">TEXT</span><input id="prop-vcontrol-content-text" class="input-pixel" type="text" maxlength="12" /></div>
          <div id="prop-vcontrol-image-wrap" class="input-labeled" style="margin-top: 8px; display: none;"><span class="input-tag">IMAGE</span><input id="prop-vcontrol-content-image-file" class="input-pixel" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></div>
        </div>
        <div class="config-group prop-vcontrol-section">
          <div class="config-group-header"><i class="ph ph-palette"></i><span>COLORS</span></div>
          <div id="prop-vcontrol-colors" class="config-two-col"></div>
        </div>`;
      pane.appendChild(virtualForm);

      const apply = () => {
        const activeKey = this.virtualControlKey;
        const activeCfg = manager.currentLayout[activeKey];
        if (!activeCfg || this.isUpdatingUI) return;
        const activePartKey = this.virtualControlPartKey;
        const activePartDef = activePartKey && typeof VControlState !== "undefined" ? VControlState.getPart(activeKey, activePartKey) : null;
        if (activePartDef) activeCfg.parts = activeCfg.parts || {};
        const targetCfg = activePartDef ? (activeCfg.parts[activePartKey] = activeCfg.parts[activePartKey] || {}) : activeCfg;
        const x = document.getElementById("prop-vcontrol-x");
        const y = document.getElementById("prop-vcontrol-y");
        const scale = document.getElementById("prop-vcontrol-scale");
        const visible = document.getElementById("prop-vcontrol-visible");
        if (!activePartDef && x) activeCfg.x = parseInt(x.value) || 0;
        if (!activePartDef && y) activeCfg.y = parseInt(y.value) || 0;
        if (scale && (!activePartDef || activePartDef.scale)) targetCfg.scale = Math.max(0.5, Math.min(2.5, (parseInt(scale.value) || 100) / 100));
        if (visible) targetCfg.visible = visible.checked;
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
        if (event.target.id === "prop-vcontrol-content-text") {
          const activeCfg = manager.currentLayout[this.virtualControlKey];
          const activePartKey = this.virtualControlPartKey;
          if (!activeCfg || !activePartKey) return;
          activeCfg.parts = activeCfg.parts || {};
          const targetCfg = activeCfg.parts[activePartKey] = activeCfg.parts[activePartKey] || {};
          targetCfg.contentMode = "text";
          targetCfg.text = event.target.value;
          manager.applyLayout();
          if (typeof VControlState !== "undefined") VControlState.saveLayout(manager);
          return;
        }
        const colorKey = event.target.getAttribute("data-vcontrol-color");
        if (!colorKey || !this.virtualControlKey) return;
        const activeCfg = manager.currentLayout[this.virtualControlKey];
        if (!activeCfg) return;
        const activePartKey = this.virtualControlPartKey;
        const targetCfg = activePartKey
          ? ((activeCfg.parts = activeCfg.parts || {})[activePartKey] = activeCfg.parts[activePartKey] || {})
          : activeCfg;
        targetCfg.colors = targetCfg.colors || {};
        targetCfg.colors[colorKey] = event.target.value;
        manager.applyLayout();
        if (typeof VControlState !== "undefined") VControlState.saveLayout(manager);
      });
      virtualForm.addEventListener("change", (event) => {
        const field = event.target.id;
        if (!field.startsWith("prop-vcontrol-content-") && field !== "prop-vcontrol-icon") return;
        const activeCfg = manager.currentLayout[this.virtualControlKey];
        const activePartKey = this.virtualControlPartKey;
        if (!activeCfg || !activePartKey) return;
        activeCfg.parts = activeCfg.parts || {};
        const targetCfg = activeCfg.parts[activePartKey] = activeCfg.parts[activePartKey] || {};
        if (field === "prop-vcontrol-content-mode") targetCfg.contentMode = event.target.value;
        else if (field === "prop-vcontrol-content-text") targetCfg.text = event.target.value;
        else if (field === "prop-vcontrol-icon") targetCfg.icon = event.target.value;
        manager.applyLayout();
        if (typeof VControlState !== "undefined") VControlState.saveLayout(manager);
        this.updateFromVirtualControl(manager, this.virtualControlKey, activePartKey);
      });
      virtualForm.addEventListener("click", (event) => {
        const preset = event.target.closest("[data-vcontrol-preset]");
        if (!preset) return;
        const activeKey = this.virtualControlKey;
        const activeCfg = manager.currentLayout[activeKey];
        const activePartKey = this.virtualControlPartKey;
        if (!activeCfg) return;
        const partDef = activePartKey && typeof VControlState !== "undefined" ? VControlState.getPart(activeKey, activePartKey) : null;
        if (partDef) activeCfg.parts = activeCfg.parts || {};
        const targetCfg = partDef ? (activeCfg.parts[activePartKey] = activeCfg.parts[activePartKey] || {}) : activeCfg;
        const kind = preset.getAttribute("data-vcontrol-preset");
        if (kind === "reset-x" || kind === "reset-y") {
          const defaults = typeof VControlState !== "undefined" ? VControlState.defaultLayout[activeKey] : null;
          const property = kind === "reset-x" ? "x" : "y";
          if (defaults) activeCfg[property] = defaults[property] || 0;
        } else if (kind === "scale") {
          targetCfg.scale = Math.max(0.5, Math.min(2.5, (parseInt(preset.getAttribute("data-value")) || 100) / 100));
        } else if (kind === "color") {
          const colorKey = preset.getAttribute("data-color-key");
          if (colorKey) {
            targetCfg.colors = targetCfg.colors || {};
            targetCfg.colors[colorKey] = preset.getAttribute("data-value");
          }
        }
        manager.applyLayout();
        if (typeof VControlState !== "undefined") VControlState.saveLayout(manager);
        this.updateFromVirtualControl(manager, activeKey, activePartKey);
      });
      const imageFileInput = document.getElementById("prop-vcontrol-content-image-file");
      if (imageFileInput) imageFileInput.addEventListener("change", () => {
        const file = imageFileInput.files && imageFileInput.files[0];
        const activeCfg = manager.currentLayout[this.virtualControlKey];
        const activePartKey = this.virtualControlPartKey;
        if (!file || !activeCfg || !activePartKey) return;
        const reader = new FileReader();
        reader.onload = () => {
          activeCfg.parts = activeCfg.parts || {};
          const targetCfg = activeCfg.parts[activePartKey] = activeCfg.parts[activePartKey] || {};
          targetCfg.contentMode = "image";
          targetCfg.image = String(reader.result || "");
          manager.applyLayout();
          if (typeof VControlState !== "undefined") VControlState.saveLayout(manager);
          this.updateFromVirtualControl(manager, this.virtualControlKey, activePartKey);
        };
        reader.readAsDataURL(file);
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
    if (id) id.textContent = partDefinition ? `${label}: ${partDefinition.label.toUpperCase()}` : `CONTROL: ${label}`;
    const positionGroup = document.getElementById("prop-vcontrol-position-group");
    const scaleGroup = document.getElementById("prop-vcontrol-scale-group");
    const visibleLabel = document.getElementById("prop-vcontrol-visible-label");
    const contentGroup = document.getElementById("prop-vcontrol-content-group");
    if (positionGroup) positionGroup.style.display = partDefinition ? "none" : "block";
    if (scaleGroup) scaleGroup.style.display = partDefinition && !partDefinition.scale ? "none" : "block";
    if (visibleLabel) visibleLabel.textContent = partDefinition ? "SHOW PART IN GAME" : "SHOW CONTROL IN GAME";
    if (contentGroup) contentGroup.style.display = partDefinition ? "block" : "none";
    if (x) x.value = Math.round(cfg.x || 0);
    if (y) y.value = Math.round(cfg.y || 0);
    const percent = Math.round(((partDefinition ? partCfg.scale : cfg.scale) || 1) * 100);
    if (scale) scale.value = percent;
    if (scaleNum) scaleNum.value = percent;
    if (visible) visible.checked = (partDefinition ? partCfg.visible : cfg.visible) !== false;
    if (partDefinition) {
      const mode = partCfg.contentMode || "icon";
      const modeInput = document.getElementById("prop-vcontrol-content-mode");
      const iconInput = document.getElementById("prop-vcontrol-icon");
      const textInput = document.getElementById("prop-vcontrol-content-text");
      const iconWrap = document.getElementById("prop-vcontrol-icon-wrap");
      const textWrap = document.getElementById("prop-vcontrol-text-wrap");
      const imageWrap = document.getElementById("prop-vcontrol-image-wrap");
      if (modeInput) modeInput.value = mode;
      if (iconInput) iconInput.value = partCfg.icon || "circle";
      if (textInput) textInput.value = partCfg.text || "";
      if (iconWrap) iconWrap.style.display = mode === "icon" ? "flex" : "none";
      if (textWrap) textWrap.style.display = mode === "text" ? "flex" : "none";
      if (imageWrap) imageWrap.style.display = mode === "image" ? "flex" : "none";
    }
    const colorPanel = document.getElementById("prop-vcontrol-colors");
    if (colorPanel) {
      const colors = partDefinition ? (partCfg.colors || {}) : (cfg.colors || {});
      const colorParts = partDefinition
        ? [{ key: "face", label: partDefinition.key === "outer" || partDefinition.key === "inner" ? "Fill" : "Face", value: "#e8eef7" }, { key: "border", label: "Border", value: "#facc15" }, { key: "text", label: "Icon / text", value: "#3b0713" }]
        : this.getVirtualControlColorParts(key);
      colorPanel.innerHTML = colorParts.map(part => `
        <label class="prop-vcontrol-color-row" title="${part.label}">
          <span class="input-tag">${part.label}</span>
          <input class="input-pixel" type="color" data-vcontrol-color="${part.key}" value="${colors[part.key] || part.value}" />
          <span class="prop-vcontrol-color-presets">
            ${["#ffffff", "#111827", "#facc15", "#ef4444", "#22c55e", "#3b82f6"].map(value => `<button class="prop-vcontrol-color-preset" type="button" title="Use ${value}" style="--preset-color: ${value}" data-vcontrol-preset="color" data-color-key="${part.key}" data-value="${value}"></button>`).join("")}
          </span>
        </label>`).join("");
    }
    this.isUpdatingUI = false;
  }
};
