window.optiwareExportCSV = function (tableId, kolom, namaFile) {
    var tabel = (typeof tableId === "string") ? $$(tableId) : tableId;
    if (!tabel) { webix.message({ type: "error", text: "Tabel tidak ditemukan" }); return; }

    function esc(v) {
        if (v === null || v === undefined) return "";
        var s = String(v).replace(/\r?\n/g, " ");
        if (/^[=+\-@]/.test(s) && isNaN(Number(s))) s = "'" + s;
        return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }

    var baris = [kolom.map(function (k) { return esc(k.header); }).join(";")];
    var no = 0;
    tabel.data.each(function (obj) {
        no++;
        baris.push(kolom.map(function (k) { return esc(k.nilai(obj, no)); }).join(";"));
    });

    if (!no) { webix.message({ type: "error", text: "Tidak ada data untuk diekspor" }); return; }

    var blob = new Blob(["\uFEFF" + baris.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = namaFile + "_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    webix.message({ type: "success", text: no + " baris diekspor ke CSV" });
};