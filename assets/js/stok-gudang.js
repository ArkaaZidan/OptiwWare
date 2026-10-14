const STORAGE_KEY_PRODUCTS = "optiware_products_data";
const STORAGE_KEY_LOGS = "optiware_stock_logs";

// Database default data
const defaultProducts = [
  {
    id: 1,
    kode: "OPT-001",
    nama: "Indomie Goreng 85g",
    kategori: "Makanan",
    stok: 120,
    kapasitas: 200,
    status: "Aman",
    rak: "Gudang A - Rak 01",
    supplier: "PT Indofood Makmur",
  },
  {
    id: 2,
    kode: "OPT-002",
    nama: "Aqua 600ml",
    kategori: "Minuman",
    stok: 45,
    kapasitas: 150,
    status: "Aman",
    rak: "Gudang A - Rak 02",
    supplier: "PT Tirta Investama",
  },
  {
    id: 3,
    kode: "OPT-003",
    nama: "Mie Sedaap 75g",
    kategori: "Makanan",
    stok: 10,
    kapasitas: 150,
    status: "Hampir Habis",
    rak: "Gudang B - Rak 01",
    supplier: "Wings Food",
  },
  {
    id: 4,
    kode: "OPT-004",
    nama: "Telur Ayam 1kg",
    kategori: "Bahan Pokok",
    stok: 5,
    kapasitas: 100,
    status: "Habis",
    rak: "Gudang C - Rak 03",
    supplier: "Peternakan Berkah",
  },
  {
    id: 5,
    kode: "OPT-005",
    nama: "Minyak Goreng 1L",
    kategori: "Bahan Pokok",
    stok: 28,
    kapasitas: 150,
    status: "Hampir Habis",
    rak: "Gudang B - Rak 02",
    supplier: "PT Wilmar Nabati",
  },
  {
    id: 6,
    kode: "OPT-006",
    nama: "Beras Ramos 5kg",
    kategori: "Bahan Pokok",
    stok: 60,
    kapasitas: 120,
    status: "Aman",
    rak: "Gudang C - Rak 01",
    supplier: "CV Lumbung Padi",
  },
  {
    id: 7,
    kode: "OPT-007",
    nama: "Gula Pasir 1kg",
    kategori: "Bahan Pokok",
    stok: 85,
    kapasitas: 150,
    status: "Aman",
    rak: "Gudang C - Rak 02",
    supplier: "PT Perkebunan Nusantara",
  },
  {
    id: 8,
    kode: "OPT-008",
    nama: "Kopi Kapal Api 100g",
    kategori: "Minuman",
    stok: 50,
    kapasitas: 150,
    status: "Aman",
    rak: "Gudang A - Rak 03",
    supplier: "PT Santos Jaya Abadi",
  },
  {
    id: 9,
    kode: "OPT-009",
    nama: "Teh Botol Sosro 450ml",
    kategori: "Minuman",
    stok: 40,
    kapasitas: 120,
    status: "Aman",
    rak: "Gudang A - Rak 02",
    supplier: "PT Sinar Sosro",
  },
  {
    id: 10,
    kode: "OPT-010",
    nama: "Sabun Lifebuoy 85g",
    kategori: "Perawatan",
    stok: 75,
    kapasitas: 200,
    status: "Aman",
    rak: "Gudang D - Rak 01",
    supplier: "Unilever Indonesia",
  },
];

const defaultLogs = [
  {
    id: 1,
    waktu: "11 Okt 2026 10:15",
    tipe: "inbound",
    label: "Stok Masuk",
    nama: "Indomie Goreng 85g",
    qty: 50,
    alur: "Pemasok -> Gudang A - Rak 01",
    ref: "SJ/IN-2026/101",
  },
  {
    id: 2,
    waktu: "11 Okt 2026 09:30",
    tipe: "outbound",
    label: "Stok Keluar",
    nama: "Mie Sedaap 75g",
    qty: -15,
    alur: "Gudang B - Rak 01 -> Toko Depan",
    ref: "DO/OUT-2026/089",
  },
  {
    id: 3,
    waktu: "11 Okt 2026 08:45",
    tipe: "transfer",
    label: "Mutasi Rak",
    nama: "Aqua 600ml",
    qty: 25,
    alur: "Gudang A - Rak 01 -> Rak 02",
    ref: "TRF-2026/044",
  },
  {
    id: 4,
    waktu: "10 Okt 2026 15:20",
    tipe: "inbound",
    label: "Stok Masuk",
    nama: "Minyak Goreng 1L",
    qty: 20,
    alur: "Pemasok -> Gudang B - Rak 02",
    ref: "SJ/IN-2026/098",
  },
  {
    id: 5,
    waktu: "10 Okt 2026 14:10",
    tipe: "opname",
    label: "Stock Opname",
    nama: "Telur Ayam 1kg",
    qty: -5,
    alur: "Penyesuaian Fisik (Pecah)",
    ref: "OPN-2026/012",
  },
];

