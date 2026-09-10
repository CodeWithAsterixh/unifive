/**
 * UNIFIVE World - Objects Asset Loader Subsystem
 */
const ObjectsAssetLoader = {
  imageCache: {},
  loadImageAsset(src, callback) {
    if (this.imageCache[src]) { callback(this.imageCache[src]); return; }
    if (typeof loadImage === "function") {
      loadImage(
        src,
        (p5Img) => {
          const cacheEntry = { img: p5Img, loaded: true, naturalW: p5Img.width || 320, naturalH: p5Img.height || 180 };
          this.imageCache[src] = cacheEntry;
          callback(cacheEntry);
        },
        (err) => {
          console.warn("Failed to load p5 image:", src, err);
          const cacheEntry = { img: null, loaded: false, naturalW: 320, naturalH: 180 };
          this.imageCache[src] = cacheEntry;
          callback(cacheEntry);
        }
      );
    }
  }
};
