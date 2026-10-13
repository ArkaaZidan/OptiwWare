/**
 * ====================================================================
 * OptiWare - Transaksi & Kasir Penjualan (transaksi.js)
 * ====================================================================
 * Mengelola riwayat transaksi penjualan ritel, kasir POS, bukti struk,
 * dan status pembayaran menggunakan Webix UI.
 * Terintegrasi dua arah dengan database stok dan mutasi gudang via localStorage.
 */

const STORAGE_KEY_PRODUCTS = "optiware_products_data";
const STORAGE_KEY_TRANSACTIONS = "optiware_transactions_data";
const STORAGE_KEY_LOGS = "optiware_stock_logs";

// --------------------------------------------------------------------
// 1. DATA AWAL TRANSAKSI & HELPER
// --------------------------------------------------------------------
const defaultTransactions = [
    {
        id: 86,
        invoice: "TRX-2026-0086",
        waktu: "11 Okt 2026 14:15",
        pelanggan: "Pelanggan Umum",
        kasir: "Admin",
        metode: "QRIS",
        status: "Selesai",
        items: [
            { nama: "Indomie Goreng 85g", qty: 5, harga: 3500, subtotal: 17500 },
            { nama: "Aqua 600ml", qty: 2, harga: 3500, subtotal: 7000 }
        ],
        subtotal: 24500,
        diskon: 0,
        total: 24500,
        bayar: 24500,
        kembali: 0
    },
    {
        id: 85,
        invoice: "TRX-2026-0085",
        waktu: "11 Okt 2026 13:40",
        pelanggan: "Ibu Rina (Member)",
        kasir: "Admin",
        metode: "Tunai",
        status: "Selesai",
        items: [
            { nama: "Beras Ramos 5kg", qty: 1, harga: 74000, subtotal: 74000 },
            { nama: "Minyak Goreng 1L", qty: 2, harga: 18500, subtotal: 37000 }
        ],
        subtotal: 111000,
        diskon: 5000,
        total: 106000,
        bayar: 110000,
        kembali: 4000
    },
    {
        id: 84,
        invoice: "TRX-2026-0084",
        waktu: "11 Okt 2026 12:20",
        pelanggan: "Bpk. Hendra",
        kasir: "Admin",
        metode: "Transfer Bank",
        status: "Selesai",
        items: [
            { nama: "Telur Ayam 1kg", qty: 2, harga: 28000, subtotal: 56000 },
            { nama: "Gula Pasir 1kg", qty: 1, harga: 17000, subtotal: 17000 }
        ],
        subtotal: 73000,
        diskon: 0,
        total: 73000,
        bayar: 73000,
        kembali: 0
    },
    {
        id: 83,
        invoice: "TRX-2026-0083",
        waktu: "11 Okt 2026 11:05",
        pelanggan: "Pelanggan Umum",
        kasir: "Admin",
        metode: "Tunai",
        status: "Selesai",
        items: [
            { nama: "Kopi Kapal Api 100g", qty: 4, harga: 7500, subtotal: 30000 },
            { nama: "Teh Botol Sosro 450ml", qty: 3, harga: 5500, subtotal: 16500 }
        ],
        subtotal: 46500,
        diskon: 0,
        total: 46500,
        bayar: 50000,
        kembali: 3500
    },
    {
        id: 82,
        invoice: "TRX-2026-0082",
        waktu: "11 Okt 2026 10:15",
        pelanggan: "Toko Berkah",
        kasir: "Admin",
        metode: "Kartu Debit",
        status: "Selesai",
        items: [
            { nama: "Indomie Goreng 85g", qty: 40, harga: 3500, subtotal: 140000 },
            { nama: "Mie Sedaap 75g", qty: 20, harga: 3300, subtotal: 66000 }
        ],
        subtotal: 206000,
        diskon: 6000,
        total: 200000,
        bayar: 200000,
        kembali: 0
    },
    {
        id: 81,
        invoice: "TRX-2026-0081",
        waktu: "11 Okt 2026 09:30",
        pelanggan: "Warung Bu Siti",
        kasir: "Admin",
        metode: "Transfer Bank",
        status: "Selesai",
        items: [
            { nama: "Minyak Goreng 1L", qty: 10, harga: 18500, subtotal: 185000 },
            { nama: "Aqua 600ml", qty: 12, harga: 3500, subtotal: 42000 }
        ],
        subtotal: 227000,
        diskon: 7000,
        total: 220000,
        bayar: 220000,
        kembali: 0
    },
    {
        id: 80,
        invoice: "TRX-2026-0080",
        waktu: "11 Okt 2026 08:50",
        pelanggan: "Pelanggan Umum",
        kasir: "Admin",
        metode: "QRIS",
        status: "Selesai",
        items: [
            { nama: "Sabun Lifebuoy 85g", qty: 5, harga: 4500, subtotal: 22500 },
            { nama: "Aqua 600ml", qty: 2, harga: 3500, subtotal: 7000 }
        ],
        subtotal: 29500,
        diskon: 0,
        total: 29500,
        bayar: 29500,
        kembali: 0
    },
    {
        id: 79,
        invoice: "TRX-2026-0079",
        waktu: "11 Okt 2026 08:15",
        pelanggan: "Bpk. Joko",
        kasir: "Admin",
        metode: "Tunai",
        status: "Pending",
        items: [
            { nama: "Beras Ramos 5kg", qty: 2, harga: 74000, subtotal: 148000 }
        ],
        subtotal: 148000,
        diskon: 0,
        total: 148000,
        bayar: 0,
        kembali: 0
    }
];

