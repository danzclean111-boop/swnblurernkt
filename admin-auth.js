/* DanzClean - verifikasi admin lewat Google Sign-In (dicek oleh Firebase Rules, bukan localStorage).
   Hanya email di ADMIN_EMAILS (dan harus sama dengan daftar di Firebase Rules) yang boleh menulis ke path admin. */
(function () {
    "use strict";
    var ADMIN_EMAILS = [
        "caisen004@gmail.com",
        "yeonj7725@gmail.com",
        "vizomzomi@gmail.com",
        "oktabae491@gmail.com"
    ];
    var AUTH_SDK = "https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js";
    var inflight = {};
    var sdkPromise = null;

    function loadAuthSdk() {
        if (typeof firebase !== "undefined" && firebase.auth) return Promise.resolve();
        if (sdkPromise) return sdkPromise;
        sdkPromise = new Promise(function (res, rej) {
            var s = document.createElement("script");
            s.src = AUTH_SDK;
            s.onload = res;
            s.onerror = function () { sdkPromise = null; rej(new Error("Gagal memuat Firebase Auth.")); };
            document.head.appendChild(s);
        });
        return sdkPromise;
    }

    function isAdminEmail(email) {
        return !!email && ADMIN_EMAILS.indexOf(String(email).toLowerCase()) !== -1;
    }

    window.dzAdminEnsure = function (app) {
        app = app || firebase.app();
        var key = app.name || "[DEFAULT]";
        if (inflight[key]) return inflight[key];
        inflight[key] = loadAuthSdk().then(function () {
            var auth = firebase.auth(app);
            return new Promise(function (res) {
                var off = auth.onAuthStateChanged(function (u) { off(); res(u); });
            }).then(function (cur) {
                if (cur && isAdminEmail(cur.email)) return cur;
                var provider = new firebase.auth.GoogleAuthProvider();
                provider.setCustomParameters({ prompt: "select_account" });
                return auth.signInWithPopup(provider).then(function (r) {
                    if (!r.user || !isAdminEmail(r.user.email)) {
                        return auth.signOut().then(function () {
                            throw new Error("Akun Google ini bukan akun owner.");
                        });
                    }
                    return r.user;
                });
            });
        }).then(function (u) { delete inflight[key]; return u; },
                function (e) { delete inflight[key]; throw e; });
        return inflight[key];
    };

    window.dzAdminGuard = function (ref, app) {
        if (!ref || ref.__dzGuarded) return ref;
        ["set", "update", "remove"].forEach(function (m) {
            var orig = ref[m];
            if (typeof orig !== "function") return;
            ref[m] = function () {
                var args = arguments;
                return window.dzAdminEnsure(app).then(function () { return orig.apply(ref, args); });
            };
        });
        var origChild = ref.child;
        ref.child = function () { return window.dzAdminGuard(origChild.apply(ref, arguments), app); };
        ref.__dzGuarded = true;
        return ref;
    };

    /* muat SDK auth lebih awal supaya popup login tidak diblokir browser */
    try { if (localStorage.getItem("isOwner") === "true") loadAuthSdk().catch(function () {}); } catch (e) {}
})();
