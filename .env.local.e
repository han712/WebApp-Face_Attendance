# ============================================================
# SALIN file ini jadi ".env.local" (bukan diedit langsung di sini),
# lalu isi value di bawah. ".env.local" TIDAK di-commit ke git
# (sudah ada di .gitignore bawaan Next.js) dan TIDAK di-upload
# kemana pun -- aman untuk isi credential asli.
# ============================================================

# --- Backend Python (REST API) ---
# IP:port server backend Anda saat ini di jaringan sekolah.
# Ganti setiap kali IP laptop server berubah, TANPA perlu rebuild webapp.
#NEXT_PUBLIC_FACE_RECOGNITION_API=https://squall-frugality-encircle.ngrok-free.dev
NEXT_PUBLIC_FACE_RECOGNITION_API=http://192.168.1.59:8080
# NEXT_PUBLIC_FACE_RECOGNITION_API=http://LAPTOP-STSOBB8I.local:8080


# NEXT_PUBLIC_IP_WEBCAM_URL= http://10.5.94.217:8080/video
# NEXT_PUBLIC_IP_WEBCAM_URL= http://192.168.1.54:8080/video
# --- Firebase Client SDK ---
# Ambil semua value di bawah dari Firebase Console:
# 1. Buka https://console.firebase.google.com -> pilih project Anda
# 2. Klik ikon gerigi (Project settings) di kiri atas
# 3. Scroll ke bagian "Your apps" -> kalau belum ada Web App, klik
#    ikon "</>" untuk daftarkan satu (nama bebas, mis. "webapp-absensi")
# 4. Firebase akan tampilkan blok "firebaseConfig" persis seperti field
#    di bawah ini -- copy satu-satu ke sini.
# 5. databaseURL BUKAN dari blok config app biasa -- ambil dari menu
#    "Realtime Database" di sidebar kiri, biasanya format:
#    https://<project-id>-default-rtdb.<region>.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDRoCtKs5nVE48TZNfHl3WoFSaAhB023lI"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="attendance-siswa.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://attendance-siswa-default-rtdb.asia-southeast1.firebasedatabase.app"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="attendance-siswa"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="attendance-siswa.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="677556815814"
NEXT_PUBLIC_FIREBASE_APP_ID="1:677556815814:web:c213c0fc3de9a2a643d4c7"
NEXT_PUBLIC_ESP32_DEVICE_ID=esp32_main
# NEXT_PUBLIC_ESP32_DEVICE_ID=esp32-01
# CATATAN KEAMANAN:
# NEXT_PUBLIC_FIREBASE_API_KEY ini BUKAN rahasia dalam arti "secret key"
# backend (ia memang didesain untuk dikirim ke browser client). Keamanan
# data Firebase sesungguhnya diatur lewat Realtime Database Rules di
# Firebase Console, bukan lewat menyembunyikan apiKey ini. Kalau nanti
# Anda mau membatasi siapa yang boleh baca/tulis node tertentu, itu
# dikerjakan di Rules -- bisa kita bahas di sesi terpisah kalau perlu.
