# Implementation Plan — Temuan Kritis Landing Page Markas Kebaikan

**Dokumen ini berisi panduan teknis langkah-demi-langkah untuk memperbaiki 4 temuan kritis**
*(Berdasarkan hasil review analisa-landingpage-mk.md)*

---

## Daftar Isi

1. [🔴 Critical #1: Autentikasi Admin Panel](#1-autentikasi-admin-panel)
2. [🔴 Critical #2: XSS Prevention (Sanitasi Input)](#2-xss-prevention-sanitasi-input)
3. [🔴 Critical #3: Integrasi Payment Gateway](#3-integrasi-payment-gateway)
4. [🔴 Critical #4: Optimasi Performa & Build Tailwind](#4-optimasi-performa--build-tailwind)
5. [Timeline & Prioritas Eksekusi](#5-timeline--prioritas-eksekusi)

---

## 1. Autentikasi Admin Panel

### 📋 Deskripsi Masalah

Halaman `admin.html` saat ini dapat diakses oleh siapa saja tanpa autentikasi. Ini adalah celah keamanan kritis karena memungkinkan pihak tidak bertanggung jawab untuk mengubah, menghapus, atau menambahkan kampanye donasi.

### 🎯 Tujuan

Membatasi akses halaman admin hanya untuk pengguna yang memiliki kredensial (username & password).

### 💡 Pendekatan yang Direkomendasikan

Karena proyek ini menggunakan **static HTML (tanpa backend server)**, kita perlu menggunakan solusi client-side yang cukup aman. Ada 3 opsi:

| Opsi | Keamanan | Kompleksitas | Cocok untuk |
|------|----------|--------------|-------------|
| **A: Login Form Sederhana** (session via localStorage) | ⭐⭐ | Rendah | MVP / Internal |
| **B: Basic Auth via .htaccess** (jika pakai Apache) | ⭐⭐⭐⭐ | Rendah | Production |
| **C: Netlify / Vercel Password Protection** | ⭐⭐⭐⭐⭐ | Sangat Rendah | Production (recommended) |

### 🔧 Implementasi Opsi A (Login Form Client-Side)

**Cocok untuk: MVP, development, staging**

#### Step 1: Buat file `admin-login.html`

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin - Markas Kebaikan</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-slate-50 flex items-center justify-center min-h-screen p-4">
    <div class="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 border border-slate-200">
        <div class="text-center mb-8">
            <div class="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
                <img src="assets/MK.ico" alt="Logo" class="w-10 h-10" />
            </div>
            <h1 class="text-2xl font-extrabold text-slate-900">Admin <span class="text-brand-600">Markas</span></h1>
            <p class="text-slate-500 text-sm mt-1">Masuk untuk mengelola penggalangan dana</p>
        </div>

        <form id="loginForm" class="space-y-5">
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <input type="text" id="loginUsername" placeholder="Masukkan username" required
                       class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <input type="password" id="loginPassword" placeholder="Masukkan password" required
                       class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>
            <div id="loginError" class="hidden bg-red-50 text-red-600 text-sm rounded-2xl px-4 py-3 border border-red-200">
                <i class="fa-solid fa-circle-exclamation mr-2"></i> Username atau password salah.
            </div>
            <button type="submit" class="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition text-sm">
                <i class="fa-solid fa-lock mr-2"></i> Masuk ke Dashboard
            </button>
        </form>

        <p class="text-center text-xs text-slate-400 mt-6">
            <a href="index.html" class="hover:text-brand-600 transition"><i class="fa-solid fa-arrow-left mr-1"></i> Kembali ke Halaman Utama</a>
        </p>
    </div>

    <script>
        // ===== KONFIGURASI LOGIN =====
        // GANTI username & password ini dengan yang Anda inginkan!
        const ADMIN_USERNAME = 'admin';
        const ADMIN_PASSWORD = 'markaskebaikan2026';

        // Hash sederhana untuk keamanan tambahan (minimal menyembunyikan dari view source langsung)
        // Sebenarnya password tetap bisa dibaca dari JS, tapi untuk static site ini cukup.
        // Untuk production: GUNAKAN Opsi B atau C (server-side auth)

        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            const errorEl = document.getElementById('loginError');

            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                // Set session flag
                sessionStorage.setItem('mk_admin_logged_in', 'true');
                window.location.href = 'admin.html';
            } else {
                errorEl.classList.remove('hidden');
                document.getElementById('loginPassword').value = '';
                document.getElementById('loginPassword').focus();
            }
        });
    </script>
</body>
</html>
```

#### Step 2: Tambahkan guard ke `admin.html`

Tambahkan script berikut di bagian `<head>` admin.html (sebelum script lain):

```html
<script>
    // Admin Authentication Guard
    (function() {
        if (sessionStorage.getItem('mk_admin_logged_in') !== 'true') {
            window.location.href = 'admin-login.html';
        }
    })();
</script>
```

#### Step 3: Tambahkan tombol Logout di Admin Page

Tambahkan di header admin.html, di samping tombol "Kembali ke Halaman Utama":

```html
<button onclick="logoutAdmin()" class="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition">
    <i class="fa-solid fa-right-from-bracket"></i> Logout
</button>
```

Dan fungsi JavaScript di `script.js`:

```javascript
function logoutAdmin() {
    sessionStorage.removeItem('mk_admin_logged_in');
    window.location.href = 'admin-login.html';
}
```

### 🔧 Implementasi Opsi B (.htaccess Basic Auth)

**Cocok untuk: Production di Apache/Nginx server**

Buat file `.htaccess` di folder yang sama dengan `admin.html`:

```apache
# .htaccess - Protect admin panel
<FilesMatch "admin\.(html|php)$">
    AuthType Basic
    AuthName "Admin Area - Markas Kebaikan"
    AuthUserFile /path/to/.htpasswd
    Require valid-user
</FilesMatch>
```

Buat file `.htpasswd` (gunakan online generator atau command line):

```bash
# Generate password hash
htpasswd -c .htpasswd admin
```

### 🔧 Implementasi Opsi C (Netlify Password Protection)

**Cocok untuk: Production — paling mudah & aman**

1. Deploy ke Netlify
2. Buka **Site settings > Access control > Visitor access**
3. Aktifkan **Password protection** untuk path `/admin*`
4. Set username & password

---

## 2. XSS Prevention (Sanitasi Input)

### 📋 Deskripsi Masalah

Data kampanye (judul, kategori, URL gambar) di-render langsung ke DOM menggunakan `innerHTML` tanpa sanitasi. Jika data mengandung tag HTML atau skrip berbahaya, maka akan dieksekusi di browser.

### 🎯 Tujuan

Semua data dari input pengguna harus disanitasi sebelum dirender ke halaman.

### 💡 Pendekatan

Kita akan membuat fungsi sanitasi sederhana (tanpa library tambahan) dan menerapkannya di semua titik render data kampanye.

### 🔧 Implementasi

#### Step 1: Buat fungsi sanitasi di `script.js`

Tambahkan fungsi berikut di bagian atas file (setelah deklarasi `STORAGE_KEY`):

```javascript
/**
 * Sanitize user input to prevent XSS attacks.
 * - Escape HTML special characters
 * - Strip dangerous tags
 * - Limit string length
 */
function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    
    // Batasi panjang maksimal (2000 karakter)
    const truncated = str.slice(0, 2000);
    
    // Escape HTML entities
    const map = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    
    return truncated.replace(/[&<>"'/]/g, function(char) {
        return map[char];
    });
}
```

#### Step 2: Terapkan sanitasi di semua fungsi render

**A. Fungsi `renderAdminCampaignList()` — sanitasi `c.title` dan `c.category`:**

```javascript
// Di dalam renderAdminCampaignList(), ubah:
<h3 class="text-base font-bold text-slate-900">${c.title}</h3>
// menjadi:
<h3 class="text-base font-bold text-slate-900">${sanitizeHTML(c.title)}</h3>

// Dan:
<p class="text-xs uppercase tracking-[0.16em] text-brand-600 font-semibold mt-1">${c.category}</p>
// menjadi:
<p class="text-xs uppercase tracking-[0.16em] text-brand-600 font-semibold mt-1">${sanitizeHTML(c.category)}</p>
```

**B. Fungsi `renderCampaigns()` — sanitasi semua data kampanye:**

```javascript
// Di dalam renderCampaigns(), ubah semua ${c.title}, ${c.category} menjadi:
${sanitizeHTML(c.title)}
${sanitizeHTML(c.category)}
```

**C. Sanitasi input di form admin (`handleAdminFormSubmit`):**

```javascript
// Di handleAdminFormSubmit(), tambahkan sanitasi setelah trim:
const title = sanitizeHTML(document.getElementById('adminTitle').value.trim());
const category = sanitizeHTML(document.getElementById('adminCategory').value.trim());
const image = sanitizeURL(document.getElementById('adminImage').value.trim()); // URL khusus

// Tambahkan fungsi sanitasi URL:
function sanitizeURL(url) {
    if (typeof url !== 'string') return '';
    try {
        const parsed = new URL(url);
        // Hanya izinkan http dan https protocol
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (e) {
        // URL tidak valid
    }
    return '';
}
```

#### Step 3: Validasi tambahan saat menyimpan data

```javascript
// Di handleAdminFormSubmit(), validasi lebih ketat:
// Sebelum validation check, tambahkan cek XSS:
const xssPattern = /<script|onerror|onload|onclick|onmouseover|javascript:/i;
if (xssPattern.test(title) || xssPattern.test(category)) {
    showToast('Input mengandung karakter yang tidak diizinkan.', true);
    return;
}
```

#### Step 4: Alternatif — gunakan DOMPurify (untuk proteksi lebih kuat)

Jika ingin proteksi yang lebih menyeluruh, tambahkan library DOMPurify:

```html
<!-- Di index.html & admin.html, tambahkan setelah FontAwesome -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.0/purify.min.js"></script>
```

Kemudan ganti `sanitizeHTML()` menjadi:

```javascript
function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
```

---

## 3. Integrasi Payment Gateway

### 📋 Deskripsi Masalah

Saat ini donasi hanya simulasi (menambah `collected` di JavaScript). Tidak ada pemrosesan pembayaran riil sehingga platform tidak bisa menerima donasi sungguhan.

### 🎯 Tujuan

Mengintegrasikan payment gateway agar donasi benar-benar diproses dan dana masuk ke rekening platform.

### 💡 Pendekatan yang Direkomendasikan

Untuk static site tanpa backend, **Midtrans Snap** adalah opsi terbaik karena bisa diintegrasikan via JavaScript tanpa server backend (menggunakan Snap token dari Midtrans).

| Gateway | Integration Type | Cocok untuk | Biaya |
|---------|-----------------|-------------|-------|
| **Midtrans Snap** | Client-side + minimal backend | Static site + mini backend | 3.9% + Rp 2.000/transaksi |
| **Xendit** | Client-side + backend | Produk digital | 1-4% |
| **QRIS API (direct)** | Backend-heavy | Aplikasi besar | 0.7% |
| **Manual (rekening bank)** | Tanpa API | MVP | 0% |

### 🔧 Implementasi dengan Midtrans Snap

#### Step 1: Setup Midtrans Account

1. Daftar di [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Dapatkan **Server Key** & **Client Key**
3. Aktifkan metode pembayaran yang diinginkan (QRIS, GoPay, BCA Virtual Account, dll.)

#### Step 2: Buat file `api/create-transaction.js` (sebagai backend minimal)

Karena Midtrans Snap membutuhkan token dari server, kita perlu backend kecil. Bisa menggunakan **Vercel Serverless Functions** atau **Cloudflare Workers**.

**Contoh dengan Vercel Serverless (Node.js):**

```javascript
// api/create-transaction.js
const midtransClient = require('midtrans-client');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { amount, donorName, donorPhone, campaignId, campaignTitle } = req.body;

        // Validasi
        if (!amount || amount < 10000) {
            return res.status(400).json({ error: 'Minimal donasi Rp 10.000' });
        }

        // Initialize Midtrans Snap API
        const snap = new midtransClient.Snap({
            isProduction: false, // Ubah ke true saat production
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY
        });

        const orderId = `MK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount
            },
            credit_card: { secure: true },
            customer_details: {
                first_name: donorName || 'Hamba Allah',
                phone: donorPhone || '-'
            },
            item_details: [{
                id: campaignId || 'MK-001',
                price: amount,
                quantity: 1,
                name: `Donasi: ${campaignTitle || 'Program Markas Kebaikan'}`
            }],
            callbacks: {
                finish: `https://markaskebaikan.org/donasi-sukses.html?order_id=${orderId}`,
                error: `https://markaskebaikan.org/donasi-gagal.html?order_id=${orderId}`
            }
        };

        const transaction = await snap.createTransaction(parameter);
        
        res.status(200).json({
            token: transaction.token,
            redirect_url: transaction.redirect_url,
            order_id: orderId
        });

    } catch (error) {
        console.error('Midtrans error:', error);
        res.status(500).json({ error: 'Gagal membuat transaksi' });
    }
};
```

#### Step 3: Update `processDonation()` di `script.js`

```javascript
async function processDonation(e) {
    e.preventDefault();
    
    const campaignId = document.getElementById('modalCampaignId').value;
    const amount = parseInt(document.getElementById('customAmount').value, 10);
    const donorName = document.getElementById('donorName').value;
    const donorPhone = document.getElementById('donorPhone').value;
    const campaignTitle = document.getElementById('modalCampaignTitle').innerText;

    if (!amount || amount < 10000) {
        showToast('Nominal minimal sedekah adalah Rp 10.000', true);
        return;
    }

    // Disable button untuk mencegah double click
    const submitBtn = document.querySelector('#donationForm button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memproses...';

    try {
        // Panggil API backend untuk membuat transaksi
        const response = await fetch('https://api-markaskebaikan.vercel.app/api/create-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount,
                donorName,
                donorPhone,
                campaignId,
                campaignTitle
            })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Gagal membuat transaksi');

        // Simpan data donasi ke localStorage untuk tracking
        const donationRecord = {
            id: data.order_id,
            campaignId,
            amount,
            donorName,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        const donations = JSON.parse(localStorage.getItem('mk_donations') || '[]');
        donations.unshift(donationRecord);
        localStorage.setItem('mk_donations', JSON.stringify(donations));

        // Buka Midtrans Snap popup
        window.snap.pay(data.token, {
            onSuccess: function(result) {
                updateCampaignProgress(campaignId, amount);
                closeDonationModal();
                showToast(`✅ Terima kasih ${donorName}! Pembayaran berhasil.`);
            },
            onPending: function(result) {
                closeDonationModal();
                showToast(`⏳ Pembayaran sedang diproses. Cek status di WhatsApp Anda.`);
            },
            onError: function(result) {
                showToast(`❌ Pembayaran gagal. Silakan coba lagi.`, true);
            },
            onClose: function() {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Lanjutkan Pembayaran <i class="fa-solid fa-arrow-right ml-2 text-sm"></i>';
            }
        });

    } catch (error) {
        console.error('Donation error:', error);
        showToast('Terjadi kesalahan. Silakan coba lagi.', true);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Lanjutkan Pembayaran <i class="fa-solid fa-arrow-right ml-2 text-sm"></i>';
    }
}

// Fungsi untuk update progress setelah pembayaran sukses
function updateCampaignProgress(campaignId, amount) {
    const campaignIndex = campaignsData.findIndex(c => c.id === campaignId);
    if (campaignIndex !== -1) {
        campaignsData[campaignIndex].collected += amount;
        saveCampaignsToStorage();
        renderCampaigns();
    }
}
```

#### Step 4: Tambahkan Midtrans Snap JS di `index.html`

```html
<!-- Di index.html, sebelum </body>, tambahkan: -->
<script src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key="{MIDTRANS_CLIENT_KEY}"></script>
```

#### Step 5: Buat halaman konfirmasi (opsional)

Buat `donasi-sukses.html` dan `donasi-gagal.html` untuk redirect setelah pembayaran.

### 💡 Alternatif Lebih Sederhana: Manual Confirmation

Jika integrasi Midtrans terlalu kompleks untuk saat ini, bisa menggunakan metode **manual confirmation**:

1. Tampilkan QRIS statis / nomor rekening di modal donasi
2. User transfer manual
3. User upload bukti transfer via WhatsApp (link wa.me)
4. Admin verifikasi manual dan update progress

Ini bisa diimplementasikan dalam 1 hari tanpa backend.

#### Implementasi Metode Manual:

```javascript
function processDonation(e) {
    e.preventDefault();
    
    const amount = parseInt(document.getElementById('customAmount').value, 10);
    const donorName = document.getElementById('donorName').value;
    const donorPhone = document.getElementById('donorPhone').value;
    const donorPrayer = document.getElementById('donorPrayer').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!amount || amount < 10000) {
        showToast('Nominal minimal sedekah adalah Rp 10.000', true);
        return;
    }

    // Buat pesan WhatsApp
    const message = encodeURIComponent(
        `Halo Markas Kebaikan! Saya ingin konfirmasi donasi:\n\n` +
        `Nama: ${donorName}\n` +
        `Nominal: Rp ${amount.toLocaleString('id-ID')}\n` +
        `Metode Pembayaran: ${paymentMethod}\n` +
        `Doa: ${donorPrayer || '-'}\n\n` +
        `*[Mohon kirimkan bukti transfer setelah melakukan pembayaran]*`
    );

    // Buka WhatsApp
    window.open(`https://wa.me/6285697570255?text=${message}`, '_blank');

    // Tutup modal & show toast
    closeDonationModal();
    showToast(`📱 Silakan transfer Rp ${amount.toLocaleString('id-ID')} ke rekening yang tertera, lalu kirim bukti via WA.`);
}
```

---

## 4. Optimasi Performa & Build Tailwind

### 📋 Deskripsi Masalah

Tailwind CSS dimuat via CDN (version dev) yang menyebabkan:
- **Render-blocking** — halaman tidak tampil sampai CSS selesai diunduh
- **Ukuran file besar** (~350KB) karena seluruh utility class termuat
- **Tidak ada purging** — class yang tidak terpakai tetap di-download

### 🎯 Tujuan

Mengurangi waktu loading halaman dengan mengoptimasi CSS, gambar, dan resource.

### 💡 Pendekatan

| Taktik | Dampak | Effort |
|--------|--------|--------|
| **A: Build CSS lokal dengan Tailwind CLI** | Ukuran CSS turun 90% | Sedang |
| **B: Pindahkan Google Fonts ke system font** | 1 request lebih sedikit | Rendah |
| **C: Optimasi gambar** | Ukuran halaman turun 70% | Rendah |
| **D: Gunakan resource hints / preload** | Loading terasa lebih cepat | Rendah |

### 🔧 Implementasi A: Build Tailwind Lokal

#### Step 1: Install Tailwind CLI via npm

```bash
# Di folder project
npm init -y
npm install -D tailwindcss
npx tailwindcss init
```

#### Step 2: Konfigurasi `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './*.html',  // Semua HTML di root
        './*.js',    // Script.js juga mengandung class
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    500: '#10b981',
                    600: '#1a1a1a',
                    700: '#047857',
                    800: '#065f46',
                },
                accent: {
                    500: '#f59e0b',
                    600: '#d97706',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        }
    },
    plugins: [],
}
```

#### Step 3: Buat file CSS input `src/input.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
.glass-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #10b981;
    border-radius: 4px;
}
```

#### Step 4: Build CSS

```bash
# Build untuk development
npx tailwindcss -i ./src/input.css -o ./dist/tailwind.css --watch

