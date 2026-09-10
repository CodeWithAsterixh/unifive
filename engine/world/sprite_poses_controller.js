/**
 * UNIFIVE World - Sprite Poses Controller
 */
const SpritePosesController = {
  panelEl: null,
  btnCloseEl: null,
  activeItem: null,

  init() {
    if (typeof SpritePosesPanel !== "undefined") SpritePosesPanel.bindUI(this);
  },

  open(item) {
    if (!item || !this.panelEl) return;
    this.activeItem = item;
    this.panelEl.style.display = "block";
  },

  hide() {
    if (this.panelEl) this.panelEl.style.display = "none";
    this.activeItem = null;
  }
};
