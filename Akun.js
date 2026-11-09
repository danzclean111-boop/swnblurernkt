const AKUN_OWNER = [
    "caisen004@gmail.com",
    "yeonj7725@gmail.com",
    "vizomzomi@gmail.com",
    "oktabae491@gmail.com"
];

function cekAkunOwner() {
    try {
        const raw = localStorage.getItem("danzclean_logged_user");

        if (!raw) {
            localStorage.removeItem("isOwner");
            return false;
        }

        const data = JSON.parse(raw);
        const email = ((data && data.email) || "").toLowerCase().trim();

        const isOwner = AKUN_OWNER.some(e => e.toLowerCase().trim() === email);

        if (isOwner) {
            localStorage.setItem("isOwner", "true");
        } else {
            localStorage.removeItem("isOwner");
        }

        return isOwner;
    } catch (err) {
        localStorage.removeItem("isOwner");
        return false;
    }
}

// Langsung dicek begitu file ini dimuat, sebelum sidebar dirender
cekAkunOwner();
