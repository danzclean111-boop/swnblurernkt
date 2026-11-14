(function () {
  if (window.__dzLoaderStarted) return;
  window.__dzLoaderStarted = true;

  const SHOW_AFTER_MS = 0;
  const MIN_VISIBLE_MS = 600;
  const MAX_MS = 8000;

  const baseCss =
    "html{background:#070a13}" +
    "#pageLoader{visibility:hidden!important;pointer-events:none!important;z-index:7050!important}" +
    "@view-transition{navigation:auto}" +
    "::view-transition-old(root){animation:none}" +
    "::view-transition-new(root){animation:dzVtIn .2s ease-out both}" +
    "@keyframes dzVtIn{from{opacity:0}to{opacity:1}}" +
    "#mnNav{view-transition-name:dz-nav}#dzTopbar{view-transition-name:dz-topbar}" +
    "::view-transition-old(dz-nav),::view-transition-new(dz-nav),::view-transition-old(dz-topbar),::view-transition-new(dz-topbar){animation:none;mix-blend-mode:normal}" +
    "::view-transition-group(dz-nav),::view-transition-group(dz-topbar){animation:none}" +
    "::view-transition-old(dz-nav),::view-transition-old(dz-topbar){display:none}" +
    "html:has(.maintenance-page:not(.maintenance-admin)) #mnNav,html:has(.maintenance-page:not(.maintenance-admin)) #dzTopbar{display:none!important}" +
    "#mnNav,#dzTopbar{transition:opacity .25s ease}" +
    "html:has(.popup-overlay.show) #mnNav,html:has(.popup-overlay.show) #dzTopbar{opacity:0!important;pointer-events:none!important}" +
    ".popup-overlay{will-change:opacity;transform:translateZ(0)}" +
    "html:has(#dzLoader) .cs-hint-tooltip{opacity:0!important;visibility:hidden!important}";

  const css =
    "#dzLoader{position:fixed;inset:0;z-index:7100;display:flex;align-items:center;justify-content:center;background:#070a13;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .3s ease;overflow:hidden;font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif}" +
    "#dzLoader.dz-ld-show{opacity:1;visibility:visible;pointer-events:auto}" +
    "#dzLoader.dz-ld-show.dz-ld-out{opacity:0;pointer-events:none;transition-duration:.6s}" +
    ".dz-ld-glow{position:absolute;inset:-20%;background:radial-gradient(420px 320px at 50% 44%,rgba(61,108,255,.26),transparent 70%),radial-gradient(360px 300px at 82% 78%,rgba(91,134,255,.12),transparent 70%),radial-gradient(340px 280px at 14% 18%,rgba(61,108,255,.14),transparent 70%);animation:dzLdDrift 9s ease-in-out infinite alternate}" +
    ".dz-ld-center{position:relative;display:flex;flex-direction:column;align-items:center;gap:22px;transition:transform .65s cubic-bezier(.4,0,.2,1),filter .65s ease}" +
    "#dzLoader.dz-ld-out .dz-ld-center{transform:scale(1.06);filter:blur(6px)}" +
    ".dz-ld-mark{position:relative;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;animation:dzLdPop .8s cubic-bezier(.2,.8,.2,1) .05s forwards}" +
    ".dz-ld-mark::before{content:'';position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(91,134,255,0),#7fa2ff 55%,rgba(91,134,255,0) 75%);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2.5px),#000 calc(100% - 2px));mask:radial-gradient(farthest-side,transparent calc(100% - 2.5px),#000 calc(100% - 2px));animation:dzLdSpin 1.6s linear infinite}" +
    ".dz-ld-mark::after{content:'';position:absolute;inset:-14px;border-radius:50%;background:radial-gradient(circle,rgba(61,108,255,.35),transparent 65%);animation:dzLdBreathe 2.4s ease-in-out infinite}" +
    ".dz-ld-mark img{position:relative;z-index:1;width:58px;height:58px;border-radius:50%;object-fit:cover;background:#0d1331}" +
    ".dz-ld-word{display:flex;font-size:34px;font-weight:700;letter-spacing:.05em;line-height:1}" +
    ".dz-ld-word span{display:inline-block;color:#fff;opacity:0;transform:translateY(16px) scale(.96);filter:blur(8px);animation:dzLdLetter .75s cubic-bezier(.2,.8,.2,1) forwards,dzLdGlow 2.6s ease-in-out 1.3s infinite;animation-delay:calc(var(--i) * 55ms + 160ms),calc(var(--i) * 90ms + 1300ms)}" +
    ".dz-ld-word span.dz-b{color:#8fb0ff}" +
    ".dz-ld-sub{margin-top:-10px;font-size:10.5px;font-weight:500;letter-spacing:.34em;text-transform:uppercase;color:rgba(158,167,214,.7);opacity:0;animation:dzLdFade .8s ease .85s forwards}" +
    ".dz-ld-track{position:relative;width:150px;height:2px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden;opacity:0;animation:dzLdFade .6s ease .5s forwards}" +
    ".dz-ld-bar{position:absolute;inset:0;border-radius:2px;background:linear-gradient(90deg,#3d6cff,#9db8ff);box-shadow:0 0 12px rgba(91,134,255,.9);transform-origin:left center;transform:scaleX(var(--p,0))}" +
    ".dz-ld-shine{position:absolute;top:0;bottom:0;width:46%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);transform:translateX(-120%);animation:dzLdShine 1.35s ease-in-out infinite}" +
    "@keyframes dzLdLetter{to{opacity:1;transform:none;filter:none}}" +
    "@keyframes dzLdGlow{0%,100%{text-shadow:0 0 0 rgba(127,162,255,0)}50%{text-shadow:0 0 18px rgba(127,162,255,.65)}}" +
    "@keyframes dzLdPop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}" +
    "@keyframes dzLdSpin{to{transform:rotate(360deg)}}" +
    "@keyframes dzLdBreathe{0%,100%{opacity:.55;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}" +
    "@keyframes dzLdFade{to{opacity:1}}" +
    "@keyframes dzLdShine{to{transform:translateX(320%)}}" +
    "@keyframes dzLdDrift{from{transform:translate3d(-2%,-1%,0) scale(1)}to{transform:translate3d(2%,2%,0) scale(1.08)}}" +
    "@media (prefers-reduced-motion:reduce){.dz-ld-glow,.dz-ld-mark::before,.dz-ld-mark::after,.dz-ld-shine{animation:none}.dz-ld-word span{animation:dzLdLetter .01s forwards;animation-delay:0s}}";

  const baseSt = document.createElement("style");
  baseSt.id = "dzBaseCss";
  baseSt.textContent = baseCss;
  (document.head || document.documentElement).appendChild(baseSt);

  const st = document.createElement("style");
  st.id = "dzLoaderCss";
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  const root = document.createElement("div");
  root.id = "dzLoader";
  root.setAttribute("aria-hidden", "true");
  const word = "DanzClean".split("").map((c, i) =>
    '<span style="--i:' + i + '"' + (i >= 4 ? ' class="dz-b"' : "") + ">" + c + "</span>").join("");
  root.innerHTML =
    '<div class="dz-ld-glow"></div>' +
    '<div class="dz-ld-center">' +
      '<div class="dz-ld-mark"><img src="./media/logo.png" alt="" onerror="this.style.display=\'none\'"></div>' +
      '<div class="dz-ld-word">' + word + "</div>" +
      '<div class="dz-ld-sub">HD Status Uploader</div>' +
      '<div class="dz-ld-track"><i class="dz-ld-bar"></i><i class="dz-ld-shine"></i></div>' +
    "</div>";
  document.documentElement.appendChild(root);

  const bar = root.querySelector(".dz-ld-bar");
  const start = performance.now();
  let domReady = document.readyState !== "loading";
  let finishing = false;
  let closed = false;
  let shown = false;
  let shownAt = 0;
  let p = 0;

  if (SHOW_AFTER_MS <= 0) {
    shown = true;
    shownAt = start;
    root.classList.add("dz-ld-show");
  }

  if (!domReady) {
    document.addEventListener("DOMContentLoaded", () => { domReady = true; }, { once: true });
  }

  function cleanup() {
    root.remove();
    st.remove();
  }

  function close() {
    if (closed) return;
    closed = true;
    const oldLoader = document.getElementById("pageLoader");
    if (oldLoader) oldLoader.style.display = "none";
    if (!shown) {
      cleanup();
      return;
    }
    bar.style.setProperty("--p", "1");
    root.classList.add("dz-ld-out");
    setTimeout(cleanup, 750);
  }

  function tick() {
    if (closed) return;
    const now = performance.now();
    const elapsed = now - start;
    const oldLoader = document.getElementById("pageLoader");
    const heldByPage = !!oldLoader && oldLoader.style.display !== "none";
    const bodyHidden = !!document.body && document.body.style.display === "none";
    const ready = domReady && !heldByPage && !bodyHidden;

    if (!shown && !ready && elapsed >= SHOW_AFTER_MS) {
      shown = true;
      shownAt = now;
      root.classList.add("dz-ld-show");
    }

    if (!finishing && ready && (!shown || now - shownAt >= MIN_VISIBLE_MS)) finishing = true;

    if (finishing && !shown) {
      close();
      return;
    }

    p += ((finishing ? 1 : 0.9) - p) * (finishing ? 0.22 : 0.028);
    bar.style.setProperty("--p", p.toFixed(4));
    if (finishing && p > 0.985) {
      close();
      return;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  setTimeout(close, MAX_MS);

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) close();
  });
})();

