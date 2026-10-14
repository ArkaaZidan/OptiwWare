const STORAGE_KEY = "optiware_products_data";

const defaultProducts = [
  {
    id: 1,
    kode: "OPT-001",
    nama: "Indomie Goreng 85g",
    kategori: "Makanan",
    hargaBeli: 2800,
    hargaJual: 3500,
    stok: 120,
    satuan: "Bungkus",
    status: "Aman",
    rak: "Gudang A - Rak 01",
    supplier: "PT Indofood Makmur",
  },
  {
    id: 2,
    kode: "OPT-002",
    nama: "Aqua 600ml",
    kategori: "Minuman",
    hargaBeli: 2500,
    hargaJual: 3500,
    stok: 45,
    satuan: "Botol",
    status: "Aman",
    rak: "Gudang A - Rak 02",
    supplier: "PT Tirta Investama",
  },
  {
    id: 3,
    kode: "OPT-003",
    nama: "Mie Sedaap 75g",
    kategori: "Makanan",
    hargaBeli: 2700,
    hargaJual: 3300,
    stok: 10,
    satuan: "Bungkus",
    status: "Hampir Habis",
    rak: "Gudang B - Rak 01",
    supplier: "Wings Food",
  },
  {
    id: 4,
    kode: "OPT-004",
    nama: "Telur Ayam 1kg",
    kategori: "Bahan Pokok",
    hargaBeli: 24000,
    hargaJual: 28000,
    stok: 5,
    satuan: "Kg",
    status: "Habis",
    rak: "Gudang C - Rak 03",
    supplier: "Peternakan Berkah",
  },
  {
    id: 5,
    kode: "OPT-005",
    nama: "Minyak Goreng 1L",
    kategori: "Bahan Pokok",
    hargaBeli: 15500,
    hargaJual: 18500,
    stok: 28,
    satuan: "Pouch",
    status: "Hampir Habis",
    rak: "Gudang B - Rak 02",
    supplier: "PT Wilmar Nabati",
  },
  {
    id: 6,
    kode: "OPT-006",
    nama: "Beras Ramos 5kg",
    kategori: "Bahan Pokok",
    hargaBeli: 65000,
    hargaJual: 74000,
    stok: 60,
    satuan: "Karung",
    status: "Aman",
    rak: "Gudang C - Rak 01",
    supplier: "CV Lumbung Padi",
  },
  {
    id: 7,
    kode: "OPT-007",
    nama: "Gula Pasir 1kg",
    kategori: "Bahan Pokok",
    hargaBeli: 14000,
    hargaJual: 17000,
    stok: 85,
    satuan: "Kg",
    status: "Aman",
    rak: "Gudang C - Rak 02",
    supplier: "PT Perkebunan Nusantara",
  },
  {
    id: 8,
    kode: "OPT-008",
    nama: "Kopi Kapal Api 100g",
    kategori: "Minuman",
    hargaBeli: 6000,
    hargaJual: 7500,
    stok: 50,
    satuan: "Bungkus",
    status: "Aman",
    rak: "Gudang A - Rak 03",
    supplier: "PT Santos Jaya Abadi",
  },
  {
    id: 9,
    kode: "OPT-009",
    nama: "Teh Botol Sosro 450ml",
    kategori: "Minuman",
    hargaBeli: 4000,
    hargaJual: 5500,
    stok: 40,
    satuan: "Botol",
    status: "Aman",
    rak: "Gudang A - Rak 02",
    supplier: "PT Sinar Sosro",
  },
  {
    id: 10,
    kode: "OPT-010",
    nama: "Sabun Lifebuoy 85g",
    kategori: "Perawatan",
    hargaBeli: 3500,
    hargaJual: 4500,
    stok: 75,
    satuan: "Pcs",
    status: "Aman",
    rak: "Gudang D - Rak 01",
    supplier: "Unilever Indonesia",
  },
];

// Helper: Ambil data dari localStorage atau inisialisasi default
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
  // Jika belum ada data, simpan data default
  saveStoredProducts(defaultProducts);
  return defaultProducts;
}

// Helper: Simpan data ke localStorage
function saveStoredProducts(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Gagal menyimpan ke localStorage:", e);
  }
}

// Helper: Format Rupiah
function formatRupiah(number) {
  return "Rp " + (Number(number) || 0).toLocaleString("id-ID");
}

