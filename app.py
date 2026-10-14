import json
import os
import re
import time
from html import escape
from datetime import datetime
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, request, jsonify, session, send_from_directory, redirect, make_response
from flask_cors import CORS
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

FOLDER = os.path.dirname(os.path.abspath(__file__))

if hasattr(time, "tzset"):
    os.environ["TZ"] = "Asia/Jakarta"
    time.tzset()

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get("SECRET_KEY")
CONTOH_SECRET = ["isi-string-acak-panjang", "isi-dengan-teks-acak-yang-panjang", "rahasia-sementara"]
if not app.secret_key or app.secret_key in CONTOH_SECRET:
    raise RuntimeError("SECRET_KEY belum diatur (isi di .env atau Environment Variables Vercel).")

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = os.environ.get("COOKIE_SAMESITE", "Lax")
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("COOKIE_SECURE", "false") == "true"

alamat_frontend = os.environ.get("FRONTEND_URL", "http://localhost:3000").split(",")
CORS(app, supports_credentials=True, origins=alamat_frontend)

alamat_mongo = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(alamat_mongo, serverSelectionTimeoutMS=5000)
db = client[os.environ.get("DB_NAME", "db_ritel")]
tabel_user = db["users"]
tabel_barang = db["barang"]
tabel_riwayat = db["riwayat"]
tabel_transaksi = db["transaksi"]
tabel_pengaturan = db["pengaturan"]


MIN_PASSWORD = 8


def ke_angka(nilai):
    try:
        return float(nilai)
    except (TypeError, ValueError):
        return None


def ke_bulat(nilai):
    try:
        return int(nilai)
    except (TypeError, ValueError):
        return None


def user_sesi():
    """Akun dari sesi yang sedang login. None kalau belum login, akun sudah dihapus, atau dinonaktifkan."""
    if "user_id" not in session:
        return None
    try:
        user = tabel_user.find_one({"_id": ObjectId(session["user_id"])})
    except (InvalidId, TypeError):
        user = None
    if user is None or user.get("status") == "Nonaktif":
        session.clear()
        return None
    session["role"] = user.get("role", "Administrator")
    return user


def login_required(fungsi):
    @wraps(fungsi)
    def pembungkus(*args, **kwargs):
        if user_sesi() is None:
            if request.path.startswith("/api/"):
                return jsonify({"pesan": "Silakan login dulu", "message": "Silakan login dulu"}), 401
            return redirect("/")
        return fungsi(*args, **kwargs)
    return pembungkus


def admin_required(fungsi):
    @wraps(fungsi)
    @login_required
    def pembungkus(*args, **kwargs):
        if session.get("role") != "Administrator":
            return jsonify({"pesan": "Hanya Administrator yang boleh mengelola pengguna"}), 403
        return fungsi(*args, **kwargs)
    return pembungkus


@app.route("/")
def halaman_login():
    if user_sesi() is not None:
        return redirect("/dashboard")
    with open(os.path.join(FOLDER, "login.html"), encoding="utf-8") as f:
        teks = f.read()
    # Pendaftaran hanya untuk akun admin pertama. Kalau sudah ada akun, tombol Daftar
    # diganti penjelasan supaya tidak jadi tautan yang memantul balik ke halaman ini.
    if tabel_user.find_one({}) is not None:
        teks = re.sub(r'<div class="switch">.*?</div>',
                      '<div class="switch">Akun staf dibuat oleh administrator di menu Pengaturan.</div>',
                      teks, count=1, flags=re.S)
    jawaban = make_response(teks)
    jawaban.headers["Content-Type"] = "text/html; charset=utf-8"
    jawaban.headers["Cache-Control"] = "no-store"
    return jawaban


@app.route("/register")
@app.route("/register.html")
def halaman_register():
    if user_sesi() is not None:
        return redirect("/dashboard")
    if tabel_user.find_one({}) is not None:
        return redirect("/")
    jawaban = make_response(send_from_directory(FOLDER, "register.html"))
    jawaban.headers["Cache-Control"] = "no-store"
    return jawaban


@app.route("/dashboard")
def halaman_dashboard():
    if user_sesi() is None:
        return redirect("/")
    return sajikan_halaman("index.html")


@app.route("/assets/<path:nama_file>")
def aset_frontend(nama_file):
    return send_from_directory(os.path.join(FOLDER, "assets"), nama_file)


