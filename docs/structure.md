# 📁 Struktur Project — Markas Kebaikan

> **Tech Lead Documentation**  
> **Terakhir diperbarui:** 24 Juli 2026

---

## 📂 Folder Tree

```
markaskebaikan/
│
├── index.html                        # Landing page publik
├── styles.css                        # CSS kustom (satu file, dipakai landing & admin)
│
├── admin/                            # Halaman panel admin
│   ├── index.html                    # Dashboard admin (sebelumnya di root)
│   ├── login.html                    # Login admin (sebelumnya admin-login.html)
│   └── js/
│       └── admin-panel.js            # Script admin panel
│
├── assets/
│   ├── js/
│   │   └── landing.js                # Script untuk index.html
│   ├── Logo MK black.png
│   ├── MARKASKEBAIKAN.png
│   ├── MK.ico
│   ├── logo.svg
│   └── .gitkeep
│
├── archive/                          # Backup file struktur lama
│   ├── admin.html
│   ├── admin-login.html
│   └── admin-panel.js
│
├── docs/
│   ├── analisa-landingpage-mk.md
│   ├── implementation-plan-critical.md
│   ├── scoring.md
│   ├── scoring-report.md
│   └── structure.md                  # File ini — dokumentasi arsitektur
│
└── README.md
```

---

## 🗄️ Data Storage Schema (localStorage)

Project ini menggunakan **localStorage** sebagai database client-side. Tidak ada backend server.

### 1. Key: `mk_campaigns`

| Field | Type | Contoh | Keterangan |
|-------|------|--------|------------|
| `id` | string | `"1712345678900-123"` | Unique ID (timestamp + random) |
| `title` | string | `"Beasiswa untuk 50 Anak Yatim"` | Judul kampanye (sanitized HTML) |
| `category` | string | `"Pendidikan"` | Kategori program |
| `image` | string | `"https://..."` atau `"data:image/..."` | URL gambar atau base64 |
| `target` | number | `50000000` | Target dana (rupiah) |
| `collected` | number | `42500000` | Dana terkumpul yang sudah dikonfirmasi |
| `pendingCollected` | number | `500000` | Dana menunggu konfirmasi admin |
| `daysLeft` | number | `12` | Sisa hari kampanye |

### 2. Key: `mk_donors`

| Field | Type | Contoh | Keterangan |
|-------|------|--------|------------|
| `id` | string | `"DON-1712345678-1234"` | Unique ID donatur |
| `campaignId` | string | `"1"` | ID kampanye yang didonasi |
| `campaignTitle` | string | `"Beasiswa Yatim"` | Judul kampanye (snapshot) |
| `name` | string | `"Hamba Allah"` | Nama donatur (sanitized) |
| `phone` | string | `"081234567890"` | Nomor WhatsApp |
| `amount` | number | `50000` | Nominal donasi |
| `paymentMethod` | string | `"QRIS"` | Metode pembayaran |
| `prayer` | string | `"Semoga berkah"` | Doa dari donatur |
| `status` | string | `"pending"` / `"confirmed"` | Status konfirmasi admin |
| `date` | string (ISO) | `"2026-07-24T12:00:00.000Z"` | Tanggal donasi |

### 3. Key: `mk_admin_logged_in` (sessionStorage)

| Value | Arti |
|-------|------|
| `"true"` | Session admin aktif |
| *(not set)* | Belum login / sudah logout |

> **Catatan:** sessionStorage hilang saat tab ditutup. Tidak ada expiry.

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                          │
│                                                          │
│  ┌─────────────────┐        ┌──────────────────────────┐ │
│  │  landing page    │        │  admin dashboard         │ │
│  │  (index.html)    │        │  (admin/login.html)      │ │
│  └────────┬─────────┘        └─────────────┬────────────┘ │
│           │                                │              │
│  ┌────────▼─────────┐        ┌─────────────▼────────────┐ │
│  │  landing.js       │        │  admin.js                │ │
│  │                   │        │                          │ │
│  │  renderCampaigns()│        │  handleAdminFormSubmit() │ │
│  │  processDonation()│        │  open/closeCampaignModal │ │
│  │  openDonationModal│        │  confirmDonor()          │ │
│  │  showToast()      │        │  export CSV/Excel        │ │
│  └────────┬──────────┘        └─────────────┬────────────┘ │
│           │                                │              │
│           └──────────┬──────────┬───────────┘              │
│                      │          │                          │
│              ┌───────▼──┐  ┌────▼────────┐                │
│              │ localStorage │  │ sessionStorage │         │
│              │ mk_campaigns │  │ mk_admin     │          │
│              │ mk_donors    │  │ _logged_in   │          │
│              └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## 🧠 Key Functions & File Mapping