if (typeof webix === "undefined") {
  console.error("Library Webix belum dimuat!");
} else {
  webix.ready(function () {
    let currentSelectedId = null;
    let formMode = "add";

    const tableContainer = document.getElementById("master-table-container");
    if (!tableContainer) {
      console.error("Kontainer #master-table-container tidak ditemukan!");
      return;
    }

    // ------------------------------------------------------------
    // A. INISIALISASI WEBIX PAGER & MASTER DATATABLE
    // ------------------------------------------------------------
    const productPager = webix.ui({
      view: "pager",
      id: "produk_pager",
      container: "pager-container",
      size: 8,
      group: 5,
      template:
        "{common.first()} {common.prev()} {common.pages()} {common.next()} {common.last()}",
    });

    const tableMaster = webix.ui({
      container: "master-table-container",
      view: "datatable",
      id: "table_produk_master",
      css: "optiware-webix-table",
      autoheight: true,
      scroll: "x",
      select: "row",
      hover: "webix_row_hover",
      rowHeight: 52,
      headerRowHeight: 46,
      pager: "produk_pager",
      columns: [
        {
          id: "no",
          header: "No",
          width: 55,
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
          minWidth: 190,
          sort: "string",
          template: function (obj) {
            return `<strong>${obj.nama}</strong>`;
          },
        },
        {
          id: "kategori",
          header: "Kategori",
          width: 130,
          sort: "string",
          template: function (obj) {
            return `<span class="category-tag">${obj.kategori}</span>`;
          },
        },
        {
          id: "hargaBeli",
          header: "Harga Beli",
          width: 120,
          sort: "int",
          css: { "text-align": "right" },
          template: function (obj) {
            return `<span class="price-muted">${formatRupiah(obj.hargaBeli)}</span>`;
          },
        },
        {
          id: "hargaJual",
          header: "Harga Jual",
          width: 125,
          sort: "int",
          css: { "text-align": "right" },
          template: function (obj) {
            let marginPercent = 0;
            if (obj.hargaBeli > 0) {
              marginPercent = Math.round(
                ((obj.hargaJual - obj.hargaBeli) / obj.hargaBeli) * 100,
              );
            }
            return `
                            <span class="price-text">${formatRupiah(obj.hargaJual)}</span>
                            <span class="margin-tag">+${marginPercent}%</span>
                        `;
          },
        },
        {
          id: "stok",
          header: "Stok",
          width: 90,
          sort: "int",
          css: { "text-align": "center" },
          template: function (obj) {
            let textClass = "";
            if (obj.stok <= 5 || obj.status === "Habis")
              textClass = "text-danger";
            else if (obj.stok <= 15 || obj.status === "Hampir Habis")
              textClass = "text-warn";
            return `<span class="${textClass} font-bold">${obj.stok}</span>`;
          },
        },
        {
          id: "satuan",
          header: "Satuan",
          width: 95,
          sort: "string",
          template: function (obj) {
            return `<span class="text-muted">${obj.satuan || "Pcs"}</span>`;
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
          header: "Aksi",
          width: 65,
          css: { "text-align": "center" },
          template: function () {
            return `<i class="fa-solid fa-ellipsis-vertical action-btn" title="Opsi Tindakan"></i>`;
          },
        },
      ],
      data: getStoredProducts(),
      onClick: {
        "action-btn": function (e, id) {
          currentSelectedId = id.row;
          productActionPopup.show(e.target);
          return false;
        },
      },
    });

    // Responsif window resize
    webix.event(window, "resize", function () {
      if ($$("table_produk_master")) {
        $$("table_produk_master").resize();
      }
    });

    // ------------------------------------------------------------
    // B. POPUP MENU AKSI
    // ------------------------------------------------------------
    const productActionPopup = webix.ui({
      view: "popup",
      id: "product_action_popup",
      width: 200,
      css: "optiware-action-popup",
      body: {
        view: "list",
        id: "master_action_list",
        autoheight: true,
        scroll: false,
        template:
          "<i class='#icon#' style='width:18px; margin-right:8px;'></i> #text#",
        data: [
          {
            id: "detail",
            text: "Rincian Lengkap",
            icon: "fa-solid fa-circle-info",
          },
          {
            id: "edit",
            text: "Edit Data Produk",
            icon: "fa-solid fa-pen-to-square",
          },
          {
            id: "stock",
            text: "Perbarui Stok",
            icon: "fa-solid fa-boxes-stacked",
          },
          {
            id: "delete",
            text: "<span style='color:var(--danger);'>Hapus Produk</span>",
            icon: "fa-solid fa-trash text-danger",
          },
        ],
        on: {
          onItemClick: function (actionId) {
            productActionPopup.hide();
            if (!currentSelectedId) return;
            const item = $$("table_produk_master").getItem(currentSelectedId);

            switch (actionId) {
              case "detail":
                openProductDetail(item);
                break;
              case "edit":
                openProductForm("edit", item);
                break;
              case "stock":
                openQuickStockModal(item);
                break;
              case "delete":
                confirmDelete(item);
                break;
            }
          },
        },
      },
    });

    // ------------------------------------------------------------
    // C. MODAL RINCIAN DETAIL PRODUK
    // ------------------------------------------------------------
    const detailModal = webix.ui({
      view: "window",
      id: "detail_modal",
      width: 480,
      position: "center",
      modal: true,
      head: {
        view: "toolbar",
        cols: [
          {
            view: "label",
            label: "Rincian Lengkap Produk",
            css: "modal-title-bold",
          },
          {
            view: "icon",
            icon: "wxi-close",
            click: function () {
              $$("detail_modal").hide();
            },
          },
        ],
      },
      body: {
        id: "detail_modal_content",
        template: function (obj) {
          if (!obj || !obj.nama) return "";
          let badgeClass = "aman";
          if (obj.status === "Hampir Habis") badgeClass = "hampir-habis";
          else if (obj.status === "Habis") badgeClass = "habis";

          let marginPercent = 0;
          if (obj.hargaBeli > 0) {
            marginPercent = Math.round(
              ((obj.hargaJual - obj.hargaBeli) / obj.hargaBeli) * 100,
            );
          }
          const totalNilaiStok = (obj.stok || 0) * (obj.hargaBeli || 0);

          return `
                        <div class="product-detail-modal-rich">
                            <div class="detail-sku-box">
                                <div>
                                    <h3 class="detail-product-name">${obj.nama}</h3>
                                    <span class="sku-tag" style="margin-top:6px;">${obj.kode}</span>
                                </div>
                                <span class="status-badge ${badgeClass}">${obj.status}</span>
                            </div>

                            <div class="detail-info-grid">
                                <div class="info-box">
                                    <span class="info-label">Kategori</span>
                                    <span class="info-val">${obj.kategori}</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">Sisa Stok</span>
                                    <span class="info-val font-accent">${obj.stok} ${obj.satuan || "Pcs"}</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">Harga Beli (Modal)</span>
                                    <span class="info-val">${formatRupiah(obj.hargaBeli)}</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">Harga Jual</span>
                                    <span class="info-val" style="color:var(--primary);">${formatRupiah(obj.hargaJual)} <small>(+${marginPercent}%)</small></span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">Total Nilai Aset</span>
                                    <span class="info-val">${formatRupiah(totalNilaiStok)}</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">Lokasi Gudang / Rak</span>
                                    <span class="info-val">${obj.rak || "Gudang Utama - Rak 01"}</span>
                                </div>
                            </div>

                            <div class="detail-supplier-row">
                                <i class="fa-solid fa-truck-ramp-box"></i>
                                <span>Pemasok (Supplier): <strong>${obj.supplier || "Distributor Resmi"}</strong></span>
                            </div>
                        </div>
                    `;
        },
      },
    });

    function openProductDetail(item) {
      $$("detail_modal_content").setValues(item);
      $$("detail_modal").show();
    }

    // ------------------------------------------------------------
    // D. MODAL FORM: TAMBAH & EDIT PRODUK
    // ------------------------------------------------------------
    const productFormModal = webix.ui({
      view: "window",
      id: "product_form_modal",
      width: 520,
      position: "center",
      modal: true,
      head: {
        view: "toolbar",
        cols: [
          {
            view: "label",
            label: "Tambah Produk Baru",
            id: "form_modal_title",
          },
          {
            view: "icon",
            icon: "wxi-close",
            click: function () {
              $$("product_form_modal").hide();
            },
          },
        ],
      },
      body: {
        view: "form",
        id: "master_product_form",
        elements: [
          {
            cols: [
              {
                view: "text",
                name: "kode",
                label: "Kode SKU",
                labelPosition: "top",
                placeholder: "Contoh: OPT-011",
                required: true,
              },
              {
                view: "combo",
                name: "kategori",
                label: "Kategori",
                labelPosition: "top",
                options: [
                  "Makanan",
                  "Minuman",
                  "Bahan Pokok",
                  "Perawatan",
                  "Elektronik",
                  "Lainnya",
                ],
                value: "Makanan",
                required: true,
              },
            ],
          },
          {
            view: "text",
            name: "nama",
            label: "Nama Produk",
            labelPosition: "top",
            placeholder: "Contoh: Susu UHT Cokelat 1L",
            required: true,
            invalidMessage: "Nama produk harus diisi",
          },
          {
            cols: [
              {
                view: "text",
                name: "hargaBeli",
                type: "number",
                label: "Harga Beli (Rp)",
                labelPosition: "top",
                placeholder: "15000",
                required: true,
              },
              {
                view: "text",
                name: "hargaJual",
                type: "number",
                label: "Harga Jual (Rp)",
                labelPosition: "top",
                placeholder: "18500",
                required: true,
              },
            ],
          },
          {
            cols: [
              {
                view: "text",
                name: "stok",
                type: "number",
                label: "Stok Masuk",
                labelPosition: "top",
                placeholder: "50",
                required: true,
              },
              {
                view: "combo",
                name: "satuan",
                label: "Satuan Unit",
                labelPosition: "top",
                options: [
                  "Bungkus",
                  "Botol",
                  "Pcs",
                  "Kg",
                  "Pouch",
                  "Karung",
                  "Dus",
                  "Kaleng",
                ],
                value: "Pcs",
                required: true,
              },
            ],
          },
          {
            cols: [
              {
                view: "text",
                name: "rak",
                label: "Lokasi Rak",
                labelPosition: "top",
                placeholder: "Gudang A - Rak 04",
              },
              {
                view: "combo",
                name: "status",
                label: "Status Stok",
                labelPosition: "top",
                options: ["Aman", "Hampir Habis", "Habis"],
                value: "Aman",
              },
            ],
          },
          {
            view: "text",
            name: "supplier",
            label: "Nama Pemasok / Distributor",
            labelPosition: "top",
            placeholder: "PT Mitra Niaga Abadi",
          },
          {
            margin: 12,
            cols: [
              {
                view: "button",
                value: "Batal",
                css: "webix_secondary",
                click: function () {
                  $$("product_form_modal").hide();
                },
              },
              {
                view: "button",
                value: "Simpan Data",
                css: "webix_primary optiware-btn-primary",
                click: saveMasterProductForm,
              },
            ],
          },
        ],
      },
    });

    function openProductForm(mode, item) {
      formMode = mode;
      const form = $$("master_product_form");
      form.clearValidation();

      if (mode === "add") {
        const totalCount = $$("table_produk_master").count();
        const nextSku = "OPT-" + String(totalCount + 1).padStart(3, "0");

        $$("form_modal_title").setValue("Tambah Produk Baru");
        form.setValues({
          kode: nextSku,
          nama: "",
          kategori: "Makanan",
          hargaBeli: 5000,
          hargaJual: 6500,
          stok: 25,
          satuan: "Pcs",
          rak: "Gudang A - Rak 01",
          status: "Aman",
          supplier: "PT Mitra Sejahtera",
        });
      } else {
        $$("form_modal_title").setValue("Edit Data: " + item.nama);
        form.setValues({
          kode: item.kode || "",
          nama: item.nama || "",
          kategori: item.kategori || "Makanan",
          hargaBeli: item.hargaBeli || 0,
          hargaJual: item.hargaJual || 0,
          stok: item.stok || 0,
          satuan: item.satuan || "Pcs",
          rak: item.rak || "",
          status: item.status || "Aman",
          supplier: item.supplier || "",
        });
      }
      $$("product_form_modal").show();
    }

    function saveMasterProductForm() {
      const form = $$("master_product_form");
      if (!form.validate()) {
        webix.message({
          type: "error",
          text: "Mohon lengkapi semua kolom dengan benar",
        });
        return;
      }

      const values = form.getValues();
      const stokNum = parseInt(values.stok, 10) || 0;
      const hargaBeliNum = parseInt(values.hargaBeli, 10) || 0;
      const hargaJualNum = parseInt(values.hargaJual, 10) || 0;

      // Hitung status otomatis bila belum ditentukan
      let status = values.status;
      if (!status) {
        if (stokNum <= 0) status = "Habis";
        else if (stokNum <= 15) status = "Hampir Habis";
        else status = "Aman";
      }

      if (formMode === "add") {
        const newId = new Date().getTime();
        const newProduct = {
          id: newId,
          kode: values.kode,
          nama: values.nama,
          kategori: values.kategori,
          hargaBeli: hargaBeliNum,
          hargaJual: hargaJualNum,
          stok: stokNum,
          satuan: values.satuan,
          rak: values.rak || "Gudang A - Rak 01",
          status: status,
          supplier: values.supplier || "Distributor Umum",
        };

        $$("table_produk_master").add(newProduct, 0); // Tambah di urutan atas
        webix.message({
          type: "success",
          text: `Produk "${values.nama}" berhasil ditambahkan!`,
        });
      } else {
        const currentItem = $$("table_produk_master").getItem(
          currentSelectedId,
        );
        currentItem.kode = values.kode;
        currentItem.nama = values.nama;
        currentItem.kategori = values.kategori;
        currentItem.hargaBeli = hargaBeliNum;
        currentItem.hargaJual = hargaJualNum;
        currentItem.stok = stokNum;
        currentItem.satuan = values.satuan;
        currentItem.rak = values.rak;
        currentItem.status = status;
        currentItem.supplier = values.supplier;

        $$("table_produk_master").updateItem(currentSelectedId, currentItem);
        webix.message({
          type: "success",
          text: `Data "${values.nama}" berhasil diperbarui!`,
        });
      }

      $$("product_form_modal").hide();
      syncDatabaseAndStats();
    }

    // ------------------------------------------------------------
    // E. MODAL UPDATE STOK CEPAT
    // ------------------------------------------------------------
    const quickStockModal = webix.ui({
      view: "window",
      id: "quick_stock_modal",
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
            click: function () {
              $$("quick_stock_modal").hide();
            },
          },
        ],
      },
      body: {
        view: "form",
        id: "quick_stock_form",
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
            name: "stok",
            type: "number",
            label: "Jumlah Stok Baru",
            labelPosition: "top",
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
                  $$("quick_stock_modal").hide();
                },
              },
              {
                view: "button",
                value: "Perbarui",
                css: "webix_primary optiware-btn-primary",
                click: saveQuickStock,
              },
            ],
          },
        ],
      },
    });

    function openQuickStockModal(item) {
      $$("quick_stock_form").setValues({
        nama: item.nama,
        stok: item.stok,
      });
      $$("quick_stock_modal").show();
    }

    function saveQuickStock() {
      const values = $$("quick_stock_form").getValues();
      const newStok = parseInt(values.stok, 10);
      if (isNaN(newStok) || newStok < 0) {
        webix.message({
          type: "error",
          text: "Jumlah stok harus berupa angka valid (>= 0)",
        });
        return;
      }

      const item = $$("table_produk_master").getItem(currentSelectedId);
      item.stok = newStok;
      if (newStok === 0) item.status = "Habis";
      else if (newStok <= 15) item.status = "Hampir Habis";
      else item.status = "Aman";

      $$("table_produk_master").updateItem(currentSelectedId, item);
      $$("quick_stock_modal").hide();
      syncDatabaseAndStats();
      webix.message({
        type: "success",
        text: `Stok "${item.nama}" diupdate menjadi ${newStok} unit`,
      });
    }

    // ------------------------------------------------------------
    // F. KONFIRMASI HAPUS PRODUK
    // ------------------------------------------------------------
    function confirmDelete(item) {
      webix.confirm({
        title: "Konfirmasi Hapus",
        text: `Apakah Anda yakin ingin menghapus produk <strong>${item.nama}</strong>?`,
        ok: "Ya, Hapus",
        cancel: "Batal",
        type: "confirm-warning",
        callback: function (result) {
          if (result) {
            $$("table_produk_master").remove(item.id);
            syncDatabaseAndStats();
            webix.message({
              type: "info",
              text: `Produk "${item.nama}" telah dihapus`,
            });
          }
        },
      });
    }

    // ------------------------------------------------------------
    // G. SINKRONISASI DATABASE & KARTU STATISTIK
    // ------------------------------------------------------------
    function syncDatabaseAndStats() {
      const table = $$("table_produk_master");
      if (!table) return;

      // Simpan state terkini ke localStorage
      const allItems = [];
      table.data.each(function (obj) {
        allItems.push(obj);
      });
      saveStoredProducts(allItems);

      // Hitung statistik
      let totalJenis = table.count();
      let amanCount = 0;
      let hampirCount = 0;
      let habisCount = 0;

      allItems.forEach((item) => {
        if (item.status === "Habis" || item.stok <= 0) habisCount++;
        else if (item.status === "Hampir Habis" || item.stok <= 15)
          hampirCount++;
        else amanCount++;
      });

      // Update DOM Statistik
      const elTotalJenis = document.getElementById("stat-total-jenis");
      if (elTotalJenis) elTotalJenis.textContent = totalJenis;

      const elStokAman = document.getElementById("stat-stok-aman");
      if (elStokAman) elStokAman.textContent = amanCount;

      const elStokHampir = document.getElementById("stat-stok-hampir");
      if (elStokHampir) elStokHampir.textContent = hampirCount;

      const elStokHabis = document.getElementById("stat-stok-habis");
      if (elStokHabis) elStokHabis.textContent = habisCount;

      const elCountInfo = document.getElementById("product-count-info");
      if (elCountInfo) {
        elCountInfo.textContent = `Menampilkan ${totalJenis} produk`;
      }
    }

    // Jalankan sinkronisasi awal
    syncDatabaseAndStats();

    // ------------------------------------------------------------
    // H. FILTER & SEARCH HANDLERS
    // ------------------------------------------------------------
    const searchInput = document.getElementById("topbar-search-produk");
    const filterKategori = document.getElementById("filter-kategori");
    const filterStatus = document.getElementById("filter-status");

    function applyCombinedFilter() {
      const searchVal = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";
      const katVal = filterKategori ? filterKategori.value : "";
      const statusVal = filterStatus ? filterStatus.value : "";

      $$("table_produk_master").filter(function (obj) {
        // Match search
        const matchSearch =
          !searchVal ||
          (obj.nama && obj.nama.toLowerCase().includes(searchVal)) ||
          (obj.kode && obj.kode.toLowerCase().includes(searchVal)) ||
          (obj.kategori && obj.kategori.toLowerCase().includes(searchVal)) ||
          (obj.rak && obj.rak.toLowerCase().includes(searchVal));

        // Match kategori
        const matchKat = !katVal || obj.kategori === katVal;

        // Match status
        const matchStatus = !statusVal || obj.status === statusVal;

        return matchSearch && matchKat && matchStatus;
      });

      const filteredCount = $$("table_produk_master").count();
      const elCountInfo = document.getElementById("product-count-info");
      if (elCountInfo) {
        elCountInfo.textContent = `Menampilkan ${filteredCount} produk`;
      }
    }

    if (searchInput) searchInput.addEventListener("input", applyCombinedFilter);
    if (filterKategori)
      filterKategori.addEventListener("change", applyCombinedFilter);
    if (filterStatus)
      filterStatus.addEventListener("change", applyCombinedFilter);

    // Reset Filter
    const btnResetFilter = document.getElementById("btn-reset-product-filter");
    if (btnResetFilter) {
      btnResetFilter.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        if (filterKategori) filterKategori.value = "";
        if (filterStatus) filterStatus.value = "";
        $$("table_produk_master").filter();
        syncDatabaseAndStats();
        webix.message({ type: "info", text: "Filter produk telah direset" });
      });
    }

    // Tombol Tambah Produk di Page Header
    const btnTambahPage = document.getElementById("btn-tambah-produk-page");
    if (btnTambahPage) {
      btnTambahPage.addEventListener("click", function () {
        openProductForm("add");
      });
    }

    // Tombol Export Excel
    const btnExportExcel = document.getElementById("btn-export-excel");
    if (btnExportExcel) {
      btnExportExcel.addEventListener("click", function () {
        optiwareExportCSV(
          "table_produk_master",
          [
            { header: "Kode SKU", nilai: (o) => o.kode },
            { header: "Nama Produk", nilai: (o) => o.nama },
            { header: "Kategori", nilai: (o) => o.kategori },
            { header: "Harga Beli", nilai: (o) => o.hargaBeli },
            { header: "Harga Jual", nilai: (o) => o.hargaJual },
            { header: "Stok", nilai: (o) => o.stok },
            { header: "Satuan", nilai: (o) => o.satuan },
            { header: "Status", nilai: (o) => o.status },
            { header: "Lokasi Rak", nilai: (o) => o.rak },
            { header: "Supplier", nilai: (o) => o.supplier },
          ],
          "OptiWare_Katalog_Produk",
        );
      });
    }

    // ------------------------------------------------------------
    // I. POPUP PROFIL (Konsisten dengan index.html)
    // ------------------------------------------------------------
    const profilePopup = webix.ui({
      view: "popup",
      id: "profile_popup_page",
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
            } else {
              webix.message("Menu: " + menuId);
            }
          },
        },
      },
    });

    const profileBtn = document.getElementById("topbar-profile-btn");
    if (profileBtn) {
      profileBtn.addEventListener("click", function () {
        profilePopup.show(this);
      });
    }

    // Sidebar Logout
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