const MN_DOWNLOADER = [
  { href: "/tiktok.html", svg: "download", label: "TikTok Downloader" },
  { href: "/instagram.html", svg: "download", label: "Instagram Downloader" },
  { href: "/yt.html", svg: "download", label: "YouTube Downloader" },
  { href: "/pinterest.html", svg: "download", label: "Pinterest Downloader" },
];

const MN_PRESET = [
  { href: "/preset-tamplate.html", svg: "layers", label: "Preset & Template", sub: "Kumpulan preset yang dibagikan" },
  { href: "/searchpreset.html", svg: "search", label: "Search Preset", sub: "Cari preset dari link TikTok" },
];

const MN_MORE = [
  { href: "https://whatsapp.com/channel/0029VbCPkeX2UPBEbTumgG2Y", icon: "./media/channel.png", label: "Channel WhatsApp", target: "_blank" },
  { href: "/creator.html", icon: "./media/creator.png", label: "Creator" },
  { href: "/rating.html", icon: "./media/rating.png", label: "Rating" },
  { href: "/settingakun.html", icon: "./media/setting.png", label: "Setting" },
  { href: "/maintenance.html", label: "Perbaikan", id: "maintenanceBtn", ownerOnly: true },
  { href: "/Blokirakun.html", label: "Blokir Akun", id: "blockAkunBtn", ownerOnly: true },
  { href: "#", label: "Logout Akun", id: "userLogoutBtn", danger: true },
];

