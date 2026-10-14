import os
import time
from datetime import datetime
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, request, jsonify, session, send_from_directory, redirect
from flask_cors import CORS
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
tabel_staf = db["staf"]
tabel_pengaturan = db["pengaturan"]


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


def login_required(fungsi):
    @wraps(fungsi)
    def pembungkus(*args, **kwargs):
        if "user_id" not in session:
            if request.path.startswith("/api/"):
                return jsonify({"pesan": "Silakan login dulu", "message": "Silakan login dulu"}), 401
            return redirect("/")
        return fungsi(*args, **kwargs)
    return pembungkus


# Login Page
@app.route("/")
def halaman_login():
    if "user_id" in session:
        return redirect("/dashboard")
    return send_from_directory(FOLDER, "login.html")


@app.route("/register")
@app.route("/register.html")
def halaman_register():
    if "user_id" in session:
        return redirect("/dashboard")
    if tabel_user.find_one({}) is not None:
        return redirect("/")
    return send_from_directory(FOLDER, "register.html")


# Page Dashboard (hanya bisa diakses kalau sudah login)
@app.route("/dashboard")
def halaman_dashboard():
    if "user_id" not in session:
        return redirect("/")
    jawaban = send_from_directory(FOLDER, "index.html")
    jawaban.headers["Cache-Control"] = "no-store"
    return jawaban

@app.route("/assets/<path:nama_file>")
def aset_frontend(nama_file):
    return send_from_directory(os.path.join(FOLDER, "assets"), nama_file)


HALAMAN_APP = {
    "produk.html", "transaksi.html", "stok-gudang.html",
    "laporan.html", "pengaturan.html",
}

@app.route("/<path:nama_file>")
def halaman_frontend(nama_file):
    if nama_file == "index.html":
        return redirect("/dashboard")
    if nama_file == "login.html":
        return redirect("/")
    if nama_file not in HALAMAN_APP:
        return jsonify({"pesan": "Halaman tidak ditemukan"}), 404
    if "user_id" not in session:
        return redirect("/")
    return send_from_directory(FOLDER, nama_file)


@app.route("/api/setup-status")
def status_setup():
    return jsonify({"needsSetup": tabel_user.find_one({}) is None})


@app.errorhandler(PyMongoError)
def database_error(error):
    return jsonify({
        "pesan": "Database tidak bisa dihubungi. Cek MONGO_URI dan Network Access di Atlas.",
        "message": "Database tidak bisa dihubungi. Cek MONGO_URI dan Network Access di Atlas.",
    }), 500


# Membuat akun admin
@app.route("/api/register", methods=["POST"])
def register():
    if tabel_user.find_one({}) is not None:
        return jsonify({"pesan": "Pendaftaran ditutup, akun admin sudah ada"}), 403

    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if username == "" or password == "":
        return jsonify({"pesan": "Username dan password wajib diisi"}), 400
    if len(password) < 6:
        return jsonify({"pesan": "Password minimal 6 karakter"}), 400

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


# Logika Login
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = tabel_user.find_one({"username": username})

    if user is None or not check_password_hash(user["password"], password):
        return jsonify({"pesan": "Username atau password salah"}), 401

    session.clear()
    session["user_id"] = str(user["_id"])
    session["username"] = user["username"]
    session["role"] = user.get("role", "Administrator")

    return jsonify({"pesan": "Login berhasil", "username": user["username"]})


# Logika Logout
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
    kasir = ke_teks(item.get("kasir"), session["username"])
    isi = {
        "invoice": ke_teks(item.get("invoice")),
        "waktu": ke_teks(item.get("waktu")),
        "pelanggan": ke_teks(item.get("pelanggan"), "Pelanggan Umum"),
        "kasir": kasir,
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
        "oleh": kasir,
    }
    hasil = tabel_transaksi.update_one({"nomor": nomor}, {"$set": isi})
    if hasil.matched_count == 0:
        isi["nomor"] = nomor
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


def staf_ke_halaman(s):
    return {
        "id": s["nomor"],
        "nama": s.get("nama", ""),
        "username": s.get("username", ""),
        "role": s.get("role", "Kasir"),
        "status": s.get("status", "Aktif"),
        "login": s.get("login", "-"),
    }


def simpan_staf(item):
    nomor = ke_bulat(item.get("id"))
    nama = ke_teks(item.get("nama"))
    if nomor is None or nama == "":
        return
    isi = {
        "nama": nama,
        "username": ke_teks(item.get("username")),
        "role": ke_teks(item.get("role"), "Kasir"),
        "status": ke_teks(item.get("status"), "Aktif"),
        "login": ke_teks(item.get("login"), "-"),
    }
    hasil = tabel_staf.update_one({"nomor": nomor}, {"$set": isi})
    if hasil.matched_count == 0:
        isi["nomor"] = nomor
        isi["dibuat"] = datetime.now()
        tabel_staf.insert_one(isi)


TABEL_SYNC = {
    "products": (tabel_barang, simpan_barang),
    "transactions": (tabel_transaksi, simpan_transaksi),
    "logs": (tabel_riwayat, simpan_log),
    "staf": (tabel_staf, simpan_staf),
}


# Mengambil semua data untuk sinkronisasi halaman
@app.route("/api/sync", methods=["GET"])
@login_required
def ambil_sinkronisasi():
    for tabel in (tabel_barang, tabel_transaksi, tabel_riwayat, tabel_staf):
        beri_nomor(tabel)

    pengaturan = tabel_pengaturan.find_one({"kunci": "toko"})
    return jsonify({
        "products": [barang_ke_halaman(b) for b in tabel_barang.find().sort("nomor", 1)],
        "transactions": [transaksi_ke_halaman(t) for t in tabel_transaksi.find().sort("dibuat", -1).limit(500)],
        "logs": [log_ke_halaman(r) for r in tabel_riwayat.find().sort("dibuat", -1).limit(300)],
        "staf": [staf_ke_halaman(s) for s in tabel_staf.find().sort("nomor", 1)],
        "settings": pengaturan["nilai"] if pengaturan else {},
    })


# CRUD data untuk sinkronisasi halaman
@app.route("/api/sync/<nama>", methods=["POST"])
@login_required
def simpan_sinkronisasi(nama):
    data = request.get_json(silent=True) or {}

    if nama == "settings":
        if data.get("reset"):
            tabel_pengaturan.delete_many({})
        elif isinstance(data.get("nilai"), dict):
            tabel_pengaturan.update_one({"kunci": "toko"}, {"$set": {"nilai": data["nilai"]}}, upsert=True)
        else:
            return jsonify({"pesan": "Data pengaturan tidak valid"}), 400

    elif nama in TABEL_SYNC:
        tabel, simpan = TABEL_SYNC[nama]
        if data.get("reset"):
            tabel.delete_many({})
        else:
            for item in (data.get("upsert") or [])[:1000]:
                if isinstance(item, dict):
                    simpan(item)
            nomor_hapus = [ke_bulat(x) for x in (data.get("hapus") or [])[:1000]]
            nomor_hapus = [x for x in nomor_hapus if x is not None]
            if nomor_hapus:
                tabel.delete_many({"nomor": {"$in": nomor_hapus}})

    else:
        return jsonify({"pesan": "Jenis data tidak dikenal"}), 404

    return jsonify({"pesan": "Tersimpan"})


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG", "false") == "true", port=5000)
