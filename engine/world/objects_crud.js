/**
 * UNIFIVE World - Objects CRUD Subsystem
 */
const ObjectsCrud = {
  createItem(assetData, targetX, targetY) {
    const isControl = assetData.type === "control";
    const controlDefaults = {
      button:    { w: 200, h: 60 },
      label:     { w: 220, h: 40 },
      slider:    { w: 260, h: 44 },
      toggle:    { w: 110, h: 54 },
      textinput: { w: 260, h: 52 }
    };
    const defDims = isControl && assetData.controlType
      ? (controlDefaults[assetData.controlType] || { w: 200, h: 50 })
      : { w: 320, h: 180 };

    const tx = targetX || 0;
    const ty = targetY || 0;

    const newItem = {
      id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      assetId: assetData.id,
      name: assetData.name || "Asset",
      src: assetData.src,
      type: assetData.type || "image",
      controlType: assetData.controlType || null,
      value: (assetData.defaultValue !== undefined) ? assetData.defaultValue : "",
      theme: assetData.theme || null,
      defaultPose: assetData.defaultPose || "Idle",
      poses: assetData.poses || null,
      currentPose: assetData.defaultPose || "Idle",
      autoplay: false,
      animSpeed: 100,
      locked: false,
      hidden: false,
      x: Math.max(0, Math.round(tx - defDims.w / 2)),
      y: Math.max(0, Math.round(ty - defDims.h / 2)),
      w: defDims.w,
      h: defDims.h,
      naturalW: defDims.w,
      naturalH: defDims.h,
      rotation: 0,
      flipH: false,
      flipV: false,
      crop: { x: 0, y: 0, w: defDims.w, h: defDims.h, isCropped: false },
      p5Img: null,
      loaded: isControl ? true : false
    };

    if (isControl) {
      if (typeof WorldConfig !== "undefined") {
        newItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - newItem.w, newItem.x));
        newItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - newItem.h, newItem.y));
      }
    } else if (assetData.src && typeof ObjectsAssetLoader !== "undefined") {
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
          if (typeof WorldConfig !== "undefined") {
            newItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - newItem.w, newItem.x));
            newItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - newItem.h, newItem.y));
          }
        }
      });
    }
    return newItem;
  }
};