HALAMAN_APP = {
    "produk.html", "transaksi.html", "stok-gudang.html",
    "laporan.html", "pengaturan.html",
}

# Halaman yang boleh dibuka tiap peran (dashboard / index.html boleh untuk semua).
# None = semua halaman.
AKSES_HALAMAN = {
    "Administrator": None,
    "Kasir": {"transaksi.html"},
    "Staf Gudang": {"produk.html", "stok-gudang.html"},
}


def halaman_boleh(role):
    boleh = AKSES_HALAMAN.get(role, set())
    if boleh is None:
        return sorted({"index.html"} | HALAMAN_APP)
    return sorted({"index.html"} | boleh)


def sajikan_halaman(nama_file):
    """Kirim halaman yang sudah disesuaikan dengan peran: menu terlarang dibuang dan profil diisi
    nama/peran asli SEBELUM sampai ke browser, jadi tidak ada menu admin yang sempat berkedip."""
    user = user_sesi()
    role = session["role"]
    boleh = halaman_boleh(role)
    terlarang = sorted(({"index.html"} | HALAMAN_APP) - set(boleh))
    nama = escape(user.get("nama") or user["username"])

    with open(os.path.join(FOLDER, nama_file), encoding="utf-8") as f:
        teks = f.read()

    for h in terlarang:
        teks = re.sub(r'[ \t]*<a href="%s" class="nav-item[^"]*">.*?</a>[ \t]*\r?\n?' % re.escape(h),
                      "", teks, flags=re.S)

    def isi(nilai):
        return lambda m: m.group(1) + nilai + m.group(2)
    teks = re.sub(r'(<span class="user-name">).*?(</span>)', isi(nama), teks, flags=re.S)
    teks = re.sub(r'(<span class="user-role">).*?(</span>)', isi(escape(role)), teks, flags=re.S)
    teks = re.sub(r'(<div class="avatar">).*?(</div>)', isi(escape((user.get("nama") or user["username"])[:1].upper() or "A")), teks, flags=re.S)

    aturan = ['.main-content a[href="%s"]{display:none!important}' % h for h in terlarang]
    if "produk.html" in terlarang:
        aturan.append("#btn-tambah-produk{display:none!important}")
    me = json.dumps({"username": user["username"], "nama": user.get("nama") or user["username"],
                     "role": role, "halaman": boleh}).replace("<", "\\u003c")
    suntik = ("<style>" + "".join(aturan) + "</style>"
              '<script>try{sessionStorage.setItem("optiware_me",' + json.dumps(me) + ')}catch(e){}</script>')
    teks = teks.replace("<head>", "<head>" + suntik, 1)

    jawaban = make_response(teks)
    jawaban.headers["Content-Type"] = "text/html; charset=utf-8"
    jawaban.headers["Cache-Control"] = "no-store"
    return jawaban


@app.route("/<path:nama_file>")
def halaman_frontend(nama_file):
    if nama_file == "index.html":
        return redirect("/dashboard")
    if nama_file == "login.html":
        return redirect("/")
    if nama_file not in HALAMAN_APP:
        return jsonify({"pesan": "Halaman tidak ditemukan"}), 404
    if user_sesi() is None:
        return redirect("/")
    if nama_file not in halaman_boleh(session.get("role")):
        return redirect("/dashboard")
    return sajikan_halaman(nama_file)


@app.route("/api/setup-status")
def status_setup():
    return jsonify({"needsSetup": tabel_user.find_one({}) is None})


@app.errorhandler(PyMongoError)
def database_error(error):
    return jsonify({
        "pesan": "Database tidak bisa dihubungi. Cek MONGO_URI dan Network Access di Atlas.",
        "message": "Database tidak bisa dihubungi. Cek MONGO_URI dan Network Access di Atlas.",
    }), 500