# Build untuk production (dengan purging & minify)
npx tailwindcss -i ./src/input.css -o ./dist/tailwind.css --minify
```

#### Step 5: Update `index.html` dan `admin.html`

```html
<!-- HAPUS CDN Tailwind -->
<!-- <script src="https://cdn.tailwindcss.com"></script> -->

<!-- GANTI dengan link ke CSS lokal -->
<link rel="stylesheet" href="dist/tailwind.css">
<link rel="stylesheet" href="styles.css">
```

#### Step 6: Hapus inline Tailwind config dari HTML

```html
<!-- HAPUS script block ini dari index.html & admin.html -->
<script>
    tailwind.config = {
        theme: {
            extend: {
                colors: { ... },
                fontFamily: { ... }
            }
        }
    }
</script>
```

**Hasil:** Ukuran CSS turun dari ~350KB menjadi ~15-30KB (tergantung class yang dipakai).

### 🔧 Implementasi B: Optimasi Google Fonts

#### Opsi 1: Preconnect + Display Swap

```html
<!-- Di <head>, ubah dari yang sekarang menjadi: -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<!-- Perhatikan: sudah ada &display=swap — ini sudah baik -->
```

#### Opsi 2: Gunakan System Font Stack (Tercepat)

```css
/* Di styles.css atau tailwind config */
fontFamily: {
    sans: [
        'Inter', 
        'system-ui', 
        '-apple-system', 
        'BlinkMacSystemFont', 
        'Segoe UI', 
        'Roboto', 
        'sans-serif'
    ],
}
```

### 🔧 Implementasi C: Optimasi Gambar

#### 1. Tambahkan `loading="lazy"` ke semua gambar

```html
<!-- Di index.html, tambahkan loading="lazy" ke setiap tag <img> -->
<img src="..." alt="..." loading="lazy" />
```

#### 2. Tambahkan `width` dan `height` untuk mencegah Cumulative Layout Shift (CLS)

```html
<img src="..." alt="..." loading="lazy" width="800" height="400" />
```

#### 3. Gunakan Unsplash dengan parameter optimasi

```javascript
// Di script.js, update URL gambar Unsplash:
// Dari:
'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop'
// Menjadi (WebP + ukuran lebih kecil + kualitas lebih rendah):
'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=75&w=600&auto=format&fit=crop&fm=webp'
```

#### 4. Gunakan fallback gambar lokal (jika offline)

```html
<img src="..." alt="..." loading="lazy" 
     onerror="this.src='assets/placeholder.jpg'" />
