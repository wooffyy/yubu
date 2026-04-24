
# yubu - AI Home Renovation Consultant

> by Muhammad Wahfiuddin / 2410511091
---

## Deskripsi Layanan

Sistem konsultasi renovasi rumah berbasis LLM yang dibangun dengan arsitektur **microservice** dan diakses melalui satu **API Gateway** terpusat.

Terdiri dari tiga komponen utama:

- **Gateway** (Node.js/Express, port 3000) — Pintu masuk tunggal untuk seluruh request client. Menggunakan `http-proxy-middleware` untuk meneruskan request ke service yang sesuai. Dilengkapi rate limiter (20 request per 15 menit) dan request logging via morgan.
- **Service 1 — AI Chat** (`service-express`, Node.js/Express, port 3001) — Memproses permintaan konsultasi menggunakan LLM via OpenRouter API. Menangani diagnosis masalah, free-form chat, konsultasi berbasis template, dan refinement diagnosis. Setiap response otomatis disimpan ke Service 2.
- **Service 2 — Template & History** (`service-php`, PHP CodeIgniter 4 + MongoDB, port 3002) — Menyimpan template diagnosis dan seluruh riwayat konsultasi yang dihasilkan Service 1. Database: MongoDB lokal, collection `yubu_db`.

Semua request client **hanya boleh melalui Gateway port 3000**. Komunikasi antar-service dilakukan secara internal (server-to-server langsung, bukan via gateway).

### Arsitektur

```
Client
  ↓
Gateway (Node.js/Express) — port 3000
  ├── /ai/*         → proxy ke Service 1 :3001
  └── /templates/*  → proxy ke Service 2 :3002

Service 1 (Node.js/Express, service-express) — port 3001
  └── Konsumsi LLM via OpenRouter API
  └── Auto-save ke Service 2 setelah setiap response

Service 2 (PHP CodeIgniter 4 + MongoDB, service-php) — port 3002
  ├── Collection: diagnosis_templates
  └── Collection: consultation_history
```

---

## Struktur Folder

```
.
├── gateway/
│   ├── index.js
│   └── package.json
├── service-express/
│   ├── index.js
│   ├── routes/
│   │   ├── chat.js
│   │   ├── diagnosis.js
│   │   └── withTemplate.js
│   ├── services/
│   │   ├── aiService.js
│   │   └── saveChatService.js
│   └── package.json
└── service-php/
    ├── app/
    │   ├── Config/
    │   │   ├── Mongo.php
    │   │   └── Routes.php
    │   ├── Controllers/
    │   │   ├── ConsultationController.php
    │   │   └── TemplateController.php
    │   └── Models/
    │       ├── ConsultationHistory.php
    │       └── DiagnosisTemplate.php
    ├── public/
    └── composer.json
```

---

## Daftar Endpoint

### Via Gateway (port 3000)

| Method | Path | Diteruskan ke |
|--------|------|---------------|
| GET | /ai/health | Service 1 |
| POST | /ai/diagnose | Service 1 |
| PUT | /ai/diagnose/refine | Service 1 |
| POST | /ai/chat | Service 1 |
| POST | /ai/consult-with-template | Service 1 |
| GET | /templates | Service 2 |
| GET | /templates/:id | Service 2 |
| POST | /templates | Service 2 |
| PUT | /templates/:id | Service 2 |
| DELETE | /templates/:id | Service 2 |
| GET | /consultations | Service 2 |
| POST | /consultations | Service 2 |
| DELETE | /consultations/:id | Service 2 |

---

### Service 1 — AI Chat (port 3001)

#### `GET /ai/health`
Cek status service.

**Response:**
```
OK
```

---

#### `POST /ai/diagnose`
Kirim deskripsi masalah renovasi → LLM analisis → kembalikan diagnosis terstruktur. Response otomatis disimpan ke Service 2 dengan category `"diagnosis"`.

**Request Body:**
```json
{
  "description": "Tembok kamar mandi lembab dan berjamur",
  "room_type": "kamar mandi",
  "wall_material": "keramik",
  "area_m2": 4
}
```
`description` wajib diisi. Field lainnya opsional.

