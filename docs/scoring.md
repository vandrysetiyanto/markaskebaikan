# 🏆 Scoring Website — Markas Kebaikan

> **QC/QA Assessment** oleh Tech Lead  
> **Tanggal:** 24 Juli 2026  
> **Total Skor Akhir:** **72 / 100** (Cukup — Banyak yang perlu diperbaiki)

---

## 10 Dimensi Penilaian

### 1. Code Quality — 60/100 (Bobot 15%)

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| DRY Principle | 50 | Duplikasi fungsi modal controller di inline script + script.js (sekarang sudah diperbaiki, tapi sebelumnya parah) |
| Error Handling | 60 | Toast untuk error, tapi tidak ada fallback untuk localStorage penuh atau JSON corrupt |
| Konsistensi | 65 | Campuran ES5 (`var`, `function`) dan ES6 (`const`, `let`, arrow function di beberapa tempat) |
| Modularitas | 55 | Satu file `script.js` untuk landing page + admin — banyak fungsi admin dipanggil padahal tidak ada di landing |
| Comments | 70 | Ada section headers, beberapa fungsi sudah di-document |

**Rekomendasi:** Pisahkan `script.js` menjadi `landing.js` + `admin.js`. Gunakan `const`/`let` konsisten.

---

### 2. UI/UX — 78/100 (Bobot 15%)

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| Responsif | 85 | Grid naik turun, mobile menu, touch targets ok |
| Feedback Visual | 70 | Toast notification sudah ada, tapi tidak ada loading state saat simpan kampanye |
| Konsistensi Desain | 80 | Brand color konsisten, tipografi rapi, spacing oke |
| Modal/Popup | 75 | Sudah ada animasi, tapi masih plain CSS (tidak pakai @apply yang rusak) |
| Form UX | 70 | Validasi form sudah ada tapi tidak ada inline error message — hanya toast |

**Rekomendasi:** Tambahkan loading spinner saat submit form, validasi inline di field.

---

### 3. Security — 55/100 (Bobot 15%)

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| XSS Protection | 70 | Ada `sanitizeHTML()` — sudah lumayan, tapi regex XSS pattern masih bisa dilewati |
| Sanitasi Input | 60 | `sanitizeURL()` sudah ada, tapi tidak ada rate limiting |
| Auth Session | 60 | SessionStorage untuk admin login — bisa di-bypass via console, tidak ada expiry |
| CSRF | 0 | Tidak ada token CSRF sama sekali (semua GET/POST dari onclick) |
| Data Storage | 80 | localStorage — aman dari XSS injection di context penyimpanan, tapi data tidak terenkripsi |

**Rekomendasi:** 
- Gunakan HTTP-only cookies + server-side session (jika ada backend)
- Minimal: tambahkan expiry timestamp di sessionStorage
- Validasi input server-side jika ada backend

---

### 4. Performance — 82/100 (Bobot 10%)

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| Resource Hints | 90 | Sudah ada `preconnect`, `dns-prefetch`, `preload` ✅ |
| Lazy Loading | 85 | `loading="lazy"` di gambar ✅ |
| Bundle Size | 75 | Tailwind CDN (279KB min) + FontAwesome (110KB) — cukup besar untuk halaman statis |
| Render Blocking | 70 | Tailwind dan FontAwesome via CDN — blocking render |
| Caching | 90 | Browser cache untuk asset statis via CDN |

**Rekomendasi:** Kecilkan bundle: gunakan Tailwind JIT (generate minified CSS) daripada CDN. FontAwesome ganti dengan subset SVG icons.

---

### 5. Data Integrity — 65/100 (Bobot 10%)

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| CRUD Consistency | 70 | Create, Read, Update, Delete berfungsi dengan benar setelah fix ID mismatch |
| localStorage Sync | 60 | `pendingCollected` di-recalc saat load, tapi tidak ada mekanisme fallback jika data corrupt |
| Validation | 70 | Frontend validation sudah ada (min amount, file type, phone regex) |
| State Management | 60 | `campaignsData` array di memory + localStorage — rentan desync jika user buka 2 tab |
| Export | 65 | CSV dan Excel export berfungsi, tapi tidak ada import backup |

**Rekomendasi:** 
- Gunakan `storage` event listener untuk sync antar tab
- Backup otomatis data lama sebelum overwrite
- Validasi format CSV saat import (jika ditambahkan nanti)

---

### 6. SEO — 85/100 (Bobot 5%)

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| Meta Tags | 90 | Description, keywords, OG, Twitter Card, canonical ✅ |
| Semantic HTML | 85 | `header`, `section`, `footer`, `nav`, `main` digunakan ✅ |
| Structured Data | 0 | **Tidak ada JSON-LD / schema.org** sama sekali ❌ |
| Heading Hierarchy | 90 | H1 → H2 → H3 rapi ✅ |
| Alt Text | 75 | Beberapa gambar tidak punya `alt` text deskriptif |

