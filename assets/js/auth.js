/* Logout bersama untuk semua halaman OptiWare.
   Memanggil backend agar sesi di server benar-benar dihapus. */
window.optiwareLogout = function () {
    fetch("/api/logout", { method: "POST", credentials: "same-origin" })
        .catch(function () { /* abaikan error jaringan, tetap keluar */ })
        .finally(function () { window.location.href = "/"; });
};