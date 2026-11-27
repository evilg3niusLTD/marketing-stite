export const EARLY_CLICK_SCRIPT = `(function () {
  try {
    var params = new URLSearchParams(location.search);
    var picked = {};
    params.forEach(function (value, name) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(name) || !value) return;
      picked[name] = String(value).slice(0, 180);
    });
    var adId = picked.gclid || picked.gbraid || picked.wbraid;
    if (!adId) return;
    var seen = "";
    try {
      seen = localStorage.getItem("tl-ad-clicks") || "";
    } catch (error) {
      seen = "";
    }
    if (seen.split(" ").indexOf(adId) !== -1) return;
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = "";
    for (var i = 0; i < bytes.length; i += 1) hex += bytes[i].toString(16).padStart(2, "0");
    var id = hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
    try {
      localStorage.setItem("tl-ad-clicks", (seen + " " + adId).trim().slice(-2000));
    } catch (error) {}
    fetch("/api/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: id, path: location.pathname, referrer: document.referrer, params: picked }),
      keepalive: true,
    }).catch(function () {});
  } catch (error) {}
})();`;