@app.route("/api/register", methods=["POST"])
def register():
    if tabel_user.find_one({}) is not None:
        return jsonify({"pesan": "Pendaftaran ditutup, akun admin sudah ada"}), 403

    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if username == "" or password == "":
        return jsonify({"pesan": "Username dan password wajib diisi"}), 400
    if len(password) < MIN_PASSWORD:
        return jsonify({"pesan": "Password minimal %d karakter" % MIN_PASSWORD}), 400

    if tabel_user.find_one({"username": username}):
        return jsonify({"pesan": "Username sudah dipakai"}), 400

    password_hash = generate_password_hash(password)

    tabel_user.insert_one({
        "username": username,
        "password": password_hash,
        "role": "Administrator",
        "dibuat": datetime.now(),
    })

    return jsonify({"pesan": "Register berhasil"}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = tabel_user.find_one({"username": username})

    if user is None or not check_password_hash(user["password"], password):
        return jsonify({"pesan": "Username atau password salah"}), 401
    if user.get("status") == "Nonaktif":
        return jsonify({"pesan": "Akun ini dinonaktifkan. Hubungi administrator."}), 403

    tabel_user.update_one({"_id": user["_id"]}, {"$set": {"login_terakhir": datetime.now()}})

    session.clear()
    session["user_id"] = str(user["_id"])
    session["username"] = user["username"]
    session["role"] = user.get("role", "Administrator")

    return jsonify({"pesan": "Login berhasil", "username": user["username"]})


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"pesan": "Logout berhasil"})


BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"]


def format_waktu(w):
    return "%02d %s %d %02d:%02d" % (w.day, BULAN[w.month - 1], w.year, w.hour, w.minute)


def ke_teks(nilai, bawaan=""):
    if nilai is None:
        return bawaan
    teks = str(nilai).strip()
    return teks if teks != "" else bawaan


def beri_nomor(tabel):
    belum = list(tabel.find({"nomor": {"$exists": False}}).sort("dibuat", 1))
    if not belum:
        return
    terakhir = tabel.find_one({"nomor": {"$exists": True}}, sort=[("nomor", -1)])
    nomor = terakhir["nomor"] if terakhir else 0
    for d in belum:
        nomor += 1
        tabel.update_one({"_id": d["_id"]}, {"$set": {"nomor": nomor}})


def status_stok(stok):
    if stok <= 0:
        return "Habis"
    if stok <= 15:
        return "Hampir Habis"
    return "Aman"


def barang_ke_halaman(b):
    stok = b.get("stok", 0)
    return {
        "id": b["nomor"],
        "kode": b.get("sku", ""),
        "nama": b.get("nama", ""),
        "kategori": b.get("kategori", "Umum"),
        "hargaBeli": b.get("harga_beli", 0),
        "hargaJual": b.get("harga", 0),
        "stok": stok,
        "satuan": b.get("satuan", "Pcs"),
        "status": status_stok(stok),
        "rak": b.get("rak", ""),
        "supplier": b.get("supplier", ""),
        "kapasitas": b.get("kapasitas", 150),
    }


def simpan_barang(item):
    nomor = ke_bulat(item.get("id"))
    nama = ke_teks(item.get("nama"))
    if nomor is None or nama == "":
        return
    isi = {
        "sku": ke_teks(item.get("kode")),
        "nama": nama,
        "kategori": ke_teks(item.get("kategori"), "Umum"),
        "stok": max(ke_bulat(item.get("stok")) or 0, 0),
        "harga": max(ke_angka(item.get("hargaJual")) or 0, 0),
        "harga_beli": max(ke_angka(item.get("hargaBeli")) or 0, 0),
        "satuan": ke_teks(item.get("satuan"), "Pcs"),
        "rak": ke_teks(item.get("rak")),
        "supplier": ke_teks(item.get("supplier")),
        "kapasitas": ke_bulat(item.get("kapasitas")) or 150,
    }
    hasil = tabel_barang.update_one({"nomor": nomor}, {"$set": isi})
    if hasil.matched_count == 0:
        isi["nomor"] = nomor
        isi["dibuat"] = datetime.now()
        isi["dibuat_oleh"] = session["username"]
        tabel_barang.insert_one(isi)