**Response:**
```json
{
  "problem_type": "Kelembaban & Jamur",
  "severity": "sedang",
  "cause": "Ventilasi buruk dan kebocoran tersembunyi",
  "estimated_cost": "Rp 1.500.000 – Rp 3.000.000",
  "steps": [
    "Identifikasi sumber kebocoran",
    "Bersihkan jamur dengan cairan anti-jamur",
    "Aplikasikan waterproofing pada dinding",
    "Perbaiki ventilasi ruangan"
  ]
}
```

---

#### `PUT /ai/diagnose/refine`
Refine diagnosis sebelumnya berdasarkan informasi tambahan atau koreksi dari user. Response otomatis disimpan ke Service 2 dengan category `"refinement"`.

**Request Body:**
```json
{
  "previous_diagnosis": {
    "problem_type": "Kelembaban",
    "severity": "sedang"
  },
  "additional_info": "Ternyata ada pipa bocor di balik dinding",
  "correction": "Bukan jamur biasa, sudah merembes ke dinding luar"
}
```
`previous_diagnosis` dan `additional_info` wajib. `correction` opsional.

**Response:**
```json
{
  "refined_diagnosis": {
    "problem_type": "Kebocoran Pipa & Rembesan",
    "severity": "tinggi",
    "cause": "Pipa bocor di dalam dinding menyebabkan rembesan meluas",
    "estimated_cost": "Rp 3.000.000 – Rp 7.000.000",
    "steps": ["..."]
  },
  "changes_from_previous": "Severity ditingkatkan dari sedang ke tinggi karena ditemukan sumber kebocoran aktif."
}
```

---

#### `POST /ai/chat`
Free-form tanya jawab seputar renovasi rumah. Support multi-turn via `consultation_history`. Response otomatis disimpan ke Service 2 dengan category `"chat"`.

**Request Body:**
```json
{
  "message": "Cat apa yang cocok untuk dinding luar rumah di daerah hujan?",
  "consultation_history": [
    { "role": "user", "content": "Rumah saya sering lembab" },
    { "role": "assistant", "content": "Apakah lembabnya di dinding dalam atau luar?" }
  ]
}
```
`message` wajib. `consultation_history` opsional.

**Response:**
```json
{
  "reply": "Untuk dinding luar di daerah curah hujan tinggi, disarankan menggunakan cat eksterior berbasis water-based dengan kandungan anti-jamur..."
}
```

---

#### `POST /ai/consult-with-template`
Ambil template dari Service 2 berdasarkan `template_id`, inject variabel ke `user_prompt_template`, lalu kirim ke LLM. `system_prompt` diambil dinamis dari data template. Response otomatis disimpan ke Service 2 dengan category `"consult-with-template"`.

**Request Body:**
```json
{
  "template_id": "664f1c2e8b1a2c3d4e5f6789",
  "variables": {
    "room_type": "dapur",
    "problem": "lantai retak"
  }
}
```

**Response:**
```json
{
  "consultation_result": { "...": "hasil diagnosis dari LLM" },
  "template_used": "Diagnosis Lantai",
  "saved_consultation_id": null
}
```

---

### Service 2 — Template & History (port 3002)

#### `GET /templates`
List semua template diagnosis yang tersedia.

#### `GET /templates/:id`
Ambil satu template berdasarkan MongoDB ObjectId. Digunakan secara internal oleh Service 1 saat `POST /ai/consult-with-template`.

#### `POST /templates`
Buat template baru.

**Request Body:**
```json
{
  "name": "Diagnosis Atap Bocor",
  "problem_category": "atap",
  "system_prompt": "Kamu adalah ahli diagnosis atap...",
  "user_prompt_template": "Masalah: {problem}, Luas: {area_m2} m2",
  "variables": ["problem", "area_m2"],
  "estimated_cost_range": "Rp 2.000.000 – Rp 10.000.000"
}
```

#### `PUT /templates/:id`
Update template berdasarkan MongoDB ObjectId.

