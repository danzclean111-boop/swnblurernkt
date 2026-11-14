const FIREBASE_CONFIG_AUTH = {
    apiKey: "AIzaSyCzifL91Yg6PnQdsFyXS9P0XQFivabTK2I",
    authDomain: "danzclean-auth.firebaseapp.com",
    databaseURL: "https://danzclean-auth-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "danzclean-auth",
    storageBucket: "danzclean-auth.firebasestorage.app",
    messagingSenderId: "450022321477",
    appId: "1:450022321477:web:4d3ee887b935726dd2a22c",
    measurementId: "G-LSCQ9MKPZ6"
};
const CLOUDINARY_CONFIG = {
    cloudName: "l8aazitj",
    uploadPreset: "danzclean_video"
};
const FIREBASE_CONFIG_MAIN = {
    apiKey: "AIzaSyCEj9USiCvQbbwvaZiFDN4lkLitPXWzew4",
    authDomain: "danzzclean.firebaseapp.com",
    databaseURL: "https://danzzclean-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "danzzclean",
    storageBucket: "danzzclean.firebasestorage.app",
    messagingSenderId: "254872462958",
    appId: "1:254872462958:web:a7964353bb5afa6678287f"
};

const FIREBASE_CONFIG_VERIFY = {
    apiKey: "AIzaSyAe4TyvZVkZoqk652JIdIQlVp9DkjE_hZU",
    authDomain: "danzclean-verify.firebaseapp.com",
    databaseURL: "https://danzclean-verify-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "danzclean-verify",
    storageBucket: "danzclean-verify.firebasestorage.app",
    messagingSenderId: "794873142364",
    appId: "1:794873142364:web:18125563e592d5813eda99"
};

const FIREBASE_CONFIG_PRESET = {
    apiKey: "AIzaSyD8AFCMv_zNNme-jVc_dryw-hMjm51v8TE",
    authDomain: "preset-9ebb6.firebaseapp.com",
    databaseURL: "https://preset-9ebb6-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "preset-9ebb6",
    storageBucket: "preset-9ebb6.firebasestorage.app",
    messagingSenderId: "460817401813",
    appId: "1:460817401813:web:1b57ae904092b6c1729f5c",
    measurementId: "G-KPLEGJJXQ1"
};

const FIREBASE_CONFIG_NOTIF = {
  apiKey: "AIzaSyATBMI8Xqg6Sk6cMlFIuZi7x_2e4obevP4",
  authDomain: "notif-22dce.firebaseapp.com",
  databaseURL: "https://notif-22dce-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "notif-22dce",
  storageBucket: "notif-22dce.firebasestorage.app",
  messagingSenderId: "159257237463",
  appId: "1:159257237463:web:be79fea1216f31f3ac9d92",
  measurementId: "G-1Z9FVXZDHN"
};

const FIREBASE_CONFIG_CHAT = {
  apiKey: "AIzaSyCt1ysCOnjZXTI5OcYs8EkQNkBvpXjud0s",
  authDomain: "chatglobal-72ac4.firebaseapp.com",
  databaseURL: "https://chatglobal-72ac4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chatglobal-72ac4",
  storageBucket: "chatglobal-72ac4.firebasestorage.app",
  messagingSenderId: "723191036470",
  appId: "1:723191036470:web:299858056a59b313fa7697",
  measurementId: "G-7Z33G70N8G"
};


/* ===== Firebase App Check (reCAPTCHA v3) =====
   1) Buat reCAPTCHA v3 site key, daftarkan di Firebase Console > App Check untuk tiap project.
   2) Isi site key di bawah. Selama masih placeholder, App Check tidak aktif (website jalan seperti biasa). */
const APPCHECK_SITE_KEY = "ISI_SITE_KEY_RECAPTCHA_V3";

(function () {
    if (typeof firebase === "undefined" || !firebase.initializeApp || firebase.__dzAppCheckWrapped) return;
    firebase.__dzAppCheckWrapped = true;
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    var origInit = firebase.initializeApp.bind(firebase);
    firebase.initializeApp = function () {
        var app = origInit.apply(null, arguments);
        try {
            if (APPCHECK_SITE_KEY.indexOf("ISI_") !== 0 && typeof firebase.appCheck === "function") {
                firebase.appCheck(app).activate(APPCHECK_SITE_KEY, true);
            }
        } catch (e) { console.warn("[AppCheck]", e && e.message); }
        return app;
    };
})();
