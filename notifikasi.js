(function () {
    const NOTIF_DB_PATH = "notifications";
    const LAST_SEEN_KEY = "danzclean_last_seen_notif";

    let notifData = {};
    let panelEl = null;
    let dbRefListening = false;

    function isOwnerUser() {
        return localStorage.getItem("isOwner") === "true";
    }

    function waitForFirebase(callback, tries) {
        tries = tries || 0;
        const ready = typeof firebase !== "undefined" &&
            firebase.database &&
            typeof FIREBASE_CONFIG_MAIN !== "undefined";

        if (ready) {
            callback();
        } else if (tries < 150) {
            setTimeout(() => waitForFirebase(callback, tries + 1), 200);
        }
    }

    const NOTIF_APP_NAME = "notifApp";

    function getMainDb() {
        if (!firebase.apps.find(a => a.name === NOTIF_APP_NAME)) {
            firebase.initializeApp(FIREBASE_CONFIG_MAIN, NOTIF_APP_NAME);
        }
        return firebase.app(NOTIF_APP_NAME).database();
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.innerText = str == null ? "" : String(str);
        return div.innerHTML;
    }

    function formatTanggal(ts) {
        if (!ts) return "";
        try {
            const d = new Date(ts);
            return d.toLocaleString("id-ID", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit"
            });
        } catch (e) {
            return "";
        }
    }

    function buildPanel() {
        if (panelEl) return panelEl;

        panelEl = document.createElement("div");
        panelEl.className = "notif-panel";
        panelEl.id = "notifPanel";
        document.body.appendChild(panelEl);

        document.addEventListener("click", (e) => {
            if (!panelEl) return;
            const btn = document.getElementById("topbarNotifBtn");
            if (!panelEl.contains(e.target) && e.target !== btn && !(btn && btn.contains(e.target))) {
                closeNotifPanel();
            }
        });

        window.addEventListener("resize", () => {
            if (panelEl.classList.contains("show")) positionPanel();
        });

        return panelEl;
    }

    function positionPanel() {
        const btn = document.getElementById("topbarNotifBtn");
        const topbar = document.querySelector(".topbar");
        if (!btn || !topbar || !panelEl) return;

        const margin = 12;
        const topbarRect = topbar.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const panelWidth = panelEl.offsetWidth || 240;

        let left = btnRect.left + (btnRect.width / 2) - (panelWidth / 2);
        left = Math.min(left, window.innerWidth - panelWidth - margin);
        left = Math.max(margin, left);

        panelEl.style.top = (topbarRect.bottom + 12) + "px";
        panelEl.style.left = left + "px";
        panelEl.style.right = "auto";
    }

    function renderPanel() {
        if (!panelEl) return;
        const owner = isOwnerUser();

        const entries = Object.entries(notifData || {})
            .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));

        let listHtml;
        if (!entries.length) {
            listHtml = `<div class="notif-empty">Belum ada informasi terbaru.</div>`;
        } else {
            listHtml = entries.map(([key, n]) => `
                <div class="notif-item">
                    <div class="notif-item-title">${escapeHtml(n.title || "Informasi")}</div>
                    <div class="notif-item-msg">${escapeHtml(n.message || "")}</div>
                    <div class="notif-item-foot">
                        <span class="notif-item-date">${formatTanggal(n.createdAt)}</span>
                        ${owner ? `<button type="button" class="notif-del-btn" data-key="${key}">Hapus</button>` : ""}
                    </div>
                </div>
            `).join("");
        }

        panelEl.innerHTML = `
            <div class="notif-panel-header">Informasi Terbaru</div>
            <div class="notif-panel-list">${listHtml}</div>
            ${owner ? `
            <div class="notif-panel-add">
                <input type="text" id="notifTitleInput" placeholder="Judul (opsional)">
<textarea id="notifMsgInput" placeholder="Tulis informasi terbaru..." rows="2"></textarea>
                <button type="button" id="notifAddBtn">+ Tambah Informasi</button>
            </div>` : ""}
        `;

        if (owner) {
            const addBtn = panelEl.querySelector("#notifAddBtn");
            if (addBtn) addBtn.addEventListener("click", handleAddNotif);

            panelEl.querySelectorAll(".notif-del-btn").forEach(btn => {
                btn.addEventListener("click", () => handleDeleteNotif(btn.getAttribute("data-key")));
            });
        }
    }

    function handleAddNotif() {
        if (!isOwnerUser()) return;

        const titleInput = document.getElementById("notifTitleInput");
        const msgInput = document.getElementById("notifMsgInput");
        const title = (titleInput.value || "").trim();
        const message = (msgInput.value || "").trim();

        if (!message) {
            msgInput.focus();
            return;
        }

        let loggedUser = {};
        try {
            loggedUser = JSON.parse(localStorage.getItem("danzclean_logged_user")) || {};
        } catch (e) {}

        const addBtn = document.getElementById("notifAddBtn");
        if (addBtn) {
            addBtn.disabled = true;
            addBtn.innerText = "Menyimpan...";
        }

        getMainDb().ref(NOTIF_DB_PATH).push({
            title: title || "Informasi",
            message: message,
            author: loggedUser.username || "Owner",
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            titleInput.value = "";
            msgInput.value = "";
        }).catch(err => {
            console.error("Gagal menambah notifikasi:", err);
        }).finally(() => {
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.innerText = "+ Tambah Informasi";
            }
        });
    }

    function handleDeleteNotif(key) {
        if (!isOwnerUser() || !key) return;
        getMainDb().ref(NOTIF_DB_PATH).child(key).remove().catch(err => {
            console.error("Gagal menghapus notifikasi:", err);
        });
    }

    function getLatestTimestamp() {
        const timestamps = Object.values(notifData || {}).map(n => n.createdAt || 0);
        return timestamps.length ? Math.max(...timestamps) : 0;
    }

    function updateDotVisibility() {
        const dot = document.getElementById("topbarNotifDot");
        if (!dot) return;

        const latest = getLatestTimestamp();
        const lastSeen = parseInt(localStorage.getItem(LAST_SEEN_KEY) || "0", 10);

        dot.style.display = latest > lastSeen ? "block" : "none";
    }

    function markAllSeen() {
        localStorage.setItem(LAST_SEEN_KEY, String(getLatestTimestamp()));
        updateDotVisibility();
    }

    function openNotifPanel() {
        buildPanel();
        renderPanel();
        positionPanel();
        panelEl.classList.add("show");
        markAllSeen();
    }

    function closeNotifPanel() {
        if (panelEl) panelEl.classList.remove("show");
    }

    function toggleNotifPanel() {
        if (panelEl && panelEl.classList.contains("show")) {
            closeNotifPanel();
        } else {
            openNotifPanel();
        }
    }

    function startListening() {
        if (dbRefListening) return;
        dbRefListening = true;

        const db = getMainDb();
        db.ref(NOTIF_DB_PATH).on("value", (snap) => {
            notifData = snap.val() || {};
            updateDotVisibility();
            if (panelEl && panelEl.classList.contains("show")) {
                renderPanel();
            }
        }, (err) => {
            console.error("Gagal memuat notifikasi:", err);
        });
    }

    window.toggleNotifPanel = toggleNotifPanel;

    function init() {
        waitForFirebase(() => {
            try {
                startListening();
            } catch (err) {
                console.error("Notifikasi Firebase error:", err);
            }
        });
    }

    init();
})();