def transaksi_ke_halaman(t):
    dibuat = t.get("dibuat", datetime.now())
    total = t.get("total", 0)
    items = t.get("items")
    if items is None:
        items = [{"nama": t.get("nama_barang", ""), "qty": t.get("jumlah", 0),
                  "harga": t.get("harga_satuan", 0), "subtotal": total}]
    return {
        "id": t["nomor"],
        "invoice": t.get("invoice") or "TRX-%d-%04d" % (dibuat.year, t["nomor"] % 10000),
        "waktu": t.get("waktu") or format_waktu(dibuat),
        "pelanggan": t.get("pelanggan", "Pelanggan Umum"),
        "kasir": t.get("kasir") or t.get("oleh", ""),
        "metode": t.get("metode", "Tunai"),
        "status": t.get("status", "Selesai"),
        "items": items,
        "subtotal": t.get("subtotal", total),
        "diskon": t.get("diskon", 0),
        "total": total,
        "bayar": t.get("bayar", total),
        "kembali": t.get("kembali", 0),
    }


def simpan_transaksi(item):
    nomor = ke_bulat(item.get("id"))
    if nomor is None:
        return
    items = []
    for i in item.get("items") or []:
        if isinstance(i, dict):
            items.append({
                "nama": ke_teks(i.get("nama")),
                "qty": ke_bulat(i.get("qty")) or 0,
                "harga": ke_angka(i.get("harga")) or 0,
                "subtotal": ke_angka(i.get("subtotal")) or 0,
            })
    nama_barang = ""
    if items:
        nama_barang = items[0]["nama"]
        if len(items) > 1:
            nama_barang += " +%d lainnya" % (len(items) - 1)
    isi = {
        "invoice": ke_teks(item.get("invoice")),
        "waktu": ke_teks(item.get("waktu")),
        "pelanggan": ke_teks(item.get("pelanggan"), "Pelanggan Umum"),
        "metode": ke_teks(item.get("metode"), "Tunai"),
        "status": ke_teks(item.get("status"), "Selesai"),
        "items": items,
        "subtotal": ke_angka(item.get("subtotal")) or 0,
        "diskon": ke_angka(item.get("diskon")) or 0,
        "total": ke_angka(item.get("total")) or 0,
        "bayar": ke_angka(item.get("bayar")) or 0,
        "kembali": ke_angka(item.get("kembali")) or 0,
        "nama_barang": nama_barang,
        "jumlah": sum(i["qty"] for i in items),
        "harga_satuan": items[0]["harga"] if items else 0,
    }
    hasil = tabel_transaksi.update_one({"nomor": nomor}, {"$set": isi})
    if hasil.matched_count == 0:
        isi["nomor"] = nomor
        isi["kasir"] = session["username"]
        isi["oleh"] = session["username"]
        isi["barang_id"] = ""
        isi["sku"] = ""
        isi["dibuat"] = datetime.now()
        tabel_transaksi.insert_one(isi)


JENIS_LOG = {"inbound": "masuk", "outbound": "keluar", "transfer": "transfer", "opname": "opname"}
LABEL_LOG = {"masuk": "Stok Masuk", "keluar": "Stok Keluar", "tambah": "Barang Baru", "hapus": "Barang Dihapus"}


def log_ke_halaman(r):
    dibuat = r.get("dibuat", datetime.now())
    if "tipe" in r:
        tipe = r["tipe"]
        label = r.get("label", "")
        qty = r.get("qty", 0)
        alur = r.get("alur", "")
        ref = r.get("ref", "")
    else:
        jenis = r.get("jenis", "")
        jumlah = r.get("jumlah", 0)
        keluar = jenis in ("keluar", "hapus")
        tipe = "outbound" if keluar else "inbound"
        label = LABEL_LOG.get(jenis, "Mutasi")
        qty = -jumlah if keluar else jumlah
        alur = r.get("catatan") or label
        ref = "-"
    return {
        "id": r["nomor"],
        "waktu": r.get("waktu") or format_waktu(dibuat),
        "tipe": tipe,
        "label": label,
        "nama": r.get("nama_barang", ""),
        "qty": qty,
        "alur": alur,
        "ref": ref,
    }


def simpan_log(item):
    nomor = ke_bulat(item.get("id"))
    if nomor is None:
        return
    tipe = ke_teks(item.get("tipe"), "inbound")
    qty = ke_bulat(item.get("qty")) or 0
    alur = ke_teks(item.get("alur"))
    isi = {
        "nama_barang": ke_teks(item.get("nama")),
        "jenis": JENIS_LOG.get(tipe, tipe),
        "jumlah": abs(qty),
        "qty": qty,
        "tipe": tipe,
        "label": ke_teks(item.get("label")),
        "alur": alur,
        "ref": ke_teks(item.get("ref")),
        "waktu": ke_teks(item.get("waktu")),
        "catatan": alur,
    }
    hasil = tabel_riwayat.update_one({"nomor": nomor}, {"$set": isi})
    if hasil.matched_count == 0:
        barang = tabel_barang.find_one({"nama": isi["nama_barang"]})
        isi["nomor"] = nomor
        isi["barang_id"] = str(barang["_id"]) if barang else ""
        isi["oleh"] = session.get("username")
        isi["dibuat"] = datetime.now()
        tabel_riwayat.insert_one(isi)