#### `DELETE /templates/:id`
Hapus template berdasarkan MongoDB ObjectId.

#### `GET /consultations`
List semua riwayat konsultasi yang tersimpan.

#### `POST /consultations`
Simpan hasil konsultasi. **Dipanggil otomatis oleh Service 1**, bukan oleh client langsung.

**Payload yang diterima dari Service 1:**
```json
{
  "user_id": "anonymous",
  "category": "diagnosis | chat | consult-with-template | refinement",
  "problem": "deskripsi masalah atau pesan user",
  "ai_response": { "...": "objek hasil dari LLM" },
  "metadata": {
    "severity": "sedang",
    "room_type": "kamar mandi"
  }
}
```

#### `DELETE /consultations/:id`
Hapus satu riwayat konsultasi berdasarkan MongoDB ObjectId.

---

## Cara Menjalankan

### Prasyarat

- Node.js >= 18
- pnpm (digunakan di kedua service Node.js)
- PHP >= 8.2 & Composer
- MongoDB (lokal, berjalan di port 27017)
- PHP extension `mongodb` aktif
- API Key dari [openrouter.ai](https://openrouter.ai)

---

### 1. Clone Repository

```bash
git clone https://github.com/wooffyy/yubu
cd yubu
```

---

### 2. Setup Service 2 — PHP CodeIgniter 4 (port 3002)

```bash
cd service-php
composer install
cp env .env
```

Edit `.env`, minimal ubah bagian ini:
```
CI_ENVIRONMENT = development
app.baseURL = 'http://localhost:3002/'
```

Koneksi MongoDB dikonfigurasi di `app/Config/Mongo.php`. Secara default terhubung ke `mongodb://127.0.0.1:27017` dan database `yubu_db`. Ubah jika perlu.

Jalankan:
```bash
php spark serve --port 3002
```

---

### 3. Setup Service 1 — AI Chat (port 3001)

```bash
cd service-express
pnpm install
```

Buat file `.env`:
```
PORT=3001
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxx
SERVICE2_URL=http://localhost:3002
```

Jalankan:
```bash
node index.js
```

Atau dengan nodemon untuk development:
```bash
pnpm nodemon index.js
```

---

### 4. Setup Gateway (port 3000)

```bash
cd gateway
pnpm install
```

Tidak ada konfigurasi `.env` yang dibutuhkan — target proxy sudah di-hardcode ke `localhost:3001` dan `localhost:3002` di `index.js`.

Jalankan:
```bash
node index.js
```

Atau dengan nodemon:
```bash
pnpm nodemon index.js
```

---

### Urutan Menjalankan

```
1. Pastikan MongoDB sudah berjalan di port 27017
2. Service 2  →  php spark serve --port 3002       (di folder service-php)
3. Service 1  →  node index.js                     (di folder service-express)
4. Gateway    →  node index.js                     (di folder gateway)
```

Semua request dikirim ke **http://localhost:3000**.


## Catatan Tambahan

- Seluruh request client **wajib melalui Gateway port 3000**. Akses langsung ke port 3001 atau 3002 tidak diperbolehkan.
- Service 1 berkomunikasi ke Service 2 secara **server-to-server internal** 
- LLM yang digunakan: model `openai/gpt-oss-20b:free` via **OpenRouter API** (dikonfigurasi di `service-express/services/aiService.js`).
- Perlu diperhatikan bahwa endpoint yang melibatkan pemanggilan LLM (`/ai/diagnose, /ai/chat, /ai/consult-with-template, /ai/diagnose/refine`) sesekali dapat mengembalikan response `500` atau `503`. Hal ini **bukan merupakan bug pada aplikasi**, melainkan disebabkan oleh pembatasan rate limit pada model free tier yang digunakan melalui OpenRouter API. Menunggu beberapa saat sebelum mencoba kembali umumnya menyelesaikan masalah ini.
- Gateway menggunakan **rate limiter**: maksimal 20 request per IP per 15 menit untuk semua endpoint `/ai/*`.
- MongoDB database name yang digunakan: `yubu_db`.