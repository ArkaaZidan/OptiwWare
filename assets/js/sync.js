(function () {
    var NAMA = {
        "optiware_products_data": "products",
        "optiware_transactions_data": "transactions",
        "optiware_stock_logs": "logs",
        "optiware_users_data": "staf",
        "optiware_app_settings": "settings"
    };
    var DAFTAR = ["optiware_products_data", "optiware_transactions_data", "optiware_stock_logs", "optiware_users_data"];
    var OUTBOX = "optiware_outbox";

    var asliSet = Storage.prototype.setItem;
    var asliHapus = Storage.prototype.removeItem;
    var asliGet = Storage.prototype.getItem;

    var snapshot = {};
    var menerapkan = false;
    var sedangKirim = false;

    function bersih(nilai) {
        return JSON.stringify(nilai, function (k, v) {
            return (typeof k === "string" && k.charAt(0) === "$") ? undefined : v;
        });
    }

    function petaId(arr) {
        var peta = {};
        arr.forEach(function (item) {
            if (item && item.id !== undefined && item.id !== null) peta[String(item.id)] = bersih(item);
        });
        return peta;
    }

    function banner(teks) {
        function tampil() {
            var el = document.getElementById("optiware-sync-banner");
            if (!teks) { if (el) el.remove(); return; }
            if (!el) {
                el = document.createElement("div");
                el.id = "optiware-sync-banner";
                el.style.cssText = "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;" +
                    "background:#b42318;color:#fff;padding:10px 18px;border-radius:8px;font:600 13px sans-serif;" +
                    "box-shadow:0 4px 14px rgba(0,0,0,.25);max-width:90vw;";
                document.body.appendChild(el);
            }
            el.textContent = teks;
        }
        if (document.body) tampil();
        else document.addEventListener("DOMContentLoaded", tampil);
    }

    function keLogin() { window.location.href = "/"; }

    function xhr(metode, url, body) {
        var x = new XMLHttpRequest();
        x.open(metode, url, false);
        x.withCredentials = true;
        x.setRequestHeader("Content-Type", "application/json");
        x.send(body ? JSON.stringify(body) : null);
        return x;
    }

    function bacaOutbox() {
        try { return JSON.parse(asliGet.call(localStorage, OUTBOX) || "[]"); } catch (e) { return []; }
    }
    function tulisOutbox(arr) {
        asliSet.call(localStorage, OUTBOX, JSON.stringify(arr));
    }

    function kirimSinkron() {
        var sisa = bacaOutbox();
        while (sisa.length) {
            var x;
            try { x = xhr("POST", "/api/sync/" + sisa[0].nama, sisa[0].payload); } catch (e) { break; }
            if (x.status === 401) { keLogin(); return false; }
            if (x.status === 0 || x.status >= 500) break;
            sisa.shift();
        }
        tulisOutbox(sisa);
        return sisa.length === 0;
    }

    function tarik() {
        var x = xhr("GET", "/api/sync");
        if (x.status === 401) { keLogin(); return false; }
        if (x.status !== 200) throw new Error("Server membalas " + x.status);
        var d = JSON.parse(x.responseText);

        menerapkan = true;
        try {
            DAFTAR.forEach(function (k) {
                var arr = d[NAMA[k]] || [];
                asliSet.call(localStorage, k, JSON.stringify(arr));
                snapshot[k] = petaId(arr);
            });

            var kSet = "optiware_app_settings";
            if (d.settings && Object.keys(d.settings).length) {
                var teks = JSON.stringify(d.settings);
                asliSet.call(localStorage, kSet, teks);
                snapshot[kSet] = teks;
            } else {
                asliHapus.call(localStorage, kSet);
                snapshot[kSet] = null;
            }
        } finally {
            menerapkan = false;
        }
        return true;
    }

    function kirimAsync() {
        if (sedangKirim) return;
        var box = bacaOutbox();
        if (!box.length) return;
        sedangKirim = true;
        var item = box[0];
        var isi = JSON.stringify(item.payload);
        var lanjut = 0;

        fetch("/api/sync/" + item.nama, {
            method: "POST",
            credentials: "same-origin",
            keepalive: isi.length < 60000,
            headers: { "Content-Type": "application/json" },
            body: isi
        }).then(function (r) {
            if (r.status === 401) { keLogin(); return; }
            if (r.status >= 500) throw new Error("server " + r.status);
            var sisa = bacaOutbox().filter(function (b) { return b.uid !== item.uid; });
            tulisOutbox(sisa);
            if (r.status >= 400) banner("Sebagian perubahan ditolak server. Muat ulang halaman.");
            else banner("");
            lanjut = 0;
        }).catch(function () {
            banner("Gagal menyimpan ke server. Perubahan akan dicoba lagi otomatis.");
            lanjut = 5000;
        }).then(function () {
            sedangKirim = false;
            if (bacaOutbox().length) setTimeout(kirimAsync, lanjut);
        });
    }

    function antre(nama, payload) {
        var box = bacaOutbox();
        box.push({ uid: Date.now() + "-" + Math.random().toString(36).slice(2, 7), nama: nama, payload: payload });
        tulisOutbox(box);
        setTimeout(kirimAsync, 0);
    }

    function catat(k, v) {
        var nama = NAMA[k];
        if (DAFTAR.indexOf(k) >= 0) {
            var arr;
            try { arr = JSON.parse(v); } catch (e) { return; }
            if (!Array.isArray(arr)) return;
            var baru = petaId(arr);
            var lama = snapshot[k] || {};
            var upsert = [], hapus = [];
            Object.keys(baru).forEach(function (id) {
                if (lama[id] !== baru[id]) upsert.push(JSON.parse(baru[id]));
            });
            Object.keys(lama).forEach(function (id) {
                if (!(id in baru)) hapus.push(Number(id));
            });
            if (!upsert.length && !hapus.length) return;
            snapshot[k] = baru;
            antre(nama, { upsert: upsert, hapus: hapus });
        } else if (nama === "settings") {
            if (snapshot[k] === v) return;
            var nilai;
            try { nilai = JSON.parse(v); } catch (e) { return; }
            snapshot[k] = v;
            antre(nama, { nilai: nilai });
        }
    }

    function reset(k) {
        var nama = NAMA[k];
        snapshot[k] = (DAFTAR.indexOf(k) >= 0) ? {} : null;
        antre(nama, { reset: true });
    }

    Storage.prototype.setItem = function (k, v) {
        asliSet.apply(this, arguments);
        if (this === window.localStorage && !menerapkan && NAMA[k]) catat(k, String(v));
    };
    Storage.prototype.removeItem = function (k) {
        asliHapus.apply(this, arguments);
        if (this === window.localStorage && !menerapkan && NAMA[k]) reset(k);
    };

    try {
        if (kirimSinkron()) tarik();
        else banner("Server belum bisa dihubungi. Menampilkan data terakhir yang tersimpan di browser.");
    } catch (e) {
        banner("Gagal memuat data dari server. Menampilkan data terakhir yang tersimpan di browser.");
    }

    if (bacaOutbox().length) setTimeout(kirimAsync, 1000);
})();
