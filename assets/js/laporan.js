/**
 * ====================================================================
 * OptiWare - Laporan & Analisis Bisnis (laporan.js)
 * ====================================================================
 * Mengelola visualisasi laporan penjualan, analisis laba per kategori,
 * peringkat produk best seller, dan valuasi aset menggunakan Webix UI.
 */

const STORAGE_KEY_PRODUCTS = "optiware_products_data";
const STORAGE_KEY_TRANSACTIONS = "optiware_transactions_data";

// --------------------------------------------------------------------
// 1. DATA LAPORAN & KALKULASI
// --------------------------------------------------------------------
function getStoredProducts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn(e);
    }
    return [];
}

function getStoredTransactions() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn(e);
    }
    return [];
}

function formatRupiah(number) {
    return "Rp " + (Number(number) || 0).toLocaleString("id-ID");
}

// Data Rekap Penjualan Harian Oktober 2026
const dailySalesReportData = [
    { id: 1, tanggal: "11 Okt 2026", trx: 18, omset: 2450000, hpp: 1735000, laba: 715000, margin: 29.2, target: "105% (Tercapai)" },
    { id: 2, tanggal: "10 Okt 2026", trx: 15, omset: 2180000, hpp: 1545000, laba: 635000, margin: 29.1, target: "98% (Stabil)" },
    { id: 3, tanggal: "09 Okt 2026", trx: 14, omset: 1950000, hpp: 1380000, laba: 570000, margin: 29.2, target: "92% (Normal)" },
    { id: 4, tanggal: "08 Okt 2026", trx: 12, omset: 1720000, hpp: 1220000, laba: 500000, margin: 29.1, target: "88% (Normal)" },
    { id: 5, tanggal: "07 Okt 2026", trx: 11, omset: 1540000, hpp: 1090000, laba: 450000, margin: 29.2, target: "85% (Normal)" },
    { id: 6, tanggal: "06 Okt 2026", trx: 8, omset: 1310000, hpp: 930000, laba: 380000, margin: 29.0, target: "75% (Rendah)" },
    { id: 7, tanggal: "05 Okt 2026", trx: 8, omset: 1300000, hpp: 920000, laba: 380000, margin: 29.2, target: "75% (Rendah)" }
];

// Data Laporan Laba per Kategori
const categoryProfitData = [
    { id: 1, kategori: "Bahan Pokok", terjual: 42, omset: 5850000, hpp: 4680000, laba: 1170000, margin: 20.0 },
    { id: 2, kategori: "Makanan", terjual: 145, omset: 3620000, hpp: 2350000, laba: 1270000, margin: 35.1 },
    { id: 3, kategori: "Minuman", terjual: 88, omset: 1840000, hpp: 1150000, laba: 690000, margin: 37.5 },
    { id: 4, kategori: "Perawatan", terjual: 35, omset: 1140000, hpp: 640000, laba: 500000, margin: 43.8 }
];

// Data Top 5 Produk Best Seller
const topProductsData = [
    { id: 1, rank: 1, kode: "OPT-001", nama: "Indomie Goreng 85g", kategori: "Makanan", qty: 95, omset: 332500, laba: 66500, share: "28.5%" },
    { id: 2, rank: 2, kode: "OPT-006", nama: "Beras Ramos 5kg", kategori: "Bahan Pokok", qty: 32, omset: 2368000, laba: 288000, share: "21.0%" },
    { id: 3, rank: 3, kode: "OPT-005", nama: "Minyak Goreng 1L", kategori: "Bahan Pokok", qty: 45, omset: 832500, laba: 135000, share: "18.2%" },
    { id: 4, rank: 4, kode: "OPT-002", nama: "Aqua 600ml", kategori: "Minuman", qty: 58, omset: 203000, laba: 58000, share: "12.4%" },
    { id: 5, rank: 5, kode: "OPT-008", nama: "Kopi Kapal Api 100g", kategori: "Minuman", qty: 30, omset: 225000, laba: 45000, share: "8.6%" }
];

