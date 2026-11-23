/* Tombol pilihan Status WA HD / Upload TikTok HD — pill meluncur antar halaman */
(function () {
  var sw = document.getElementById("modeSwitch");
  if (!sw) return;
  var cur = sw.getAttribute("data-active") || "wa";
  var prev = null;
  try { prev = sessionStorage.getItem("dzModePrev"); } catch (e) {}
  if (prev && prev !== cur) {
    sw.setAttribute("data-active", prev);
    sw.classList.add("ms-anim");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { sw.setAttribute("data-active", cur); });
    });
  }
  try { sessionStorage.setItem("dzModePrev", cur); } catch (e) {}
})();
