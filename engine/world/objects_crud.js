/**
 * UNIFIVE World - Objects CRUD Subsystem
 */
const ObjectsCrud = {
  createItem(assetData, targetX, targetY) {
    const newItem = {
      id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      assetId: assetData.id,
      name: assetData.name || "Asset",
      src: assetData.src,
      type: assetData.type || "image",
      theme: assetData.theme || null,
      defaultPose: assetData.defaultPose || "Idle",
      poses: assetData.poses || null,
      currentPose: assetData.defaultPose || "Idle",
      autoplay: false,
      animSpeed: 100,
      locked: false,
      hidden: false,
      x: targetX || 0,
      y: targetY || 0,
      w: 320,
      h: 180,
      naturalW: 320,
      naturalH: 180,
      rotation: 0,
      flipH: false,
      flipV: false,
      crop: { x: 0, y: 0, w: 320, h: 180, isCropped: false },
      p5Img: null,
      loaded: false
    };

    if (typeof ObjectsAssetLoader !== "undefined") {
      ObjectsAssetLoader.loadImageAsset(assetData.src, (cacheEntry) => {
        if (cacheEntry.loaded && cacheEntry.img) {
          newItem.p5Img = cacheEntry.img;
          newItem.loaded = true;
          newItem.naturalW = cacheEntry.naturalW;
          newItem.naturalH = cacheEntry.naturalH;
          newItem.crop = { x: 0, y: 0, w: cacheEntry.naturalW, h: cacheEntry.naturalH, isCropped: false };
          let nw = cacheEntry.naturalW;
          let nh = cacheEntry.naturalH;
          if (newItem.type === "sprite" || (newItem.assetId && newItem.assetId.startsWith("sprite_")) || newItem.poses) {
            let spriteScale = nh > 600 ? (140 / nh) : (nh <= 32 ? 2.5 : 1.5);
            nw = Math.max(20, Math.round(nw * spriteScale));
            nh = Math.max(20, Math.round(nh * spriteScale));
          } else if (nw > 640 || nh > 640) {
            const ratio = Math.min(640 / nw, 640 / nh);
            nw = Math.round(nw * ratio);
            nh = Math.round(nh * ratio);
          }
          newItem.w = nw;
          newItem.h = nh;
        }
      });
    }
    return newItem;
  }
};