function getStoredTransactions() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Gagal membaca localStorage transaksi:", e);
    }
    saveStoredTransactions(defaultTransactions);
    return defaultTransactions;
}

function saveStoredTransactions(data) {
    try {
        localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(data));
    } catch (e) {
        console.warn("Gagal menyimpan transaksi:", e);
    }
}

function getStoredProducts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Gagal membaca produk:", e);
    }
    return [];
}

function saveStoredProducts(data) {
    try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(data));
    } catch (e) {
        console.warn("Gagal menyimpan produk:", e);
    }
}

function formatRupiah(number) {
    return "Rp " + (Number(number) || 0).toLocaleString("id-ID");
}

function getFormattedNow() {
    const d = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const day = String(d.getDate()).padStart(2, '0');
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${mon} ${year} ${hour}:${min}`;
}

// --------------------------------------------------------------------
// 2. LOGIKA WEBIX APPLICATION
// --------------------------------------------------------------------
if (typeof webix === "undefined") {
    console.error("Library Webix belum dimuat!");
} else {
    webix.ready(function () {

        let currentSelectedId = null;
        let posCart = []; // Keranjang belanja kasir POS

        const tableContainer = document.getElementById("transaksi-table-container");
        if (!tableContainer) {
            console.error("Kontainer #transaksi-table-container tidak ditemukan!");
            return;
        }

        // ------------------------------------------------------------
        // A. WEBIX PAGER & TABEL TRANSAKSI
        // ------------------------------------------------------------
        webix.ui({
            view: "pager",
            id: "transaksi_pager",
            container: "transaksi-pager-container",
            size: 8,
            group: 5,
            template: "{common.first()} {common.prev()} {common.pages()} {common.next()} {common.last()}"
        });

        const tableTransaksi = webix.ui({
            container: "transaksi-table-container",
            view: "datatable",
            id: "table_transaksi",
            css: "optiware-webix-table",
            autoheight: true,
            scroll: "x",
            select: "row",
            hover: "webix_row_hover",
            rowHeight: 54,
            headerRowHeight: 46,
            pager: "transaksi_pager",
            columns: [
                { 
                    id: "no", 
                    header: "No", 
                    width: 50, 
                    css: { "text-align": "center" },
                    template: function (obj, common, value, config, index) {
                        return (typeof index === "number" ? index + 1 : (obj.id || 1));
                    }
                },
                { 
                    id: "invoice", 
                    header: "No. Faktur", 
                    width: 140, 
                    sort: "string",
                    template: function (obj) {
                        return `<span class="invoice-tag">${obj.invoice}</span>`;
                    }
                },
                { 
                    id: "waktu", 
                    header: "Waktu Transaksi", 
                    width: 155, 
                    sort: "string" 
                },
                { 
                    id: "pelanggan", 
                    header: "Pelanggan", 
                    width: 160, 
                    sort: "string",
                    template: function (obj) {
                        return `<strong>${obj.pelanggan || 'Umum'}</strong>`;
                    }
                },
                { 
                    id: "items", 
                    header: "Rincian Item", 
                    fillspace: 3, 
                    minWidth: 200,
                    template: function (obj) {
                        if (Array.isArray(obj.items) && obj.items.length > 0) {
                            const desc = obj.items.map(it => `${it.nama} (${it.qty}x)`).join(", ");
                            return `<span style="font-size:13px; color:var(--text-main);">${desc}</span>`;
                        }
                        return "-";
                    }
                },
                { 
                    id: "total", 
                    header: "Total Tagihan", 
                    width: 135, 
                    sort: "int",
                    css: { "text-align": "right" },
                    template: function (obj) {
                        return `<strong style="font-size:14px; color:var(--text-main);">${formatRupiah(obj.total)}</strong>`;
                    }
                },
                { 
                    id: "metode", 
                    header: "Metode Bayar", 
                    width: 135, 
                    sort: "string",
                    template: function (obj) {
                        let mClass = "tunai";
                        let icon = "fa-money-bill-wave";
                        const m = (obj.metode || "").toLowerCase();
                        if (m.includes("qris")) { mClass = "qris"; icon = "fa-qrcode"; }
                        else if (m.includes("transfer")) { mClass = "transfer"; icon = "fa-building-columns"; }
                        else if (m.includes("debit")) { mClass = "debit"; icon = "fa-credit-card"; }

                        return `<span class="payment-tag ${mClass}"><i class="fa-solid ${icon}"></i> ${obj.metode}</span>`;
                    }
                },
                { 
                    id: "status", 
                    header: "Status", 
                    width: 120, 
                    sort: "string",
                    template: function (obj) {
                        let sClass = "selesai";
                        if (obj.status === "Pending") sClass = "pending";
                        else if (obj.status === "Batal") sClass = "batal";
                        return `<span class="status-badge ${sClass}">${obj.status}</span>`;
                    }
                },
                { 
                    id: "aksi", 
                    header: "Aksi", 
                    width: 65, 
                    css: { "text-align": "center" },
                    template: function () {
                        return `<i class="fa-solid fa-ellipsis-vertical action-btn" title="Opsi Tindakan"></i>`;
                    }
                }
            ],
            data: getStoredTransactions(),
            onClick: {
                "action-btn": function (e, id) {
                    currentSelectedId = id.row;
                    trxActionPopup.show(e.target);
                    return false;
                }
            }
        });

        // Responsif window resize
        webix.event(window, "resize", function () {
            if ($$("table_transaksi")) $$("table_transaksi").resize();
        });

        // ------------------------------------------------------------
        // B. POPUP MENU AKSI TRANSAKSI
        // ------------------------------------------------------------
        const trxActionPopup = webix.ui({
            view: "popup",
            id: "trx_action_popup",
            width: 200,
            css: "optiware-action-popup",
            body: {
                view: "list",
                id: "trx_action_list",
                autoheight: true,
                scroll: false,
                template: "<i class='#icon#' style='width:18px; margin-right:8px;'></i> #text#",
                data: [
                    { id: "receipt", text: "Lihat / Cetak Struk", icon: "fa-solid fa-receipt text-primary" },
                    { id: "paid", text: "Tandai Lunas", icon: "fa-solid fa-check text-success" },
                    { id: "cancel", text: "<span style='color:var(--danger);'>Batalkan Transaksi</span>", icon: "fa-solid fa-ban text-danger" }
                ],
                on: {
                    onItemClick: function (actionId) {
                        trxActionPopup.hide();
                        if (!currentSelectedId) return;
                        const item = $$("table_transaksi").getItem(currentSelectedId);

                        switch (actionId) {
                            case "receipt":
                                showReceipt(item);
                                break;
                            case "paid":
                                markAsPaid(item);
                                break;
                            case "cancel":
                                cancelTransaction(item);
                                break;
                        }
                    }
                }
            }
        });

        // ------------------------------------------------------------
        // C. MODAL STRUK BUKTI TRANSAKSI (RECEIPT INVOICE)
        // ------------------------------------------------------------
        const receiptModal = webix.ui({
            view: "window",
            id: "receipt_modal",
            width: 440,
            position: "center",
            modal: true,
            head: {
                view: "toolbar",
                cols: [
                    { view: "label", label: "Struk Bukti Pembayaran", css: "modal-title-bold" },
                    { view: "icon", icon: "wxi-close", click: function () { $$("receipt_modal").hide(); } }
                ]
            },
            body: {
                rows: [
                    {
                        id: "receipt_content",
                        autoheight: true,
                        template: function (obj) {
                            if (!obj || !obj.invoice) return "";
                            let itemsHtml = "";
                            if (Array.isArray(obj.items)) {
                                itemsHtml = obj.items.map(it => `
                                    <tr>
                                        <td>${it.nama}<br><small style="color:#64748b;">${it.qty} x ${formatRupiah(it.harga)}</small></td>
                                        <td style="text-align:right; vertical-align:bottom;">${formatRupiah(it.subtotal)}</td>
                                    </tr>
                                `).join("");
                            }

                            return `
                                <div class="receipt-card" id="printable-receipt">
                                    <div class="receipt-header">
                                        <div class="receipt-store-name">OptiWare Ritel & Gudang</div>
                                        <div class="receipt-store-sub">Jl. Logistik Niaga Modern No. 45</div>
                                        <div class="receipt-store-sub">Telp: (021) 555-8900 | ID Kasir: ${obj.kasir || 'Admin'}</div>
                                    </div>

                                    <div class="receipt-meta">
                                        <div class="receipt-meta-row">
                                            <span>No. Faktur:</span>
                                            <strong>${obj.invoice}</strong>
                                        </div>
                                        <div class="receipt-meta-row">
                                            <span>Tanggal:</span>
                                            <span>${obj.waktu}</span>
                                        </div>
                                        <div class="receipt-meta-row">
                                            <span>Pelanggan:</span>
                                            <span>${obj.pelanggan || 'Pelanggan Umum'}</span>
                                        </div>
                                        <div class="receipt-meta-row">
                                            <span>Metode Bayar:</span>
                                            <strong>${obj.metode}</strong>
                                        </div>
                                    </div>

                                    <table class="receipt-table">
                                        <thead>
                                            <tr>
                                                <th style="text-align:left;">Produk</th>
                                                <th style="text-align:right;">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${itemsHtml}
                                        </tbody>
                                    </table>

                                    <div class="receipt-totals">
                                        <div class="receipt-total-row">
                                            <span>Subtotal:</span>
                                            <span>${formatRupiah(obj.subtotal)}</span>
                                        </div>
                                        ${obj.diskon > 0 ? `
                                            <div class="receipt-total-row" style="color:var(--success);">
                                                <span>Potongan Diskon:</span>
                                                <span>-${formatRupiah(obj.diskon)}</span>
                                            </div>
                                        ` : ''}
                                        <div class="receipt-total-row grand-total">
                                            <span>GRAND TOTAL:</span>
                                            <span>${formatRupiah(obj.total)}</span>
                                        </div>
                                        <div class="receipt-total-row" style="margin-top:6px;">
                                            <span>Uang Diterima:</span>
                                            <span>${formatRupiah(obj.bayar || obj.total)}</span>
                                        </div>
                                        <div class="receipt-total-row">
                                            <span>Kembalian:</span>
                                            <span>${formatRupiah(obj.kembali || 0)}</span>
                                        </div>
                                    </div>

                                    <div class="receipt-footer">
                                        <p>Terima kasih telah berbelanja di OptiWare!</p>
                                        <p>Barang yang sudah dibeli dapat ditukar maksimal 2x24 jam.</p>
                                    </div>
                                </div>
                            `;
                        }
                    },
                    {
                        margin: 12,
                        padding: { top: 10, bottom: 10, left: 14, right: 14 },
                        cols: [
                            { view: "button", value: "Tutup", css: "webix_secondary", click: function () { $$("receipt_modal").hide(); } },
                            { 
                                view: "button", 
                                value: "Cetak Struk", 
                                css: "webix_primary optiware-btn-primary", 
                                click: function () {
                                    window.print();
                                } 
                            }
                        ]
                    }
                ]
            }
        });

        function showReceipt(item) {
            $$("receipt_content").setValues(item);
            $$("receipt_modal").show();
        }

        function markAsPaid(item) {
            if (item.status === "Selesai") {
                webix.message({ type: "info", text: "Transaksi ini sudah berstatus Selesai (Lunas)" });
                return;
            }
            item.status = "Selesai";
            item.bayar = item.total;
            item.kembali = 0;
            $$("table_transaksi").updateItem(item.id, item);
            syncStorageAndStats();
            webix.message({ type: "success", text: `Faktur ${item.invoice} berhasil ditandai Lunas` });
        }

        function cancelTransaction(item) {
            if (item.status === "Batal") {
                webix.message({ type: "info", text: "Transaksi ini sudah dibatalkan" });
                return;
            }

            webix.confirm({
                title: "Batalkan Transaksi",
                text: `Apakah Anda yakin ingin membatalkan transaksi <strong>${item.invoice}</strong>? Stok produk akan dikembalikan ke gudang.`,
                ok: "Ya, Batalkan",
                cancel: "Kembali",
                type: "confirm-warning",
                callback: function (result) {
                    if (result) {
                        item.status = "Batal";
                        $$("table_transaksi").updateItem(item.id, item);

                        // Kembalikan stok ke database produk
                        if (Array.isArray(item.items)) {
                            const products = getStoredProducts();
                            item.items.forEach(it => {
                                const prod = products.find(p => p.nama === it.nama);
                                if (prod) {
                                    prod.stok += it.qty;
                                    if (prod.stok > 15) prod.status = "Aman";
                                    else if (prod.stok > 0) prod.status = "Hampir Habis";
                                }
                            });
                            saveStoredProducts(products);
                        }

                        syncStorageAndStats();
                        webix.message({ type: "info", text: `Transaksi ${item.invoice} telah dibatalkan & stok dikembalikan` });
                    }
                }
            });
        }

        // ------------------------------------------------------------
        // D. MODAL TRANSAKSI BARU (KASIR POS PENJUALAN)
        // ------------------------------------------------------------
        const posModal = webix.ui({
            view: "window",
            id: "pos_modal",
            width: 720,
            position: "center",
            modal: true,
            head: {
                view: "toolbar",
                cols: [
                    { view: "label", label: "Kasir POS - Buat Transaksi Baru", css: "modal-title-bold" },
                    { view: "icon", icon: "wxi-close", click: function () { $$("pos_modal").hide(); } }
                ]
            },
            body: {
                rows: [
                    {
                        view: "form",
                        id: "pos_header_form",
                        elements: [
                            {
                                cols: [
                                    { view: "text", name: "pelanggan", label: "Nama Pelanggan", labelPosition: "top", value: "Pelanggan Umum", placeholder: "Nama Pelanggan / Member" },
                                    { 
                                        view: "combo", 
                                        name: "metode", 
                                        label: "Metode Pembayaran", 
                                        labelPosition: "top", 
                                        options: ["Tunai", "QRIS", "Transfer Bank", "Kartu Debit"], 
                                        value: "Tunai" 
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        view: "toolbar",
                        css: "pos-item-toolbar",
                        cols: [
                            { 
                                view: "combo", 
                                id: "pos_product_select", 
                                placeholder: "Pilih produk dari katalog...", 
                                width: 340 
                            },
                            { 
                                view: "text", 
                                id: "pos_qty_input", 
                                type: "number", 
                                value: 1, 
                                width: 90, 
                                placeholder: "Qty" 
                            },
                            { 
                                view: "button", 
                                value: "+ Tambah ke Keranjang", 
                                css: "webix_primary optiware-btn-primary", 
                                width: 190, 
                                click: addItemToCart 
                            }
                        ]
                    },
                    {
                        view: "datatable",
                        id: "table_pos_cart",
                        autoheight: true,
                        maxHeight: 220,
                        scroll: "y",
                        columns: [
                            { id: "nama", header: "Nama Produk", fillspace: 3 },
                            { id: "harga", header: "Harga Satuan", width: 130, css: { "text-align": "right" }, template: obj => formatRupiah(obj.harga) },
                            { id: "qty", header: "Qty", width: 80, css: { "text-align": "center" } },
                            { id: "subtotal", header: "Subtotal", width: 130, css: { "text-align": "right" }, template: obj => `<strong>${formatRupiah(obj.subtotal)}</strong>` },
                            { 
                                id: "hapus", 
                                header: "Aksi", 
                                width: 60, 
                                css: { "text-align": "center" }, 
                                template: "<i class='fa-solid fa-trash text-danger action-btn' title='Hapus'></i>" 
                            }
                        ],
                        data: [],
                        onClick: {
                            "action-btn": function (e, id) {
                                $$("table_pos_cart").remove(id.row);
                                updateCartCalculations();
                                return false;
                            }
                        }
                    },
                    {
                        id: "pos_summary_view",
                        autoheight: true,
                        template: function (data) {
                            return `
                                <div class="pos-total-summary">
                                    <div class="pos-summary-row">
                                        <span>Total Item:</span>
                                        <span><strong>${data.totalQty || 0} unit</strong></span>
                                    </div>
                                    <div class="pos-summary-row">
                                        <span>Subtotal Tagihan:</span>
                                        <span>${formatRupiah(data.subtotal || 0)}</span>
                                    </div>
                                    <div class="pos-summary-row total-bold">
                                        <span>GRAND TOTAL:</span>
                                        <span class="total-accent">${formatRupiah(data.grandTotal || 0)}</span>
                                    </div>
                                </div>
                            `;
                        },
                        data: { totalQty: 0, subtotal: 0, grandTotal: 0 }
                    },
                    {
                        cols: [
                            { 
                                view: "text", 
                                id: "pos_bayar_input", 
                                type: "number", 
                                label: "Nominal Uang Diterima (Rp)", 
                                labelPosition: "top", 
                                placeholder: "0",
                                on: {
                                    onTimedKeyPress: function () {
                                        updateChangeCalculation();
                                    }
                                }
                            },
                            { 
                                view: "text", 
                                id: "pos_kembali_display", 
                                label: "Uang Kembalian (Rp)", 
                                labelPosition: "top", 
                                readonly: true, 
                                value: "Rp 0" 
                            }
                        ]
                    },
                    {
                        margin: 12,
                        padding: { top: 12 },
                        cols: [
                            { view: "button", value: "Batal", css: "webix_secondary", click: function () { $$("pos_modal").hide(); } },
                            { 
                                view: "button", 
                                value: "Selesaikan & Cetak Struk", 
                                css: "webix_primary optiware-btn-primary", 
                                click: completePosTransaction 
                            }
                        ]
                    }
                ]
            }
        });

        function populatePosProductSelect() {
            const products = getStoredProducts();
            const options = products.map(p => ({
                id: p.id,
                value: `${p.nama} - ${formatRupiah(p.hargaJual)} (Stok: ${p.stok})`
            }));
            $$("pos_product_select").define("options", options);
            $$("pos_product_select").refresh();
        }

        function openPosModal() {
            populatePosProductSelect();
            $$("table_pos_cart").clearAll();
            $$("pos_product_select").setValue("");
            $$("pos_qty_input").setValue(1);
            $$("pos_bayar_input").setValue("");
            $$("pos_kembali_display").setValue("Rp 0");
            $$("pos_header_form").setValues({
                pelanggan: "Pelanggan Umum",
                metode: "Tunai"
            });
            updateCartCalculations();
            $$("pos_modal").show();
        }

        function addItemToCart() {
            const prodId = $$("pos_product_select").getValue();
            const qty = parseInt($$("pos_qty_input").getValue(), 10);

            if (!prodId) {
                webix.message({ type: "error", text: "Pilih produk terlebih dahulu" });
                return;
            }
            if (isNaN(qty) || qty <= 0) {
                webix.message({ type: "error", text: "Qty produk minimal 1" });
                return;
            }

            const products = getStoredProducts();
            const prod = products.find(p => p.id == prodId);
            if (!prod) return;

            if (prod.stok < qty) {
                webix.message({ type: "error", text: `Stok produk tidak mencukupi! Tersisa ${prod.stok} unit.` });
                return;
            }

            // Cek apakah item sudah ada di keranjang
            let existing = null;
            $$("table_pos_cart").data.each(function (obj) {
                if (obj.prodId == prod.id) existing = obj;
            });

            if (existing) {
                const newQty = existing.qty + qty;
                if (prod.stok < newQty) {
                    webix.message({ type: "error", text: `Total pembelian melebihi sisa stok (${prod.stok})` });
                    return;
                }
                existing.qty = newQty;
                existing.subtotal = existing.qty * existing.harga;
                $$("table_pos_cart").updateItem(existing.id, existing);
            } else {
                $$("table_pos_cart").add({
                    id: new Date().getTime(),
                    prodId: prod.id,
                    nama: prod.nama,
                    harga: prod.hargaJual || 0,
                    qty: qty,
                    subtotal: qty * (prod.hargaJual || 0)
                });
            }

            $$("pos_qty_input").setValue(1);
            updateCartCalculations();
            webix.message({ type: "info", text: `+${qty} ${prod.nama} masuk ke keranjang` });
        }

        function updateCartCalculations() {
            let totalQty = 0;
            let subtotal = 0;

            $$("table_pos_cart").data.each(function (obj) {
                totalQty += (obj.qty || 0);
                subtotal += (obj.subtotal || 0);
            });

            $$("pos_summary_view").setValues({
                totalQty: totalQty,
                subtotal: subtotal,
                grandTotal: subtotal
            });

            updateChangeCalculation();
        }

        function updateChangeCalculation() {
            const bayar = parseInt($$("pos_bayar_input").getValue(), 10) || 0;
            let grandTotal = 0;
            $$("table_pos_cart").data.each(function (obj) {
                grandTotal += (obj.subtotal || 0);
            });

            const kembali = Math.max(0, bayar - grandTotal);
            $$("pos_kembali_display").setValue(formatRupiah(kembali));
        }

        function completePosTransaction() {
            if ($$("table_pos_cart").count() === 0) {
                webix.message({ type: "error", text: "Keranjang belanja masih kosong!" });
                return;
            }

            const headerVals = $$("pos_header_form").getValues();
            const items = [];
            let grandTotal = 0;

            $$("table_pos_cart").data.each(function (obj) {
                items.push({
                    nama: obj.nama,
                    qty: obj.qty,
                    harga: obj.harga,
                    subtotal: obj.subtotal,
                    prodId: obj.prodId
                });
                grandTotal += obj.subtotal;
            });

            const bayar = parseInt($$("pos_bayar_input").getValue(), 10) || grandTotal;
            if (headerVals.metode === "Tunai" && bayar < grandTotal) {
                webix.message({ type: "error", text: "Nominal uang diterima kurang dari total tagihan!" });
                return;
            }

            const kembali = Math.max(0, bayar - grandTotal);

            // Generate No Faktur Baru
            const nextId = $$("table_transaksi").count() + 1;
            const newInvoice = "TRX-2026-" + String(nextId).padStart(4, "0");

            const newTx = {
                id: nextId,
                invoice: newInvoice,
                waktu: getFormattedNow(),
                pelanggan: headerVals.pelanggan || "Pelanggan Umum",
                kasir: "Admin",
                metode: headerVals.metode || "Tunai",
                status: "Selesai",
                items: items,
                subtotal: grandTotal,
                diskon: 0,
                total: grandTotal,
                bayar: bayar,
                kembali: kembali
            };

            // 1. Tambah transaksi ke tabel
            $$("table_transaksi").add(newTx, 0);

            // 2. Potong stok produk di database
            const products = getStoredProducts();
            items.forEach(it => {
                const prod = products.find(p => p.id == it.prodId || p.nama === it.nama);
                if (prod) {
                    prod.stok = Math.max(0, prod.stok - it.qty);
                    if (prod.stok === 0) prod.status = "Habis";
                    else if (prod.stok <= 15) prod.status = "Hampir Habis";
                    else prod.status = "Aman";
                }
            });
            saveStoredProducts(products);

            // 3. Catat mutasi outbound di log gudang
            try {
                const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || "[]");
                logs.unshift({
                    id: new Date().getTime(),
                    waktu: getFormattedNow(),
                    tipe: "outbound",
                    label: "Penjualan Kasir",
                    nama: items.map(i => `${i.nama} (${i.qty}x)`).join(", "),
                    qty: -items.reduce((acc, i) => acc + i.qty, 0),
                    alur: `Gudang -> Kasir POS (${newInvoice})`,
                    ref: newInvoice
                });
                localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
            } catch (e) {
                console.warn(e);
            }

            $$("pos_modal").hide();
            syncStorageAndStats();

            webix.message({ type: "success", text: `Transaksi ${newInvoice} berhasil disimpan!` });
            showReceipt(newTx);
        }

        // ------------------------------------------------------------
        // E. SINKRONISASI DATABASE & METRIK STATISTIK
        // ------------------------------------------------------------
        function syncStorageAndStats() {
            const table = $$("table_transaksi");
            if (!table) return;

            const allTx = [];
            let totalOmset = 0;
            let lunasCount = 0;
            let pendingCount = 0;

            table.data.each(function (obj) {
                allTx.push(obj);
                if (obj.status === "Selesai") {
                    totalOmset += (obj.total || 0);
                    lunasCount++;
                } else if (obj.status === "Pending") {
                    pendingCount++;
                }
            });

            saveStoredTransactions(allTx);

            // Update DOM Statistik
            const elOmset = document.getElementById("stat-omset");
            if (elOmset) elOmset.textContent = formatRupiah(totalOmset);

            const elTotalTx = document.getElementById("stat-total-trx");
            if (elTotalTx) elTotalTx.textContent = allTx.length;

            const elLunas = document.getElementById("stat-lunas");
            if (elLunas) elLunas.textContent = lunasCount;

            const elPending = document.getElementById("stat-pending");
            if (elPending) elPending.textContent = pendingCount;

            const elInfo = document.getElementById("trx-count-info");
            if (elInfo) elInfo.textContent = `Menampilkan ${allTx.length} transaksi`;
        }

        syncStorageAndStats();

        // ------------------------------------------------------------
        // F. FILTER & SEARCH HANDLERS
        // ------------------------------------------------------------
        const searchInput = document.getElementById("topbar-search-transaksi");
        const filterStatus = document.getElementById("filter-status-trx");
        const filterMetode = document.getElementById("filter-metode-trx");

        function applyTxFilter() {
            const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
            const statusVal = filterStatus ? filterStatus.value : "";
            const metodeVal = filterMetode ? filterMetode.value : "";

            $$("table_transaksi").filter(function (obj) {
                const matchStatus = !statusVal || (obj.status === statusVal);
                const matchMetode = !metodeVal || (obj.metode === metodeVal);

                let itemsStr = "";
                if (Array.isArray(obj.items)) {
                    itemsStr = obj.items.map(i => i.nama).join(" ").toLowerCase();
                }

                const matchSearch = !query || (
                    (obj.invoice && obj.invoice.toLowerCase().includes(query)) ||
                    (obj.pelanggan && obj.pelanggan.toLowerCase().includes(query)) ||
                    (obj.metode && obj.metode.toLowerCase().includes(query)) ||
                    itemsStr.includes(query)
                );

                return matchStatus && matchMetode && matchSearch;
            });

            const filteredCount = $$("table_transaksi").count();
            const elInfo = document.getElementById("trx-count-info");
            if (elInfo) elInfo.textContent = `Menampilkan ${filteredCount} transaksi`;
        }

        if (searchInput) searchInput.addEventListener("input", applyTxFilter);
        if (filterStatus) filterStatus.addEventListener("change", applyTxFilter);
        if (filterMetode) filterMetode.addEventListener("change", applyTxFilter);

        const btnResetFilter = document.getElementById("btn-reset-trx-filter");
        if (btnResetFilter) {
            btnResetFilter.addEventListener("click", function () {
                if (searchInput) searchInput.value = "";
                if (filterStatus) filterStatus.value = "";
                if (filterMetode) filterMetode.value = "";
                $$("table_transaksi").filter();
                syncStorageAndStats();
                webix.message({ type: "info", text: "Filter transaksi telah direset" });
            });
        }

        // Tombol Buat Transaksi Baru
        const btnNewTx = document.getElementById("btn-transaksi-baru");
        if (btnNewTx) {
            btnNewTx.addEventListener("click", openPosModal);
        }

        // Tombol Export Excel
        const btnExport = document.getElementById("btn-export-transaksi");
        if (btnExport) {
            btnExport.addEventListener("click", function () {
                webix.toExcel($$("table_transaksi"), {
                    filename: "OptiWare_Transaksi_Penjualan",
                    name: "Transaksi"
                });
                webix.message({ type: "success", text: "Data transaksi diekspor ke Excel" });
            });
        }

        // ------------------------------------------------------------
        // G. POPUP NOTIFIKASI & PROFIL (Konsisten)
        // ------------------------------------------------------------
        const notifPopup = webix.ui({
            view: "popup",
            id: "notif_popup_trx",
            width: 340,
            css: "optiware-notif-popup",
            body: {
                rows: [
                    {
                        template: "<div class='notif-header'><span>Notifikasi Penjualan</span><span class='notif-badge'>3 Baru</span></div>",
                        autoheight: true
                    },
                    {
                        view: "list",
                        autoheight: true,
                        scroll: false,
                        template: `
                            <div class="notif-item">
                                <div class="notif-icon-circle #type#">
                                    <i class="#icon#"></i>
                                </div>
                                <div class="notif-text-container">
                                    <div class="notif-title">#title#</div>
                                    <div class="notif-time">#time#</div>
                                </div>
                            </div>
                        `,
                        data: [
                            { id: 1, title: "Transaksi baru TRX-0086 senilai Rp 24.500 selesai", time: "15 menit lalu", icon: "fa-solid fa-circle-check", type: "success" },
                            { id: 2, title: "TRX-0079 senilai Rp 148.000 menunggu pembayaran", time: "1 jam lalu", icon: "fa-solid fa-clock", type: "warn" },
                            { id: 3, title: "Target omset harian telah tercapai 85%", time: "2 jam lalu", icon: "fa-solid fa-chart-line", type: "success" }
                        ]
                    },
                    {
                        view: "button",
                        value: "Tandai Sudah Dibaca",
                        css: "webix_transparent notif-clear-btn",
                        click: function () {
                            const badge = document.querySelector(".notification .badge-dot");
                            if (badge) badge.style.display = "none";
                            $$("notif_popup_trx").hide();
                        }
                    }
                ]
            }
        });

        const notifBtn = document.getElementById("topbar-notif-btn");
        if (notifBtn) notifBtn.addEventListener("click", function () { notifPopup.show(this); });

        const profilePopup = webix.ui({
            view: "popup",
            id: "profile_popup_trx",
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