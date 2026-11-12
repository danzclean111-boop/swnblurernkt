/* ============================================================
   Chat Global - DanzClean
   ============================================================ */

/* ---------- menu sidebar (dipanggil dari onclick di HTML) ---------- */
function toggleMenu() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("overlay").classList.toggle("active");
    document.body.classList.toggle("sidebar-open");
}

(function () {
    var CHAT_PATH = "global_chat/messages";
    var HISTORY_LIMIT = 100;
    var MAX_LEN = 500;
    var SEND_GAP_MS = 1500;
    var GROUP_GAP_MS = 5 * 60 * 1000;
    var TTL_MS = 24 * 60 * 60 * 1000;
    var READ_KEY = "dz_chat_read";
    var SWIPE_TRIGGER = 56, SWIPE_MAX = 72, LONG_PRESS_MS = 460;

    var $ = function (id) { return document.getElementById(id); };
    var listEl = $("cgList"), skelEl = $("cgSkel"), inputEl = $("cgInput"), sendBtn = $("cgSend");
    var noteEl = $("cgNote"), pillEl = $("cgPill"), pillTxt = $("cgPillTxt");
    var dotEl = $("cgDot"), stateEl = $("cgState");
    var replyEl = $("cgReply"), rbName = $("cgRbName"), rbText = $("cgRbText");
    var mentionsEl = $("cgMentions");
    var scrimEl = $("cgScrim"), sheetList = $("cgSheetList"), sheetConfirm = $("cgSheetConfirm");
    var delItem = $("cgDelItem"), copyTxt = $("cgCopyTxt");

    var ICON = {
        chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-7l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/><path d="M8 10h8M8 13h5"/></svg>',
        reply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>'
    };
    var TICKS = {
        sending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
        sent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.8l4.6 4.6L19 7.4"/></svg>',
        seen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1.8 12.8l4.6 4.6 9.4-10"/><path d="M10.2 15.8l1.6 1.6 9.8-10.2"/></svg>'
    };

    /* ---------- identitas ---------- */
    var session = {};
    try { session = JSON.parse(localStorage.getItem("danzclean_logged_user") || "{}") || {}; } catch (e) {}
    var myName = String(session.username || session.name || "User").trim().slice(0, 30) || "User";

    function hashId(str) {
        var h = 5381;
        for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
        return "u" + (h >>> 0).toString(36);
    }
    var myId = hashId(String(session.email || session.username || "anon").toLowerCase().trim());

    /* foto profil: URL https pendek, atau thumbnail data:image kecil (foto asli di akun bisa sampai 2MB, jadi tidak dikirim utuh) */
    function safePhoto(u) {
        u = String(u || "").trim();
        if (/^https:\/\/[^\s"'<>]+$/i.test(u) && u.length <= 500) return u;
        if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(u) && u.length <= 30000) return u;
        return "";
    }
    var profiles = {}; /* id pengguna -> foto (dibaca dari global_chat/profiles) */

    var isOwner = false;
    try { isOwner = (typeof cekAkunOwner === "function" && cekAkunOwner()) || localStorage.getItem("isOwner") === "true"; } catch (e) {}

    var AV_COLORS = ["#3a68e8", "#12805a", "#8a3fd0", "#c2492a", "#bf2a64", "#12788f", "#8f5f08"];
    var NM_COLORS = ["#8fb0ff", "#5fe0b0", "#d3a4ff", "#ffa98c", "#ff8fb4", "#6fd6f2", "#f4c44f"];
    /* avatar: huruf berwarna sebagai dasar, foto akun menimpa kalau ada dan berhasil dimuat */
    function setAvatarPhoto(av, photo) {
        var old = av.querySelector("img");
        if (old) av.removeChild(old);
        if (!photo) return;
        var img = document.createElement("img");
        img.alt = ""; img.decoding = "async"; img.referrerPolicy = "no-referrer";
        img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
        img.src = photo;
        av.appendChild(img);
    }
    function makeAvatar(name, color, photo, cls, uid) {
        var av = el("div", "cg-avatar" + (cls ? " " + cls : ""), String(name || "?").charAt(0));
        av.style.background = color;
        if (uid) av.dataset.uid = uid;
        setAvatarPhoto(av, photo);
        return av;
    }
    function refreshAvatars(uid) {
        var list = document.querySelectorAll('.cg-avatar[data-uid="' + uid + '"]:not(.ghost)');
        for (var i = 0; i < list.length; i++) setAvatarPhoto(list[i], profiles[uid]);
    }
    function colorIdx(id) {
        var n = 0;
        for (var i = 0; i < id.length; i++) n = (n + id.charCodeAt(i)) % AV_COLORS.length;
        return n;
    }

    function db() {
        var useChat = typeof FIREBASE_CONFIG_CHAT !== "undefined";
        var name = useChat ? "chatApp" : "verifyApp";
        var app = firebase.apps.find(function (a) { return a.name === name; });
        if (!app) app = firebase.initializeApp(useChat ? FIREBASE_CONFIG_CHAT : FIREBASE_CONFIG_VERIFY, name);
        return app.database();
    }
    var database = db();
    var ref = database.ref(CHAT_PATH);

    /* ---------- util ---------- */
    function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    function toArr(v) { return Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.keys(v).map(function (k) { return v[k]; }) : []); }
    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    function fmtTime(ts) { return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"); }
    function dayLabel(ts) {
        var d = new Date(ts), t = new Date();
        if (d.toDateString() === t.toDateString()) return "Hari ini";
        var y = new Date(); y.setDate(t.getDate() - 1);
        if (d.toDateString() === y.toDateString()) return "Kemarin";
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    }
    function note(msg) {
        noteEl.textContent = msg || "";
        if (msg) setTimeout(function () { if (noteEl.textContent === msg) noteEl.textContent = ""; }, 3500);
    }
    function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

    function nearBottom() { return listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 90; }
    var newCount = 0;
    function toBottom() { listEl.scrollTop = listEl.scrollHeight; pillEl.hidden = true; newCount = 0; }
    listEl.addEventListener("scroll", function () { if (nearBottom()) { pillEl.hidden = true; newCount = 0; } });
    pillEl.addEventListener("click", toBottom);

    /* ---------- state ---------- */
    var rows = {}, msgs = {}, people = {}, mineRows = {};
    var pending = {}, othersSeen = 0;
    var last = { u: null, ts: 0, day: "" };
    var loaded = false, maxTs = 0;
    var replyTo = null;

    function stateFor(key, ts) {
        if (pending[key]) return "sending";
        return othersSeen && othersSeen >= ts ? "seen" : "sent";
    }
    function setTick(node, state) {
        node.className = "cg-tick " + state;
        node.innerHTML = TICKS[state];
        node.setAttribute("aria-label", state === "seen" ? "Dilihat" : state === "sent" ? "Terkirim" : "Mengirim");
    }
    function refreshTicks() { for (var k in mineRows) setTick(mineRows[k].el, stateFor(k, mineRows[k].ts)); }

    function updatePeopleCount() {
        var n = Object.keys(people).length;
        if (n && dotEl.classList.contains("on")) stateEl.textContent = "Terhubung · " + n + " peserta";
    }

    /* ---------- penanda baca (dipakai badge di sidebar) ---------- */
    function markRead() {
        if (!loaded || document.visibilityState !== "visible" || !maxTs) return;
        try {
            var cur = Number(localStorage.getItem(READ_KEY)) || 0;
            if (maxTs > cur) localStorage.setItem(READ_KEY, String(maxTs));
        } catch (e) {}
    }
    document.addEventListener("visibilitychange", markRead);

    /* ---------- teks + mention ---------- */
    function fillText(node, text, mn) {
        node.textContent = "";
        var list = toArr(mn).filter(function (x) { return x && x.n; });
        if (!list.length) { node.textContent = text; return; }
        var names = list.map(function (x) { return x.n; }).sort(function (a, b) { return b.length - a.length; }).map(esc);
        var re = new RegExp("@(" + names.join("|") + ")(?![A-Za-z0-9_])", "gi");
        var pos = 0, m;
        while ((m = re.exec(text))) {
            if (m.index > pos) node.appendChild(document.createTextNode(text.slice(pos, m.index)));
            var hit = list.filter(function (x) { return x.n.toLowerCase() === m[1].toLowerCase(); })[0];
            node.appendChild(el("span", "cg-tag" + (hit && hit.u === myId ? " me" : ""), m[0]));
            pos = m.index + m[0].length;
        }
        if (pos < text.length) node.appendChild(document.createTextNode(text.slice(pos)));
    }
    function mentionsMe(m) {
        var r = m.r && m.r.u === myId;
        return !!r || toArr(m.mn).some(function (x) { return x && x.u === myId; });
    }

    /* ---------- keadaan kosong ---------- */
    function showEmpty() {
        if (listEl.querySelector(".cg-row") || listEl.querySelector(".cg-state-box")) return;
        var box = el("div", "cg-state-box");
        box.innerHTML = '<div class="ico">' + ICON.chat + '</div><b>Belum ada pesan</b>Jadi yang pertama menyapa!';
        listEl.appendChild(box);
    }
    function clearStateBoxes() {
        var b = listEl.querySelector(".cg-state-box"); if (b) b.remove();
        if (skelEl && skelEl.parentNode) skelEl.remove();
    }

    /* hapus penanda hari yatim (tanpa pesan di bawahnya) + sinkronkan status pengelompokan */
    function pruneDays() {
        Array.prototype.slice.call(listEl.children).forEach(function (n) {
            if (!n.classList.contains("cg-day")) return;
            var nx = n.nextElementSibling;
            if (!nx || !nx.classList.contains("cg-row")) n.remove();
        });
        var rs = listEl.querySelectorAll(".cg-row:not(.gone)");
        var lr = rs[rs.length - 1], m = lr && msgs[lr.dataset.key];
        if (m) {
            var t = Number(m.ts) || 0;
            last = { u: m.u, ts: t, day: new Date(t).toDateString() };
        } else {
            last = { u: null, ts: 0, day: "" };
        }
    }

    /* ---------- render pesan ---------- */
    function render(key, m) {
        if (rows[key]) return;
        clearStateBoxes();

        var ts = Number(m.ts) || Date.now();
        if (ts > maxTs) maxTs = ts;
        var mine = m.u === myId;
        var admin = !!m.o;
        var stick = nearBottom() || mine;
        msgs[key] = m;
        if (m.u) people[m.u] = { n: String(m.n || "User"), o: admin };

        var dayKey = new Date(ts).toDateString();
        var newDay = dayKey !== last.day;
        if (newDay) listEl.appendChild(el("div", "cg-day", dayLabel(ts)));
        var grouped = !newDay && m.u === last.u && (ts - last.ts) < GROUP_GAP_MS;
        last = { u: m.u, ts: ts, day: dayKey };

        var ci = colorIdx(String(m.u || m.n || "?"));
        var row = el("div", "cg-row" + (mine ? " me" : "") + (grouped ? " grouped" : "") + (admin ? " owner" : "") + (!mine && mentionsMe(m) ? " tagged" : ""));
        row.dataset.key = key;
        rows[key] = row;

        var swipeIc = el("span", "cg-swipe-ic");
        swipeIc.setAttribute("aria-hidden", "true");
        swipeIc.innerHTML = ICON.reply;
        row.appendChild(swipeIc);

        var inner = el("div", "cg-inner");

        if (!mine) {
            inner.appendChild(makeAvatar(m.n, AV_COLORS[ci], grouped ? "" : profiles[m.u], grouped ? "ghost" : "", m.u));
        }

        var col = el("div", "cg-col");
        var bubble = el("div", "cg-bubble");
        bubble.tabIndex = 0;
        bubble.setAttribute("aria-haspopup", "dialog");

        if (!grouped && !mine) {
            var nm = el("div", "cg-name");
            if (!mine) {
                var nt = el("span", "", String(m.n || "User"));
                nt.style.color = NM_COLORS[ci];
                nm.appendChild(nt);
            }
            bubble.appendChild(nm);
        }

        if (m.r && m.r.t != null) {
            var rc = colorIdx(String(m.r.u || m.r.n || "?"));
            var q = el("div", "cg-quote");
            q.style.setProperty("--qc", NM_COLORS[rc]);
            q.style.setProperty("--qn", NM_COLORS[rc]);
            q.appendChild(el("i", "qbar"));
            var qb = el("div", "qb");
            qb.appendChild(el("b", "", m.r.u === myId ? "Kamu" : String(m.r.n || "User")));
            qb.appendChild(el("span", "", String(m.r.t)));
            q.appendChild(qb);
            q.addEventListener("click", function (e) { e.stopPropagation(); jumpTo(m.r.k); });
            bubble.appendChild(q);
        }

        var tx = el("span", "cg-text");
        fillText(tx, String(m.t || ""), m.mn);
        var tm = el("span", "cg-time");
        tm.appendChild(el("span", "", fmtTime(ts)));
        if (mine) {
            var tk = el("span");
            setTick(tk, stateFor(key, ts));
            tm.appendChild(tk);
            mineRows[key] = { el: tk, ts: ts };
        }
        bubble.appendChild(tx);
        bubble.appendChild(tm);
        col.appendChild(bubble);
        inner.appendChild(col);
        row.appendChild(inner);

        bindGestures(row, inner, swipeIc, bubble, key);
        listEl.appendChild(row);

        if (stick) toBottom();
        else if (loaded) {
            newCount++;
            pillTxt.textContent = newCount + " pesan baru";
            pillEl.hidden = false;
        }
        if (loaded) { markRead(); if (!mine) markSeen(); }
        updatePeopleCount();
    }

    function jumpTo(key) {
        var r = rows[key];
        if (!r) return note("Pesan asli sudah dihapus.");
        r.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        r.classList.remove("flash"); void r.offsetWidth; r.classList.add("flash");
        setTimeout(function () { r.classList.remove("flash"); }, 1300);
    }

    /* ---------- gestur: geser kanan = balas, tahan = menu ---------- */
    function bindGestures(row, inner, ic, bubble, key) {
        var st = null, lp = null, longFired = false;

        function reset() {
            clearTimeout(lp);
            row.classList.remove("dragging", "armed");
            inner.style.transform = "";
            ic.style.opacity = ""; ic.style.transform = "";
            st = null;
        }

        row.addEventListener("pointerdown", function (e) {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (e.target.closest("button, a")) return;
            st = { x: e.clientX, y: e.clientY, id: e.pointerId, mode: null, tx: 0 };
            longFired = false;
            clearTimeout(lp);
            lp = setTimeout(function () {
                if (!st || st.mode) return;
                longFired = true;
                buzz(14);
                openMenu(key);
            }, LONG_PRESS_MS);
        });

        row.addEventListener("pointermove", function (e) {
            if (!st || e.pointerId !== st.id) return;
            var dx = e.clientX - st.x, dy = e.clientY - st.y;
            if (!st.mode) {
                if (Math.abs(dx) > 9 || Math.abs(dy) > 9) {
                    clearTimeout(lp);
                    if (dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                        st.mode = "swipe";
                        row.classList.add("dragging");
                        try { row.setPointerCapture(e.pointerId); } catch (er) {}
                    } else {
                        st.mode = "no";
                    }
                }
                return;
            }
            if (st.mode !== "swipe") return;
            var tx = dx <= 0 ? 0 : (dx <= SWIPE_TRIGGER ? dx : SWIPE_TRIGGER + (dx - SWIPE_TRIGGER) * 0.25);
            tx = Math.min(tx, SWIPE_MAX);
            st.tx = tx;
            inner.style.transform = "translateX(" + tx + "px)";
            var p = Math.min(1, tx / SWIPE_TRIGGER);
            ic.style.opacity = String(Math.min(1, tx / 28));
            ic.style.transform = "scale(" + (0.5 + 0.5 * p) + ")";
            var armed = tx >= SWIPE_TRIGGER;
            if (armed && !row.classList.contains("armed")) buzz(10);
            row.classList.toggle("armed", armed);
        });

        function end(e) {
            if (!st || (e && e.pointerId !== st.id)) return;
            var fire = st.mode === "swipe" && st.tx >= SWIPE_TRIGGER && e && e.type === "pointerup";
            reset();
            if (fire) setReply(key);
        }
        row.addEventListener("pointerup", end);
        row.addEventListener("pointercancel", function (e) { reset(); });

        row.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            if (!longFired) openMenu(key);
        });
        bubble.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " " || e.key === "ContextMenu") { e.preventDefault(); openMenu(key); }
        });
        bubble.addEventListener("dblclick", function () { setReply(key); });
    }

    /* ---------- balas ---------- */
    function setReply(key) {
        var m = msgs[key]; if (!m) return;
        replyTo = { k: key, u: m.u || "", n: String(m.n || "User"), t: String(m.t || "").slice(0, 120) };
        var ci = colorIdx(String(m.u || m.n || "?"));
        replyEl.style.setProperty("--qc", NM_COLORS[ci]);
        replyEl.style.setProperty("--qn", NM_COLORS[ci]);
        rbName.textContent = m.u === myId ? "Kamu" : replyTo.n;
        rbText.textContent = replyTo.t;
        replyEl.hidden = false;
        inputEl.focus();
    }
    function clearReply() { replyTo = null; replyEl.hidden = true; }
    $("cgRbX").addEventListener("click", function () { clearReply(); inputEl.focus(); });
    $("cgRbX").addEventListener("pointerdown", function (e) { e.preventDefault(); });

    /* ---------- menu tahan pesan ---------- */
    var menuKey = null, menuOpenedAt = 0;
    function openMenu(key) {
        var m = msgs[key]; if (!m) return;
        if (menuKey === key) return;
        closeMenu(true);
        menuKey = key; menuOpenedAt = Date.now();
        if (rows[key]) rows[key].classList.add("picked");
        $("cgSheetWho").textContent = m.u === myId ? "Pesan kamu" : String(m.n || "User");
        $("cgSheetTxt").textContent = String(m.t || "");
        copyTxt.textContent = "Salin";
        delItem.hidden = !(m.u === myId || isOwner);
        sheetList.hidden = false; sheetConfirm.hidden = true;
        scrimEl.hidden = false;
        requestAnimationFrame(function () { scrimEl.classList.add("show"); });
        setTimeout(function () { var f = sheetList.querySelector(".cg-sheet-item:not([hidden])"); if (f) f.focus(); }, 60);
    }
    function closeMenu(instant) {
        if (!menuKey && scrimEl.hidden) return;
        if (rows[menuKey]) rows[menuKey].classList.remove("picked");
        menuKey = null;
        scrimEl.classList.remove("show");
        if (instant) scrimEl.hidden = true;
        else setTimeout(function () { if (!menuKey) scrimEl.hidden = true; }, 200);
    }
    scrimEl.addEventListener("click", function (e) {
        if (e.target === scrimEl && Date.now() - menuOpenedAt > 350) closeMenu();
    });
    $("cgSheet").addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]"); if (!b || !menuKey) return;
        var key = menuKey, m = msgs[key], act = b.dataset.act;
        if (!m) return closeMenu();
        if (act === "reply") { closeMenu(); setReply(key); }
        else if (act === "copy") {
            var t = String(m.t || "");
            var done = function () { copyTxt.textContent = "Tersalin"; setTimeout(closeMenu, 600); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done).catch(function () { legacyCopy(t); done(); });
            else { legacyCopy(t); done(); }
        }
        else if (act === "del") { sheetList.hidden = true; sheetConfirm.hidden = false; var c = sheetConfirm.querySelector(".fill"); if (c) c.focus(); }
        else if (act === "cancel") { sheetConfirm.hidden = true; sheetList.hidden = false; }
        else if (act === "confirm") {
            if (m && (m.u === myId || isOwner)) {
                ref.child(key).remove().catch(function () { note("Gagal menghapus. Cek rules Firebase / koneksi."); });
            }
            closeMenu();
        }
    });
    function legacyCopy(t) {
        try {
            var ta = document.createElement("textarea");
            ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
        } catch (e) {}
    }
    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        if (menuKey) closeMenu(); else if (replyTo) clearReply();
    });

    /* ---------- sebut @ ---------- */
    var mentionIdx = 0, mentionList = [];
    function currentToken() {
        var pos = inputEl.selectionStart, before = inputEl.value.slice(0, pos);
        var mt = /(^|\s)@([^\s@]*)$/.exec(before);
        return mt ? { start: pos - mt[2].length - 1, pos: pos, q: mt[2] } : null;
    }
    function hideMentions() { mentionsEl.hidden = true; mentionList = []; }
    function updateMentions() {
        var tk = currentToken();
        if (!tk) return hideMentions();
        var q = tk.q.toLowerCase();
        mentionList = Object.keys(people).filter(function (id) {
            return id !== myId && people[id].n.toLowerCase().indexOf(q) !== -1;
        }).sort(function (a, b) {
            var as = people[a].n.toLowerCase().indexOf(q) === 0 ? 0 : 1, bs = people[b].n.toLowerCase().indexOf(q) === 0 ? 0 : 1;
            return as - bs || people[a].n.localeCompare(people[b].n);
        }).slice(0, 5);
        if (!mentionList.length) return hideMentions();
        mentionIdx = Math.min(mentionIdx, mentionList.length - 1);
        mentionsEl.innerHTML = "";
        mentionList.forEach(function (id, i) {
            var p = people[id];
            var b = el("button", "cg-ment" + (i === mentionIdx ? " on" : ""));
            b.type = "button"; b.setAttribute("role", "option");
            b.appendChild(makeAvatar(p.n, AV_COLORS[colorIdx(id)], profiles[id], "", id));
            b.appendChild(el("span", "n", p.n));
            b.addEventListener("pointerdown", function (e) { e.preventDefault(); });
            b.addEventListener("click", function () { pickMention(id); });
            mentionsEl.appendChild(b);
        });
        mentionsEl.hidden = false;
    }
    function pickMention(id) {
        var tk = currentToken(); if (!tk || !people[id]) return hideMentions();
        var v = inputEl.value, ins = "@" + people[id].n + " ";
        inputEl.value = v.slice(0, tk.start) + ins + v.slice(tk.pos);
        var caret = tk.start + ins.length;
        inputEl.setSelectionRange(caret, caret);
        hideMentions(); mentionIdx = 0;
        inputEl.dispatchEvent(new Event("input"));
        inputEl.focus();
    }
    function findMentions(text) {
        var out = [];
        Object.keys(people).forEach(function (id) {
            if (id === myId) return;
            var re = new RegExp("@" + esc(people[id].n) + "(?![A-Za-z0-9_])", "i");
            if (re.test(text)) out.push({ u: id, n: people[id].n });
        });
        return out.slice(0, 10);
    }

    /* ---------- dilihat ---------- */
    var lastSeenWrite = 0, seenTimer = null;
    function markSeen() {
        if (!loaded || document.visibilityState !== "visible") return;
        var wait = 4000 - (Date.now() - lastSeenWrite);
        if (wait > 0) {
            if (!seenTimer) seenTimer = setTimeout(function () { seenTimer = null; markSeen(); }, wait);
            return;
        }
        lastSeenWrite = Date.now();
        database.ref("global_chat/seen/" + myId).set(firebase.database.ServerValue.TIMESTAMP).catch(function () {});
    }
    document.addEventListener("visibilitychange", markSeen);
    window.addEventListener("focus", markSeen);

    database.ref("global_chat/seen").on("value", function (snap) {
        var max = 0;
        snap.forEach(function (c) {
            if (c.key === myId) return;
            var v = Number(c.val()) || 0;
            if (v > max) max = v;
        });
        othersSeen = max;
        refreshTicks();
    });

    /* ---------- muat & dengarkan ---------- */
    var query = ref.orderByChild("ts").startAt(Date.now() - TTL_MS).limitToLast(HISTORY_LIMIT);
    query.once("value").then(function () {
        loaded = true;
        markSeen(); markRead();
        if (skelEl && skelEl.parentNode) skelEl.remove();
        showEmpty();
        toBottom();
    }).catch(function () {
        if (skelEl && skelEl.parentNode) skelEl.remove();
        var box = el("div", "cg-state-box");
        box.innerHTML = '<div class="ico">' + ICON.chat + '</div><b>Gagal memuat chat</b>Cek koneksi atau rules Firebase, lalu coba lagi.';
        listEl.appendChild(box);
    });

    query.on("child_added", function (snap) {
        var m = snap.val();
        if (m && typeof m === "object") render(snap.key, m);
    });
    query.on("child_removed", function (snap) {
        var key = snap.key, row = rows[key];
        if (menuKey === key) closeMenu(true);
        if (row) {
            row.classList.add("gone");
            setTimeout(function () { row.remove(); pruneDays(); }, 190);
            delete rows[key]; delete mineRows[key]; delete msgs[key];
        }
        if (loaded) setTimeout(showEmpty, 200);
    });

    function purgeExpired() {
        ref.orderByChild("ts").endAt(Date.now() - TTL_MS).limitToFirst(200).once("value").then(function (snap) {
            var updates = {}, n = 0;
            snap.forEach(function (c) { updates[c.key] = null; n++; });
            if (n) return ref.update(updates);
        }).catch(function () {});
        database.ref("global_chat/seen").orderByValue().endAt(Date.now() - TTL_MS).once("value").then(function (snap) {
            var updates = {}, n = 0;
            snap.forEach(function (c) { updates[c.key] = null; n++; });
            if (n) return database.ref("global_chat/seen").update(updates);
        }).catch(function () {});
    }
    purgeExpired();
    setInterval(purgeExpired, 10 * 60 * 1000);

    database.ref(".info/connected").on("value", function (s) {
        var on = s.val() === true;
        dotEl.classList.toggle("on", on);
        stateEl.textContent = on ? "Terhubung" : "Menyambung...";
        if (on) updatePeopleCount();
    });

    /* ---------- foto profil akun ---------- */
    var profRef = database.ref("global_chat/profiles");
    function onProfile(snap) {
        var v = safePhoto(snap.val());
        if (profiles[snap.key] === v) return;
        profiles[snap.key] = v;
        refreshAvatars(snap.key);
    }
    var profWarned = false;
    function profFail(what, err) {
        try { console.warn("[chat] foto profil: " + what, err); } catch (e) {}
        if (profWarned) return;
        profWarned = true;
        note("Foto profil belum bisa " + what + " (" + ((err && err.code) || "error") + "). Cek rules Firebase global_chat/profiles.");
    }
    function profReadFail(err) { profFail("dimuat", err); }
    profRef.on("child_added", onProfile, profReadFail);
    profRef.on("child_changed", onProfile, profReadFail);
    profRef.on("child_removed", function (snap) { delete profiles[snap.key]; refreshAvatars(snap.key); }, profReadFail);

    function makeThumb(src, done) {
        var img = new Image();
        if (!/^data:/i.test(src)) img.crossOrigin = "anonymous";
        img.onload = function () {
            try {
                var S = 96, c = document.createElement("canvas");
                c.width = c.height = S;
                var w = img.naturalWidth, h = img.naturalHeight, side = Math.min(w, h);
                if (!side) return done("");
                var g = c.getContext("2d");
                g.fillStyle = "#fff"; g.fillRect(0, 0, S, S);
                g.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, S, S);
                var out = c.toDataURL("image/jpeg", 0.72);
                if (out.length > 20000) out = c.toDataURL("image/jpeg", 0.5);
                done(safePhoto(out));
            } catch (e) { done(""); }
        };
        img.onerror = function () { done(""); };
        img.src = src;
    }
    function publishMyPhoto() {
        var src = String(session.photo || "").trim();
        if (!src) return;
        makeThumb(src, function (thumb) {
            /* kalau thumbnail gagal dibuat (mis. foto https dari situs lain yang memblokir canvas), pakai URL aslinya */
            var val = thumb || safePhoto(src);
            if (!val) return;
            profRef.child(myId).once("value").then(function (snap) {
                if (snap.val() !== val) return profRef.child(myId).set(val);
            }).catch(function (err) { profFail("dikirim", err); });
        });
    }
    publishMyPhoto();

    /* ---------- kirim ---------- */
    var lastSend = 0;
    function syncSend() { sendBtn.disabled = !inputEl.value.trim(); }
    function send() {
        var text = inputEl.value.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
        if (!text) return;
        if (text.length > MAX_LEN) text = text.slice(0, MAX_LEN);
        var now = Date.now();
        if (now - lastSend < SEND_GAP_MS) return note("Terlalu cepat, tunggu sebentar.");
        lastSend = now;

        var payload = { n: myName, u: myId, t: text, ts: firebase.database.ServerValue.TIMESTAMP };
        if (isOwner) payload.o = true;
        var mn = findMentions(text);
        if (mn.length) payload.mn = mn;
        if (replyTo) payload.r = { k: replyTo.k, u: replyTo.u, n: replyTo.n, t: replyTo.t };
        var sentReply = replyTo;

        var newRef = ref.push();
        var key = newRef.key;
        pending[key] = true;
        inputEl.value = "";
        inputEl.style.height = "auto";
        hideMentions(); clearReply(); syncSend();
        inputEl.focus();

        newRef.set(payload).then(function () {
            delete pending[key];
            refreshTicks();
        }).catch(function (err) {
            delete pending[key];
            try { console.error("[chat] gagal kirim:", err); } catch (e) {}
            if (!inputEl.value) inputEl.value = text;
            if (sentReply && !replyTo) setReply(sentReply.k);
            syncSend();
            note("Gagal mengirim (" + ((err && err.code) || "error") + "). Cek rules Firebase / koneksi.");
        });
    }

    sendBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); });
    sendBtn.addEventListener("click", send);
    inputEl.addEventListener("keydown", function (e) {
        if (!mentionsEl.hidden && mentionList.length) {
            if (e.key === "ArrowDown") { e.preventDefault(); mentionIdx = (mentionIdx + 1) % mentionList.length; return updateMentions(); }
            if (e.key === "ArrowUp") { e.preventDefault(); mentionIdx = (mentionIdx - 1 + mentionList.length) % mentionList.length; return updateMentions(); }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); return pickMention(mentionList[mentionIdx]); }
            if (e.key === "Escape") { e.preventDefault(); return hideMentions(); }
        }
        var desktop = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (e.key === "Enter" && !e.shiftKey && desktop) { e.preventDefault(); send(); }
    });
    inputEl.addEventListener("input", function () {
        inputEl.style.height = "auto";
        inputEl.style.height = Math.min(inputEl.scrollHeight, 112) + "px";
        mentionIdx = 0;
        syncSend();
        updateMentions();
    });
    inputEl.addEventListener("click", updateMentions);
    inputEl.addEventListener("focus", function () {
        document.documentElement.classList.add("cg-typing");
        setTimeout(toBottom, 250);
    });
    inputEl.addEventListener("blur", function () {
        setTimeout(function () { document.documentElement.classList.remove("cg-typing"); hideMentions(); }, 120);
    });

})();
