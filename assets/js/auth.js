// Fungsi logout untuk semua halaman OptiWare
window.optiwareLogout = function () {
    fetch("/api/logout", { method: "POST", credentials: "same-origin" })
        .catch(function () { /* abaikan error jaringan, tetap keluar */ })
        .finally(function () { window.location.href = "/"; });
};