# Vibecoding in Bun

Aplikasi backend RESTful API modern yang dibangun menggunakan runtime Bun, framework web ElysiaJS, dan Drizzle ORM dengan database MySQL. Aplikasi ini menyediakan fungsionalitas manajemen pengguna dan otentikasi sesi yang aman, cepat, dan terstruktur.

---

## Daftar Isi

- [Ringkasan Aplikasi](#ringkasan-aplikasi)
- [Tech Stack dan Pustaka](#tech-stack-dan-pustaka)
- [Arsitektur dan Struktur Proyek](#arsitektur-dan-struktur-proyek)
- [Skema Database](#skema-database)
- [Dokumentasi API](#dokumentasi-api)
- [Dokumentasi Interaktif Swagger](#dokumentasi-interaktif-swagger)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Panduan Setup Proyek](#panduan-setup-proyek)
- [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
- [Cara Menjalankan Pengujian](#cara-menjalankan-pengujian)
- [Manajemen Database dan Migrasi](#manajemen-database-dan-migrasi)

---

## Ringkasan Aplikasi

Aplikasi ini mengimplementasikan sistem manajemen pengguna dan otentikasi berbasis token sesi:

- Registrasi pengguna baru dengan enkripsi password menggunakan algoritma bcrypt bawaan Bun.
- Autentikasi login dengan verifikasi password aman dan pembuatan token sesi UUID unik.
- Pengambilan profil pengguna aktif berdasarkan header Authorization Bearer token tanpa mengekspos field password.
- Logout pengguna dengan menghapus record sesi dari database secara efisien.
- Health-check endpoint untuk memantau status runtime server dan konektivitas database MySQL.

---

## Tech Stack dan Pustaka

### Komponen Inti

- **Runtime & Package Manager**: [Bun](https://bun.sh/) (v1.x) - Runtime JavaScript/TypeScript berkinerja tinggi.
- **Web Framework**: [ElysiaJS](https://elysiajs.com/) (`elysia`) - Framework HTTP cepat dan ergonomis untuk Bun.
- **Dokumentasi API (OpenAPI/Swagger)**: [@elysiajs/swagger](https://elysiajs.com/plugins/swagger.html) - Plugin resmi untuk integrasi antarmuka Swagger UI dan OpenAPI spec otomatis.
- **Object-Relational Mapping (ORM)**: [Drizzle ORM](https://orm.drizzle.team/) (`drizzle-orm`) - TypeScript ORM berbasis SQL yang type-safe dan ringan.
- **Database Driver**: [MySQL2](https://github.com/sidorares/node-mysql2) (`mysql2`) - Client MySQL untuk Node.js dan Bun dengan dukungan Connection Pool dan Promise.
- **Database Engine**: MySQL (versi 8.0 atau MariaDB yang kompatibel).
- **Bahasa**: TypeScript (Strict Mode).

### Komponen Pendukung Bawaan Runtime

- **Validasi Data**: TypeBox (`t` dari pustaka ElysiaJS) untuk validasi schema request body secara runtime dan compile-time.
- **Kriptografi & Password Hashing**: `Bun.password.hash` dan `Bun.password.verify` dengan algoritma bcrypt (cost factor 10) tanpa memerlukan pustaka eksternal.
- **Token Generator**: Web Crypto API native (`crypto.randomUUID()`) untuk menghasilkan identifier sesi yang unik.
- **Test Runner**: `bun:test` bawaan Bun untuk pengujian unit dan integrasi.

### Dependensi Pengembangan (Dev Dependencies)

- `drizzle-kit`: CLI tool untuk deklarasi schema, introspeksi, dan pembuatan berkas migrasi SQL.
- `@types/bun`: Definisi tipe TypeScript untuk global API runtime Bun.
- `@types/node`: Definisi tipe TypeScript pendukung ekosistem Node.js.

---

## Arsitektur dan Struktur Proyek

Aplikasi ini menerapkan pola **Layered Architecture (Route-Service-Data Pattern)** untuk memisahkan tanggung jawab (separation of concerns):

1. **Route Layer (`src/routes/`)**: Bertanggung jawab menerima HTTP request, melakukan validasi payload dan header, mengatur HTTP status code, dan mengembalikan response JSON.
2. **Service Layer (`src/services/`)**: Berisi logika bisnis (business logic) murni, enkripsi password, pembuatan token, dan eksekusi query database via Drizzle.
3. **Data Layer (`src/db/`)**: Mengelola koneksi database pool dan deklarasi skema tabel.
4. **Utils Layer (`src/utils/`)**: Fungsi utilitas bersama yang reusable, seperti parsing dan validasi header Authorization Bearer token.

### Konvensi Penamaan Berkas

- Berkas route dan service menggunakan format **kebab-case** dengan akhiran jenis layer:
  - Route: `src/routes/users-route.ts`
  - Service: `src/services/users-services.ts`
  - Util: `src/utils/auth.ts`
  - Test: `src/tests/users.test.ts`, `src/tests/utils/auth.test.ts`

### Struktur Direktori Lengkap

```text
vibecoding-in-bun/
├── drizzle/                  # Berkas migrasi SQL otomatis yang dibuat Drizzle Kit
│   ├── 0000_massive_proteus.sql
│   ├── 0001_clear_nitro.sql
│   ├── 0002_milky_thor_girl.sql
│   ├── 0003_wealthy_frightful_four.sql
│   └── meta/                 # Snapshot metadata schema Drizzle
├── src/
│   ├── config/
│   │   └── env.ts            # Sentralisasi konfigurasi environment variable
│   ├── db/
│   │   ├── index.ts          # Inisialisasi pool koneksi MySQL dan instance Drizzle
│   │   └── schema.ts         # Definisi skema tabel database (users, sessions)
│   ├── routes/
│   │   ├── health.ts         # Endpoint health-check server dan database
│   │   └── users-route.ts    # Endpoint registrasi, login, current user, dan logout
│   ├── services/
│   │   └── users-services.ts # Logika bisnis operasional pengguna dan sesi
│   ├── utils/
│   │   └── auth.ts           # Helper ekstraksi Bearer token dari header request
│   ├── tests/
│   │   ├── users.test.ts     # Pengujian integrasi API endpoint
│   │   └── utils/
│   │       └── auth.test.ts  # Pengujian unit untuk helper auth
│   └── index.ts              # Entry point utama aplikasi server ElysiaJS
├── .env.example              # Template variabel lingkungan
├── drizzle.config.ts         # Konfigurasi Drizzle Kit CLI
├── package.json              # Konfigurasi dependensi dan skrip eksekusi
├── README.md                 # Dokumentasi proyek
└── tsconfig.json             # Konfigurasi TypeScript compiler
```

---

## Skema Database

Skema database didefinisikan menggunakan Drizzle ORM MySQL dialect pada berkas `src/db/schema.ts`.

### 1. Tabel `users`

Menyimpan identitas data pengguna aplikasi.

| Nama Kolom   | Tipe Data      | Batasan (Constraints)              | Keterangan                              |
|--------------|----------------|------------------------------------|-----------------------------------------|
| `id`         | `serial` (int) | Primary Key, Auto Increment        | Identitas unik user                     |
| `name`       | `varchar(256)` | Not Null                           | Nama lengkap pengguna (maks 256 char)   |
| `email`      | `varchar(100)` | Not Null, Unique                   | Alamat email unik pengguna              |
| `password`   | `varchar(255)` | Not Null                           | Hash password (bcrypt)                  |
| `created_at` | `timestamp`    | Not Null, Default `current_timestamp` | Waktu user didaftarkan                  |

### 2. Tabel `sessions`

Menyimpan token sesi aktif dari pengguna yang telah login.

| Nama Kolom   | Tipe Data      | Batasan (Constraints)              | Keterangan                              |
|--------------|----------------|------------------------------------|-----------------------------------------|
| `id`         | `serial` (int) | Primary Key, Auto Increment        | Identitas unik sesi                     |
| `token`      | `varchar(255)` | Not Null                           | Token sesi login (string UUID)          |
| `user_id`    | `int`          | Not Null, Foreign Key              | Mereferensikan kolom `id` tabel `users` |
| `created_at` | `timestamp`    | Not Null, Default `current_timestamp` | Waktu sesi dibuat                       |

---

## Dokumentasi API

Base URL lokal: `http://localhost:3000`

### 1. Root Welcome

- **Method**: `GET`
- **Path**: `/`
- **Headers**: Tidak ada
- **Response**:
  - `200 OK`:

    ```json
    {
      "message": "Welcome to Vibecoding API in Bun!",
      "version": "1.0.0"
    }
    ```

### 2. Health Check

- **Method**: `GET`
- **Path**: `/health`
- **Headers**: Tidak ada
- **Response**:
  - `200 OK`:

    ```json
    {
      "status": "ok",
      "timestamp": "2026-11-05T13:00:00.000Z",
      "uptime": 12.34,
      "database": "connected"
    }
    ```

### 3. Registrasi User

Mendaftarkan akun pengguna baru ke sistem.

- **Method**: `POST`
- **Path**: `/api/users`
- **Headers**: `Content-Type: application/json`
- **Request Body**:

  ```json
  {
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "password": "rahasiaPassword123"
  }
  ```
  
- **Aturan Validasi**:
  - `name`: String, minimal 1 karakter, maksimal 256 karakter.
  - `email`: String, minimal 1 karakter, maksimal 100 karakter.
  - `password`: String, minimal 1 karakter, maksimal 255 karakter.
- **Responses**:
  - `201 Created` (Sukses):

    ```json
    {
      "data": "OK"
    }
    ```

  - `400 Bad Request` (Email Duplikat):

    ```json
    {
      "error": "Email sudah terdaftar"
    }
    ```

  - `400 Bad Request` (Validasi Gagal):

    ```json
    {
      "error": "Pesan rincian kegagalan validasi schema"
    }
    ```

### 4. Login User

Mengautentikasi pengguna dan mengembalikan token sesi baru.

- **Method**: `POST`
- **Path**: `/api/users/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:

  ```json
  {
    "email": "budi@example.com",
    "password": "rahasiaPassword123"
  }
  ```

- **Responses**:
  - `200 OK` (Sukses):

    ```json
    {
      "data": "550e8400-e29b-41d4-a716-446655440000"
    }
    ```

  - `400 Bad Request` (Kredensial Tidak Valid):

    ```json
    {
      "error": "Email atau password salah"
    }
    ```

  - `400 Bad Request` (Validasi Body Kosong):

    ```json
    {
      "error": "Pesan rincian kegagalan validasi schema"
    }
    ```

### 5. Get Current User Profile

Mengambil data profil pengguna yang sedang login berdasarkan token sesi.

- **Method**: `GET`
- **Path**: `/api/users/current`
- **Headers**:
  - `Authorization: Bearer <token_uuid>`
- **Request Body**: Tidak ada (kosong)
- **Responses**:
  - `200 OK` (Sukses):

    ```json
    {
      "data": {
        "id": 1,
        "name": "Budi Santoso",
        "email": "budi@example.com",
        "created_at": "2026-11-05T13:00:00.000Z"
      }
    }
    ```

    *Catatan: Kolom password tidak pernah disertakan dalam respon.*
  - `401 Unauthorized` (Header Tidak Ada / Format Salah / Token Tidak Terdaftar):

    ```json
    {
      "error": "Unauthorized"
    }
    ```

### 6. Logout User

Menghapus sesi pengguna dari database sehingga token tidak dapat digunakan lagi.

- **Method**: `DELETE`
- **Path**: `/api/users/logout`
- **Headers**:
  - `Authorization: Bearer <token_uuid>`
- **Request Body**: Tidak ada (kosong)
- **Responses**:
  - `200 OK` (Sukses):

    ```json
    {
      "data": "OK"
    }
    ```

  - `401 Unauthorized` (Token Kosong atau Sesi Tidak Ditemukan):

    ```json
    {
      "error": "Unauthorized"
    }
    ```

---

## Dokumentasi Interaktif Swagger

Aplikasi ini dilengkapi dengan antarmuka web interaktif **Swagger UI** berbasis spesifikasi OpenAPI v3:

- **Alamat Swagger UI**: [http://localhost:3000/swagger](http://localhost:3000/swagger)
- **Alamat OpenAPI JSON Spec**: [http://localhost:3000/swagger/json](http://localhost:3000/swagger/json)

### Fitur Swagger UI

1. **Eksplorasi Endpoint**: Melihat daftar endpoint, parameter, dan skema request/response secara visual.
2. **Uji Coba Langsung (Try it out)**: Mengirimkan request langsung dari browser ke server lokal.
3. **Otentikasi Bearer Token**:
   - Klik tombol **Authorize** di bagian kanan atas halaman Swagger UI.
   - Masukkan token sesi UUID (didapat dari response endpoint `/api/users/login`) pada kolom input.
   - Klik **Authorize**, dan seluruh request ke endpoint terproteksi (`/api/users/current` dan `/api/users/logout`) otomatis menyertakan header `Authorization: Bearer <token>`.

---

## Persyaratan Sistem

Pastikan lingkungan kerja lokal Anda telah terpasang:

1. **Bun**: Versi 1.1.0 atau yang lebih baru.

   ```bash
   bun --version
   ```

2. **MySQL Server**: Versi 8.0 ke atas atau MariaDB versi 10.5 ke atas yang aktif dan dapat diakses.

---

## Panduan Setup Proyek

### 1. Clone Repositori

```bash
git clone git@github.com:naunauwf/vibecoding-in-bun.git
cd vibecoding-in-bun
```

### 2. Pasang Seluruh Dependensi Proyek

```bash
bun install
```

### 3. Konfigurasi Environment Variables

Salin berkas `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Buka file `.env` dan sesuaikan parameter koneksi database Anda:

```env
PORT=3000
DATABASE_URL=mysql://root:password@localhost:3306/vibecoding_db
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=vibecoding_db
```

### 4. Buat Database MySQL

Pastikan database dengan nama yang ditentukan pada `.env` telah tersedia di MySQL server Anda:

```sql
CREATE DATABASE IF NOT EXISTS vibecoding_db;
```

### 5. Jalankan Migrasi Database

Terapkan skema tabel ke dalam database menggunakan Drizzle Kit:

```bash
bun run db:migrate
```

---

## Cara Menjalankan Aplikasi

Semua skrip operasional didefinisikan pada bagian `scripts` di `package.json`.

### Mode Development (Hot Reload)

Menjalankan server dalam mode pemantauan berkas. Server otomatis restart ketika ada perubahan kode:

```bash
bun run dev
```

### Mode Production

Menjalankan server langsung untuk lingkungan produksi:

```bash
bun run start
```

### Pengecekan Tipe TypeScript (Typecheck)

Memvalidasi seluruh tipe TypeScript tanpa mengompilasi berkas output:

```bash
bun run typecheck
```

---

## Cara Menjalankan Pengujian

Pengujian dilakukan menggunakan test runner bawaan Bun (`bun:test`).

### 1. Menjalankan Seluruh Test Suite

```bash
bun test
```

atau

```bash
bun run test
```

### 2. Menjalankan Berkas Pengujian Tertentu

- Menjalankan pengujian endpoint pengguna:

  ```bash
  bun test src/tests/users.test.ts
  ```

- Menjalankan pengujian unit helper autentikasi:

  ```bash
  bun test src/tests/utils/auth.test.ts
  ```

### 3. Menjalankan Pengujian dalam Mode Watch

Otomatis menjalankan ulang test saat berkas diubah:

```bash
bun test --watch
```

---

## Manajemen Database dan Migrasi

Proyek ini menggunakan Drizzle Kit untuk manajemen versi skema database secara terstruktur.

### 1. Membuat Berkas Migrasi Baru

Setelah mengubah definisi tabel pada `src/db/schema.ts`, buat berkas migrasi SQL baru di direktori `drizzle/`:

```bash
bun run db:generate
```

### 2. Menerapkan Migrasi ke Database

Menjalankan semua berkas migrasi SQL yang belum diterapkan ke database aktif:

```bash
bun run db:migrate
```

### 3. Membuka Drizzle Studio GUI

Membuka antarmuka visual berbasis web di browser lokal untuk melihat dan mengelola data tabel secara langsung:

```bash
bun run db:studio
```
