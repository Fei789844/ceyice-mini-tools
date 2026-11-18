/* Public miniTool APIs only; browser fallbacks do not claim account access. */
(function () {
  'use strict';
  let serial = Promise.resolve();
  const sdk = () => window.xhs && window.xhs.miniTool;
  async function nativeStorage() {
    const api = sdk();
    if (!api || typeof api.getStorage !== 'function' || typeof api.setStorage !== 'function') return null;
    let launch = window.xhs && window.xhs.launchOptions;
    if (!(launch && launch.miniToolEnv && launch.miniToolEnv.buildVersion) && typeof api.getLaunchOptions === 'function') {
      try { launch = await api.getLaunchOptions(); } catch (_) { return null; }
    }
    const version = Number(launch && launch.miniToolEnv && launch.miniToolEnv.buildVersion) || 0;
    return Math.floor(version / 1000) >= 9460 ? api : null;
  }
  async function get(key) {
    const api = await nativeStorage();
    if (api) { try { const r = await api.getStorage({key}); return r.data === null ? null : JSON.parse(r.data); } catch (_) { return null; } }
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
  }
  function set(key,value) {
    serial = serial.catch(() => {}).then(async () => {
      const api = await nativeStorage(), data = JSON.stringify(value);
      if(api) { await api.setStorage({key,data}); return true; }
      try {localStorage.setItem(key,data); return true;}catch(_){return false;}
    }).catch(() => false);
    return serial;
  }
  function remove(key) {
    serial = serial.catch(() => {}).then(async () => {
      const api=await nativeStorage();
      if(api && typeof api.removeStorage==='function') {await api.removeStorage({key}); return;}
      try{localStorage.removeItem(key);}catch(_){/* no persistence */}
    }).catch(() => false);
    return serial;
  }
  async function saveImage(dataUrl) {
    const api=sdk();
    if(!api || typeof api.saveImageToPhotosAlbum!=='function') return false;
    let filePath=dataUrl;
    if(typeof api.writeTempFile==='function') {const r=await api.writeTempFile({data:dataUrl});filePath=r.filePath;}
    await api.saveImageToPhotosAlbum({filePath}); return true;
  }
  window.FriendshipPlatform={get,set,remove,saveImage,hasNativeSave:()=>!!(sdk() && typeof sdk().saveImageToPhotosAlbum==='function')};
})();