const MN_NAV = [
  { key: "home", label: "Dashboard", icon: "home", img: "./media/dashboard.png", href: "/" },
  { key: "dl", label: "Downloader", icon: "download", img: "./media/downloader.png", popup: "dl", list: MN_DOWNLOADER },
  { key: "preset", label: "Preset", icon: "layers", img: "./media/preset.png", popup: "preset", list: MN_PRESET },
  { key: "stats", label: "Statistik", icon: "chart", img: "./media/statistik.png", alts: ["stats", "statistic", "statistics", "stat", "grafik", "chart"], href: "/stats.html" },
  { key: "chat", label: "Chat", icon: "chat", img: "./media/chat.png", href: "/chatglobal.html" },
  { key: "more", label: "Lainnya", icon: "grid", img: "./media/lainnya.png", popup: "more", list: MN_MORE },
];

const MN_ICONS = {
  home: '<path d="M4 11.2 12 4l8 7.2V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
  download: '<path d="M12 4v10"/><path d="M8 10.5l4 4 4-4"/><path d="M5 19h14"/>',
  layers: '<path d="M12 4 3.5 8.5 12 13l8.5-4.5z"/><path d="M3.5 12.5 12 17l8.5-4.5"/><path d="M3.5 16.5 12 21l8.5-4.5"/>',
  chart: '<path d="M5 20v-8"/><path d="M12 20V4"/><path d="M19 20v-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  chat: '<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-7l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/><path d="M8 10h8M8 13h5"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>',
};

document.addEventListener("click", (e) => {
  if (e.target && e.target.closest && e.target.closest("#userLogoutBtn")) {
    e.preventDefault();
    localStorage.removeItem("danzclean_logged_user");
    localStorage.removeItem("isOwner");

    if (typeof firebase !== "undefined" && firebase.auth) {
      firebase.auth().signOut().then(() => {
        window.location.replace("/danzclean.html");
      }).catch(() => {
        window.location.replace("/danzclean.html");
      });
    } else {
      window.location.replace("/danzclean.html");
    }
  }
});

let dzNotifBootPromise = null;

function dzLoadScript(src) {
  return new Promise((resolve) => {
    const sc = document.createElement("script");
    sc.src = src;
    sc.onload = () => resolve(true);
    sc.onerror = () => resolve(false);
    (document.head || document.documentElement).appendChild(sc);
  });
}

function dzWhenPageLoaded() {
  return new Promise((resolve) => {

    if (document.readyState !== "loading") resolve();
    else document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
  });
}

const DZ_MAIN_CFG_KEY = "dz_fb_main_cfg";

function dzBootNotif() {
  if (dzNotifBootPromise) return dzNotifBootPromise;

  dzNotifBootPromise = dzWhenPageLoaded().then(async () => {

    const saveCfg = () => {
      try {
        if (typeof FIREBASE_CONFIG_MAIN !== "undefined" && FIREBASE_CONFIG_MAIN) {
          localStorage.setItem(DZ_MAIN_CFG_KEY, JSON.stringify(FIREBASE_CONFIG_MAIN));
          return true;
        }
      } catch (e) {}
      return typeof FIREBASE_CONFIG_MAIN !== "undefined";
    };
    saveCfg();

    if (typeof firebase === "undefined") {
      await dzLoadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
    }
    if (typeof firebase !== "undefined" && !firebase.appCheck) {
      try { await dzLoadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-app-check.js"); } catch (e) {}
    }
    if (typeof firebase !== "undefined" && !firebase.database) {
      await dzLoadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js");
    }

    if (!saveCfg()) {
      for (const file of ["firebase-config.js", "config.js"]) {
        if (document.querySelector('script[src*="' + file + '"]')) continue;
        await dzLoadScript("/" + file);
        if (saveCfg()) break;
      }
    }

    if (typeof FIREBASE_CONFIG_MAIN === "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(DZ_MAIN_CFG_KEY));
        if (saved && saved.databaseURL) window.FIREBASE_CONFIG_MAIN = saved;
      } catch (e) {}
    }
    if (typeof FIREBASE_CONFIG_MAIN === "undefined") {
      console.warn("[DanzClean] FIREBASE_CONFIG_MAIN belum ketemu - buka Dashboard sekali biar tersimpan.");
    }

    if (typeof window.toggleNotifPanel !== "function" &&
        !document.querySelector('script[src*="notifikasi.js"]')) {
      await dzLoadScript("/notifikasi.js");
    }
  });

  return dzNotifBootPromise;
}

function dzEnsureNotif(cb) {
  dzBootNotif();
  if (!cb) return;

  let tries = 0;
  const iv = setInterval(() => {
    tries++;
    if (typeof window.toggleNotifPanel === "function") {
      clearInterval(iv);
      cb();
    } else if (tries > 100) {
      clearInterval(iv);
    }
  }, 100);
}

function dzWhenLoaderGone(cb) {
  const check = () => {
    if (document.getElementById("dzLoader")) setTimeout(check, 120);
    else cb();
  };
  check();
}