function getStoredProducts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Pastikan properti kapasitas ada
        return parsed.map((item) => ({
          ...item,
          kapasitas: item.kapasitas || 150,
        }));
      }
    }
  } catch (e) {
    console.warn("Gagal membaca localStorage produk:", e);
  }
  saveStoredProducts(defaultProducts);
  return defaultProducts;
}

function saveStoredProducts(data) {
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(data));
  } catch (e) {
    console.warn("Gagal menyimpan produk:", e);
  }
}

function getStoredLogs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LOGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Gagal membaca localStorage log:", e);
  }
  saveStoredLogs(defaultLogs);
  return defaultLogs;
}

function saveStoredLogs(data) {
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(data));
  } catch (e) {
    console.warn("Gagal menyimpan log:", e);
  }
}

function getFormattedNow() {
  const d = new Date();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agt",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const day = String(d.getDate()).padStart(2, "0");
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${mon} ${year} ${hour}:${min}`;
}

if (typeof webix === "undefined") {
  console.error("Library Webix belum dimuat!");
} else {
  webix.ready(function () {
    let currentSelectedId = null;
    let selectedZone = "";

    const tableContainer = document.getElementById("gudang-table-container");
    const logContainer = document.getElementById("log-table-container");

    if (!tableContainer || !logContainer) {
      console.error("Kontainer tabel gudang tidak ditemukan!");
      return;
    }

    // ------------------------------------------------------------
    // A. WEBIX PAGER & TABEL STOK GUDANG (INVENTORY)
    // ------------------------------------------------------------
    webix.ui({
      view: "pager",
      id: "gudang_pager",
      container: "gudang-pager-container",
      size: 8,
      group: 5,
      template:
        "{common.first()} {common.prev()} {common.pages()} {common.next()} {common.last()}",
    });

    const tableGudang = webix.ui({
      container: "gudang-table-container",
      view: "datatable",
      id: "table_stok_gudang",
      css: "optiware-webix-table",
      autoheight: true,
      scroll: "x",
      select: "row",
      hover: "webix_row_hover",
      rowHeight: 56,
      headerRowHeight: 46,
      pager: "gudang_pager",
      columns: [
        {
          id: "no",
          header: "No",
          width: 50,
          css: { "text-align": "center" },
          template: function (obj, common, value, config, index) {
            return typeof index === "number" ? index + 1 : obj.id || 1;
          },
        },
        {
          id: "kode",
          header: "Kode SKU",
          width: 105,
          sort: "string",
          template: function (obj) {
            return `<span class="sku-tag">${obj.kode || "OPT-00" + obj.id}</span>`;
          },
        },
        {
          id: "nama",
          header: "Nama Produk",
          fillspace: 3,
          minWidth: 180,
          sort: "string",
          template: function (obj) {
            return `<strong>${obj.nama}</strong>`;
          },
        },
        {
          id: "rak",
          header: "Lokasi Rak & Gudang",
          width: 190,
          sort: "string",
          template: function (obj) {
            return `<span class="location-tag"><i class="fa-solid fa-location-dot"></i> ${obj.rak || "Gudang A - Rak 01"}</span>`;
          },
        },
        {
          id: "stok",
          header: "Stok Fisik",
          width: 100,
          sort: "int",
          css: { "text-align": "center" },
          template: function (obj) {
            let textClass = "";
            if (obj.stok <= 5 || obj.status === "Habis")
              textClass = "text-danger";
            else if (obj.stok <= 15 || obj.status === "Hampir Habis")
              textClass = "text-warn";
            return `<span class="${textClass} font-bold" style="font-size:15px;">${obj.stok}</span> unit`;
          },
        },
        {
          id: "okupansi",
          header: "Kapasitas & Okupansi Rak",
          width: 210,
          template: function (obj) {
            const kapasitas = obj.kapasitas || 150;
            const persen = Math.min(
              100,
              Math.round(((obj.stok || 0) / kapasitas) * 100),
            );
            let colorClass = "normal";
            if (persen >= 85) colorClass = "full";
            else if (persen >= 60) colorClass = "warn";

            return `
                            <div class="capacity-wrapper">
                                <div class="capacity-text">
                                    <span>${obj.stok || 0} / ${kapasitas} unit</span>
                                    <span><strong>${persen}%</strong></span>
                                </div>
                                <div class="capacity-bar-track">
                                    <div class="capacity-bar-fill ${colorClass}" style="width: ${persen}%;"></div>
                                </div>
                            </div>
                        `;
          },
        },
        {
          id: "status",
          header: "Status",
          width: 130,
          sort: "string",
          template: function (obj) {
            let badgeClass = "aman";
            if (obj.status === "Hampir Habis") badgeClass = "hampir-habis";
            else if (obj.status === "Habis") badgeClass = "habis";
            return `<span class="status-badge ${badgeClass}">${obj.status}</span>`;
          },
        },
        {
          id: "aksi",
          header: "Tindakan",
          width: 75,
          css: { "text-align": "center" },
          template: function () {
            return `<i class="fa-solid fa-ellipsis-vertical action-btn" title="Opsi Tindakan Stok"></i>`;
          },
        },
      ],
      data: getStoredProducts(),
      onClick: {
        "action-btn": function (e, id) {
          currentSelectedId = id.row;
          gudangActionPopup.show(e.target);
          return false;
        },
      },
    });

    // ------------------------------------------------------------
    // B. WEBIX TABEL RIWAYAT LOG MUTASI
    // ------------------------------------------------------------
    const tableLogs = webix.ui({
      container: "log-table-container",
      view: "datatable",
      id: "table_log_mutasi",
      css: "optiware-webix-table",
      autoheight: true,
      scroll: "x",
      rowHeight: 48,
      headerRowHeight: 42,
      columns: [
        { id: "waktu", header: "Waktu & Tanggal", width: 160, sort: "string" },
        {
          id: "tipe",
          header: "Jenis Aktivitas",
          width: 150,
          template: function (obj) {
            let icon = "fa-arrow-down";
            if (obj.tipe === "outbound") icon = "fa-arrow-up";
            else if (obj.tipe === "transfer") icon = "fa-arrows-rotate";
            else if (obj.tipe === "opname") icon = "fa-clipboard-check";
            return `<span class="log-type-tag ${obj.tipe}"><i class="fa-solid ${icon}"></i> ${obj.label}</span>`;
          },
        },
        {
          id: "nama",
          header: "Produk",
          fillspace: 2,
          minWidth: 160,
          sort: "string",
        },
        {
          id: "qty",
          header: "Jumlah",
          width: 100,
          css: { "text-align": "center" },
          template: function (obj) {
            if (obj.qty > 0) return `<span class="qty-in">+${obj.qty}</span>`;
            else if (obj.qty < 0)
              return `<span class="qty-out">${obj.qty}</span>`;
            return `<span class="qty-diff">0</span>`;
          },
        },
        { id: "alur", header: "Alur Pergerakan", fillspace: 3, minWidth: 200 },
        { id: "ref", header: "No. Referensi / Ket", width: 160 },
      ],
      data: getStoredLogs(),
    });

    // Responsif window resize
    webix.event(window, "resize", function () {
      if ($$("table_stok_gudang")) $$("table_stok_gudang").resize();
      if ($$("table_log_mutasi")) $$("table_log_mutasi").resize();
    });

    // ------------------------------------------------------------
    // C. POPUP MENU TINDAKAN
    // ------------------------------------------------------------
    const gudangActionPopup = webix.ui({
      view: "popup",
      id: "gudang_action_popup",
      width: 210,
      css: "optiware-action-popup",
      body: {
        view: "list",
        id: "gudang_action_list",
        autoheight: true,
        scroll: false,
        template:
          "<i class='#icon#' style='width:18px; margin-right:8px;'></i> #text#",
        data: [
          {
            id: "inbound",
            text: "Tambah Stok Masuk",
            icon: "fa-solid fa-arrow-down-to-bracket text-success",
          },
          {
            id: "outbound",
            text: "Keluarkan Stok",
            icon: "fa-solid fa-arrow-up-from-bracket text-danger",
          },
          {
            id: "transfer",
            text: "Pindah Lokasi Rak",
            icon: "fa-solid fa-arrows-left-right",
          },
          {
            id: "opname",
            text: "Sesuaikan (Opname)",
            icon: "fa-solid fa-clipboard-check",
          },
        ],
        on: {
          onItemClick: function (actionId) {
            gudangActionPopup.hide();
            if (!currentSelectedId) return;
            const item = $$("table_stok_gudang").getItem(currentSelectedId);

            switch (actionId) {
              case "inbound":
                openInboundModal(item);
                break;
              case "outbound":
                openOutboundModal(item);
                break;
              case "transfer":
                openTransferModal(item);
                break;
              case "opname":
                openOpnameModal(item);
                break;
            }
          },
        },
      },
    });

    // ------------------------------------------------------------
    // D. MODAL STOK MASUK (INBOUND)
    // ------------------------------------------------------------
    const inboundModal = webix.ui({
      view: "window",
      id: "inbound_modal",
      width: 460,
      position: "center",
      modal: true,
      head: {
        view: "toolbar",
        cols: [
          {
            view: "label",
            label: "Catat Penerimaan Stok Masuk",
            css: "modal-title-bold",
          },
          {
            view: "icon",
            icon: "wxi-close",
            click: function () {
              $$("inbound_modal").hide();
            },
          },
        ],
      },
      body: {
        view: "form",
        id: "inbound_form",
        elements: [
          {
            view: "combo",
            name: "productId",
            label: "Pilih Produk",
            labelPosition: "top",
            required: true,
            id: "inbound_product_combo",
          },
          {
            cols: [
              {
                view: "text",
                name: "qty",
                type: "number",
                label: "Jumlah Masuk (Unit)",
                labelPosition: "top",
                required: true,
                placeholder: "Contoh: 50",
              },
              {
                view: "text",
                name: "ref",
                label: "No. Surat Jalan / Faktur",
                labelPosition: "top",
                placeholder: "SJ/IN-2026/...",
              },
            ],
          },
          {
            view: "text",
            name: "supplier",
            label: "Pemasok / Supplier",
            labelPosition: "top",
            placeholder: "PT Distributor Utama",
          },
          {
            view: "text",
            name: "rak",
            label: "Rak Tujuan Simpan",
            labelPosition: "top",
            placeholder: "Gudang A - Rak 01",
          },
          {
            margin: 12,
            cols: [
              {
                view: "button",
                value: "Batal",
                css: "webix_secondary",
                click: function () {
                  $$("inbound_modal").hide();
                },
              },
              {
                view: "button",
                value: "Konfirmasi Masuk",
                css: "webix_primary optiware-btn-primary",
                click: saveInbound,
              },
            ],
          },
        ],
      },
    });

    function populateProductCombo(comboId) {
      const options = [];
      $$("table_stok_gudang").data.each(function (obj) {
        options.push({
          id: obj.id,
          value: `${obj.kode} - ${obj.nama} (Sisa: ${obj.stok})`,
        });
      });
      $$(comboId).define("options", options);
      $$(comboId).refresh();
    }

    function openInboundModal(preselectedItem) {
      populateProductCombo("inbound_product_combo");
      const form = $$("inbound_form");
      form.clearValidation();

      if (preselectedItem) {
        form.setValues({
          productId: preselectedItem.id,
          qty: 20,
          ref: "SJ/IN-2026/" + Math.floor(100 + Math.random() * 900),
          supplier: preselectedItem.supplier || "Distributor Resmi",
          rak: preselectedItem.rak || "Gudang A - Rak 01",
        });
      } else {
        const firstItem = $$("table_stok_gudang").getItem(
          $$("table_stok_gudang").getFirstId(),
        );
        form.setValues({
          productId: firstItem ? firstItem.id : "",
          qty: 20,
          ref: "SJ/IN-2026/" + Math.floor(100 + Math.random() * 900),
          supplier: firstItem ? firstItem.supplier : "",
          rak: firstItem ? firstItem.rak : "Gudang A - Rak 01",
        });
      }
      $$("inbound_modal").show();
    }

    function saveInbound() {
      const form = $$("inbound_form");
      if (!form.validate()) {
        webix.message({
          type: "error",
          text: "Mohon lengkapi formulir stok masuk",
        });
        return;
      }

      const val = form.getValues();
      const qtyNum = parseInt(val.qty, 10);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        webix.message({
          type: "error",
          text: "Jumlah stok masuk harus lebih dari 0",
        });
        return;
      }

      const item = $$("table_stok_gudang").getItem(val.productId);
      if (!item) return;

      item.stok += qtyNum;
      if (item.stok > 15) item.status = "Aman";
      else if (item.stok > 0) item.status = "Hampir Habis";
      if (val.rak) item.rak = val.rak;

      $$("table_stok_gudang").updateItem(item.id, item);

      // Tambahkan catatan log mutasi
      addLogRecord({
        tipe: "inbound",
        label: "Stok Masuk",
        nama: item.nama,
        qty: qtyNum,
        alur: `${val.supplier || "Pemasok"} -> ${item.rak}`,
        ref: val.ref || "SJ/IN-2026/RESTOCK",
      });

      $$("inbound_modal").hide();
      syncStorageAndMetrics();
      webix.message({
        type: "success",
        text: `Berhasil menambahkan +${qtyNum} unit ${item.nama}`,
      });
    }

    // ------------------------------------------------------------
    // E. MODAL STOK KELUAR (OUTBOUND)
    // ------------------------------------------------------------
    const outboundModal = webix.ui({
      view: "window",
      id: "outbound_modal",
      width: 460,
      position: "center",
      modal: true,
      head: {
        view: "toolbar",
        cols: [
          {
            view: "label",
            label: "Catat Pengeluaran Stok Gudang",
            css: "modal-title-bold",
          },
          {
            view: "icon",
            icon: "wxi-close",
            click: function () {
              $$("outbound_modal").hide();
            },
          },
        ],
      },
      body: {
        view: "form",
        id: "outbound_form",
        elements: [
          {
            view: "combo",
            name: "productId",
            label: "Pilih Produk",
            labelPosition: "top",
            required: true,
            id: "outbound_product_combo",
          },
          {
            cols: [
              {
                view: "text",
                name: "qty",
                type: "number",
                label: "Jumlah Keluar (Unit)",
                labelPosition: "top",
                required: true,
                placeholder: "Contoh: 10",
              },
              {
                view: "text",
                name: "ref",
                label: "No. Delivery Order (DO)",
                labelPosition: "top",
                placeholder: "DO/OUT-2026/...",
              },
            ],
          },
          {
            view: "text",
            name: "tujuan",
            label: "Tujuan Pengiriman / Alasan",
            labelPosition: "top",
            placeholder: "Toko Depan Ritel / Pelanggan",
            required: true,
          },
          {
            margin: 12,
            cols: [
              {
                view: "button",
                value: "Batal",
                css: "webix_secondary",
                click: function () {
                  $$("outbound_modal").hide();
                },
              },
              {
                view: "button",
                value: "Keluarkan Stok",
                css: "webix_primary optiware-btn-primary",
                click: saveOutbound,
              },
            ],
          },
        ],
      },
    });

    function openOutboundModal(preselectedItem) {
      populateProductCombo("outbound_product_combo");
      const form = $$("outbound_form");
      form.clearValidation();

      if (preselectedItem) {
        form.setValues({
          productId: preselectedItem.id,
          qty: 5,
          ref: "DO/OUT-2026/" + Math.floor(100 + Math.random() * 900),
          tujuan: "Toko Depan Ritel",
        });
      } else {
        const firstItem = $$("table_stok_gudang").getItem(
          $$("table_stok_gudang").getFirstId(),
        );
        form.setValues({
          productId: firstItem ? firstItem.id : "",
          qty: 5,
          ref: "DO/OUT-2026/" + Math.floor(100 + Math.random() * 900),
          tujuan: "Toko Depan Ritel",
        });
      }
      $$("outbound_modal").show();
    }

    function saveOutbound() {
      const form = $$("outbound_form");
      if (!form.validate()) {
        webix.message({
          type: "error",
          text: "Mohon lengkapi formulir pengeluaran stok",
        });
        return;
      }

      const val = form.getValues();
      const qtyNum = parseInt(val.qty, 10);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        webix.message({
          type: "error",
          text: "Jumlah keluar harus lebih dari 0",
        });
        return;
      }

      const item = $$("table_stok_gudang").getItem(val.productId);
      if (!item) return;

      if (item.stok < qtyNum) {
        webix.message({
          type: "error",
          text: `Stok tidak mencukupi! Sisa stok fisik hanya ${item.stok} unit.`,
        });
        return;
      }

      item.stok -= qtyNum;
      if (item.stok === 0) item.status = "Habis";
      else if (item.stok <= 15) item.status = "Hampir Habis";
      else item.status = "Aman";

      $$("table_stok_gudang").updateItem(item.id, item);

      addLogRecord({
        tipe: "outbound",
        label: "Stok Keluar",
        nama: item.nama,
        qty: -qtyNum,
        alur: `${item.rak} -> ${val.tujuan}`,
        ref: val.ref || "DO/OUT-2026/DIST",
      });

      $$("outbound_modal").hide();
      syncStorageAndMetrics();
      webix.message({
        type: "info",
        text: `Berhasil mengeluarkan -${qtyNum} unit ${item.nama}`,
      });
    }

    // ------------------------------------------------------------
    // F. MODAL MUTASI PINDAH RAK
    // ------------------------------------------------------------
    const transferModal = webix.ui({
      view: "window",
      id: "transfer_modal",
      width: 420,
      position: "center",
      modal: true,
      head: {
        view: "toolbar",
        cols: [
          { view: "label", label: "Pindah Lokasi Rak Gudang" },
          {
            view: "icon",
            icon: "wxi-close",
            click: function () {
              $$("transfer_modal").hide();
            },
          },
        ],
      },
      body: {
        view: "form",
        id: "transfer_form",
        elements: [
          {
            view: "text",
            name: "nama",
            label: "Nama Produk",
            labelPosition: "top",
            readonly: true,
          },
          {
            view: "text",
            name: "rakLama",
            label: "Lokasi Rak Saat Ini",
            labelPosition: "top",
            readonly: true,
          },
          {
            view: "combo",
            name: "rakBaru",
            label: "Pindah ke Rak Tujuan",
            labelPosition: "top",
            options: [
              "Gudang A - Rak 01",
              "Gudang A - Rak 02",
              "Gudang A - Rak 03",
              "Gudang B - Rak 01",
              "Gudang B - Rak 02",
              "Gudang C - Rak 01",
              "Gudang C - Rak 02",
              "Gudang C - Rak 03",
              "Gudang D - Rak 01",
            ],
            required: true,
          },
          {
            margin: 12,
            cols: [
              {
                view: "button",
                value: "Batal",
                css: "webix_secondary",
                click: function () {
                  $$("transfer_modal").hide();
                },
              },
              {
                view: "button",
                value: "Pindahkan Rak",
                css: "webix_primary optiware-btn-primary",
                click: saveTransfer,
              },
            ],
          },
        ],
      },
    });

    function openTransferModal(item) {
      $$("transfer_form").setValues({
        nama: item.nama,
        rakLama: item.rak,
        rakBaru: item.rak,
      });
      $$("transfer_modal").show();
    }

    function saveTransfer() {
      const val = $$("transfer_form").getValues();
      if (!val.rakBaru || val.rakBaru === val.rakLama) {
        webix.message({
          type: "error",
          text: "Pilih lokasi rak tujuan yang berbeda dari rak saat ini",
        });
        return;
      }

      const item = $$("table_stok_gudang").getItem(currentSelectedId);
      const oldRak = item.rak;
      item.rak = val.rakBaru;

      $$("table_stok_gudang").updateItem(currentSelectedId, item);

      addLogRecord({
        tipe: "transfer",
        label: "Mutasi Rak",
        nama: item.nama,
        qty: item.stok,
        alur: `${oldRak} -> ${val.rakBaru}`,
        ref: "TRF-2026/" + Math.floor(100 + Math.random() * 900),
      });

      $$("transfer_modal").hide();
      syncStorageAndMetrics();
      webix.message({
        type: "success",
        text: `Lokasi "${item.nama}" dipindahkan ke ${val.rakBaru}`,
      });
    }

    // ------------------------------------------------------------
    // G. MODAL STOCK OPNAME
    // ------------------------------------------------------------
    const opnameModal = webix.ui({
      view: "window",
      id: "opname_modal",
      width: 440,
      position: "center",
      modal: true,
      head: {
        view: "toolbar",
        cols: [
          {
            view: "label",
            label: "Penyesuaian Fisik (Stock Opname)",
            css: "modal-title-bold",
          },
          {
            view: "icon",
            icon: "wxi-close",
            click: function () {
              $$("opname_modal").hide();
            },
          },
        ],
      },
      body: {
        view: "form",
        id: "opname_form",
        elements: [
          {
            view: "combo",
            name: "productId",
            label: "Pilih Produk",
            labelPosition: "top",
            required: true,
            id: "opname_product_combo",
          },
          {
            cols: [
              {
                view: "text",
                name: "stokSistem",
                label: "Stok Sistem",
                labelPosition: "top",
                readonly: true,
              },
              {
                view: "text",
                name: "stokFisik",
                type: "number",
                label: "Stok Fisik Aktual",
                labelPosition: "top",
                required: true,
              },
            ],
          },
          {
            view: "text",
            name: "alasan",
            label: "Alasan Penyesuaian",
            labelPosition: "top",
            placeholder: "Contoh: Kerusakan kemasan / selisih hitung",
            required: true,
          },
          {
            margin: 12,
            cols: [
              {
                view: "button",
                value: "Batal",
                css: "webix_secondary",
                click: function () {
                  $$("opname_modal").hide();
                },
              },
              {
                view: "button",
                value: "Simpan Opname",
                css: "webix_primary optiware-btn-primary",
                click: saveOpname,
              },
            ],
          },
        ],
      },
    });

    function openOpnameModal(preselectedItem) {
      populateProductCombo("opname_product_combo");
      const form = $$("opname_form");
      form.clearValidation();

      const item =
        preselectedItem ||
        $$("table_stok_gudang").getItem($$("table_stok_gudang").getFirstId());
      if (item) {
        form.setValues({
          productId: item.id,
          stokSistem: item.stok,
          stokFisik: item.stok,
          alasan: "Pemeriksaan berkala",
        });
      }
      $$("opname_modal").show();
    }

    // Listener perubahan pilihan combo opname
    $$("opname_product_combo").attachEvent("onChange", function (newVal) {
      if (newVal) {
        const item = $$("table_stok_gudang").getItem(newVal);
        if (item) {
          $$("opname_form").setValues({
            productId: item.id,
            stokSistem: item.stok,
            stokFisik: item.stok,
            alasan: "Pemeriksaan berkala",
          });
        }
      }
    });

    function saveOpname() {
      const form = $$("opname_form");
      if (!form.validate()) {
        webix.message({
          type: "error",
          text: "Mohon isi formulir opname dengan lengkap",
        });
        return;
      }

      const val = form.getValues();
      const fisikNum = parseInt(val.stokFisik, 10);
      if (isNaN(fisikNum) || fisikNum < 0) {
        webix.message({
          type: "error",
          text: "Stok fisik harus bernilai >= 0",
        });
        return;
      }

      const item = $$("table_stok_gudang").getItem(val.productId);
      if (!item) return;

      const selisih = fisikNum - item.stok;
      item.stok = fisikNum;
      if (fisikNum === 0) item.status = "Habis";
      else if (fisikNum <= 15) item.status = "Hampir Habis";
      else item.status = "Aman";

      $$("table_stok_gudang").updateItem(item.id, item);

      addLogRecord({
        tipe: "opname",
        label: "Stock Opname",
        nama: item.nama,
        qty: selisih,
        alur: `${val.alasan} (Selisih: ${selisih})`,
        ref: "OPN-2026/" + Math.floor(100 + Math.random() * 900),
      });

      $$("opname_modal").hide();
      syncStorageAndMetrics();
      webix.message({
        type: "success",
        text: `Stock opname ${item.nama} disimpan. Stok kini: ${fisikNum}`,
      });
    }

    // ------------------------------------------------------------
    // H. LOG MUTASI HELPER
    // ------------------------------------------------------------
    function addLogRecord(logData) {
      const newLog = {
        id: new Date().getTime(),
        waktu: getFormattedNow(),
        ...logData,
      };
      $$("table_log_mutasi").add(newLog, 0);

      // Simpan log ke localStorage
      const logs = [];
      $$("table_log_mutasi").data.each(function (obj) {
        logs.push(obj);
      });
      saveStoredLogs(logs);

      const countEl = document.getElementById("log-count-info");
      if (countEl) countEl.textContent = `${logs.length} Mutasi Tercatat`;
    }

    // ------------------------------------------------------------
    // I. SINKRONISASI & PERHITUNGAN METRIK GUDANG
    // ------------------------------------------------------------
    function syncStorageAndMetrics() {
      const table = $$("table_stok_gudang");
      if (!table) return;

      const allProducts = [];
      let totalFisik = 0;
      let totalKapasitas = 0;

      table.data.each(function (obj) {
        allProducts.push(obj);
        totalFisik += parseInt(obj.stok, 10) || 0;
        totalKapasitas += parseInt(obj.kapasitas, 10) || 150;
      });

      saveStoredProducts(allProducts);

      // Update DOM Statistik
      const elTotalFisik = document.getElementById("stat-total-fisik");
      if (elTotalFisik)
        elTotalFisik.textContent = totalFisik.toLocaleString("id-ID");

      const okupansiPersen =
        totalKapasitas > 0
          ? Math.round((totalFisik / totalKapasitas) * 100)
          : 0;
      const elOkupansi = document.getElementById("stat-okupansi");
      if (elOkupansi) elOkupansi.textContent = okupansiPersen + "%";
    }

    // Jalankan sinkronisasi awal
    syncStorageAndMetrics();

    // ------------------------------------------------------------
    // J. FILTER ZONA GUDANG (TABS) & PENCARIAN REAL-TIME
    // ------------------------------------------------------------
    const zoneTabs = document.querySelectorAll(".warehouse-zones .zone-tab");
    const searchInput = document.getElementById("topbar-search-gudang");

    function applyWarehouseFilter() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

      $$("table_stok_gudang").filter(function (obj) {
        const matchZone =
          !selectedZone || (obj.rak && obj.rak.includes(selectedZone));
        const matchSearch =
          !query ||
          (obj.nama && obj.nama.toLowerCase().includes(query)) ||
          (obj.kode && obj.kode.toLowerCase().includes(query)) ||
          (obj.rak && obj.rak.toLowerCase().includes(query)) ||
          (obj.kategori && obj.kategori.toLowerCase().includes(query));
        return matchZone && matchSearch;
      });
    }

    zoneTabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        zoneTabs.forEach((t) => t.classList.remove("active"));
        this.classList.add("active");
        selectedZone = this.getAttribute("data-zone") || "";
        applyWarehouseFilter();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", applyWarehouseFilter);
    }

    // Tombol Header Aksi Cepat
    const btnInbound = document.getElementById("btn-stok-masuk");
    if (btnInbound)
      btnInbound.addEventListener("click", function () {
        openInboundModal();
      });

    const btnOutbound = document.getElementById("btn-stok-keluar");
    if (btnOutbound)
      btnOutbound.addEventListener("click", function () {
        openOutboundModal();
      });

    const btnOpname = document.getElementById("btn-stock-opname");
    if (btnOpname)
      btnOpname.addEventListener("click", function () {
        openOpnameModal();
      });

    // Tombol Export Excel
    const btnExportStok = document.getElementById("btn-export-stok");
    if (btnExportStok) {
      btnExportStok.addEventListener("click", function () {
        webix.toExcel($$("table_stok_gudang"), {
          filename: "OptiWare_Stok_Gudang",
          name: "StokGudang",
        });
        webix.message({
          type: "success",
          text: "Data stok gudang diekspor ke Excel",
        });
      });
    }

    // ------------------------------------------------------------
    // K. PROFIL POPUP (Konsisten)
    // ------------------------------------------------------------
    const profilePopup = webix.ui({
      view: "popup",
      id: "profile_popup_gudang",
      width: 220,
      body: {
        view: "list",
        autoheight: true,
        scroll: false,
        template:
          "<i class='#icon#' style='width:18px; margin-right:8px;'></i> #text#",
        data: [
          { id: "profile", text: "Profil Saya", icon: "fa-regular fa-user" },
          { id: "settings", text: "Pengaturan Akun", icon: "fa-solid fa-gear" },
          {
            id: "logout",
            text: "<span style='color:var(--danger);'>Keluar</span>",
            icon: "fa-solid fa-arrow-right-from-bracket text-danger",
          },
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
                },
              });
            }
          },
        },
      },
    });

    const profileBtn = document.getElementById("topbar-profile-btn");
    if (profileBtn)
      profileBtn.addEventListener("click", function () {
        profilePopup.show(this);
      });

    // Navigasi Menu Sidebar
    const navItems = document.querySelectorAll(".nav-menu .nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (href && href !== "#" && !href.startsWith("javascript")) {
          return; // Biarkan browser berpindah halaman
        }
        e.preventDefault();
        navItems.forEach((n) => n.classList.remove("active"));
        this.classList.add("active");
        const menuTitle = this.querySelector("span")
          ? this.querySelector("span").textContent
          : "Menu";
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
          },
        });
      });
    }
  });
}
