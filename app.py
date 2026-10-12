import os
import re
from io import BytesIO
from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from openpyxl import Workbook
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "rahasia-sementara")

app.config["SESSION_COOKIE_HTTPONLY"] = True   
app.config["SESSION_COOKIE_SAMESITE"] = os.environ.get("COOKIE_SAMESITE", "Lax")
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("COOKIE_SECURE", "false") == "true"

# CORS: supaya frontend (Webix) boleh memanggil backend dan mengirim cookie
alamat_frontend = os.environ.get("FRONTEND_URL", "http://localhost:3000").split(",")
CORS(app, supports_credentials=True, origins=alamat_frontend)

alamat_mongo = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient("URI_MONGODB_")
db = client["db_ritel"] 
tabel_user = db["users"]
tabel_barang = db["barang"]    
tabel_riwayat = db["riwayat"] 


#ini aku bikin funcion buat pengecekan

def ubah_id(data):
    data["id"] = str(data.pop("_id"))
    if "dibuat" in data:
        data["dibuat"] = data["dibuat"].strftime("%Y-%m-%d %H:%M:%S")
    return data

def cari_id(teks):
    try:
        return ObjectId(teks)
    except Exception:
        return None

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
            return jsonify({"pesan": "Silakan login dulu"}), 401
        return fungsi(*args, **kwargs)
    return pembungkus


def catat_riwayat(barang_id, nama_barang, jenis, jumlah, catatan):
    tabel_riwayat.insert_one({
        "barang_id": barang_id,
        "nama_barang": nama_barang,
        "jenis": jenis,         
        "jumlah": jumlah,
        "catatan": catatan,
        "oleh": session.get("username"),
        "dibuat": datetime.now(),
    })

@app.route("/")
def beranda():
    return jsonify({"pesan": "API jalan"})

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if username == "" or password == "":
        return jsonify({"pesan": "Username dan password wajib diisi"}), 400
    if len(password) < 6:
        return jsonify({"pesan": "Password minimal 6 karakter"}), 400
    
    # cek username sudah dipakai atau belum
    if tabel_user.find_one({"username": username}):
        return jsonify({"pesan": "Username sudah dipakai"}), 400
    
    # password TIDAK disimpan asli, tapi di-hash
    password_hash = generate_password_hash(password)

    tabel_user.insert_one({
        "username": username,
        "password": password_hash,
        "dibuat": datetime.now(),
    })
    return jsonify({"pesan": "Register berhasil"}), 201

@app.route("/api/login", methods = ["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = tabel_user.find_one({"username": username})

    if user is None or not check_password_hash(user["password"], password):
            return jsonify({"pesan": "Username atau password salah"}), 401

    session.clear()
    session["user_id"] = str(user["_id"])
    session["username"] = user["username"]
    
    return jsonify({"pesan": "Login berhasil", "username": user["username"]})

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"pesan": "Logout berhasil"})    


@app.route("/api/me")
@login_required
def me():
    # frontend bisa pakai ini untuk cek: " masih login atau tidak"
    return jsonify({"username": session["username"]})

#baca daftar sama buat cari buat filter halaman
@app.route("/api/barang", methods=["GET"])
@login_required
def daftar_barang():
    kata_cari = request.args.get("q", "").strip()
    kategori = request.args.get("kategori", "").strip()
    halaman = ke_bulat(request.args.get("page")) or 1
    batas = ke_bulat(request.args.get("limit")) or 10

    filter_cari = {}
    if kata_cari != "":
        filter_cari["nama"] = {"$reges" : re.escape(kata_cari), "$options" : "i"}
    if kategori != "":
        filter_cari["kategori"] = kategori

    total = tabel_barang.count_documents(filter_cari)
    hasil = tabel_barang.find(filter_cari).sort("dibuat" , -1) \
        .skip((halaman - 1) * batas).limit(batas)

    daftar = [ubah_id(b) for b in hasil]
    return jsonify({"data" : daftar, "total" : total, "page" : halaman, "limit" : batas})

#baca satu barang
@app.route("/api/barang/<id>", methods=["GET"])
@login_required
def detail_barang(id):
    oid = cari_id(id)
    if oid is None:
        return jsonify({"pesan": "ID tidak valid"}), 400

    barang = tabel_barang.find_one({"_id": oid})
    if barang is None:
        return jsonify({"pesan": "Barang tidak ditemukan"}), 404
    return jsonify(ubah_id(barang))

#create
@app.route("/api/barang", methods=["POST"])
@login_required
def tambah_barang():
    data = request.get_json() or {}

    nama = (data.get("nama") or "").strip()
    kategori = (data.get("kategori") or "Umum").strip()
    stok = ke_bulat(data.get("stok", 0))
    harga = ke_angka(data.get("harga", 0))

    if nama == "":
        return jsonify({"pesan": "Nama barang wajib diisi"}), 400
    if stok is None or stok < 0:
        return jsonify({"pesan": "Stok harus angka >= 0"}), 400
    if harga is None or harga < 0:
        return jsonify({"pesan": "Harga harus angka >= 0"}), 400

    barang_baru = {
        "nama": nama,
        "kategori": kategori,
        "stok": stok,
        "harga": harga,
        "dibuat": datetime.now(),
        "dibuat_oleh": session["username"],
    }
    hasil = tabel_barang.insert_one(barang_baru)
    catat_riwayat(str(hasil.inserted_id), nama, "tambah", stok, "Barang baru ditambahkan")

    return jsonify({"pesan": "Barang berhasil ditambahkan", "id": str(hasil.inserted_id)}), 201