function showCsHintTooltip(csBtn) {

  if (location.pathname.endsWith("/customerservice.html")) return;

  const tooltip = document.createElement("div");
  tooltip.className = "cs-hint-tooltip";
  tooltip.id = "csHintTooltip";
  tooltip.innerHTML = "Tanya apa saja<br>masalahmu di CS";
  document.body.appendChild(tooltip);

  function positionTooltip() {
    const btnRect = csBtn.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    if (!btnRect.width || !tooltipRect.width) {
      requestAnimationFrame(positionTooltip);
      return;
    }

    const btnCenterX = btnRect.left + btnRect.width / 2;
    const margin = 8;

    let left = btnCenterX + 19 - tooltipRect.width;

    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));

    tooltip.style.left = left + "px";
    tooltip.style.top = (btnRect.bottom + 10) + "px";
  }

  requestAnimationFrame(() => requestAnimationFrame(positionTooltip));
  window.addEventListener("resize", positionTooltip);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => tooltip.classList.add("show"));
  });

  const hide = () => {
    tooltip.classList.remove("show");
    setTimeout(() => tooltip.remove(), 400);
  };

  const autoHideTimer = setTimeout(hide, 7000);

  csBtn.addEventListener("click", () => {
    clearTimeout(autoHideTimer);
    hide();
  }, { once: true });

  const sidebarObserver = new MutationObserver(() => {
    if (document.body.classList.contains("sidebar-open")) {
      clearTimeout(autoHideTimer);
      hide();
      sidebarObserver.disconnect();
    }
  });
  sidebarObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
}

function renderTopbarProfile() {
  const topbar = document.getElementById("dzTopbar") || document.querySelector(".topbar");
  if (!topbar || document.getElementById("topbarProfileBtn")) return;
  const staleDd = document.getElementById("profileDropdown");
  if (staleDd) staleDd.remove();

  let loggedUser = {};
  try {
    loggedUser = JSON.parse(localStorage.getItem("danzclean_logged_user")) || {};
  } catch (e) {
    loggedUser = {};
  }

  const displayName = loggedUser.username || "User";
  const fallbackAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName) + "&background=4c7dff&color=fff";
  const avatarSrc = loggedUser.photo || fallbackAvatar;

  let csBtnRef = null;

  if (!document.getElementById("topbarNotifBtn")) {
    const notifBtn = document.createElement("button");
    notifBtn.type = "button";
    notifBtn.className = "topbar-notif-btn";
    notifBtn.id = "topbarNotifBtn";
    notifBtn.title = "Notifikasi"; notifBtn.setAttribute("aria-label", "Notifikasi");
    notifBtn.innerHTML = `
      <span class="topbar-notif-inner">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
      </span>
      <span class="topbar-notif-dot" id="topbarNotifDot" style="display:none;"></span>
    `;

    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dzEnsureNotif(() => {
        if (typeof window.toggleNotifPanel === "function") window.toggleNotifPanel();
      });
    });
    topbar.appendChild(notifBtn);
  }

  if (!document.getElementById("topbarCsBtn")) {
    const csBtn = document.createElement("button");
    csBtn.type = "button";
    csBtn.className = "topbar-cs-btn";
    csBtn.id = "topbarCsBtn";
    csBtn.title = "Customer Service"; csBtn.setAttribute("aria-label", "Customer Service");
    csBtn.innerHTML = `
      <span class="topbar-cs-inner">
        <img src="./media/cs.png" alt="CS" onerror="this.style.display='none';">
      </span>
      <span class="topbar-cs-status"></span>
    `;
    csBtn.addEventListener("click", () => {
      window.location.href = "/customerservice.html";
    });
    topbar.appendChild(csBtn);

    csBtnRef = csBtn;
  }

  const profileBtn = document.createElement("button");
  profileBtn.type = "button";
  profileBtn.className = "topbar-profile-btn";
  profileBtn.id = "topbarProfileBtn"; profileBtn.setAttribute("aria-label", "Menu profil");
  profileBtn.innerHTML = `<img src="${avatarSrc}" alt="Profil" onerror="this.src='${fallbackAvatar}'"><span class="topbar-profile-status"></span>`;
  topbar.appendChild(profileBtn);

  if (csBtnRef && !window.__csHintShown) {
    window.__csHintShown = true;
    dzWhenLoaderGone(() => showCsHintTooltip(csBtnRef));
  }

  const dropdown = document.createElement("div");
  dropdown.className = "profile-dropdown";
  dropdown.id = "profileDropdown";
  dropdown.innerHTML = `
    <div class="profile-dropdown-header">
      <img src="${avatarSrc}" alt="Profil" onerror="this.src='${fallbackAvatar}'">
      <div class="profile-dropdown-info">
        <div class="profile-dropdown-name">${displayName}</div>
        <div class="profile-dropdown-sub">${loggedUser.phone || "Akun DanzClean"}</div>
      </div>
    </div>
    <a href="/settingakun.html" class="profile-dropdown-item">
      <span class="pd-icon"><img src="./media/setting.png" alt="" width="16" height="16" style="width:16px;height:16px;object-fit:contain;"></span> Setting Akun
    </a>
  `;
  document.body.appendChild(dropdown);

  function positionDropdown() {
    const btnRect = profileBtn.getBoundingClientRect();
    const topbarRect = topbar.getBoundingClientRect();
    dropdown.style.top = (topbarRect.bottom + 12) + "px";
    dropdown.style.right = (window.innerWidth - btnRect.right) + "px";
  }

  function openDropdown() {
    positionDropdown();
    dropdown.classList.add("show");
    profileBtn.classList.add("open");
  }

  function closeDropdown() {
    dropdown.classList.remove("show");
    profileBtn.classList.remove("open");
  }

  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains("show")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== profileBtn) {
      closeDropdown();
    }
  });

  window.addEventListener("resize", () => {
    if (dropdown.classList.contains("show")) positionDropdown();
  });
}

const MN_ICON_CACHE_KEY = "dz_nav_icons_v2";

const MN_ICON_EXTS = [".png", ".webp", ".jpg", ".jpeg", ".svg"];

