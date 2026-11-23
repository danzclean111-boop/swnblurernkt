(function () {
  var cfg = fetch("/api/turnstile-config", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; });
  var loaded = new Promise(function (resolve) { window.dzTurnstileLoaded = resolve; });
  var domReady = new Promise(function (resolve) {
    if (document.readyState !== "loading") resolve();
    else document.addEventListener("DOMContentLoaded", resolve);
  });
  Promise.all([cfg, loaded, domReady]).then(function (v) {
    var c = v[0], el = document.getElementById("cfWidget");
    if (!c || !c.siteKey || !el || !window.turnstile) return;
    var opts = { sitekey: c.siteKey };
    if (el.getAttribute("data-theme")) opts.theme = el.getAttribute("data-theme");
    if (el.getAttribute("data-size")) opts.size = el.getAttribute("data-size");
    window.turnstile.render(el, opts);
  });
})();
