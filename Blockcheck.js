

(function () {

    function getCurrentUid() {
        try {
            const stored = localStorage.getItem("danzclean_logged_user");
            if (!stored) return null;
            const data = JSON.parse(stored);
            return data && data.uid ? data.uid : null;
        } catch (e) {
            return null;
        }
    }

    function paksaLogout() {
        localStorage.removeItem("danzclean_logged_user");
        localStorage.removeItem("isOwner");
        if (typeof firebase !== "undefined" && firebase.auth) {
            firebase.auth().signOut().catch(() => {});
        }
    }

    function tampilkanLayarBlokir(reason) {
        // Cegah interaksi lain di halaman
        document.documentElement.style.overflow = "hidden";

        const overlay = document.createElement("div");
        overlay.id = "accountBlockedOverlay";
        overlay.style.cssText = `
            position:fixed; inset:0; z-index:999999;
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            padding:32px 24px; text-align:center;
            background:#070a13; color:#fff;
            font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
        `;
        overlay.innerHTML = `
            <div style="width:84px;height:84px;margin-bottom:18px;border-radius:50%;display:grid;place-items:center;color:#ff5d73;background:rgba(255,93,115,.12);box-shadow:0 0 0 6px rgba(255,93,115,.06);"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="m5.3 5.3 13.4 13.4"/></svg></div>
            <div style="font-size:24px; font-weight:800; margin-bottom:10px;
                background:linear-gradient(135deg,#ffffff,#ff8fa0);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
                Akun Kamu Diblokir
            </div>
            <div style="color:#b6bedf; font-size:14px; max-width:360px; line-height:1.7; margin-bottom:26px;">
                Akun ini telah diblokir oleh admin dan tidak bisa lagi mengakses layanan danzclean.
                ${reason ? "<br><br><b>Alasan:</b> " + reason : ""}
                <br><br>Jika kamu merasa ini kesalahan, silakan hubungi admin.
            </div>
            <button id="blockedLogoutBtn" style="
                background:#ff5d73; color:#fff; border:none;
                min-height:48px; padding:14px 30px; border-radius:14px;
                font-weight:700; font-size:14px; cursor:pointer;">
                LOGOUT
            </button>
        `;
        document.body.appendChild(overlay);

        document.getElementById("blockedLogoutBtn").addEventListener("click", function () {
            paksaLogout();
            location.href = "/login.html";
        });
    }

    const uid = getCurrentUid();
    if (!uid) return; // belum login, tidak perlu dicek

    function mulaiPantau() {
        firebase.database().ref("blocked_users/" + uid).on("value", function (snap) {
            const data = snap.val();
            if (data && data.blocked) {
                if (!document.getElementById("accountBlockedOverlay")) {
                    tampilkanLayarBlokir(data.reason);
                }
            }
        });
    }

    if (typeof firebase !== "undefined" && firebase.database) {
        mulaiPantau();
    } else {

        const waitFirebase = setInterval(() => {
            if (typeof firebase !== "undefined" && firebase.database) {
                clearInterval(waitFirebase);
                mulaiPantau();
            }
        }, 200);
    }

})();