function mnIconCandidates(it) {
  if (!it.img) return [];
  const dir = it.img.slice(0, it.img.lastIndexOf("/") + 1);
  const bases = [it.img.slice(it.img.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "")].concat(it.alts || []);
  const out = [];
  bases.forEach(base => MN_ICON_EXTS.forEach(ext => out.push(dir + base + ext)));
  return out;
}

function mnIconSrc(it) {
  const list = mnIconCandidates(it);
  try {
    const c = JSON.parse(localStorage.getItem(MN_ICON_CACHE_KEY) || "{}");
    if (c[it.key] && c[it.key].indexOf("data:image/") === 0) return c[it.key];
  } catch (e) {}
  return list[0] || "";
}

function mnSaveIcon(key, url) {
  if (!url || url.indexOf("data:") === 0) return;
  fetch(url)
    .then(r => (r.ok ? r.blob() : null))
    .then(blob => {
      if (!blob || blob.size > 150000 || blob.type.indexOf("image/") !== 0) return;
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const c = JSON.parse(localStorage.getItem(MN_ICON_CACHE_KEY) || "{}");
          c[key] = fr.result;
          localStorage.setItem(MN_ICON_CACHE_KEY, JSON.stringify(c));
        } catch (e) {}
      };
      fr.readAsDataURL(blob);
    })
    .catch(() => {});
}

function mnForgetIcon(key) {
  try {
    const c = JSON.parse(localStorage.getItem(MN_ICON_CACHE_KEY) || "{}");
    delete c[key];
    localStorage.setItem(MN_ICON_CACHE_KEY, JSON.stringify(c));
  } catch (e) {}
}

function mnNormPath(p) {
  p = (p || "").toLowerCase().split("?")[0].split("#")[0];
  p = p.replace(/\.html$/, "");
  if (p.endsWith("/index")) p = p.slice(0, -5);
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}

function mnActiveIndex() {
  const cur = mnNormPath(location.pathname);
  for (let i = 0; i < MN_NAV.length; i++) {
    const it = MN_NAV[i];
    if (it.href && mnNormPath(it.href) === cur) return i;
    if (it.list && it.list.some(x => x.href && x.href.charAt(0) === "/" && mnNormPath(x.href) === cur)) return i;
  }
  return -1;
}

function mnSvg(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + MN_ICONS[name] + "</svg>";
}

function mnPopHtml(list, isGrid, isOwner, cur) {
  let out = "";
  list.forEach(x => {
    if (x.ownerOnly && !isOwner) return;
    const t = x.target ? ' target="' + x.target + '" rel="noopener"' : "";
    const id = x.id ? ' id="' + x.id + '"' : "";
    const isCur = x.href && x.href.charAt(0) === "/" && mnNormPath(x.href) === cur;
    const cls = "mn-pop-item" + (x.danger ? " mn-danger" : "") + (isCur ? " current" : "");
    const ico = x.icon
      ? '<img src="' + x.icon + '" alt="" onerror="this.style.display=\'none\'">'
      : (x.svg ? '<span class="mn-pop-ico">' + mnSvg(x.svg) + "</span>" : "");
    const txt = x.sub
      ? '<span class="mn-pop-txt"><span>' + x.label + "</span><small>" + x.sub + "</small></span>"
      : "<span>" + x.label + "</span>";
    out += '<a href="' + x.href + '"' + t + id + ' class="' + cls + '">' + ico + txt + "</a>";
  });
  return '<div class="' + (isGrid ? "mn-pop-grid" : "mn-pop-list") + '">' + out + "</div>";
}


/* ===== Badge Chat: lingkaran merah (belum dibaca) + tanda @ (disebut / dibalas) ===== */
const DZ_CHAT_READ_KEY = "dz_chat_read";
const DZ_CHAT_CFG_KEY = "dz_fb_chat_cfg";
const DZ_CHAT_BADGES =
  '<span class="dz-cb dz-cb-at" id="dzChatAt" aria-hidden="true">@</span>' +
  '<span class="dz-cb dz-cb-n" id="dzChatCount" aria-hidden="true"></span>';

function dzInjectChatBadgeCss() {
  if (document.getElementById("dzChatBadgeCss")) return;
  const st = document.createElement("style");
  st.id = "dzChatBadgeCss";
  st.textContent =
    ".mn-ico{position:relative}" +
    ".dz-cb{position:absolute;top:-8px;min-width:18px;height:18px;padding:0 5px;box-sizing:border-box;border-radius:99px;display:flex;align-items:center;justify-content:center;font:800 10.5px/1 'Plus Jakarta Sans','Inter',system-ui,sans-serif;pointer-events:none;transform:scale(0);opacity:0;transition:transform .28s cubic-bezier(.34,1.5,.5,1),opacity .15s ease;box-shadow:0 0 0 2px var(--mn-bar,#0e1635)}" +
    ".dz-cb.show{transform:scale(1);opacity:1}" +
    ".dz-cb-n{right:-12px;background:#e5284a;color:#fff}" +
    ".dz-cb-at{left:-13px;width:18px;padding:0;background:#36e2a8;color:#04281c;font-size:11px}" +
    ".dz-cb.bump{animation:dzCbBump .45s cubic-bezier(.34,1.5,.5,1)}" +
    "@keyframes dzCbBump{0%{transform:scale(.6)}55%{transform:scale(1.3)}100%{transform:scale(1)}}" +
    ".mn-item.active .dz-cb{display:none}" +
    ".dz-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
    "@media (max-width:420px){.mn-label{font-size:10px!important;letter-spacing:-.2px!important}}" +
    "@media (prefers-reduced-motion:reduce){.dz-cb{transition:none}.dz-cb.bump{animation:none}}";
  (document.head || document.documentElement).appendChild(st);
}

