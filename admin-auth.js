(function () {
    "use strict";
    var ADMIN_EMAILS = [
        "caisen004@gmail.com",
        "yeonj7725@gmail.com",
        "vizomzomi@gmail.com",
        "oktabae491@gmail.com"
    ];
    var AUTH_SDK = "https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js";
    var AUTH_APP_NAME = "dzAdminAuthApp";
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

    function friendly(e, app) {
        var c = e && e.code, p = (app && app.options && app.options.projectId) || "";
        if (c === "auth/operation-not-allowed") return "Login Google belum diaktifkan di project " + p + ". Aktifkan di Firebase Console > Authentication > Sign-in method > Google.";
        if (c === "auth/unauthorized-domain") return "Domain " + location.hostname + " belum ada di Authorized domains project " + p + " (Authentication > Settings).";
        if (c === "auth/popup-blocked") return "Popup diblokir browser. Izinkan popup lalu coba lagi.";
        if (c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request") return "Login Google dibatalkan.";
        if (c === "auth/network-request-failed") return "Koneksi bermasalah, coba lagi.";
        return (e && e.message) || "Login admin gagal.";
    }

    function waitState(auth) {
        return new Promise(function (res) {
            var off = auth.onAuthStateChanged(function (u) { off(); res(u); });
        });
    }

    function isAuthProject(app) {
        return typeof FIREBASE_CONFIG_AUTH !== "undefined" && app.options && app.options.projectId === FIREBASE_CONFIG_AUTH.projectId;
    }

    function getAuthApp() {
        try { return firebase.app(AUTH_APP_NAME); }
        catch (e) { return firebase.initializeApp(FIREBASE_CONFIG_AUTH, AUTH_APP_NAME); }
    }

    function popupSignIn(app) {
        var auth = firebase.auth(app);
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        var timeout = new Promise(function (_, rej) {
            setTimeout(function () { rej(new Error("Login Google tidak selesai dalam 2 menit. Tutup tab login, lalu coba lagi.")); }, 120000);
        });
        return Promise.race([auth.signInWithPopup(provider), timeout]).then(function (r) {
            if (!r.user || !isAdminEmail(r.user.email)) {
                return auth.signOut().then(function () {
                    throw new Error("Akun Google ini bukan akun owner.");
                });
            }
            return r;
        }, function (e) { throw new Error(friendly(e, app)); });
    }

    function signInAdmin(app) {
        var auth = firebase.auth(app);
        return waitState(auth).then(function (cur) {
            if (cur && isAdminEmail(cur.email)) return cur;
            if (isAuthProject(app) || typeof FIREBASE_CONFIG_AUTH === "undefined") {
                return popupSignIn(app).then(function (r) { return r.user; });
            }
            return popupSignIn(getAuthApp()).then(function (r) {
                var cred = r.credential;
                if (!cred || !cred.idToken) throw new Error("Token Google tidak tersedia, coba lagi.");
                return auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(cred.idToken)).then(function (res) {
                    if (!isAdminEmail(res.user.email)) {
                        return auth.signOut().then(function () {
                            throw new Error("Akun Google ini bukan akun owner.");
                        });
                    }
                    return res.user;
                }, function (e) { throw new Error(friendly(e, app)); });
            });
        });
    }

    window.dzAdminEnsure = function (app) {
        app = app || firebase.app();
        var key = app.name || "[DEFAULT]";
        if (inflight[key]) return inflight[key];
        inflight[key] = loadAuthSdk().then(function () {
            return signInAdmin(app);
        }).then(function (u) { delete inflight[key]; return u; },
                function (e) { delete inflight[key]; throw new Error(friendly(e, app)); });
        return inflight[key];
    };

    window.dzAdminSilent = function (app) {
        app = app || firebase.app();
        return loadAuthSdk().then(function () {
            var auth = firebase.auth(app);
            return new Promise(function (res) {
                var off = auth.onAuthStateChanged(function (u) { off(); res(u && isAdminEmail(u.email) ? u : null); });
            });
        });
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

    try { if (localStorage.getItem("isOwner") === "true") loadAuthSdk().catch(function () {}); } catch (e) {}
})();
