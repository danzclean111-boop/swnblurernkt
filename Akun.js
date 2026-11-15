function cekAkunOwner() {
    try {
        return localStorage.getItem("isOwner") === "true";
    } catch (err) {
        return false;
    }
}

cekAkunOwner();
