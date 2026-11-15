(function () {
    "use strict";
    function authSdkUrl() {
        var v9 = typeof firebase === "undefined" || String(firebase.SDK_VERSION || "").indexOf("9.") === 0;
        return v9
            ? "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"
            : "https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js";
    }
    var AUTH_APP_NAME = "dzAdminAuthApp";
    var inflight = {};
    var sdkPromise = null;
    var verifyCache = {};

    function sessionKey() {
        try {
            var x = JSON.parse(localStorage.getItem("danzclean_logged_user") || "{}") || {};
            return String(x.email || x.uid || x.username || "anon").toLowerCase().trim();
        } catch (e) { return "anon"; }
    }

    function setOwnerFlag(v) {
        try {
            if (v) {
                localStorage.setItem("isOwner", "true");
                localStorage.setItem("isOwnerFor", sessionKey());
            } else {
                localStorage.removeItem("isOwner");
                localStorage.removeItem("isOwnerFor");
            }
        } catch (e) {}
    }

    function loadAuthSdk() {
        if (typeof firebase !== "undefined" && firebase.auth) return Promise.resolve();
        if (sdkPromise) return sdkPromise;
        sdkPromise = new Promise(function (res, rej) {
            var s = document.createElement("script");
            s.src = authSdkUrl();
            s.onload = res;
            s.onerror = function () { sdkPromise = null; rej(new Error("Gagal memuat Firebase Auth.")); };
            document.head.appendChild(s);
        });
        return sdkPromise;
    }

    function serverIsAdmin(user) {
        if (!user) return Promise.resolve(false);
        var c = verifyCache[user.uid];
        if (c && Date.now() - c.t < 300000) return Promise.resolve(c.v);
        return user.getIdToken().then(function (token) {
            return fetch("/api/admin-check", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });
        }).then(function (r) {
            if (r.status === 401 || r.status === 403) return false;
            if (!r.ok) return null;
            return r.json().then(function (j) { return !!(j && j.admin); });
        }).then(function (v) {
            if (v !== null) verifyCache[user.uid] = { v: v, t: Date.now() };
            return v;
        }).catch(function () { return null; });
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
        return Promise.race([auth.signInWithPopup(provider), timeout]).catch(function (e) {
            throw new Error(friendly(e, app));
        });
    }

    function rejectNonOwner(auth) {
        setOwnerFlag(false);
        return auth.signOut().then(function () {
            throw new Error("Akun Google ini bukan akun owner.");
        });
    }

    function signInAdmin(app) {
        var auth = firebase.auth(app);
        return waitState(auth).then(function (cur) {
            var authProject = isAuthProject(app) || typeof FIREBASE_CONFIG_AUTH === "undefined";
            if (!authProject) {
                if (cur) return cur;
                return popupSignIn(getAuthApp()).then(function (r) {
                    var cred = r.credential;
                    return serverIsAdmin(r.user).then(function (ok) {
                        if (ok === false) return rejectNonOwner(firebase.auth(getAuthApp()));
                        if (ok === null) throw new Error("Server tidak bisa memeriksa akun owner, coba lagi.");
                        if (!cred || !cred.idToken) throw new Error("Token Google tidak tersedia, coba lagi.");
                        return auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(cred.idToken)).then(function (res) {
                            setOwnerFlag(true);
                            return res.user;
                        });
                    });
                });
            }
            var ask = cur ? serverIsAdmin(cur) : Promise.resolve(false);
            return ask.then(function (ok) {
                if (ok === true) { setOwnerFlag(true); return cur; }
                if (ok === null) throw new Error("Server tidak bisa memeriksa akun owner, coba lagi.");
                return popupSignIn(app).then(function (r) {
                    return serverIsAdmin(r.user).then(function (ok2) {
                        if (ok2 === false) return rejectNonOwner(auth);
                        if (ok2 === null) throw new Error("Server tidak bisa memeriksa akun owner, coba lagi.");
                        setOwnerFlag(true);
                        return r.user;
                    });
                });
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
            return waitState(firebase.auth(app));
        }).then(function (u) {
            if (!u) return null;
            return serverIsAdmin(u).then(function (ok) {
                if (ok === true) { setOwnerFlag(true); return u; }
                if (ok === false) setOwnerFlag(false);
                return null;
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

    function refreshOwner() {
        try { if (localStorage.getItem("isOwner") !== "true") return; } catch (e) { return; }
        if (typeof FIREBASE_CONFIG_AUTH === "undefined" || typeof firebase === "undefined") return;
        loadAuthSdk().then(function () {
            var apps = [getAuthApp()];
            try { if (isAuthProject(firebase.app())) apps.unshift(firebase.app()); } catch (e) {}
            return Promise.all(apps.map(function (a) { return waitState(firebase.auth(a)); })).then(function (users) {
                var list = users.filter(Boolean);
                if (!list.length) { setOwnerFlag(false); return; }
                return Promise.all(list.map(serverIsAdmin)).then(function (res) {
                    if (res.indexOf(true) !== -1) return;
                    if (res.indexOf(null) !== -1) return;
                    setOwnerFlag(false);
                });
            });
        }).catch(function () {});
    }

    refreshOwner();
})();
