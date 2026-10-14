/* Logout + pembatasan menu per peran untuk semua halaman OptiWare.
   Ini hanya merapikan tampilan; yang benar-benar menolak akses adalah server. */
(function () {
    var KUNCI = "optiware_me";

    function bacaCache() {
        try { return JSON.parse(sessionStorage.getItem(KUNCI) || "null"); } catch (e) { return null; }
    }

    // Selama peran belum diketahui, sembunyikan menu supaya tidak sempat terlihat semua
    var gaya = null;
    if (!bacaCache()) {
        gaya = document.createElement("style");
        gaya.textContent = ".nav-menu{visibility:hidden}";
        document.head.appendChild(gaya);
    }

    function lepasGaya() {
        if (gaya) { gaya.remove(); gaya = null; }
    }

    function namaFile(href) {
        var f = (href || "").split("#")[0].split("?")[0].split("/").pop();
        return (f === "" || f === "dashboard") ? "index.html" : f;
    }

    function sembunyikanTautan(selector, boleh) {
        document.querySelectorAll(selector).forEach(function (a) {
            var f = namaFile(a.getAttribute("href"));
            if (/\.html$/.test(f) && boleh.indexOf(f) < 0) a.style.display = "none";
        });
    }

    function terapkan(me) {
        var boleh = me.halaman || [];

        sembunyikanTautan(".nav-menu .nav-item[href]", boleh);
        sembunyikanTautan(".main-content a[href]", boleh);

        var tambahProduk = document.getElementById("btn-tambah-produk");
        if (tambahProduk && boleh.indexOf("produk.html") < 0) tambahProduk.style.display = "none";

        var nama = me.nama || me.username || "";
        document.querySelectorAll(".user-profile .user-name").forEach(function (el) { el.textContent = nama; });
        document.querySelectorAll(".user-profile .user-role").forEach(function (el) { el.textContent = me.role || ""; });
        document.querySelectorAll(".user-profile .avatar").forEach(function (el) {
            el.textContent = nama.charAt(0).toUpperCase() || "A";
        });

        lepasGaya();
    }

    function mulai() {
        var cache = bacaCache();
        if (cache) terapkan(cache);

        fetch("/api/saya", { credentials: "same-origin" })
            .then(function (r) {
                if (r.status === 401) { window.location.href = "/"; return null; }
                return r.ok ? r.json() : null;
            })
            .then(function (me) {
                if (me) {
                    try { sessionStorage.setItem(KUNCI, JSON.stringify(me)); } catch (e) { }
                    terapkan(me);
                }
            })
            .catch(function () { /* offline: pakai cache kalau ada */ })
            .then(lepasGaya);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulai);
    else mulai();

    window.optiwareLogout = function () {
        try { sessionStorage.removeItem(KUNCI); } catch (e) { }
        fetch("/api/logout", { method: "POST", credentials: "same-origin" })
            .catch(function () { /* abaikan error jaringan, tetap keluar */ })
            .finally(function () { window.location.href = "/"; });
    };
})();