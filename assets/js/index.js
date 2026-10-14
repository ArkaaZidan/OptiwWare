if (typeof webix === "undefined") {
    console.error("Library Webix belum dimuat. Pastikan tag script CDN Webix telah dimasukkan.");
} else {
    webix.ready(function () {

        // Database produk
        const STORAGE_KEY = "optiware_products_data";

        function getStoredProducts() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                }
            } catch (e) {
                console.warn("Gagal membaca localStorage:", e);
            }
            return [];
        }

        function getStoredTransactions() {
            try {
                const parsed = JSON.parse(localStorage.getItem("optiware_transactions_data") || "[]");
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }

        function saveStoredProducts(data) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.warn("Gagal menyimpan ke localStorage:", e);
            }
        }

        function persistTable() {
            const all = [];
            $$("table_produk").data.each(function (obj) { all.push(obj); });
            saveStoredProducts(all);
}

        const initialProducts = getStoredProducts();

        let currentSelectedId = null;

        // Base state untuk statistik dashboard
        let statsState = {
            totalProduk: 0,
            totalStok: 0,
            hampirHabis: 0
        };

        // Datatable Webix untuk menampilkan daftar produk
        const tableContainer = document.getElementById("table-container");
        if (!tableContainer) {
            console.error("Kontainer #table-container tidak ditemukan di index.html!");
            return;
        }

        const tableProduk = webix.ui({
            container: "table-container",
            view: "datatable",
            id: "table_produk",
            css: "optiware-webix-table",
            autoheight: true,
            scroll: "x",
            select: "row",
            hover: "webix_row_hover",
            rowHeight: 52,
            headerRowHeight: 46,
            columns: [
                { 
                    id: "no", 
                    header: "No", 
                    width: 60, 
                    css: { "text-align": "center" },
                    template: function (obj, common, value, config, index) {
                        return (typeof index === "number" ? index + 1 : (obj.no || 1));
                    }
                },
                { 
                    id: "nama", 
                    header: "Nama Produk", 
                    fillspace: 3, 
                    minWidth: 180,
                    sort: "string",
                    template: function (obj) {
                        return `<strong>${obj.nama}</strong>`;
                    }
                },
                { 
                    id: "kategori", 
                    header: "Kategori", 
                    fillspace: 2, 
                    minWidth: 120,
                    sort: "string" 
                },
                { 
                    id: "stok", 
                    header: "Stok", 
                    fillspace: 1, 
                    minWidth: 90,
                    sort: "int",
                    template: function (obj) {
                        let textClass = "";
                        if (obj.stok <= 5 || obj.status === "Habis") {
                            textClass = "text-danger";
                        } else if (obj.stok <= 15 || obj.status === "Hampir Habis") {
                            textClass = "text-warn";
                        }
                        return `<span class="${textClass}">${obj.stok}</span>`;
                    }
                },
                { 
                    id: "status", 
                    header: "Status", 
                    fillspace: 2, 
                    minWidth: 130,
                    sort: "string",
                    template: function (obj) {
                        let badgeClass = "aman";
                        if (obj.status === "Hampir Habis") badgeClass = "hampir-habis";
                        else if (obj.status === "Habis") badgeClass = "habis";
                        return `<span class="status-badge ${badgeClass}">${obj.status}</span>`;
                    }
                },
                { 
                    id: "aksi", 
                    header: "Aksi", 
                    width: 70, 
                    css: { "text-align": "center" },
                    template: function () {
                        return `<i class="fa-solid fa-ellipsis-vertical action-btn" title="Opsi Tindakan"></i>`;
                    }
                }
            ],
            data: initialProducts,
            onClick: {
                "action-btn": function (e, id) {
                    currentSelectedId = id.row;
                    actionPopup.show(e.target);
                    return false; // Mencegah event bubbling
                }
            }
        });

        // Responsif: Sesuaikan layout Webix saat ukuran window berubah
        webix.event(window, "resize", function () {
            if ($$("table_produk")) {
                $$("table_produk").resize();
            }
            if ($$("product_window")) {
                $$("product_window").define("width", Math.max(220, Math.min(480, Math.floor(window.innerWidth * 0.8))));
                $$("product_window").define("height", Math.max(280, Math.min(480, Math.floor(window.innerHeight * 0.8))));
                $$("product_window").resize();
            }
        });

        // Popup aksi untuk setiap baris produk
        const actionPopup = webix.ui({
            view: "popup",
            id: "action_popup",
            width: 190,
            css: "optiware-action-popup",
            body: {
                view: "list",
                id: "action_list",
                autoheight: true,
                rowHeight: 44,
                scroll: false,
                template: "<i class='#icon#' style='width:18px; margin-right:8px;'></i> #text#",
                data: [
                    { id: "detail", text: "Detail Produk", icon: "fa-solid fa-circle-info" },
                    { id: "edit", text: "Edit Data", icon: "fa-solid fa-pen-to-square" },
                    { id: "stock", text: "Update Stok", icon: "fa-solid fa-boxes-stacked" },
                    { id: "delete", text: "<span style='color:var(--danger);'>Hapus</span>", icon: "fa-solid fa-trash text-danger" }
                ],
                on: {
                    onItemClick: function (itemId) {
                        actionPopup.hide();
                        if (!currentSelectedId) return;
                        const item = $$("table_produk").getItem(currentSelectedId);

                        switch (itemId) {
                            case "detail":
                                showProductDetail(item);
                                break;
                            case "edit":
                                openProductForm("edit", item);
                                break;
                            case "stock":
                                openStockModal(item);
                                break;
                            case "delete":
                                confirmDeleteProduct(item);
                                break;
                        }
                    }
                }
            }
        });

        // Detail produk dalam modal Webix
        const detailWindow = webix.ui({
            view: "window",
            id: "detail_window",
            width: 440,
            position: "center",
            modal: true,
            head: {
                view: "toolbar",
                cols: [
                    { view: "label", label: "Detail Informasi Produk", css: "modal-title-bold" },
                    { 
                        view: "icon", 
                        icon: "wxi-close", 
                        click: function () { $$("detail_window").hide(); } 
                    }
                ]
            },
            body: {
                id: "detail_template",
                template: function (obj) {
                    if (!obj || !obj.nama) return "";
                    let badgeClass = "aman";
                    if (obj.status === "Hampir Habis") badgeClass = "hampir-habis";
                    else if (obj.status === "Habis") badgeClass = "habis";

                    return `
                        <div class="product-detail-modal">
                            <div class="detail-top">
                                <div>
                                    <h3 class="detail-product-name">${obj.nama}</h3>
                                    <p class="detail-product-sku">${obj.kode || ('OPT-00' + obj.id)}</p>
                                </div>
                                <span class="status-badge ${badgeClass}">${obj.status}</span>
                            </div>
                            <div class="detail-info-grid">
                                <div class="info-box">
                                    <span class="info-label">Kategori</span>
                                    <span class="info-val">${obj.kategori}</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">Jumlah Stok</span>
                                    <span class="info-val font-accent">${obj.stok} unit</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">Lokasi Gudang</span>
                                    <span class="info-val">${obj.rak || 'Gudang Utama - Rak 01'}</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">Status Inventaris</span>
                                    <span class="info-val">${obj.status}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        });

        function showProductDetail(item) {
            $$("detail_template").setValues(item);
            $$("detail_window").show();
        }

        // CRUD Produk: Tambah & Edit Produk
        let formMode = "add";

        const productWindow = webix.ui({
            view: "window",
            id: "product_window",
            width: Math.max(220, Math.min(480, Math.floor(window.innerWidth * 0.8))),
            height: Math.max(280, Math.min(480, Math.floor(window.innerHeight * 0.8))),
            position: "center",
            modal: true,
            head: {
                view: "toolbar",
                css: "product-window-toolbar",
                cols: [
                    { view: "label", label: "Tambah Produk Baru", id: "product_window_title" },
                    { 
                        view: "icon", 
                        icon: "wxi-close", 
                        click: function () { $$("product_window").hide(); } 
                    }
                ]
            },
            body: {
                view: "form",
                id: "product_form",
                scroll: "y",
                padding: 18,
                elements: [
                    { 
                        view: "text", 
                        name: "nama", 
                        label: "Nama Produk", 
                        labelPosition: "top", 
                        placeholder: "Contoh: Kopi Kapal Api 100g",
                        required: true,
                        invalidMessage: "Nama produk tidak boleh kosong"
                    },
                    { 
                        view: "combo", 
                        name: "kategori", 
                        label: "Kategori Produk", 
                        labelPosition: "top", 
                        options: ["Makanan", "Minuman", "Bahan Pokok", "Perawatan", "Elektronik", "Lainnya"],
                        value: "Makanan",
                        required: true 
                    },
                    { 
                        view: "text", 
                        name: "stok", 
                        type: "number",
                        label: "Jumlah Stok", 
                        labelPosition: "top", 
                        placeholder: "Contoh: 50",
                        required: true,
                        invalidMessage: "Stok harus berupa angka valid"
                    },
                    { 
                        view: "combo", 
                        name: "status", 
                        label: "Status Ketersediaan", 
                        labelPosition: "top", 
                        options: ["Aman", "Hampir Habis", "Habis"],
                        value: "Aman"
                    },
                    { 
                        view: "text", 
                        name: "rak", 
                        label: "Lokasi Rak / Gudang", 
                        labelPosition: "top", 
                        placeholder: "Contoh: Gudang A - Rak 03"
                    },
                    {
                        margin: 12,
                        cols: [
                            { 
                                view: "button", 
                                value: "Batal", 
                                css: "webix_secondary", 
                                click: function () { $$("product_window").hide(); } 
                            },
                            { 
                                view: "button", 
                                value: "Simpan", 
                                css: "webix_primary optiware-btn-primary", 
                                click: saveProductForm 
                            }
                        ]
                    },
                    { height: 12 }
                ]
            }
        });

        function openProductForm(mode, item) {
            formMode = mode;
            const form = $$("product_form");
            form.clearValidation();

            if (mode === "add") {
                $$("product_window_title").setValue("Tambah Produk Baru");
                form.setValues({
                    nama: "",
                    kategori: "Makanan",
                    stok: 10,
                    status: "Aman",
                    rak: "Gudang A - Rak 01"
                });
            } else {
                $$("product_window_title").setValue("Edit Produk: " + item.nama);
                form.setValues({
                    nama: item.nama,
                    kategori: item.kategori,
                    stok: item.stok,
                    status: item.status,
                    rak: item.rak || "Gudang A - Rak 01"
                });
            }
            $$("product_window").show();
        }

        function saveProductForm() {
            const form = $$("product_form");
            if (!form.validate()) {
                webix.message({ type: "error", text: "Mohon lengkapi semua kolom bertanda wajib" });
                return;
            }

            const values = form.getValues();
            const stokNum = parseInt(values.stok, 10) || 0;

            // Auto-tentukan status bila perlu
            let status = values.status;
            if (!status || status === "") {
                if (stokNum <= 0) status = "Habis";
                else if (stokNum <= 15) status = "Hampir Habis";
                else status = "Aman";
            }

            if (formMode === "add") {
                const newId = new Date().getTime();
                $$("table_produk").add({
                    id: newId,
                    nama: values.nama,
                    kategori: values.kategori,
                    stok: stokNum,
                    status: status,
                    kode: "OPT-" + String(Math.floor(100 + Math.random() * 900)),
                    rak: values.rak || "Gudang A - Rak 01"
                });

                statsState.totalProduk += 1;
                statsState.totalStok += stokNum;
                webix.message({ type: "success", text: `Produk "${values.nama}" berhasil ditambahkan!` });
            } else {
                const currentItem = $$("table_produk").getItem(currentSelectedId);
                const oldStok = currentItem.stok;
                currentItem.nama = values.nama;
                currentItem.kategori = values.kategori;
                currentItem.stok = stokNum;
                currentItem.status = status;
                currentItem.rak = values.rak;
                $$("table_produk").updateItem(currentSelectedId, currentItem);

                statsState.totalStok += (stokNum - oldStok);
                webix.message({ type: "success", text: `Data "${values.nama}" berhasil diperbarui!` });
            }

            $$("product_window").hide();
            persistTable();
            syncDashboardStats();
        }

        // Update stok produk melalui modal Webix
        const stockWindow = webix.ui({
            view: "window",
            id: "stock_window",
            width: 380,
            position: "center",
            modal: true,
            head: {
                view: "toolbar",
                cols: [
                    { view: "label", label: "Perbarui Jumlah Stok" },
                    { 
                        view: "icon", 
                        icon: "wxi-close", 
                        click: function () { $$("stock_window").hide(); } 
                    }
                ]
            },
            body: {
                view: "form",
                id: "stock_form",
                elements: [
                    { view: "text", name: "nama", label: "Nama Produk", labelPosition: "top", readonly: true },
                    { 
                        view: "text", 
                        name: "stok", 
                        type: "number",
                        label: "Stok Baru (Unit)", 
                        labelPosition: "top", 
                        required: true 
                    },
                    {
                        margin: 12,
                        cols: [
                            { 
                                view: "button", 
                                value: "Batal", 
                                css: "webix_secondary", 
                                click: function () { $$("stock_window").hide(); } 
                            },
                            { 
                                view: "button", 
                                value: "Perbarui", 
                                css: "webix_primary optiware-btn-primary", 
                                click: saveStockUpdate 
                            }
                        ]
                    }
                ]
            }
        });

        function openStockModal(item) {
            $$("stock_form").setValues({
                nama: item.nama,
                stok: item.stok
            });
            $$("stock_window").show();
        }

        function saveStockUpdate() {
            const values = $$("stock_form").getValues();
            const newStok = parseInt(values.stok, 10);
            if (isNaN(newStok) || newStok < 0) {
                webix.message({ type: "error", text: "Jumlah stok harus berupa angka valid (>= 0)" });
                return;
            }

            const item = $$("table_produk").getItem(currentSelectedId);
            const diff = newStok - item.stok;
            item.stok = newStok;
            if (newStok === 0) item.status = "Habis";
            else if (newStok <= 15) item.status = "Hampir Habis";
            else item.status = "Aman";

            $$("table_produk").updateItem(currentSelectedId, item);
            $$("stock_window").hide();

            statsState.totalStok += diff;
            persistTable(); 
            syncDashboardStats();
            webix.message({ type: "success", text: `Stok "${item.nama}" diperbarui ke ${newStok} unit` });
        }

        // ------------------------------------------------------------
        // 7. KONFIRMASI HAPUS PRODUK
        // ------------------------------------------------------------
        function confirmDeleteProduct(item) {
            webix.confirm({
                title: "Hapus Produk",
                text: `Apakah Anda yakin ingin menghapus produk <strong>${item.nama}</strong> dari daftar?`,
                ok: "Ya, Hapus",
                cancel: "Batal",
                type: "confirm-warning",
                callback: function (result) {
                    if (result) {
                        statsState.totalProduk = Math.max(0, statsState.totalProduk - 1);
                        statsState.totalStok = Math.max(0, statsState.totalStok - item.stok);
                        $$("table_produk").remove(item.id);
                        persistTable();
                        syncDashboardStats();
                        webix.message({ type: "info", text: `Produk "${item.nama}" telah dihapus` });
                    }
                }
            });
        }

        // 9. POPUP KALENDER / DATE PICKER
        // ------------------------------------------------------------
        const datePopup = webix.ui({
            view: "popup",
            id: "date_popup",
            width: 320,
            body: {
                rows: [
                    {
                        view: "calendar",
                        id: "dashboard_calendar",
                        date: new Date(2026, 9, 11), // 11 Oktober 2026
                        on: {
                            onDateSelect: function (date) {
                                const formatted = webix.Date.dateToStr("%d %F %Y")(date);
                                const dateLabel = document.querySelector(".date-picker span");
                                if (dateLabel) {
                                    dateLabel.textContent = formatted;
                                }
                                $$("date_popup").hide();
                                webix.message({ type: "info", text: "Rentang tanggal diubah ke: " + formatted });
                            }
                        }
                    }
                ]
            }
        });

        // ------------------------------------------------------------
        // 10. POPUP PROFIL PENGGUNA
        // ------------------------------------------------------------
        const profilePopup = webix.ui({
            view: "popup",
            id: "profile_popup",
            width: 220,
            body: {
                view: "list",
                id: "profile_menu_list",
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
                                text: "Apakah Anda yakin ingin keluar dari sistem OptiWare?",
                                ok: "Ya, Keluar",
                                cancel: "Batal",
                                callback: function (res) {
                                    if (res) optiwareLogout();
                                }
                            });
                        } else if (menuId === "profile") {
                            webix.message({ text: "Membuka Profil Admin" });
                        } else if (menuId === "settings") {
                            webix.message({ text: "Membuka Pengaturan Akun" });
                        }
                    }
                }
            }
        });

        // ------------------------------------------------------------
        // 11. SINKRONISASI KARTU STATISTIK DASHBOARD
        // ------------------------------------------------------------
        function syncDashboardStats() {
            const table = $$("table_produk");
            if (!table) return;

            const products = [];
            table.data.each(function (obj) { products.push(obj); });
            renderStats(products, getStoredTransactions());
        }

        function setText(id, text) {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        }

        function setTrend(id, iconClass, text) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<i class="${iconClass}"></i> ${text}`;
        }

        // Hitung semua kartu statistik langsung dari data produk & transaksi
        function renderStats(products, transactions) {
            let totalStok = 0;
            let hampirHabis = 0;
            products.forEach(function (p) {
                const stok = parseInt(p.stok, 10) || 0;
                totalStok += stok;
                if (stok <= 15) hampirHabis++;
            });

            let omset = 0;
            let lunas = 0;
            let pending = 0;
            transactions.forEach(function (t) {
                if (t.status === "Selesai") {
                    omset += Number(t.total) || 0;
                    lunas++;
                } else if (t.status === "Pending") {
                    pending++;
                }
            });

            statsState.totalProduk = products.length;
            statsState.totalStok = totalStok;
            statsState.hampirHabis = hampirHabis;

            setText("stat-dash-omset", "Rp " + omset.toLocaleString("id-ID"));
            setTrend("stat-dash-omset-trend", "fa-solid fa-circle-check", lunas + " transaksi lunas");
            setText("stat-dash-produk", products.length.toLocaleString("id-ID"));
            setTrend("stat-dash-produk-trend", "fa-solid fa-box", "Jenis produk terdaftar");
            setText("stat-dash-stok", totalStok.toLocaleString("id-ID"));
            setTrend("stat-dash-stok-trend", "fa-solid fa-triangle-exclamation", hampirHabis + " produk hampir habis");
            setText("stat-dash-trx", transactions.length.toLocaleString("id-ID"));
            setTrend("stat-dash-trx-trend", "fa-solid fa-hourglass-half", pending + " menunggu pembayaran");
        }

        // Jalankan sinkronisasi awal
        syncDashboardStats();

        // Auto-refresh dari database tiap 15 detik (dan saat tab kembali aktif)
        let refreshing = false;
        function refreshFromServer() {
            if (refreshing || document.hidden) return;
            let outbox = [];
            try { outbox = JSON.parse(localStorage.getItem("optiware_outbox") || "[]"); } catch (e) {}
            if (outbox.length) return; // masih ada perubahan lokal yang belum terkirim
            refreshing = true;
            fetch("/api/sync", { credentials: "same-origin" })
                .then(function (r) {
                    if (r.status === 401) { window.location.href = "/"; return null; }
                    return r.ok ? r.json() : null;
                })
                .then(function (d) {
                    if (!d) return;
                    const table = $$("table_produk");
                    if (table) {
                        table.clearAll();
                        table.parse(d.products || []);
                    }
                    renderStats(d.products || [], d.transactions || []);
                })
                .catch(function () {})
                .then(function () { refreshing = false; });
        }
        setInterval(refreshFromServer, 15000);
        document.addEventListener("visibilitychange", refreshFromServer);

        // ------------------------------------------------------------
        // 12. PENGHUBUNG EVENT ELEMEN DARI INDEX.HTML
        // ------------------------------------------------------------

        // A. Pencarian Real-Time (Search Box Topbar)
        const searchInput = document.querySelector(".search-box input");
        if (searchInput) {
            searchInput.addEventListener("input", function () {
                const query = this.value.trim().toLowerCase();
                $$("table_produk").filter(function (obj) {
                    if (!query) return true;
                    return (
                        (obj.nama && obj.nama.toLowerCase().includes(query)) ||
                        (obj.kategori && obj.kategori.toLowerCase().includes(query)) ||
                        (obj.status && obj.status.toLowerCase().includes(query))
                    );
                });
            });
        }

        // B. Tombol Tambah Produk
        const btnTambah = document.getElementById("btn-tambah-produk");
        if (btnTambah) {
            btnTambah.addEventListener("click", function (e) {
                e.preventDefault();
                openProductForm("add");
            });
        }

        // C. Tombol Lihat Semua (Arahkan ke halaman katalog produk)
        const btnLihatSemua = document.getElementById("btn-lihat-semua");
        if (btnLihatSemua) {
            btnLihatSemua.addEventListener("click", function (e) {
                const href = this.getAttribute("href");
                if (href && href !== "#") {
                    return; // Biarkan browser menuju produk.html
                }
                e.preventDefault();
                if (searchInput) searchInput.value = "";
                $$("table_produk").filter();
                webix.message({ type: "info", text: "Menampilkan semua produk" });
            });
        }

        // D. Klik Date Picker
        const datePickerBtn = document.querySelector(".date-picker");
        if (datePickerBtn) {
            datePickerBtn.addEventListener("click", function () {
                datePopup.show(this);
            });
        }

        // F. Klik User Profile
        const profileBtn = document.querySelector(".user-profile");
        if (profileBtn) {
            profileBtn.addEventListener("click", function () {
                profilePopup.show(this);
            });
        }

        // G. Navigasi Menu Sidebar
        const navItems = document.querySelectorAll(".nav-menu .nav-item");
        navItems.forEach(item => {
            item.addEventListener("click", function (e) {
                const href = this.getAttribute("href");
                if (href && href !== "#" && !href.startsWith("javascript")) {
                    return; // Biarkan berpindah ke halaman seperti produk.html atau index.html
                }
                e.preventDefault();
                navItems.forEach(n => n.classList.remove("active"));
                this.classList.add("active");

                const menuTitle = this.querySelector("span") ? this.querySelector("span").textContent : "Menu";
                const pageTitle = document.querySelector(".page-title");
                if (pageTitle) {
                    pageTitle.textContent = menuTitle;
                }

                webix.message({ text: "Membuka halaman: " + menuTitle });
            });
        });

        // H. Tombol Logout di Sidebar Bawah
        const logoutBtn = document.querySelector(".sidebar-bottom .nav-item");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
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