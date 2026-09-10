/**
 * UNIFIVE World - Objects Z-Order Subsystem
 */
const ObjectsZOrder = {
  bringToFront(items, selectedId) {
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].id === selectedId) {
        const [it] = items.splice(i, 1);
        items.push(it);
        break;
      }
    }
  },
  bringForward(items, selectedId) {
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].id === selectedId) {
        const [it] = items.splice(i, 1);
        items.splice(i + 1, 0, it);
        break;
      }
    }
  },
  sendBackward(items, selectedId) {
    for (let i = 1; i < items.length; i++) {
      if (items[i].id === selectedId) {
        const [it] = items.splice(i, 1);
        items.splice(i - 1, 0, it);
        break;
      }
    }
  },
  sendToBack(items, selectedId) {
    for (let i = 1; i < items.length; i++) {
      if (items[i].id === selectedId) {
        const [it] = items.splice(i, 1);
        items.unshift(it);
        break;
      }
    }
  }
};