function dzChatMyId() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem("danzclean_logged_user") || "{}") || {}; } catch (e) {}
  const str = String(s.email || s.username || "anon").toLowerCase().trim();
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return "u" + (h >>> 0).toString(36);
}

const dzChat = { unread: 0, mention: false, items: {}, announced: 0 };

function dzChatRender() {
  const cnt = document.getElementById("dzChatCount");
  const at = document.getElementById("dzChatAt");
  const item = cnt && cnt.closest(".mn-item");
  if (!cnt || !at || !item) return;

  const n = dzChat.unread;
  const prevN = parseInt(cnt.getAttribute("data-n") || "0", 10);
  cnt.textContent = n > 99 ? "99+" : String(n || "");
  cnt.setAttribute("data-n", String(n));
  cnt.classList.toggle("show", n > 0);
  at.classList.toggle("show", n > 0 && dzChat.mention);

  if (n > prevN) {
    [cnt, at].forEach(b => { b.classList.remove("bump"); void b.offsetWidth; if (b.classList.contains("show")) b.classList.add("bump"); });
  }

  let label = "Chat";
  if (n > 0) label += ", " + n + " pesan belum dibaca" + (dzChat.mention ? ", ada yang menyebut atau membalas kamu" : "");
  item.setAttribute("aria-label", label);

  let live = document.getElementById("dzChatLive");
  if (!live) {
    live = document.createElement("span");
    live.id = "dzChatLive";
    live.className = "dz-sr";
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    document.body.appendChild(live);
  }
  if (n > dzChat.announced) live.textContent = dzChat.mention ? "Ada pesan baru di chat, kamu disebut" : n + " pesan baru di chat";
  dzChat.announced = n;
}

function dzChatRecount() {
  const lastRead = Number(localStorage.getItem(DZ_CHAT_READ_KEY)) || 0;
  let n = 0, mention = false;
  Object.keys(dzChat.items).forEach(k => {
    const it = dzChat.items[k];
    if (it.ts <= lastRead) { delete dzChat.items[k]; return; }
    n++;
    if (it.mention) mention = true;
  });
  dzChat.unread = n;
  dzChat.mention = mention;
  dzChatRender();
}

function dzBootChatBadge() {
  if (dzChat.booted) return;
  dzChat.booted = true;
  if (mnNormPath(location.pathname) === "/chatglobal") return;
  if (!localStorage.getItem("danzclean_logged_user")) return;

  dzBootNotif().then(() => {
    let cfg = null, name = "";
    if (typeof FIREBASE_CONFIG_CHAT !== "undefined") { cfg = FIREBASE_CONFIG_CHAT; name = "chatApp"; }
    else if (typeof FIREBASE_CONFIG_VERIFY !== "undefined") { cfg = FIREBASE_CONFIG_VERIFY; name = "verifyApp"; }

    if (cfg) {
      try { localStorage.setItem(DZ_CHAT_CFG_KEY, JSON.stringify({ name: name, cfg: cfg })); } catch (e) {}
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(DZ_CHAT_CFG_KEY));
        if (saved && saved.cfg && saved.cfg.databaseURL) { cfg = saved.cfg; name = saved.name; }
      } catch (e) {}
    }
    if (!cfg || typeof firebase === "undefined" || !firebase.database) return;

    let app = firebase.apps.find(a => a.name === name);
    if (!app) app = firebase.initializeApp(cfg, name);

    const myId = dzChatMyId();
    let lastRead = Number(localStorage.getItem(DZ_CHAT_READ_KEY)) || 0;
    if (!lastRead) {
      lastRead = Date.now();
      try { localStorage.setItem(DZ_CHAT_READ_KEY, String(lastRead)); } catch (e) {}
    }

    const q = app.database().ref("global_chat/messages").orderByChild("ts").startAt(lastRead + 1).limitToLast(60);

    q.on("child_added", snap => {
      const m = snap.val();
      if (!m || typeof m !== "object" || m.u === myId) return;
      const ts = Number(m.ts) || 0;
      if (ts <= (Number(localStorage.getItem(DZ_CHAT_READ_KEY)) || 0)) return;
      const mn = Array.isArray(m.mn) ? m.mn : (m.mn && typeof m.mn === "object" ? Object.keys(m.mn).map(k => m.mn[k]) : []);
      dzChat.items[snap.key] = {
        ts: ts,
        mention: !!(m.r && m.r.u === myId) || mn.some(x => x && x.u === myId)
      };
      dzChatRecount();
    });
    q.on("child_removed", snap => {
      delete dzChat.items[snap.key];
      dzChatRecount();
    });

    window.addEventListener("storage", e => { if (e.key === DZ_CHAT_READ_KEY) dzChatRecount(); });
    window.addEventListener("pageshow", dzChatRecount);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") dzChatRecount(); });
    dzChatRecount();
  });
}

