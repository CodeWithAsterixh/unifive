/**
 * UNIFIVE Engine - Properties Flip, Layering & Actions Subsystem
 */
const PropFlipOpacity = {
  bind(inspector) {
    this.bindInputs(inspector);
  },

  bindInputs(inspector) {
    const btnFlipH = document.getElementById("btn-flip-h");
    const btnFlipV = document.getElementById("btn-flip-v");
    const btnBringFront = document.getElementById("btn-bring-front");
    const btnBringForward = document.getElementById("btn-bring-forward");
    const btnSendBackward = document.getElementById("btn-send-backward");
    const btnSendBack = document.getElementById("btn-send-back");
    const btnDuplicate = document.getElementById("btn-duplicate-item");
    const btnDelete = document.getElementById("btn-delete-item");

    const getSel = () => {
      if (typeof WorldObjectsManager !== "undefined") {
        return WorldObjectsManager.getSelectedItem ? WorldObjectsManager.getSelectedItem() : null;
      }
      return null;
    };

    const save = () => {
      if (typeof WorldObjectsManager !== "undefined" && typeof WorldObjectsManager.saveHistory === "function") {
        WorldObjectsManager.saveHistory();
      }
    };

    // 1. Flip Horizontal
    if (btnFlipH) {
      btnFlipH.addEventListener("click", () => {
        const item = getSel();
        if (!item) return;

        item.flipH = !item.flipH;
        btnFlipH.classList.toggle("active", !!item.flipH);
        save();
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(540, "sine", 0.03, 0.06);
        }
      });
    }

    // 2. Flip Vertical
    if (btnFlipV) {
      btnFlipV.addEventListener("click", () => {
        const item = getSel();
        if (!item) return;

        item.flipV = !item.flipV;
        btnFlipV.classList.toggle("active", !!item.flipV);
        save();
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(480, "sine", 0.03, 0.06);
        }
      });
    }

    // 3. Layering: Bring to Front (TOP)
    if (btnBringFront) {
      btnBringFront.addEventListener("click", () => {
        const item = getSel();
        if (!item || typeof WorldObjectsManager === "undefined") return;
        if (typeof WorldObjectsManager.bringToFront === "function") {
          WorldObjectsManager.bringToFront(item.id);
        } else if (typeof ObjectsZOrder !== "undefined") {
          ObjectsZOrder.bringToFront(WorldObjectsManager.items, item.id);
          save();
        }
      });
    }

    // 4. Layering: Bring Forward (UP)
    if (btnBringForward) {
      btnBringForward.addEventListener("click", () => {
        const item = getSel();
        if (!item || typeof WorldObjectsManager === "undefined") return;
        if (typeof WorldObjectsManager.bringForward === "function") {
          WorldObjectsManager.bringForward(item.id);
        } else if (typeof ObjectsZOrder !== "undefined") {
          ObjectsZOrder.bringForward(WorldObjectsManager.items, item.id);
          save();
        }
      });
    }

    // 5. Layering: Send Backward (DOWN)
    if (btnSendBackward) {
      btnSendBackward.addEventListener("click", () => {
        const item = getSel();
        if (!item || typeof WorldObjectsManager === "undefined") return;
        if (typeof WorldObjectsManager.sendBackward === "function") {
          WorldObjectsManager.sendBackward(item.id);
        } else if (typeof ObjectsZOrder !== "undefined") {
          ObjectsZOrder.sendBackward(WorldObjectsManager.items, item.id);
          save();
        }
      });
    }

    // 6. Layering: Send to Back (BOTTOM)
    if (btnSendBack) {
      btnSendBack.addEventListener("click", () => {
        const item = getSel();
        if (!item || typeof WorldObjectsManager === "undefined") return;
        if (typeof WorldObjectsManager.sendToBack === "function") {
          WorldObjectsManager.sendToBack(item.id);
        } else if (typeof ObjectsZOrder !== "undefined") {
          ObjectsZOrder.sendToBack(WorldObjectsManager.items, item.id);
          save();
        }
      });
    }

    // 7. Duplicate Item
    if (btnDuplicate) {
      btnDuplicate.addEventListener("click", () => {
        const item = getSel();
        if (!item || typeof WorldObjectsManager === "undefined") return;
        if (typeof WorldObjectsManager.duplicateItem === "function") {
          WorldObjectsManager.duplicateItem(item.id);
        }
      });
    }

    // 8. Delete Item
    if (btnDelete) {
      btnDelete.addEventListener("click", () => {
        const item = getSel();
        if (!item || typeof WorldObjectsManager === "undefined") return;
        if (typeof WorldObjectsManager.deleteItem === "function") {
          WorldObjectsManager.deleteItem(item.id);
        }
      });
    }
  }
};

if (typeof window !== "undefined") window.PropFlipOpacity = PropFlipOpacity;
if (typeof globalThis !== "undefined") globalThis.PropFlipOpacity = PropFlipOpacity;
