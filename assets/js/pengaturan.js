/**
 * ====================================================================
 * OptiWare - Pengaturan Sistem & Usaha (pengaturan.js)
 * ====================================================================
 * Mengelola konfigurasi identitas toko, manajemen staf pengguna,
 * preferensi POS/stok, serta pencadangan & pemulihan database (backup/restore).
 */

const STORAGE_KEY_SETTINGS = "optiware_app_settings";
const STORAGE_KEY_USERS = "optiware_users_data";

// --------------------------------------------------------------------
// 1. DATA DEFAULT & HELPER DATABASE
// --------------------------------------------------------------------
const defaultSettings = {
    storeName: "OptiWare Ritel & Gudang",
    storeTagline: "Solusi Manajemen Inventaris & Ritel Modern",
    storeAddress: "Jl. Logistik Niaga Modern No. 45, Sentra Pergudangan, Jakarta Barat",
    storePhone: "(021) 555-8900 / 0812-9876-5432",
    storeEmail: "kontak@optiware-store.co.id",
    storeNpwp: "09.876.543.2-123.000",
    storeCurrency: "IDR",
    storeReceiptFooter: "Terima kasih telah berbelanja di OptiWare!\nBarang yang sudah dibeli dapat ditukar maksimal 2x24 jam dengan membawa struk ini.",
    stockMinThreshold: 15,
    taxRate: 11,
    invoicePrefix: "TRX-2026-",
    autoPrint: "yes",
    notifyLowStock: true
};

const defaultUsers = [
    { id: 1, nama: "Bpk. Admin Utama", username: "admin", role: "Administrator", status: "Aktif", login: "Hari ini 14:30" },
    { id: 2, nama: "Siti Rahmawati", username: "kasir_siti", role: "Kasir", status: "Aktif", login: "Hari ini 13:45" },
    { id: 3, nama: "Budi Santoso", username: "gudang_budi", role: "Staf Gudang", status: "Aktif", login: "Hari ini 11:10" },
    { id: 4, nama: "Rian Pratama", username: "kasir_rian", role: "Kasir", status: "Nonaktif", login: "3 hari lalu" }
];

function getStoredSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn(e);
    }
    return defaultSettings;
}

function saveStoredSettings(data) {
    try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data));
    } catch (e) {
        console.warn(e);
    }
}

function getStoredUsers() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_USERS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn(e);
    }
    saveStoredUsers(defaultUsers);
    return defaultUsers;
}

function saveStoredUsers(data) {
    try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(data));
    } catch (e) {
        console.warn(e);
    }
}