ROLE_VALID = ("Administrator", "Kasir", "Staf Gudang")
STATUS_VALID = ("Aktif", "Nonaktif")
POLA_USERNAME = re.compile(r"^[A-Za-z0-9_.-]{3,30}$")


def staf_ke_halaman(u):
    login = u.get("login_terakhir")
    return {
        "id": u["nomor"],
        "nama": u.get("nama") or u["username"],
        "username": u["username"],
        "role": u.get("role", "Administrator"),
        "status": u.get("status", "Aktif"),
        "login": format_waktu(login) if login else "Belum pernah",
    }


def nomor_user_berikut():
    beri_nomor(tabel_user)
    terakhir = tabel_user.find_one({"nomor": {"$exists": True}}, sort=[("nomor", -1)])
    return (terakhir["nomor"] if terakhir else 0) + 1


def username_dipakai(username, kecuali_id=None):
    cari = {"username": {"$regex": "^" + re.escape(username) + "$", "$options": "i"}}
    if kecuali_id is not None:
        cari["_id"] = {"$ne": kecuali_id}
    return tabel_user.find_one(cari) is not None


def cek_isian_staf(nama, username, role, status):
    if nama == "":
        return "Nama lengkap wajib diisi"
    if not POLA_USERNAME.match(username):
        return "Username 3-30 karakter, hanya huruf, angka, titik, garis bawah, atau strip"
    if role not in ROLE_VALID:
        return "Peran tidak valid"
    if status not in STATUS_VALID:
        return "Status tidak valid"
    return None


def jumlah_admin_aktif_lain(id_user):
    return tabel_user.count_documents({
        "_id": {"$ne": id_user},
        "$or": [{"role": "Administrator"}, {"role": {"$exists": False}}],
        "status": {"$ne": "Nonaktif"},
    })


def adalah_admin_aktif(u):
    return u.get("role", "Administrator") == "Administrator" and u.get("status", "Aktif") != "Nonaktif"


TABEL_SYNC = {
    "products": (tabel_barang, simpan_barang),
    "transactions": (tabel_transaksi, simpan_transaksi),
    "logs": (tabel_riwayat, simpan_log),
}


@app.route("/api/sync", methods=["GET"])
@login_required
def ambil_sinkronisasi():
    for tabel in (tabel_barang, tabel_transaksi, tabel_riwayat, tabel_user):
        beri_nomor(tabel)

    pengaturan = tabel_pengaturan.find_one({"kunci": "toko"})
    return jsonify({
        "products": [barang_ke_halaman(b) for b in tabel_barang.find().sort("nomor", 1)],
        "transactions": [transaksi_ke_halaman(t) for t in tabel_transaksi.find().sort("dibuat", -1).limit(500)],
        "logs": [log_ke_halaman(r) for r in tabel_riwayat.find().sort("dibuat", -1).limit(300)],
        "staf": [staf_ke_halaman(s) for s in tabel_user.find().sort("nomor", 1)] if session.get("role") == "Administrator" else [],
        "settings": pengaturan["nilai"] if pengaturan else {},
    })


# Peran yang boleh menyimpan tiap jenis data. Kasir menulis transaksi dan mengurangi stok,
# Staf Gudang menulis produk dan mutasi stok. Staf diurus lewat /api/staf, bukan di sini.
IZIN_TULIS = {
    "products": {"Administrator", "Staf Gudang", "Kasir"},
    "transactions": {"Administrator", "Kasir"},
    "logs": {"Administrator", "Staf Gudang", "Kasir"},
    "settings": {"Administrator"},
}
# Peran yang boleh menghapus baris (reset selalu khusus Administrator)
IZIN_HAPUS = {
    "products": {"Administrator", "Staf Gudang"},
    "transactions": {"Administrator"},
    "logs": {"Administrator"},
}