**Rekomendasi:** Tambahkan JSON-LD (Organization, WebSite, Event). Perbaiki alt text gambar yang kurang.

---

### 7. Mobile Readiness — 88/100 (Bobot 10%)

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| Touch Targets | 85 | Minimal 44px, tapi ada beberapa tombol kecil di admin (filter) |
| Mobile Nav | 90 | Hamburger menu + drawer ✅ |
| Responsive Grid | 90 | Grid breakpoint 1→2→3 kolom ✅ |
| Font Readability | 90 | Font size cukup, line-height oke |
| Viewport | 95 | Viewport meta ✅, scroll behavior smooth |

**Rekomendasi:** Tingkatkan ukuran touch target untuk filter dropdown di mobile admin.

---

### 8. Maintainability — 45/100 (Bobot 10%)

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| File Organization | 40 | **Semua file di root** — campur aduk HTML, JS, CSS, markdown, gambar |
| Naming Convention | 50 | `admin-login.html` vs `admin.html` — tidak konsisten. `script.js` untuk 2 halaman |
| Git Hygiene | 60 | Ada commit history, tapi tidak ada .gitignore yang proper |
| Documentation | 30 | Tidak ada dokumentasi struktur, data flow, atau deployment |
| CSS Management | 40 | CSS tercecer: inline di admin.html + index.html + styles.css (hanya 17 baris) |

**Rekomendasi:** 
- **Restrukturisasi folder** (lihat proposal di bawah)
- **Pisahkan script.js** → landing.js + admin.js
- **Buat README yang proper**
- **Buat dokumentasi struktur & data flow** (file ini)

---

### 9. Bug Count — 60/100 (Bobot 5%)

| Tingkat | Jumlah | Detail |
|---------|--------|--------|
| 🔴 Critical | 1 | ID container mismatch — kampanye baru tidak muncul di index (✅ sudah fix) |
| 🟡 High | 2 | `@apply` di CSS tidak diproses oleh Tailwind CDN (✅ sudah fix). Double function definition modal controller (✅ sudah fix) |
| 🟢 Low | 2 | `brand-50/60` opacity di drag zone mungkin tidak support di beberapa browser. `pendingCollected` tidak visible jika 0. |

**Skor:** Dari 5 bug yang teridentifikasi, 3 sudah fix. Score = (5-2)/5 * 100 = 60

---

### 10. Accessibility — 65/100 (Bobot 5%)

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| Alt Text | 70 | Ada alt text tapi beberapa generic ("Logo", "Preview") |
| ARIA Labels | 30 | Hampir tidak ada `aria-label`, `role`, `aria-hidden` |
| Keyboard Navigation | 50 | Form bisa di-tab via default, tapi modal tidak trap focus |
| Color Contrast | 80 | Brand colors kontras cukup baik (dark #1a1a1a vs putih) |
| Focus Indicator | 60 | `focus:ring` di input, tapi tombol tidak semua punya visible focus |

**Rekomendasi:** Tambahkan focus trap di modal, `aria-label` di icon-only buttons, `role="dialog"` di modal.

---

## 📊 Final Score

| # | Dimensi | Bobot | Skor | Kontribusi |
|---|---------|-------|------|------------|
| 1 | Code Quality | 15% | 60 | 9.0 |
| 2 | UI/UX | 15% | 78 | 11.7 |
| 3 | Security | 15% | 55 | 8.3 |
| 4 | Performance | 10% | 82 | 8.2 |
| 5 | Data Integrity | 10% | 65 | 6.5 |
| 6 | SEO | 5% | 85 | 4.3 |
| 7 | Mobile Readiness | 10% | 88 | 8.8 |
| 8 | Maintainability | 10% | 45 | 4.5 |
| 9 | Bug Count | 5% | 60 | 3.0 |
| 10 | Accessibility | 5% | 65 | 3.3 |
| | **TOTAL** | **100%** | | **72** |

> **Grade: C** (Cukup)
> - A (90-100): Excellent
> - B (80-89): Baik
> - C (70-79): Cukup ← **Sekarang**
> - D (60-69): Kurang
> - E (<60): Sangat Kurang

---

## 🚀 Prioritas Perbaikan

| Priority | Area | Dampak | Estimasi Waktu |
|----------|------|--------|----------------|
| 🔴 P1 | Pisahkan script.js → landing.js + admin.js | Maintainability + 10 poin | 30 menit |
| 🔴 P1 | Restrukturisasi folder | Maintainability + 10 poin | 20 menit |
| 🟡 P2 | Security: expiry session + rate limiting | Security + 10 poin | 1 jam |
| 🟡 P2 | CSS migrated ke satu file | Maintainability + 5 poin | 15 menit |
| 🟢 P3 | JSON-LD structured data | SEO + 10 poin | 10 menit |
| 🟢 P3 | ARIA labels + keyboard focus trap | Accessibility + 15 poin | 30 menit |