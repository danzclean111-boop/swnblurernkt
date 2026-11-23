(function () {
  var siteKey = null;
  var apiReady = false;
  var rendered = false;

  function render() {
    if (rendered || !siteKey || !apiReady) return;
    var el = document.getElementById("cfWidget");
    if (!el || !window.turnstile) return;
    rendered = true;
    window.turnstile.render(el, {
      sitekey: siteKey,
      theme: "dark",
      size: "flexible"
    });
  }

  function showError(msg) {
    var el = document.getElementById("cfWidget");
    if (el) el.textContent = msg;
  }

  window.dzTurnstileLoaded = function () {
    apiReady = true;
    render();
  };

  document.addEventListener("DOMContentLoaded", render);

  fetch("/api/turnstile-config")
    .then(function (r) {
      return r.json().then(function (d) {
        return { ok: r.ok, d: d };
      });
    })
    .then(function (res) {
      if (!res.ok || !res.d.siteKey) {
        showError("Captcha belum dikonfigurasi");
        return;
      }
      siteKey = res.d.siteKey;
      render();
    })
    .catch(function () {
      showError("Captcha gagal dimuat, coba refresh");
    });
})();
