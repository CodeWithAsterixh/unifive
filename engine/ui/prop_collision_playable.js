/**
 * UNIFIVE Engine - Properties Collision, Playable & Physics Subsystem
 */
const PropCollisionPlayable = {
  bind(inspector) {
    this.bindInputs(inspector);
  },

  bindInputs(inspector) {
    const isPlayable = document.getElementById("prop-is-playable");
    const collisionType = document.getElementById("prop-collision-type");
    const deviceVis = document.getElementById("prop-device-visibility");

    const speedInput = document.getElementById("prop-speed");
    const weightInput = document.getElementById("prop-weight");
    const jumpForceInput = document.getElementById("prop-jump-force");
    const gravityInput = document.getElementById("prop-gravity");
    const frictionInput = document.getElementById("prop-friction");

    const getSel = () => (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
    const save = () => {
      if (typeof WorldObjectsManager !== "undefined" && typeof WorldObjectsManager.saveHistory === "function") {
        WorldObjectsManager.saveHistory();
      }
    };

    if (isPlayable) {
      isPlayable.addEventListener("change", (e) => {
        const item = getSel();
        if (item) {
          item.isPlayable = !!e.target.checked;
          save();
        }
      });
    }

    if (collisionType) {
      collisionType.addEventListener("change", (e) => {
        const item = getSel();
        if (item) {
          item.isSolid = (e.target.value === "solid");
          save();
        }
      });
    }

    if (deviceVis) {
      deviceVis.addEventListener("change", (e) => {
        const item = getSel();
        if (item) {
          item.deviceVisibility = e.target.value;
          save();
        }
      });
    }

    if (speedInput) {
      speedInput.addEventListener("input", (e) => {
        const item = getSel();
        if (item) {
          item.speed = Math.max(0.1, Math.min(30, parseFloat(e.target.value) || 6.5));
          save();
        }
      });
    }

    if (weightInput) {
      weightInput.addEventListener("input", (e) => {
        const item = getSel();
        if (item) {
          item.weight = Math.max(0.1, Math.min(10, parseFloat(e.target.value) || 1.0));
          save();
        }
      });
    }

    if (jumpForceInput) {
      jumpForceInput.addEventListener("input", (e) => {
        const item = getSel();
        if (item) {
          item.jumpForce = Math.max(0, Math.min(35, parseFloat(e.target.value) || 12.0));
          save();
        }
      });
    }

    if (gravityInput) {
      gravityInput.addEventListener("input", (e) => {
        const item = getSel();
        if (item) {
          item.gravity = Math.max(0, Math.min(3.0, parseFloat(e.target.value) || 0.65));
          save();
        }
      });
    }

    if (frictionInput) {
      frictionInput.addEventListener("input", (e) => {
        const item = getSel();
        if (item) {
          item.friction = Math.max(0.1, Math.min(0.98, parseFloat(e.target.value) || 0.82));
          save();
        }
      });
    }
  }
};

if (typeof window !== "undefined") window.PropCollisionPlayable = PropCollisionPlayable;
if (typeof globalThis !== "undefined") globalThis.PropCollisionPlayable = PropCollisionPlayable;