// --------------------------------------------------------------------
// 2. LOGIKA WEBIX APPLICATION
// --------------------------------------------------------------------
if (typeof webix === "undefined") {
    console.error("Library Webix belum dimuat!");
} else {
    webix.ready(function () {

        let currentSelectedUserId = null;
        let userFormMode = "add";

        const usersContainer = document.getElementById("users-table-container");
        if (!usersContainer) {
            console.error("Kontainer tabel pengguna tidak ditemukan!");
            return;
        }

        // ------------------------------------------------------------
        // A. WEBIX TABEL PENGGUNA & STAF
        // ------------------------------------------------------------
        const tableUsers = webix.ui({
            container: "users-table-container",
            view: "datatable",
            id: "table_users_settings",
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
                    width: 50, 
                    css: { "text-align": "center" },
                    template: function (obj, common, value, config, index) {
                        return (typeof index === "number" ? index + 1 : (obj.id || 1));
                    }
                },
                { 
                    id: "nama", 
                    header: "Nama Lengkap Staf", 
                    fillspace: 3, 
                    minWidth: 180,
                    sort: "string",
                    template: obj => `<strong>${obj.nama}</strong>` 
                },
                { 
                    id: "username", 
                    header: "Username", 
                    width: 140, 
                    sort: "string",
                    template: obj => `<span class="sku-tag">@${obj.username}</span>` 
                },
                { 
                    id: "role", 
                    header: "Hak Akses / Peran", 
                    width: 160, 
                    sort: "string",
                    template: function (obj) {
                        let rClass = "admin";
                        let icon = "fa-shield-halved";
                        const r = (obj.role || "").toLowerCase();
                        if (r.includes("kasir")) { rClass = "kasir"; icon = "fa-cash-register"; }
                        else if (r.includes("gudang")) { rClass = "gudang"; icon = "fa-boxes-stacked"; }

                        return `<span class="role-badge ${rClass}"><i class="fa-solid ${icon}"></i> ${obj.role}</span>`;
                    }
                },
                { 
                    id: "status", 
                    header: "Status Akun", 
                    width: 130, 
                    sort: "string",
                    template: function (obj) {
                        let sClass = obj.status === "Aktif" ? "aktif" : "nonaktif";
                        return `<span class="status-badge ${sClass}">${obj.status}</span>`;
                    }
                },
                { id: "login", header: "Terakhir Aktif", width: 150, sort: "string" },
                { 
                    id: "aksi", 
                    header: "Aksi", 
                    width: 70, 
                    css: { "text-align": "center" },
                    template: () => `<i class="fa-solid fa-ellipsis-vertical action-btn" title="Opsi Pengguna"></i>`
                }
            ],
            data: getStoredUsers(),
            onClick: {
                "action-btn": function (e, id) {
                    currentSelectedUserId = id.row;
                    userActionPopup.show(e.target);
                    return false;
                }
            }
        });

        // Responsif window resize
        webix.event(window, "resize", function () {
            if ($$("table_users_settings")) $$("table_users_settings").resize();
        });

        // ------------------------------------------------------------
        // B. POPUP AKSI PENGGUNA
        // ------------------------------------------------------------
        const userActionPopup = webix.ui({
            view: "popup",
            id: "user_action_popup",
            width: 190,
            css: "optiware-action-popup",
            body: {
                view: "list",
                id: "user_action_list",
                autoheight: true,
                scroll: false,
                template: "<i class='#icon#' style='width:18px; margin-right:8px;'></i> #text#",
                data: [
                    { id: "edit", text: "Edit Data Staf", icon: "fa-solid fa-pen-to-square" },
                    { id: "toggle", text: "Ubah Status", icon: "fa-solid fa-toggle-on" },
                    { id: "delete", text: "<span style='color:var(--danger);'>Hapus Akun</span>", icon: "fa-solid fa-trash text-danger" }
                ],
                on: {
                    onItemClick: function (actionId) {
                        userActionPopup.hide();
                        if (!currentSelectedUserId) return;
                        const item = $$("table_users_settings").getItem(currentSelectedUserId);

                        switch (actionId) {
                            case "edit":
                                openUserModal("edit", item);
                                break;
                            case "toggle":
                                toggleUserStatus(item);
                                break;
                            case "delete":
                                deleteUser(item);
                                break;
                        }
                    }
                }
            }
        });

        // ------------------------------------------------------------
        // C. MODAL TAMBAH & EDIT PENGGUNA
        // ------------------------------------------------------------
        const userModal = webix.ui({
            view: "window",
            id: "user_modal",
            width: 440,
            position: "center",
            modal: true,
            head: {
                view: "toolbar",
                cols: [
                    { view: "label", label: "Tambah Pengguna Baru", id: "user_modal_title", css: "modal-title-bold" },
                    { view: "icon", icon: "wxi-close", click: function () { $$("user_modal").hide(); } }
                ]
            },
            body: {
                view: "form",
                id: "user_form",
                elements: [
                    { view: "text", name: "nama", label: "Nama Lengkap Staf", labelPosition: "top", required: true, placeholder: "Contoh: Dian Permata" },
                    { view: "text", name: "username", label: "Username Login", labelPosition: "top", required: true, placeholder: "Contoh: kasir_dian" },
                    { 
                        view: "combo", 
                        name: "role", 
                        label: "Hak Akses / Peran", 
                        labelPosition: "top", 
                        options: ["Administrator", "Kasir", "Staf Gudang"], 
                        value: "Kasir",
                        required: true 
                    },
                    { 
                        view: "combo", 
                        name: "status", 
                        label: "Status Akun", 
                        labelPosition: "top", 
                        options: ["Aktif", "Nonaktif"], 
                        value: "Aktif",
                        required: true 
                    },
                    {
                        margin: 12,
                        cols: [
                            { view: "button", value: "Batal", css: "webix_secondary", click: function () { $$("user_modal").hide(); } },
                            { view: "button", value: "Simpan Pengguna", css: "webix_primary optiware-btn-primary", click: saveUser }
                        ]
                    }
                ]
            }
        });

        function openUserModal(mode, item) {
            userFormMode = mode;
            const form = $$("user_form");
            form.clearValidation();

            if (mode === "add") {
                $$("user_modal_title").setValue("Tambah Pengguna Baru");
                form.setValues({
                    nama: "",
                    username: "",
                    role: "Kasir",
                    status: "Aktif"
                });
            } else {
                $$("user_modal_title").setValue("Edit Staf: " + item.nama);
                form.setValues({
                    nama: item.nama,
                    username: item.username,
                    role: item.role,
                    status: item.status
                });
            }
            $$("user_modal").show();
        }

        function saveUser() {
            const form = $$("user_form");
            if (!form.validate()) {
                webix.message({ type: "error", text: "Lengkapi semua data pengguna" });
                return;
            }

            const val = form.getValues();

            if (userFormMode === "add") {
                const newId = new Date().getTime();
                $$("table_users_settings").add({
                    id: newId,
                    nama: val.nama,
                    username: val.username.replace("@", ""),
                    role: val.role,
                    status: val.status,
                    login: "Baru dibuat"
                });
                webix.message({ type: "success", text: `Pengguna ${val.nama} berhasil ditambahkan` });
            } else {
                const item = $$("table_users_settings").getItem(currentSelectedUserId);
                item.nama = val.nama;
                item.username = val.username.replace("@", "");
                item.role = val.role;
                item.status = val.status;
                $$("table_users_settings").updateItem(currentSelectedUserId, item);
                webix.message({ type: "success", text: `Data ${val.nama} berhasil diperbarui` });
            }

            // Simpan ke storage
            const users = [];
            $$("table_users_settings").data.each(u => users.push(u));
            saveStoredUsers(users);

            $$("user_modal").hide();
        }

        function toggleUserStatus(item) {
            item.status = item.status === "Aktif" ? "Nonaktif" : "Aktif";
            $$("table_users_settings").updateItem(item.id, item);

            const users = [];
            $$("table_users_settings").data.each(u => users.push(u));
            saveStoredUsers(users);

            webix.message({ type: "info", text: `Status ${item.nama} diubah menjadi ${item.status}` });
        }

        function deleteUser(item) {
            if (item.username === "admin") {
                webix.message({ type: "error", text: "Akun Administrator Utama tidak boleh dihapus!" });
                return;
            }

            webix.confirm({
                title: "Konfirmasi Hapus",
                text: `Apakah Anda yakin ingin menghapus staf <strong>${item.nama}</strong>?`,
                ok: "Ya, Hapus",
                cancel: "Batal",
                type: "confirm-warning",
                callback: function (result) {
                    if (result) {
                        $$("table_users_settings").remove(item.id);
                        const users = [];
                        $$("table_users_settings").data.each(u => users.push(u));
                        saveStoredUsers(users);
                        webix.message({ type: "info", text: `Akun ${item.nama} telah dihapus` });
                    }
                }
            });
        }

        // Tombol Tambah Pengguna
        const btnAddUser = document.getElementById("btn-tambah-user");
        if (btnAddUser) btnAddUser.addEventListener("click", () => openUserModal("add"));

        // ------------------------------------------------------------
        // D. SETTINGS TAB SWITCHING
        // ------------------------------------------------------------
        const settingsTabs = document.querySelectorAll(".settings-tabs .settings-tab");
        const tabContents = {
            store: document.getElementById("tab-content-store"),
            users: document.getElementById("tab-content-users"),
            pos: document.getElementById("tab-content-pos"),
            backup: document.getElementById("tab-content-backup")
        };

        settingsTabs.forEach(tab => {
            tab.addEventListener("click", function () {
                settingsTabs.forEach(t => t.classList.remove("active"));
                this.classList.add("active");

                const tabKey = this.getAttribute("data-tab");
                Object.keys(tabContents).forEach(key => {
                    if (tabContents[key]) {
                        tabContents[key].style.display = (key === tabKey) ? "block" : "none";
                    }
                });

                if (tabKey === "users" && $$("table_users_settings")) {
                    $$("table_users_settings").resize();
                }
            });
        });

        // ------------------------------------------------------------
        // E. LOAD & SAVE FORM SETTINGS
        // ------------------------------------------------------------
        function populateSettingsForm() {
            const s = getStoredSettings();
            if (document.getElementById("store-name")) document.getElementById("store-name").value = s.storeName || "";
            if (document.getElementById("store-tagline")) document.getElementById("store-tagline").value = s.storeTagline || "";
            if (document.getElementById("store-address")) document.getElementById("store-address").value = s.storeAddress || "";
            if (document.getElementById("store-phone")) document.getElementById("store-phone").value = s.storePhone || "";
            if (document.getElementById("store-email")) document.getElementById("store-email").value = s.storeEmail || "";
            if (document.getElementById("store-npwp")) document.getElementById("store-npwp").value = s.storeNpwp || "";
            if (document.getElementById("store-currency")) document.getElementById("store-currency").value = s.storeCurrency || "IDR";
            if (document.getElementById("store-receipt-footer")) document.getElementById("store-receipt-footer").value = s.storeReceiptFooter || "";
            if (document.getElementById("stock-min-threshold")) document.getElementById("stock-min-threshold").value = s.stockMinThreshold || 15;
            if (document.getElementById("tax-rate")) document.getElementById("tax-rate").value = s.taxRate || 11;
            if (document.getElementById("invoice-prefix")) document.getElementById("invoice-prefix").value = s.invoicePrefix || "TRX-2026-";
            if (document.getElementById("auto-print")) document.getElementById("auto-print").value = s.autoPrint || "yes";
            if (document.getElementById("notify-low-stock")) document.getElementById("notify-low-stock").checked = !!s.notifyLowStock;
        }

        function collectSettingsForm() {
            return {
                storeName: document.getElementById("store-name")?.value || defaultSettings.storeName,
                storeTagline: document.getElementById("store-tagline")?.value || defaultSettings.storeTagline,
                storeAddress: document.getElementById("store-address")?.value || defaultSettings.storeAddress,
                storePhone: document.getElementById("store-phone")?.value || defaultSettings.storePhone,
                storeEmail: document.getElementById("store-email")?.value || defaultSettings.storeEmail,
                storeNpwp: document.getElementById("store-npwp")?.value || defaultSettings.storeNpwp,
                storeCurrency: document.getElementById("store-currency")?.value || "IDR",
                storeReceiptFooter: document.getElementById("store-receipt-footer")?.value || defaultSettings.storeReceiptFooter,
                stockMinThreshold: parseInt(document.getElementById("stock-min-threshold")?.value, 10) || 15,
                taxRate: parseFloat(document.getElementById("tax-rate")?.value) || 11,
                invoicePrefix: document.getElementById("invoice-prefix")?.value || "TRX-2026-",
                autoPrint: document.getElementById("auto-print")?.value || "yes",
                notifyLowStock: !!document.getElementById("notify-low-stock")?.checked
            };
        }

        populateSettingsForm();

        // Tombol Simpan Pengaturan
        const btnSaveSettings = document.getElementById("btn-save-settings");
        if (btnSaveSettings) {
            btnSaveSettings.addEventListener("click", function () {
                const data = collectSettingsForm();
                saveStoredSettings(data);
                webix.message({ type: "success", text: "Pengaturan sistem & toko berhasil disimpan!" });
            });
        }

        // Tombol Reset Standar
        const btnResetSettings = document.getElementById("btn-reset-default-settings");
        if (btnResetSettings) {
            btnResetSettings.addEventListener("click", function () {
                webix.confirm({
                    title: "Reset Pengaturan",
                    text: "Apakah Anda ingin mengembalikan formulir pengaturan ke nilai standar?",
                    ok: "Ya, Reset",
                    cancel: "Batal",
                    callback: function (res) {
                        if (res) {
                            saveStoredSettings(defaultSettings);
                            populateSettingsForm();
                            webix.message({ type: "info", text: "Pengaturan dikembalikan ke nilai standar" });
                        }
                    }
                });
            });
        }

        // ------------------------------------------------------------
        // F. CADANGAN & PEMULIHAN DATABASE (BACKUP & RESTORE)
        // ------------------------------------------------------------
        // 1. Export JSON Backup
        const btnExportBackup = document.getElementById("btn-export-backup");
        if (btnExportBackup) {
            btnExportBackup.addEventListener("click", function () {
                const fullBackup = {
                    version: "1.0",
                    timestamp: new Date().toISOString(),
                    settings: getStoredSettings(),
                    users: getStoredUsers(),
                    products: JSON.parse(localStorage.getItem("optiware_products_data") || "[]"),
                    transactions: JSON.parse(localStorage.getItem("optiware_transactions_data") || "[]"),
                    stockLogs: JSON.parse(localStorage.getItem("optiware_stock_logs") || "[]")
                };

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
                const downloadAnchor = document.createElement("a");
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `OptiWare_Backup_${new Date().toISOString().slice(0, 10)}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();

                webix.message({ type: "success", text: "File cadangan JSON berhasil diunduh!" });
            });
        }

        // 2. Import JSON Restore
        const btnTriggerRestore = document.getElementById("btn-trigger-restore");
        const fileInputRestore = document.getElementById("input-restore-file");

        if (btnTriggerRestore && fileInputRestore) {
            btnTriggerRestore.addEventListener("click", () => fileInputRestore.click());

            fileInputRestore.addEventListener("change", function (e) {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function (event) {
                    try {
                        const parsed = JSON.parse(event.target.result);
                        if (parsed.products || parsed.transactions || parsed.settings) {
                            if (parsed.products) localStorage.setItem("optiware_products_data", JSON.stringify(parsed.products));
                            if (parsed.transactions) localStorage.setItem("optiware_transactions_data", JSON.stringify(parsed.transactions));
                            if (parsed.stockLogs) localStorage.setItem("optiware_stock_logs", JSON.stringify(parsed.stockLogs));
                            if (parsed.settings) saveStoredSettings(parsed.settings);
                            if (parsed.users) saveStoredUsers(parsed.users);

                            populateSettingsForm();
                            if ($$("table_users_settings") && parsed.users) {
                                $$("table_users_settings").clearAll();
                                $$("table_users_settings").parse(parsed.users);
                            }

                            webix.message({ type: "success", text: "Database berhasil dipulihkan dari file backup!" });
                        } else {
                            webix.message({ type: "error", text: "Format file JSON tidak sesuai dengan skema OptiWare" });
                        }
                    } catch (err) {
                        webix.message({ type: "error", text: "Gagal membaca file JSON backup: " + err.message });
                    }
                };
                reader.readAsText(file);
                fileInputRestore.value = "";
            });
        }

        // 3. Reset Database ke Demo
        const btnResetDb = document.getElementById("btn-reset-database");
        if (btnResetDb) {
            btnResetDb.addEventListener("click", function () {
                webix.confirm({
                    title: "Konfirmasi Reset Database",
                    text: "<span style='color:var(--danger);'><strong>PERINGATAN:</strong> Seluruh data produk, riwayat transaksi, dan mutasi stok akan dikembalikan ke data bawaan demo. Tindakan ini tidak dapat dibatalkan. Lanjutkan?</span>",
                    ok: "Ya, Hapus & Reset",
                    cancel: "Batal",
                    type: "confirm-warning",
                    callback: function (res) {
                        if (res) {
                            localStorage.removeItem("optiware_products_data");
                            localStorage.removeItem("optiware_transactions_data");
                            localStorage.removeItem("optiware_stock_logs");
                            localStorage.removeItem(STORAGE_KEY_SETTINGS);
                            localStorage.removeItem(STORAGE_KEY_USERS);

                            populateSettingsForm();
                            $$("table_users_settings").clearAll();
                            $$("table_users_settings").parse(defaultUsers);

                            webix.message({ type: "info", text: "Database OptiWare telah direset ke data awal demo!" });
                        }
                    }
                });
            });
        }

        // ------------------------------------------------------------
        // G. NOTIFIKASI & PROFIL POPUP (Konsisten)
        // ------------------------------------------------------------
        const notifPopup = webix.ui({
            view: "popup",
            id: "notif_popup_settings",
            width: 340,
            css: "optiware-notif-popup",
            body: {
                rows: [
                    {
                        template: "<div class='notif-header'><span>Notifikasi Sistem</span><span class='notif-badge'>3 Baru</span></div>",
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
                            { id: 1, title: "Sistem berjalan normal pada versi 2.4", time: "10 menit lalu", icon: "fa-solid fa-circle-check", type: "success" },
                            { id: 2, title: "Pencadangan data otomatis tersedia di tab Cadangan", time: "1 jam lalu", icon: "fa-solid fa-database", type: "warn" },
                            { id: 3, title: "4 akun staf terdaftar dan siap digunakan", time: "3 jam lalu", icon: "fa-solid fa-users", type: "success" }
                        ]
                    },
                    {
                        view: "button",
                        value: "Tandai Sudah Dibaca",
                        css: "webix_transparent notif-clear-btn",
                        click: function () {
                            const badge = document.querySelector(".notification .badge-dot");
                            if (badge) badge.style.display = "none";
                            $$("notif_popup_settings").hide();
                        }
                    }
                ]
            }
        });

        const notifBtn = document.getElementById("topbar-notif-btn");
        if (notifBtn) notifBtn.addEventListener("click", function () { notifPopup.show(this); });

        const profilePopup = webix.ui({
            view: "popup",
            id: "profile_popup_settings",
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