def simpan_stok_saja(item):
    # Kasir hanya boleh mengubah stok produk yang sudah ada (akibat penjualan),
    # bukan menambah produk atau mengubah harga.
    nomor = ke_bulat(item.get("id"))
    stok = ke_bulat(item.get("stok"))
    if nomor is None or stok is None:
        return
    tabel_barang.update_one({"nomor": nomor}, {"$set": {"stok": max(stok, 0)}})


# Perubahan status yang boleh dilakukan Kasir pada transaksi yang sudah ada
# (Tandai Lunas = Pending -> Selesai, Batalkan = Pending/Selesai -> Batal)
STATUS_TRANSISI_KASIR = {("Pending", "Selesai"), ("Pending", "Batal"), ("Selesai", "Batal")}


def simpan_transaksi_kasir(item):
    # Transaksi baru dari kasir POS boleh dibuat. Transaksi yang sudah ada hanya boleh
    # berubah statusnya; total, isi belanja, dan pelanggan tidak bisa ditimpa.
    nomor = ke_bulat(item.get("id"))
    if nomor is None:
        return
    lama = tabel_transaksi.find_one({"nomor": nomor})
    if lama is None:
        simpan_transaksi(item)
        return
    status_lama = lama.get("status", "Selesai")
    status_baru = ke_teks(item.get("status"), status_lama)
    if (status_lama, status_baru) not in STATUS_TRANSISI_KASIR:
        return
    isi = {"status": status_baru}
    if status_baru == "Selesai":
        # lunas: nominal bayar dihitung server dari total, bukan dari browser
        isi["bayar"] = lama.get("total", 0)
        isi["kembali"] = 0
    tabel_transaksi.update_one({"_id": lama["_id"]}, {"$set": isi})


def simpan_log_kasir(item):
    # Riwayat mutasi dari kasir hanya boleh ditambah, tidak boleh menimpa yang sudah ada.
    nomor = ke_bulat(item.get("id"))
    if nomor is None:
        return
    if tabel_riwayat.find_one({"nomor": nomor}) is not None:
        return
    simpan_log(item)


@app.route("/api/sync/<nama>", methods=["POST"])
@login_required
def simpan_sinkronisasi(nama):
    data = request.get_json(silent=True) or {}
    role = session.get("role")

    if nama in IZIN_TULIS and role not in IZIN_TULIS[nama]:
        return jsonify({"pesan": "Peran Anda tidak boleh mengubah data ini"}), 403

    if nama == "settings":
        if data.get("reset"):
            tabel_pengaturan.delete_many({})
        elif isinstance(data.get("nilai"), dict):
            tabel_pengaturan.update_one({"kunci": "toko"}, {"$set": {"nilai": data["nilai"]}}, upsert=True)
        else:
            return jsonify({"pesan": "Data pengaturan tidak valid"}), 400

    elif nama == "staf":
        # diabaikan: akun dikelola lewat /api/staf (khusus Administrator)
        pass

    elif nama in TABEL_SYNC:
        tabel, simpan = TABEL_SYNC[nama]
        nomor_hapus = [ke_bulat(x) for x in (data.get("hapus") or [])[:1000]]
        nomor_hapus = [x for x in nomor_hapus if x is not None]

        if data.get("reset") and role != "Administrator":
            return jsonify({"pesan": "Hanya Administrator yang boleh mereset data"}), 403
        if nomor_hapus and role not in IZIN_HAPUS[nama]:
            return jsonify({"pesan": "Peran Anda tidak boleh menghapus data ini"}), 403

        if data.get("reset"):
            tabel.delete_many({})
        else:
            for item in (data.get("upsert") or [])[:1000]:
                if isinstance(item, dict):
                    if role == "Kasir" and nama == "products":
                        simpan_stok_saja(item)
                    elif role == "Kasir" and nama == "transactions":
                        simpan_transaksi_kasir(item)
                    elif role == "Kasir" and nama == "logs":
                        simpan_log_kasir(item)
                    else:
                        simpan(item)
            if nomor_hapus:
                tabel.delete_many({"nomor": {"$in": nomor_hapus}})

    else:
        return jsonify({"pesan": "Jenis data tidak dikenal"}), 404

    return jsonify({"pesan": "Tersimpan"})