### `landing.js`

| Function | Tujuan |
|----------|--------|
| `renderCampaigns()` | Render kartu kampanye dari `campaignsData` ke `#campaignListContainer` |
| `openDonationModal(id)` | Buka modal donasi untuk kampanye tertentu |
| `closeDonationModal()` | Tutup modal donasi |
| `selectNominal(value)` | Pilih nominal preset |
| `processDonation(event)` | Proses donasi → simpan ke localStorage + redirect WhatsApp |
| `openImpactModal(...)` | Buka modal impact report |
| `closeImpactModal()` | Tutup modal impact report |
| `showToast(msg, err)` | Tampilkan notifikasi toast |
| `loadCampaignsFromStorage()` | Load data kampanye dari localStorage |
| `saveCampaignsToStorage()` | Simpan data kampanye ke localStorage |
| `getDonors()` | Load data donatur dari localStorage |
| `saveDonor(donor)` | Simpan donatur baru ke localStorage |
| `sanitizeHTML(str)` | Sanitasi input untuk XSS prevention |
| `sanitizeURL(url)` | Validasi URL aman |
| `formatRupiah(num)` | Format angka ke Rupiah |

### `admin.js`

| Function | Tujuan |
|----------|--------|
| `openCampaignModal()` | Buka modal form tambah/edit kampanye |
| `closeCampaignModal()` | Tutup modal form |
| `switchAdminTab(tab)` | Ganti tab kampanye / donatur |
| `handleAdminFormSubmit(e)` | Submit form kampanye (create/update) |
| `editCampaign(id)` | Isi form dengan data kampanye untuk diedit |
| `deleteCampaign(id)` | Hapus kampanye |
| `confirmDonor(donorId)` | Konfirmasi donasi pending → tambahkan ke collected |
| `renderAdminCampaignList()` | Render daftar kampanye di admin |
| `renderAdminDonorList()` | Render daftar donatur dengan filter |
| `renderAdminDonorStats()` | Update statistik (total, confirmed, pending) |
| `filterDonors()` | Filter donatur berdasarkan nama + status |
| `downloadCSV()` | Export CSV |
| `downloadExcel()` | Export Excel |
| `clearAllDonors()` | Hapus semua data donatur |
| `logoutAdmin()` | Logout → redirect ke login |
| `openCampaignModal` / `closeCampaignModal` | Tambah/Edit kampanye di admin |

### Shared (di kedua file)

| Function | Tujuan |
|----------|--------|
| `loadCampaignsFromStorage()` | Load dari localStorage ke `campaignsData` |
| `saveCampaignsToStorage()` | Simpan `campaignsData` ke localStorage |
| `getDonors()` | Load donatur dari localStorage |
| `sanitizeHTML()` | XSS protection |
| `sanitizeURL()` | URL validation |
| `formatRupiah()` | Format currency |
| `showToast()` | Toast notification |
| `recalcPendingFromDonors()` | Hitung ulang pendingCollected dari data donatur |

> **Catatan:** Fungsi shared didefinisikan di `admin.js` dan digunakan di kedua file melalui global scope. Idealnya dipisah ke `lib.js` atau `shared.js`.

---

## 🚀 Cara Deploy (Static Hosting)

Project ini 100% static (HTML + CSS + JS). Cukup upload ke:

1. **GitHub Pages** (gratis) — push ke `main` branch
2. **Netlify** — drag & drop folder
3. **Vercel** — deploy dari GitHub repo
4. **Any web server** — Apache, Nginx, cPanel

**Tidak ada build step.** File langsung bisa diakses.

---

## 🧪 Testing Checklist

| Test Case | Halaman | Expected |
|-----------|---------|----------|
| Login admin dengan password salah | admin/login.html | Toast error, tidak redirect |
| Login admin dengan password benar | admin/login.html | Redirect ke dashboard |
| Tambah kampanye baru | admin/dashboard.html | Modal muncul, data tersimpan, tampil di list |
| Edit kampanye | admin/dashboard.html | Modal pre-filled, data terupdate |
| Hapus kampanye | admin/dashboard.html | Kampanye hilang dari list |
| Donasi via halaman utama | index.html | Data donatur tersimpan, redirect WA |
| Konfirmasi donasi | admin/dashboard.html | Dana pindah dari pending → collected |
| Filter donatur | admin/dashboard.html | List terfilter sesuai input |
| Export CSV | admin/dashboard.html | File CSV terdownload |
| Export Excel | admin/dashboard.html | File XLS terdownload |
| Kampanye baru muncul di index | index.html | Setelah simpan di admin, refresh index → kampanye muncul |
| Responsive mobile | index.html, admin/dashboard.html | Layout menyesuaikan layar kecil |