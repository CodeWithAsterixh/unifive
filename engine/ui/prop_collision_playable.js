/**
 * UNIFIVE Engine - Properties Collision & Playable Subsystem
 */
const PropCollisionPlayable = {
  bind(inspector) {
    this.bindInputs(inspector);
  },

  bindInputs(inspector) {
    const isSolid = document.getElementById("prop-is-solid");
    const isPlayer = document.getElementById("prop-is-player");

    if (isSolid) {
      isSolid.addEventListener("change", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.isSolid = !!e.target.checked;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }
    if (isPlayer) {
      isPlayer.addEventListener("change", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.isPlayer = !!e.target.checked;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }
  }
};