```

### 🔧 Implementasi D: Resource Hints

```html
<!-- Di <head> index.html, tambahkan preload untuk resource penting -->
<!-- Preload logo -->
<link rel="preload" href="assets/MK.ico" as="image">

<!-- Preconnect ke origin pihak ketiga -->
<link rel="preconnect" href="https://images.unsplash.com">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdnjs.cloudflare.com">

<!-- DNS prefetch -->
<link rel="dns-prefetch" href="//images.unsplash.com">
<link rel="dns-prefetch" href="//fonts.googleapis.com">
```

### 📊 Target Hasil Optimasi

| Metrik | Sebelum | Sesudah (Estimasi) |
|--------|---------|-------------------|
| **CSS size** | ~350KB (CDN) | ~20KB (build lokal) |
| **Total requests** | ~15 | ~10 |
| **Page size** | ~1.5 MB | ~500 KB |
| **FCP** | ~2.5s | ~1.2s |
| **LCP** | ~4s | ~2s |
| **Lighthouse Score** | ~55 | ~85+ |

---

## 5. Timeline & Prioritas Eksekusi

### 📅 Urutan Prioritas (Berdasarkan Dampak x Urgensi)

| Prioritas | Task | Estimasi Waktu | Dampak |
|-----------|------|----------------|--------|
| **P1** | 🔴 Autentikasi Admin | 2 jam | Keamanan — HIGH |
| **P2** | 🔴 XSS Sanitasi Input | 1 jam | Keamanan — HIGH |
| **P3** | 🔴 Optimasi Tailwind CSS (Build Lokal) | 2 jam | Performa — HIGH |
| **P4** | 🟡 Payment Gateway Integration | 2-3 hari | Fungsionalitas — HIGH |
| **P5** | 🟡 Optimasi Gambar (Lazy Loading, WebP, Resize) | 1 jam | Performa — MEDIUM |
| **P6** | 🟡 Resource Hints (Preconnect, Preload) | 30 menit | Performa — MEDIUM |
| **P7** | 🟡 Meta Tags (OG, Description, Twitter Card) | 30 menit | SEO — MEDIUM |
| **P8** | 🟢 Alt: Focus Trap Modal | 1 jam | Aksesibilitas — LOW |
| **P9** | 🟢 Alt: Inline → addEventListener | 1 jam | Code Quality — LOW |

### 📅 Timeline Visual

```
Hari 1:  [P1] [P2] [P3] [P6] [P7]
         (Autentikasi, XSS, Build Tailwind, Resource Hints, Meta Tags)
          → Hasi: Admin aman + Performa naik + SEO membaik
          
Hari 2-4: [P4] Payment Gateway (atau manual confirmation dalam 1 hari)
          → Hasil: Platform bisa menerima donasi sungguhan

Hari 5:   [P5] [P8] [P9]
          (Optimasi gambar, Focus trap, Code cleanup)
          → Hasil: Landing page production-ready
```

### 💎 Catatan Akhir

1. **Autentikasi (P1)** dan **XSS (P2)** adalah **Wajib** — tanpa ini, platform rentan diserang.
2. **Build Tailwind Lokal (P3)** sangat dianjurkan sebelum production — akan mengurangi ukuran halaman secara drastis.
3. **Payment Gateway (P4)** adalah nilai jual utama — platform belum bisa menghasilkan uang tanpa ini.
4. Semua perubahan bersifat **non-destruktif** — bisa diimplementasikan bertahap tanpa merusak fungsi yang sudah ada.
5. Jika ragu, mulai dari **Manual Confirmation (alternatif P4)** — hanya butuh 1 hari dan bisa langsung digunakan.