function renderBottomNav() {
  if (document.getElementById("mnNav")) return;

  const isOwner = localStorage.getItem("isOwner") === "true";
  const cur = mnNormPath(location.pathname);
  const realIdx = mnActiveIndex();

  const nav = document.createElement("nav");
  nav.id = "mnNav";
  nav.className = "mn-nav mn-no-anim";
  nav.style.setProperty("--n", MN_NAV.length);
  nav.style.setProperty("--i", Math.max(realIdx, 0));

  let itemsHtml = "";
  MN_NAV.forEach((it, i) => {
    const icoHtml = it.img
      ? '<img src="' + mnIconSrc(it) + '" alt="" draggable="false" decoding="sync" data-key="' + it.key + '" data-try="0" data-fallback="' + it.icon + '">'
      : mnSvg(it.icon);
    const inner = '<span class="mn-ico">' + icoHtml + (it.key === "chat" ? DZ_CHAT_BADGES : "") + '</span><span class="mn-label">' + it.label + "</span>";
    if (it.popup) {
      itemsHtml += '<button type="button" class="mn-item" data-idx="' + i + '" data-popup="' + it.popup + '" aria-expanded="false">' + inner + "</button>";
    } else {
      itemsHtml += '<a class="mn-item" data-idx="' + i + '" href="' + it.href + '">' + inner + "</a>";
    }
  });

  nav.innerHTML =
    '<div class="mn-shadow"></div>' +
    '<div class="mn-goo">' +
      '<div class="mn-bar"></div>' +
      '<div class="mn-slot mn-slot-trail"><span class="mn-blob"></span></div>' +
      '<div class="mn-slot mn-slot-lead"><span class="mn-blob"></span></div>' +
    "</div>" +
    '<div class="mn-slot mn-slot-lead mn-bead-wrap"><span class="mn-bead"></span></div>' +
    '<div class="mn-items">' + itemsHtml + "</div>" +
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">' +
      '<defs><filter id="mn-goo" x="-10%" y="-90%" width="120%" height="280%" color-interpolation-filters="sRGB">' +
        '<feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur"/>' +
        '<feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"/>' +
      "</filter></defs>" +
    "</svg>";

  const scrim = document.createElement("div");
  scrim.className = "mn-scrim";
  scrim.id = "mnScrim";

  const popTitles = { dl: "Downloader", preset: "Preset", more: "Menu Lainnya" };
  const pops = {};
  MN_NAV.forEach(it => {
    if (!it.popup) return;
    const p = document.createElement("div");
    p.className = "mn-pop";
    p.id = "mnPop-" + it.popup;
    p.innerHTML = '<div class="mn-pop-title">' + (popTitles[it.popup] || it.label) + "</div>" + mnPopHtml(it.list, it.popup === "more", isOwner, cur);
    pops[it.popup] = p;
  });

  document.body.appendChild(scrim);
  Object.keys(pops).forEach(k => document.body.appendChild(pops[k]));
  document.documentElement.appendChild(nav);

  nav.querySelectorAll(".mn-ico img").forEach(img => {
    const item = MN_NAV.find(x => x.key === img.getAttribute("data-key"));
    const list = mnIconCandidates(item);
    const useFallback = () => {
      const span = img.parentNode;
      if (span) {
        const keep = Array.from(span.querySelectorAll(".dz-cb"));
        span.innerHTML = mnSvg(img.getAttribute("data-fallback"));
        keep.forEach(n => span.appendChild(n));
      }
    };
    const tryNext = () => {
      if (img.src.indexOf("data:") === 0) {
        mnForgetIcon(item.key);
        img.setAttribute("data-try", "0");
        img.src = list[0];
        return;
      }
      const n = parseInt(img.getAttribute("data-try"), 10) + 1;
      if (n >= list.length) {
        useFallback();
        return;
      }
      img.setAttribute("data-try", String(n));
      img.src = list[n];
    };
    img.addEventListener("error", tryNext);
    img.addEventListener("load", () => {
      if (img.src.indexOf("data:") !== 0) mnSaveIcon(item.key, img.src);
    });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) tryNext();
  });

  const items = Array.from(nav.querySelectorAll(".mn-item"));
  let visIdx = -2;
  let openKey = null;
  let navigating = false;

  function melt() {
    nav.classList.remove("mn-melt");
    void nav.offsetWidth;
    nav.classList.add("mn-melt");
    setTimeout(() => nav.classList.remove("mn-melt"), 700);
  }

  function setVisual(idx, animate) {
    if (animate === false) nav.classList.add("mn-no-anim");
    nav.style.setProperty("--i", Math.max(idx, 0));
    nav.classList.toggle("mn-none", idx < 0);
    items.forEach((el, i) => el.classList.toggle("active", i === idx));
    if (animate !== false && idx !== visIdx && idx >= 0) melt();
    visIdx = idx;
    if (animate === false) {
      requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.remove("mn-no-anim")));
    }
  }

  function saveIdx(idx) {
    try { sessionStorage.setItem("mn_idx", String(idx)); } catch (e) {}
  }

  function openPop(key, idx) {
    Object.keys(pops).forEach(k => pops[k].classList.toggle("show", k === key));
    scrim.classList.add("show");
    items.forEach(el => el.setAttribute("aria-expanded", el.dataset.popup === key ? "true" : "false"));
    openKey = key;
    setVisual(idx);
  }

  function closePop(revert) {
    Object.keys(pops).forEach(k => pops[k].classList.remove("show"));
    scrim.classList.remove("show");
    items.forEach(el => el.setAttribute("aria-expanded", "false"));
    openKey = null;
    if (revert !== false) setVisual(realIdx);
  }

  let prev = null;
  try { prev = sessionStorage.getItem("mn_idx"); } catch (e) {}
  prev = prev === null ? null : parseInt(prev, 10);

  if (prev !== null && !isNaN(prev) && prev >= 0 && prev < MN_NAV.length && prev !== realIdx && realIdx >= 0) {
    setVisual(prev, false);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      nav.classList.remove("mn-no-anim");
      setVisual(realIdx);
    }));
  } else {
    setVisual(realIdx, false);
  }
  if (realIdx >= 0) saveIdx(realIdx);

  nav.addEventListener("click", (e) => {
    const el = e.target.closest(".mn-item");
    if (!el) return;
    const idx = parseInt(el.dataset.idx, 10);
    const it = MN_NAV[idx];

    if (it.popup) {
      e.preventDefault();
      if (openKey === it.popup) closePop(true);
      else openPop(it.popup, idx);
      return;
    }

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    e.preventDefault();

    if (idx === realIdx) {
      closePop(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (navigating) return;
    navigating = true;

    closePop(false);
    setVisual(idx);
    saveIdx(idx);
    setTimeout(() => { location.href = it.href; }, 440);
  });

  Object.keys(pops).forEach(key => {
    pops[key].addEventListener("click", (e) => {
      const a = e.target.closest(".mn-pop-item");
      if (!a) return;
      const idx = MN_NAV.findIndex(x => x.popup === key);
      const internal = a.getAttribute("href") && a.getAttribute("href").charAt(0) === "/";
      if (internal) saveIdx(idx);

      setTimeout(() => closePop(!internal), 0);
    });
  });

  scrim.addEventListener("click", () => closePop(true));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openKey) closePop(true); });

  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    navigating = false;
    closePop(false);
    setVisual(realIdx, false);
  });
}