// --------------------------------------------------------------------
// 2. LOGIKA WEBIX APPLICATION
// --------------------------------------------------------------------
if (typeof webix === "undefined") {
    console.error("Library Webix belum dimuat!");
} else {
    webix.ready(function () {

        let currentActiveTab = "sales";

        const tableContainer = document.getElementById("laporan-table-container");
        const bestSellerContainer = document.getElementById("bestseller-table-container");

        if (!tableContainer || !bestSellerContainer) {
            console.error("Kontainer tabel laporan tidak ditemukan!");
            return;
        }

        // ------------------------------------------------------------
        // A. WEBIX PAGER & TABEL UTAMA LAPORAN
        // ------------------------------------------------------------
        webix.ui({
            view: "pager",
            id: "laporan_pager",
            container: "laporan-pager-container",
            size: 8,
            group: 5,
            template: "{common.first()} {common.prev()} {common.pages()} {common.next()} {common.last()}"
        });

        // Konfigurasi Kolom untuk Penjualan Harian
        const salesColumns = [
            { id: "tanggal", header: "Tanggal / Periode", width: 150, sort: "string" },
            { id: "trx", header: "Transaksi", width: 130, sort: "int", css: { "text-align": "center" }, template: obj => `<strong>${obj.trx}</strong> trx` },
            { id: "omset", header: "Total Omset", fillspace: 2, sort: "int", css: { "text-align": "right" }, template: obj => `<strong>${formatRupiah(obj.omset)}</strong>` },
            { id: "hpp", header: "Beban Modal (HPP)", fillspace: 2, sort: "int", css: { "text-align": "right" }, template: obj => `<span class="text-muted">${formatRupiah(obj.hpp)}</span>` },
            { id: "laba", header: "Laba Kotor", fillspace: 2, sort: "int", css: { "text-align": "right" }, template: obj => `<span style="color:var(--success); font-weight:700;">${formatRupiah(obj.laba)}</span>` },
            { 
                id: "margin", 
                header: "Margin (%)", 
                width: 120, 
                sort: "int", 
                css: { "text-align": "center" }, 
                template: function (obj) {
                    let mClass = "medium";
                    if (obj.margin >= 30) mClass = "high";
                    else if (obj.margin < 25) mClass = "low";
                    return `<span class="margin-badge ${mClass}">${obj.margin}%</span>`;
                } 
            },
            { id: "target", header: "Status Target", width: 160, sort: "string" }
        ];

        // Konfigurasi Kolom untuk Laba per Kategori
        const categoryColumns = [
            { id: "kategori", header: "Kategori Produk", fillspace: 3, sort: "string", template: obj => `<strong>${obj.kategori}</strong>` },
            { id: "terjual", header: "Vol. Terjual", width: 160, sort: "int", css: { "text-align": "center" }, template: obj => `${obj.terjual} unit` },
            { id: "omset", header: "Total Omset", fillspace: 2, sort: "int", css: { "text-align": "right" }, template: obj => `<strong>${formatRupiah(obj.omset)}</strong>` },
            { id: "hpp", header: "Beban Pokok (HPP)", fillspace: 2, sort: "int", css: { "text-align": "right" }, template: obj => `<span class="text-muted">${formatRupiah(obj.hpp)}</span>` },
            { id: "laba", header: "Estimasi Laba", fillspace: 2, sort: "int", css: { "text-align": "right" }, template: obj => `<span style="color:var(--success); font-weight:700;">${formatRupiah(obj.laba)}</span>` },
            { 
                id: "margin", 
                header: "Margin Rata-rata", 
                width: 150, 
                sort: "int", 
                css: { "text-align": "center" }, 
                template: obj => `<span class="margin-badge high">${obj.margin}%</span>` 
            }
        ];

        // Inisialisasi Tabel Utama Laporan
        const tableLaporan = webix.ui({
            container: "laporan-table-container",
            view: "datatable",
            id: "table_laporan_utama",
            css: "optiware-webix-table",
            autoheight: true,
            scroll: "x",
            select: "row",
            hover: "webix_row_hover",
            rowHeight: 52,
            headerRowHeight: 46,
            pager: "laporan_pager",
            columns: salesColumns,
            data: dailySalesReportData
        });

        // ------------------------------------------------------------
        // B. WEBIX TABEL SUB: TOP 5 BEST SELLER
        // ------------------------------------------------------------
        const tableBestSeller = webix.ui({
            container: "bestseller-table-container",
            view: "datatable",
            id: "table_bestseller_sub",
            css: "optiware-webix-table",
            autoheight: true,
            scroll: "x",
            select: "row",
            rowHeight: 52,
            headerRowHeight: 46,
            columns: [
                { 
                    id: "rank", 
                    header: "Rank", 
                    width: 70, 
                    css: { "text-align": "center" },
                    template: function (obj) {
                        let rClass = "rank-default";
                        if (obj.rank === 1) rClass = "rank-1";
                        else if (obj.rank === 2) rClass = "rank-2";
                        else if (obj.rank === 3) rClass = "rank-3";
                        return `<span class="rank-badge ${rClass}">#${obj.rank}</span>`;
                    }
                },
                { id: "kode", header: "SKU", width: 105, template: obj => `<span class="sku-tag">${obj.kode}</span>` },
                { id: "nama", header: "Nama Produk", fillspace: 3, minWidth: 180, template: obj => `<strong>${obj.nama}</strong>` },
                { id: "kategori", header: "Kategori", width: 130, template: obj => `<span class="category-tag">${obj.kategori}</span>` },
                { id: "qty", header: "Vol. Terjual", width: 130, css: { "text-align": "center" }, sort: "int", template: obj => `<strong>${obj.qty}</strong> unit` },
                { id: "omset", header: "Total Omset", width: 140, css: { "text-align": "right" }, sort: "int", template: obj => `<strong>${formatRupiah(obj.omset)}</strong>` },
                { id: "laba", header: "Kontribusi Laba", width: 140, css: { "text-align": "right" }, sort: "int", template: obj => `<span style="color:var(--success); font-weight:700;">${formatRupiah(obj.laba)}</span>` },
                { id: "share", header: "Pangsa", width: 100, css: { "text-align": "center" } }
            ],
            data: topProductsData
        });

        // Responsif window resize
        webix.event(window, "resize", function () {
            if ($$("table_laporan_utama")) $$("table_laporan_utama").resize();
            if ($$("table_bestseller_sub")) $$("table_bestseller_sub").resize();
        });

        // ------------------------------------------------------------
        // C. SINKRONISASI REAL-TIME METRIK DARI DATABASE
        // ------------------------------------------------------------
        function syncRealMetrics() {
            const products = getStoredProducts();
            const txList = getStoredTransactions();

            const modalByNama = {};
            let totalValuasiAset = 0;
            products.forEach(p => {
                modalByNama[p.nama] = p.hargaBeli || 0;
                totalValuasiAset += (p.stok || 0) * (p.hargaBeli || 0);
            });

            let totalOmset = 0, totalHpp = 0;
            txList.forEach(t => {
                if (t.status !== "Selesai") return;
                totalOmset += (t.total || 0);
                (t.items || []).forEach(it => {
                    totalHpp += (modalByNama[it.nama] || 0) * (it.qty || 0);
                });
            });
            const totalLaba = totalOmset - totalHpp;
            const persenHpp = totalOmset ? (totalHpp / totalOmset * 100).toFixed(1) : "0";
            const margin = totalOmset ? (totalLaba / totalOmset * 100).toFixed(1) : "0";

            const set = function (id, v) { const e = document.getElementById(id); if (e) e.textContent = v; };
            set("stat-total-omset", formatRupiah(totalOmset));
            set("stat-total-hpp", formatRupiah(totalHpp));
            set("stat-total-laba", formatRupiah(totalLaba));
            set("stat-total-aset", formatRupiah(totalValuasiAset));

            const h = document.getElementById("stat-hpp-trend");
            if (h) h.innerHTML = '<i class="fa-solid fa-circle-info"></i> ' + persenHpp + '% dari omset';
            const l = document.getElementById("stat-laba-trend");
            if (l) l.innerHTML = '<i class="fa-solid fa-percent"></i> Margin laba ' + margin + '%';
        }

        syncRealMetrics();

        // ------------------------------------------------------------
        // D. TAB SWITCHING LAPORAN
        // ------------------------------------------------------------
        const reportTabs = document.querySelectorAll(".report-tabs .report-tab");
        const titleEl = document.getElementById("report-table-title");
        const subSection = document.getElementById("section-top-products");

        reportTabs.forEach(tab => {
            tab.addEventListener("click", function () {
                reportTabs.forEach(t => t.classList.remove("active"));
                this.classList.add("active");

                const reportType = this.getAttribute("data-report");
                currentActiveTab = reportType;

                const table = $$("table_laporan_utama");

                if (reportType === "sales") {
                    titleEl.textContent = "Rekapitulasi Penjualan Harian (Oktober 2026)";
                    table.config.columns = salesColumns;
                    table.refreshColumns();
                    table.clearAll();
                    table.parse(dailySalesReportData);
                    if (subSection) subSection.style.display = "block";
                } else if (reportType === "category") {
                    titleEl.textContent = "Laporan Laba & Margin per Kategori Produk";
                    table.config.columns = categoryColumns;
                    table.refreshColumns();
                    table.clearAll();
                    table.parse(categoryProfitData);
                    if (subSection) subSection.style.display = "none";
                } else if (reportType === "bestseller") {
                    titleEl.textContent = "Evaluasi Produk Terlaris (Berdasarkan Omset & Laba)";
                    table.config.columns = [
                        { id: "rank", header: "Rank", width: 70, css: { "text-align": "center" }, template: obj => `<span class="rank-badge rank-${obj.rank || 'default'}">#${obj.rank}</span>` },
                        { id: "kode", header: "SKU", width: 105, template: obj => `<span class="sku-tag">${obj.kode}</span>` },
                        { id: "nama", header: "Nama Produk", fillspace: 3, template: obj => `<strong>${obj.nama}</strong>` },
                        { id: "kategori", header: "Kategori", width: 130 },
                        { id: "qty", header: "Volume Terjual", width: 140, css: { "text-align": "center" }, template: obj => `<strong>${obj.qty}</strong> unit` },
                        { id: "omset", header: "Total Omset", width: 150, css: { "text-align": "right" }, template: obj => `<strong>${formatRupiah(obj.omset)}</strong>` },
                        { id: "laba", header: "Kontribusi Laba", width: 150, css: { "text-align": "right" }, template: obj => `<strong style="color:var(--success);">${formatRupiah(obj.laba)}</strong>` }
                    ];
                    table.refreshColumns();
                    table.clearAll();
                    table.parse(topProductsData);
                    if (subSection) subSection.style.display = "none";
                }
            });
        });

        // ------------------------------------------------------------
        // E. FILTER PENCARIAN REAL-TIME
        // ------------------------------------------------------------
        const searchInput = document.getElementById("topbar-search-laporan");
        if (searchInput) {
            searchInput.addEventListener("input", function () {
                const query = this.value.trim().toLowerCase();
                $$("table_laporan_utama").filter(function (obj) {
                    if (!query) return true;
                    return (
                        (obj.tanggal && obj.tanggal.toLowerCase().includes(query)) ||
                        (obj.kategori && obj.kategori.toLowerCase().includes(query)) ||
                        (obj.nama && obj.nama.toLowerCase().includes(query)) ||
                        (obj.target && obj.target.toLowerCase().includes(query))
                    );
                });
            });
        }

        // ------------------------------------------------------------
        // F. TOMBOL EXPORT EXCEL & CETAK
        // ------------------------------------------------------------
        const btnExport = document.getElementById("btn-export-laporan");
        if (btnExport) {
            btnExport.addEventListener("click", function () {
                let filename = "Laporan_Penjualan_OptiWare";
                if (currentActiveTab === "category") filename = "Laporan_Laba_Kategori_OptiWare";
                else if (currentActiveTab === "bestseller") filename = "Laporan_Best_Seller_OptiWare";

                var kolomLaporan = {
                    sales: [
                        { header: "Tanggal / Periode", nilai: o => o.tanggal },
                        { header: "Transaksi", nilai: o => o.trx },
                        { header: "Total Omset", nilai: o => o.omset },
                        { header: "Beban Modal (HPP)", nilai: o => o.hpp },
                        { header: "Laba Kotor", nilai: o => o.laba },
                        { header: "Margin (%)", nilai: o => o.margin },
                        { header: "Status Target", nilai: o => o.target }
                    ],
                    category: [
                        { header: "Kategori Produk", nilai: o => o.kategori },
                        { header: "Vol. Terjual", nilai: o => o.terjual },
                        { header: "Total Omset", nilai: o => o.omset },
                        { header: "Beban Pokok (HPP)", nilai: o => o.hpp },
                        { header: "Estimasi Laba", nilai: o => o.laba },
                        { header: "Margin Rata-rata (%)", nilai: o => o.margin }
                    ],
                    bestseller: [
                        { header: "Rank", nilai: o => o.rank },
                        { header: "SKU", nilai: o => o.kode },
                        { header: "Nama Produk", nilai: o => o.nama },
                        { header: "Kategori", nilai: o => o.kategori },
                        { header: "Vol. Terjual", nilai: o => o.qty },
                        { header: "Total Omset", nilai: o => o.omset },
                        { header: "Kontribusi Laba", nilai: o => o.laba }
                    ]
                };
                window.optiwareExportCSV("table_laporan_utama", kolomLaporan[currentActiveTab] || kolomLaporan.sales, filename);
            });
        }

        const btnPrint = document.getElementById("btn-print-laporan");
        if (btnPrint) {
            btnPrint.addEventListener("click", function () {
                window.print();
            });
        }

        // ------------------------------------------------------------
        // G. PROFIL POPUP (Konsisten)
        // ------------------------------------------------------------
        const profilePopup = webix.ui({
            view: "popup",
            id: "profile_popup_laporan",
            width: 220,
            body: {
                view: "list",
                autoheight: true,
                scroll: false,
                template: "<i class='#icon#' style='width:18px; margin-right:8px;'></i> #text#",
                data: [
                    { id: "profile", text: "Profil Saya", icon: "fa-regular fa-user" },
                    { id: "settings", text: "Pengaturan Akun", icon: "fa-solid fa-gear" },
                    { id: "logout", text: "<span style='color:var(--danger);'>Keluar</span>", icon: "fa-solid fa-arrow-right-from-bracket text-danger" }
                ],
                on: {
                    onItemClick: function (menuId) {
                        profilePopup.hide();
                        if (menuId === "logout") {
                            webix.confirm({
                                title: "Konfirmasi Keluar",
                                text: "Apakah Anda yakin ingin keluar?",
                                ok: "Ya, Keluar",
                                cancel: "Batal",
                                callback: function (res) {
                                    if (res) optiwareLogout();
                                }
                            });
                        }
                    }
                }
            }
        });

        const profileBtn = document.getElementById("topbar-profile-btn");
        if (profileBtn) profileBtn.addEventListener("click", function () { profilePopup.show(this); });

        // Navigasi Menu Sidebar
        const navItems = document.querySelectorAll(".nav-menu .nav-item");
        navItems.forEach(item => {
            item.addEventListener("click", function (e) {
                const href = this.getAttribute("href");
                if (href && href !== "#" && !href.startsWith("javascript")) {
                    return; // Biarkan browser berpindah halaman
                }
                e.preventDefault();
                navItems.forEach(n => n.classList.remove("active"));
                this.classList.add("active");
                const menuTitle = this.querySelector("span") ? this.querySelector("span").textContent : "Menu";
                webix.message({ text: "Membuka menu: " + menuTitle });
            });
        });

        const sidebarLogoutBtn = document.getElementById("sidebar-logout-btn");
        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.addEventListener("click", function (e) {
                e.preventDefault();
                webix.confirm({
                    title: "Konfirmasi Keluar",
                    text: "Apakah Anda yakin ingin keluar dari sistem OptiWare?",
                    ok: "Ya, Keluar",
                    cancel: "Batal",
                    callback: function (res) {
                        if (res) optiwareLogout();
                    }
                });
            });
        }

    });
}