@app.route("/api/saya")
@login_required
def siapa_saya():
    user = user_sesi()
    return jsonify({
        "username": user["username"],
        "nama": user.get("nama") or user["username"],
        "role": session["role"],
        "halaman": halaman_boleh(session["role"]),
    })


@app.route("/api/staf", methods=["POST"])
@admin_required
def tambah_staf():
    data = request.get_json(silent=True) or {}
    nama = ke_teks(data.get("nama"))
    username = ke_teks(data.get("username")).lstrip("@")
    role = ke_teks(data.get("role"), "Kasir")
    status = ke_teks(data.get("status"), "Aktif")
    password = data.get("password") or ""

    pesan = cek_isian_staf(nama, username, role, status)
    if pesan:
        return jsonify({"pesan": pesan}), 400
    if len(password) < MIN_PASSWORD:
        return jsonify({"pesan": "Password minimal %d karakter" % MIN_PASSWORD}), 400
    if username_dipakai(username):
        return jsonify({"pesan": "Username sudah dipakai"}), 400

    dokumen = {
        "nomor": nomor_user_berikut(),
        "nama": nama,
        "username": username,
        "password": generate_password_hash(password),
        "role": role,
        "status": status,
        "dibuat": datetime.now(),
        "dibuat_oleh": session.get("username"),
    }
    tabel_user.insert_one(dokumen)
    return jsonify(staf_ke_halaman(dokumen)), 201


@app.route("/api/staf/<int:nomor>", methods=["PUT"])
@admin_required
def ubah_staf(nomor):
    beri_nomor(tabel_user)
    target = tabel_user.find_one({"nomor": nomor})
    if target is None:
        return jsonify({"pesan": "Pengguna tidak ditemukan"}), 404

    data = request.get_json(silent=True) or {}
    nama = ke_teks(data.get("nama"))
    username = ke_teks(data.get("username"), target["username"]).lstrip("@")
    role = ke_teks(data.get("role"), target.get("role", "Administrator"))
    status = ke_teks(data.get("status"), target.get("status", "Aktif"))
    password = data.get("password") or ""

    pesan = cek_isian_staf(nama, username, role, status)
    if pesan:
        return jsonify({"pesan": pesan}), 400
    if password != "" and len(password) < MIN_PASSWORD:
        return jsonify({"pesan": "Password minimal %d karakter" % MIN_PASSWORD}), 400
    if username_dipakai(username, target["_id"]):
        return jsonify({"pesan": "Username sudah dipakai"}), 400

    dipakai_sendiri = str(target["_id"]) == session.get("user_id")
    if dipakai_sendiri and status == "Nonaktif":
        return jsonify({"pesan": "Akun yang sedang Anda pakai tidak bisa dinonaktifkan"}), 400
    if adalah_admin_aktif(target) and (role != "Administrator" or status == "Nonaktif") \
            and jumlah_admin_aktif_lain(target["_id"]) == 0:
        return jsonify({"pesan": "Harus ada minimal satu Administrator aktif"}), 400

    isi = {"nama": nama, "username": username, "role": role, "status": status}
    if password != "":
        isi["password"] = generate_password_hash(password)
    tabel_user.update_one({"_id": target["_id"]}, {"$set": isi})
    if dipakai_sendiri:
        session["username"] = username

    return jsonify(staf_ke_halaman(tabel_user.find_one({"_id": target["_id"]})))


@app.route("/api/staf/<int:nomor>", methods=["DELETE"])
@admin_required
def hapus_staf(nomor):
    beri_nomor(tabel_user)
    target = tabel_user.find_one({"nomor": nomor})
    if target is None:
        return jsonify({"pesan": "Pengguna tidak ditemukan"}), 404
    if str(target["_id"]) == session.get("user_id"):
        return jsonify({"pesan": "Akun yang sedang Anda pakai tidak bisa dihapus"}), 400
    if adalah_admin_aktif(target) and jumlah_admin_aktif_lain(target["_id"]) == 0:
        return jsonify({"pesan": "Harus ada minimal satu Administrator aktif"}), 400
    tabel_user.delete_one({"_id": target["_id"]})
    return jsonify({"pesan": "Pengguna dihapus"})


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG", "false") == "true", port=5000)