function ensureTopbar() {

  let topbar = document.getElementById("dzTopbar");

  if (!topbar) {
    topbar = document.createElement("div");
    topbar.id = "dzTopbar";
    topbar.className = "topbar";

    document.querySelectorAll(".topbar").forEach(old => {
      Array.from(old.children).forEach(ch => {
        if (!ch.classList.contains("menu-btn") &&
            !ch.classList.contains("topbar-brand") &&
            !ch.id.startsWith("topbar")) {
          topbar.appendChild(ch);
        }
      });
      old.remove();
    });

    document.documentElement.appendChild(topbar);
  }

  document.querySelectorAll(".menu-btn").forEach(el => el.remove());
  const oldSidebar = document.getElementById("sidebar");
  if (oldSidebar) oldSidebar.remove();
  const oldOverlay = document.getElementById("overlay");
  if (oldOverlay) oldOverlay.remove();

  if (!topbar.querySelector(".topbar-brand")) {
    const brand = document.createElement("a");
    brand.className = "topbar-brand";
    brand.href = "/";
    brand.innerHTML = '<img src="./media/logo.png" alt="" onerror="this.style.display=\'none\'"><span>DanzClean</span>';
    topbar.insertBefore(brand, topbar.firstChild);
  }
}

function dzTopbarOk() {
  const t = document.getElementById("dzTopbar");
  return !!(t && t.querySelector(".topbar-brand") && t.querySelector("#topbarNotifBtn") &&
            t.querySelector("#topbarCsBtn") && t.querySelector("#topbarProfileBtn"));
}

function dzRemoveStrayTopbars() {

  document.querySelectorAll(".topbar:not(#dzTopbar)").forEach(el => el.remove());
}

function dzRepairTopbar() {

  if (document.querySelector(".maintenance-page:not(.maintenance-admin)")) return;
  if (dzTopbarOk()) return;
  ensureTopbar();
  renderTopbarProfile();
}

function dzInjectCriticalCss() {
  if (document.getElementById("dzCriticalCss")) return;
  const st = document.createElement("style");
  st.id = "dzCriticalCss";
  st.textContent =
    "#dzTopbar.topbar{display:flex!important;align-items:center!important;padding:0 12px 0 12px!important;z-index:7400!important;overflow:hidden!important;pointer-events:auto!important}" +
    "#dzTopbar>.topbar-notif-btn{margin:0 8px 0 auto!important}" +
    "#dzTopbar>.topbar-cs-btn{margin:0 8px 0 0!important}" +
    "#dzTopbar>.topbar-profile-btn{margin:0!important}" +
    ".topbar-brand{gap:7px;margin-right:6px}.topbar-brand img{width:34px!important;height:34px!important}" +
    ".topbar-brand span{display:block;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".mn-nav{z-index:7700!important}.mn-scrim{z-index:7600!important}.mn-pop{z-index:7750!important}";
  (document.head || document.documentElement).appendChild(st);
}

function initDanzNav() {
  dzInjectCriticalCss();
  dzInjectChatBadgeCss();
  ensureTopbar();
  renderTopbarProfile();
  renderBottomNav();
  dzBootChatBadge();

  let repairs = 0;
  let timer = null;
  dzRemoveStrayTopbars();
  dzBootNotif();
  document.addEventListener("DOMContentLoaded", dzRemoveStrayTopbars);
  window.addEventListener("load", dzRemoveStrayTopbars);
  const mo = new MutationObserver(() => {
    dzRemoveStrayTopbars();
    if (repairs >= 10 || dzTopbarOk()) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!dzTopbarOk()) { repairs++; dzRepairTopbar(); }
    }, 60);
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

if (document.body) {
  initDanzNav();
} else {
  document.addEventListener("DOMContentLoaded", initDanzNav);
}


/* Cegah pinch-zoom & double-tap zoom (iOS Safari / browser yang abaikan meta viewport) */
(function () {
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (ev) {
    document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false });
  });
  document.addEventListener("touchmove", function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  var lastTouchEnd = 0;
  document.addEventListener("touchend", function (e) {
    var now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
})();
