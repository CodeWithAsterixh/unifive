/**
 * UNIFIVE World - Objects Asset Loader Subsystem
 * Uses WorldObjectsManager.imageCache as the shared backing store so that
 * images pre-populated by CompilerLoader, ObjectsCrud, and Serialization
 * all hit the same cache without redundant network fetches.
 */
const ObjectsAssetLoader = {
  _pendingCallbacks: {},

  // Lazy getter — resolves to WorldObjectsManager.imageCache once it exists
  get imageCache() {
    return (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.imageCache)
      ? WorldObjectsManager.imageCache
      : (this._fallbackCache = this._fallbackCache || {});
  },

  loadImageAsset(src, callback) {
    if (!src) {
      if (typeof callback === "function") callback({ img: null, loaded: false, naturalW: 320, naturalH: 180 });
      return;
    }

    if (this.imageCache[src]) {
      if (typeof callback === "function") callback(this.imageCache[src]);
      return;
    }

    if (!this._pendingCallbacks[src]) {
      this._pendingCallbacks[src] = [];
      if (typeof callback === "function") this._pendingCallbacks[src].push(callback);

      if (typeof loadImage === "function") {
        loadImage(
          src,
          (p5Img) => {
            const cacheEntry = { img: p5Img, loaded: true, naturalW: p5Img.width || 320, naturalH: p5Img.height || 180 };
            this.imageCache[src] = cacheEntry;
            const cbs = this._pendingCallbacks[src] || [];
            delete this._pendingCallbacks[src];
            for (const cb of cbs) {
              try { cb(cacheEntry); } catch (e) { console.error("Error in loadImageAsset callback", e); }
            }
          },
          (err) => {
            console.warn("Failed to load p5 image:", src, err);
            const cacheEntry = { img: null, loaded: false, naturalW: 320, naturalH: 180 };
            this.imageCache[src] = cacheEntry;
            const cbs = this._pendingCallbacks[src] || [];
            delete this._pendingCallbacks[src];
            for (const cb of cbs) {
              try { cb(cacheEntry); } catch (e) { console.error("Error in loadImageAsset callback", e); }
            }
          }
        );
      } else {
        const cacheEntry = { img: null, loaded: false, naturalW: 320, naturalH: 180 };
        const cbs = this._pendingCallbacks[src] || [];
        delete this._pendingCallbacks[src];
        for (const cb of cbs) {
          try { cb(cacheEntry); } catch (e) {}
        }
      }
    } else {
      if (typeof callback === "function") {
        this._pendingCallbacks[src].push(callback);
      }
    }
  }
};