#update
@app.route("/api/barang/<id>", methods=["PUT"])
@login_required
def ubah_barang(id):
    oid = cari_id(id)
    if oid is None:
        return jsonify({"pesan": "ID tidak valid"}), 400

    data = request.get_json() or {}
    nama = (data.get("nama") or "").strip()
    kategori = (data.get("kategori") or "Umum").strip()
    stok = ke_bulat(data.get("stok"))
    harga = ke_angka(data.get("harga"))

    if nama == "":
        return jsonify({"pesan": "Nama barang wajib diisi"}), 400
    if stok is None or stok < 0:
        return jsonify({"pesan": "Stok harus angka >= 0"}), 400
    if harga is None or harga < 0:
        return jsonify({"pesan": "Harga harus angka >= 0"}), 400

    hasil = tabel_barang.update_one(
        {"_id": oid},
        {"$set": {"nama": nama, "kategori": kategori, "stok": stok, "harga": harga}},
    )
    if hasil.matched_count == 0:
        return jsonify({"pesan": "Barang tidak ditemukan"}), 404

    return jsonify({"pesan": "Barang berhasil diubah"})

#delete
@app.route("/api/barang/<id>", methods=["DELETE"])
@login_required
def hapus_barang(id):
    oid = cari_id(id)
    if oid is None:
        return jsonify({"pesan": "ID tidak valid"}), 400

    barang = tabel_barang.find_one({"_id": oid})
    if barang is None:
        return jsonify({"pesan": "Barang tidak ditemukan"}), 404

    tabel_barang.delete_one({"_id": oid})
    catat_riwayat(id, barang["nama"], "hapus", barang["stok"], "Barang dihapus")

    return jsonify({"pesan": "Barang berhasil dihapus"})

#bbuat stok masuk atau keluarr
@app.route("/api/barang/<id>/stok", methods=["POST"])
@login_required
def ubah_stok(id):
    oid = cari_id(id)
    if oid is None:
        return jsonify({"pesan": "ID tidak valid"}), 400

    data = request.get_json() or {}
    jenis = data.get("jenis")           
    jumlah = ke_bulat(data.get("jumlah"))
    catatan = (data.get("catatan") or "").strip()

    if jenis not in ["masuk", "keluar"]:
        return jsonify({"pesan": "Jenis harus 'masuk' atau 'keluar'"}), 400
    if jumlah is None or jumlah <= 0:
        return jsonify({"pesan": "Jumlah harus angka lebih dari 0"}), 400

    barang = tabel_barang.find_one({"_id": oid})
    if barang is None:
        return jsonify({"pesan": "Barang tidak ditemukan"}), 404

    if jenis == "masuk":
        stok_baru = barang["stok"] + jumlah
    else:
        if jumlah > barang["stok"]:
            return jsonify({"pesan": "Stok tidak cukup"}), 400
        stok_baru = barang["stok"] - jumlah

    tabel_barang.update_one({"_id": oid}, {"$set": {"stok": stok_baru}})
    catat_riwayat(id, barang["nama"], jenis, jumlah, catatan)

    return jsonify({"pesan": "Stok berhasil diperbarui", "stok": stok_baru})

#buat riwayat 
@app.route("/api/riwayat", methods=["GET"])
@login_required
def daftar_riwayat():
    hasil = tabel_riwayat.find().sort("dibuat", -1).limit(100)
    daftar = [ubah_id(r) for r in hasil]
    return jsonify({"data": daftar})


@app.route("/api/dashboard", methods=["GET"])
@login_required
def dashboard():
    semua_barang = list(tabel_barang.find())

    total_jenis = len(semua_barang)
    total_stok = 0
    nilai_total = 0
    stok_menipis = []

    for b in semua_barang:
        total_stok += b["stok"]
        nilai_total += b["stok"] * b["harga"]
        if b["stok"] <= 5:
            stok_menipis.append({"id": str(b["_id"]), "nama": b["nama"], "stok": b["stok"]})

    return jsonify({
        "total_jenis": total_jenis,
        "total_stok": total_stok,
        "nilai_total": nilai_total,
        "stok_menipis": stok_menipis,
    })

#ini buat excelnya 
@app.route("/api/export/excel", methods=["GET"])
@login_required
def export_excel():
    wb = Workbook()

    sheet = wb.active
    sheet.title = "Barang"
    sheet.append(["No", "Nama", "Kategori", "Stok", "Harga", "Total Nilai", "Dibuat"])

    nomor = 1
    for b in tabel_barang.find().sort("nama", 1):
        sheet.append([
            nomor,
            b["nama"],
            b["kategori"],
            b["stok"],
            b["harga"],
            b["stok"] * b["harga"],
            b["dibuat"].strftime("%Y-%m-%d %H:%M"),
        ])
        nomor += 1

    sheet2 = wb.create_sheet("Riwayat")
    sheet2.append(["Waktu", "Barang", "Jenis", "Jumlah", "Catatan", "Oleh"])
    for r in tabel_riwayat.find().sort("dibuat", -1):
        sheet2.append([
            r["dibuat"].strftime("%Y-%m-%d %H:%M"),
            r["nama_barang"],
            r["jenis"],
            r["jumlah"],
            r["catatan"],
            r["oleh"],
        ])

    isi_file = BytesIO()
    wb.save(isi_file)
    isi_file.seek(0)

    nama_file = "inventaris_" + datetime.now().strftime("%Y%m%d_%H%M") + ".xlsx"
    return send_file(
        isi_file,
        as_attachment=True,
        download_name=nama_file,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

if __name__ == "__main__":
    app.run(debug=True, port=5000)