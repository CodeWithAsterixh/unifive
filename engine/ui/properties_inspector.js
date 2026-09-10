/**
 * UNIFIVE Engine - Properties Inspector Subsystem
 * DOM synchronization of the properties inspector form based on the currently selected world object.
 */
const PropertiesInspector = {
  updateFromSelected(controller, item) {
    const emptyView = document.getElementById("prop-empty-state");
    const formView = document.getElementById("prop-inspector-form");

    if (!item) {
      if (emptyView) emptyView.style.display = "flex";
      if (formView) formView.style.display = "none";
      if (typeof CropController !== "undefined" && CropController.isActive) CropController.exitCrop(false);
      return;
    }

    if (emptyView) emptyView.style.display = "none";
    if (formView) formView.style.display = "flex";

    controller.isUpdatingUI = true;

    const thumbImg = document.getElementById("prop-thumb-img");
    const nameInput = document.getElementById("prop-name-input");
    const idBadge = document.getElementById("prop-id-badge");
    const croppedBadge = document.getElementById("prop-cropped-badge");
    const posX = document.getElementById("prop-pos-x");
    const posY = document.getElementById("prop-pos-y");
    const sizeW = document.getElementById("prop-size-w");
    const sizeH = document.getElementById("prop-size-h");
    const rotSlider = document.getElementById("prop-rotation-slider");
    const rotNum = document.getElementById("prop-rotation-num");
    const btnFlipH = document.getElementById("btn-flip-h");
    const btnFlipV = document.getElementById("btn-flip-v");
    const chkPlayable = document.getElementById("prop-is-playable");
    const selectDeviceVis = document.getElementById("prop-device-visibility");
    const selectCollision = document.getElementById("prop-collision-type");

    const cropX = document.getElementById("prop-crop-x");
    const cropY = document.getElementById("prop-crop-y");
    const cropW = document.getElementById("prop-crop-w");
    const cropH = document.getElementById("prop-crop-h");

    if (thumbImg) thumbImg.src = item.src;
    if (nameInput) nameInput.value = item.name;
    if (idBadge) idBadge.textContent = `ID: ${item.id.substring(0, 14)}`;
    if (croppedBadge) croppedBadge.style.display = (item.crop && item.crop.isCropped) ? "inline-block" : "none";
    if (posX) posX.value = Math.round(item.x);
    if (posY) posY.value = Math.round(item.y);
    if (sizeW) sizeW.value = Math.round(item.w);
    if (sizeH) sizeH.value = Math.round(item.h);
    
    const deg = Math.round(item.rotation || 0);
    if (rotSlider) rotSlider.value = deg;
    if (rotNum) rotNum.value = deg;

    if (btnFlipH) btnFlipH.classList.toggle("active", !!item.flipH);
    if (btnFlipV) btnFlipV.classList.toggle("active", !!item.flipV);
    if (chkPlayable) chkPlayable.checked = !!item.isPlayable;
    if (selectDeviceVis) selectDeviceVis.value = item.deviceVisibility || "all";
    if (selectCollision) selectCollision.value = item.isSolid ? "solid" : "pass_through";

    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;
    const c = item.crop || { x: 0, y: 0, w: nw, h: nh, isCropped: false };
    if (cropX) cropX.value = Math.round(c.x);
    if (cropY) cropY.value = Math.round(c.y);
    if (cropW) cropW.value = Math.round(c.w);
    if (cropH) cropH.value = Math.round(c.h);

    if (typeof CropController !== "undefined") {
      CropController.updateUI();
    }

    const groupCtrlVal = document.getElementById("group-control-value");
    const ctrlTypeBadge = document.getElementById("prop-control-type-badge");
    const ctrlValTextWrap = document.getElementById("prop-control-value-text-wrap");
    const ctrlValSliderWrap = document.getElementById("prop-control-value-slider-wrap");
    const ctrlValToggleWrap = document.getElementById("prop-control-value-toggle-wrap");
    const ctrlValText = document.getElementById("prop-control-value-text");
    const ctrlValSlider = document.getElementById("prop-control-value-slider");
    const ctrlValNum = document.getElementById("prop-control-value-num");
    const ctrlValToggle = document.getElementById("prop-control-value-toggle");
    const ctrlValToggleLabel = document.getElementById("prop-control-value-toggle-label");

    if (groupCtrlVal) {
      groupCtrlVal.style.display = (item.type === "control") ? "block" : "none";
    }
    if (item.type === "control") {
      const ct = item.controlType || "label";
      if (ctrlTypeBadge) ctrlTypeBadge.textContent = String(ct).toUpperCase();

      const useText = (ct === "button" || ct === "label" || ct === "textinput");
      const useSlider = (ct === "slider");
      const useToggle = (ct === "toggle");

      if (ctrlValTextWrap) ctrlValTextWrap.style.display = useText ? "flex" : "none";
      if (ctrlValSliderWrap) ctrlValSliderWrap.style.display = useSlider ? "flex" : "none";
      if (ctrlValToggleWrap) ctrlValToggleWrap.style.display = useToggle ? "flex" : "none";

      if (useText && ctrlValText) {
        ctrlValText.value = item.value !== undefined && item.value !== null ? String(item.value) : "";
      }
      if (useSlider) {
        const n = Math.max(0, Math.min(100, parseInt(item.value) || 0));
        if (ctrlValSlider) ctrlValSlider.value = n;
        if (ctrlValNum) ctrlValNum.value = n;
      }
      if (useToggle) {
        const on = !!item.value;
        if (ctrlValToggle) ctrlValToggle.checked = on;
        if (ctrlValToggleLabel) ctrlValToggleLabel.textContent = on ? "STATE: ON" : "STATE: OFF";
      }
    }

    controller.isUpdatingUI = false;
  }
};
