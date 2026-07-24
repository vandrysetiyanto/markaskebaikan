// ============================================
// ADMIN MODAL CONTROLLER (inline - no conflict)
// ============================================

function openCampaignModal() {
    var modal = document.getElementById('campaignModal');
    if (!modal) { alert('ERROR: Modal kampanye tidak ditemukan di DOM.'); return; }
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    var title = document.getElementById('modalFormTitle');
    if (title) title.innerText = 'Tambah Kampanye Baru';
    var btn = document.getElementById('adminSubmitBtn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Kampanye';
    // Reset form fields
    resetAdminForm();
}

function closeCampaignModal() {
    var modal = document.getElementById('campaignModal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    var form = document.getElementById('adminCampaignForm');
    if (form) form.reset();
    document.getElementById('adminCampaignId').value = '';
    document.getElementById('adminImage').value = '';
    document.getElementById('adminCancelBtn').classList.add('hidden');
    var pc = document.getElementById('imagePreviewContainer');
    var ph = document.getElementById('imagePlaceholder');
    if (pc) pc.classList.add('hidden');
    if (ph) ph.classList.remove('hidden');
    document.getElementById('urlPreviewContainer').classList.add('hidden');
    document.getElementById('adminImageUrl').value = '';
    document.getElementById('imageFileInput').value = '';
}

function switchAdminTab(tab) {
    var tabCampaigns = document.getElementById('tabCampaigns');
    var tabDonors = document.getElementById('tabDonors');
    var tabPrograms = document.getElementById('tabPrograms');
    var contentCampaigns = document.getElementById('tabContentCampaigns');
    var contentDonors = document.getElementById('tabContentDonors');
    var contentPrograms = document.getElementById('tabContentPrograms');
    if (!tabCampaigns || !tabDonors || !tabPrograms || !contentCampaigns || !contentDonors || !contentPrograms) return;
    
    tabCampaigns.className = 'tab-btn inactive';
    tabDonors.className = 'tab-btn inactive';
    tabPrograms.className = 'tab-btn inactive';
    contentCampaigns.classList.add('hidden');
    contentDonors.classList.add('hidden');
    contentPrograms.classList.add('hidden');
    
    if (tab === 'campaigns') {
        tabCampaigns.className = 'tab-btn active';
        contentCampaigns.classList.remove('hidden');
    } else if (tab === 'donors') {
        tabDonors.className = 'tab-btn active';
        contentDonors.classList.remove('hidden');
    } else if (tab === 'programs') {
        tabPrograms.className = 'tab-btn active';
        contentPrograms.classList.remove('hidden');
        renderAdminProgramDonations();
    }
}

// ============================================
// DONOR SEARCH & FILTER
// ============================================

var allDonorsCache = [];

function renderAdminDonorList() {
    var container = document.getElementById('adminDonorList');
    if (!container) return;
    var donors = getDonors();
    allDonorsCache = donors;
    applyDonorFilter();
}

function applyDonorFilter() {
    var container = document.getElementById('adminDonorList');
    if (!container) return;
    var searchQuery = (document.getElementById('donorSearchInput').value || '').toLowerCase().trim();
    var statusFilter = document.getElementById('donorFilterStatus').value;
    var filtered = allDonorsCache.filter(function(d) {
        if (statusFilter !== 'all' && d.status !== statusFilter) return false;
        if (searchQuery && d.name.toLowerCase().indexOf(searchQuery) === -1) return false;
        return true;
    });
    if (filtered.length === 0) {
        container.innerHTML = '<div class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">' +
            (allDonorsCache.length === 0
                ? 'Belum ada data donatur. Data akan muncul setelah ada donasi yang masuk.'
                : 'Tidak ada donatur yang cocok dengan pencarian.') +
            '</div>';
        return;
    }
    container.innerHTML = filtered.map(function(d) {
        var safeName = sanitizeHTML(d.name);
        var safePhone = sanitizeHTML(d.phone || '-');
        var safePrayer = sanitizeHTML(d.prayer || '-');
        var safeCampaign = sanitizeHTML(d.campaignTitle || '-');
        var safePayment = sanitizeHTML(d.paymentMethod || '-');
        var statusBadge = d.status === 'confirmed'
            ? '<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold"><i class="fa-solid fa-circle-check"></i> Dikonfirmasi</span>'
            : '<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"><i class="fa-solid fa-clock"></i> Menunggu</span>';
        return '<div class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"><div class="p-5">' +
            '<div class="flex items-center justify-between gap-3 mb-3"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">' + d.name.charAt(0).toUpperCase() + '</div><div><h4 class="text-sm font-bold text-slate-900">' + safeName + '</h4><p class="text-xs text-slate-500">' + safePhone + '</p></div></div><div class="text-xs">' + statusBadge + '</div></div>' +
            '<div class="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">' +
            '<div><span class="text-slate-400">Nominal:</span> <strong class="text-slate-900">' + formatRupiah(d.amount) + '</strong></div>' +
            '<div><span class="text-slate-400">Pembayaran:</span> <strong class="text-slate-900">' + safePayment + '</strong></div>' +
            '<div class="col-span-2"><span class="text-slate-400">Program:</span> <strong class="text-slate-900">' + safeCampaign + '</strong></div>' +
            '<div class="col-span-2"><span class="text-slate-400">Doa:</span> <em class="text-slate-700">"' + safePrayer + '"</em></div>' +
            '<div class="col-span-2"><span class="text-slate-400">Tanggal:</span> ' + formatDate(d.date) + '</div></div>' +
            '<div class="flex flex-wrap gap-2">' +
            (d.status === 'pending' ? '<button type="button" onclick="confirmDonor(\'' + d.id + '\')" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"><i class="fa-solid fa-check"></i> Konfirmasi</button>' : '') +
            '<button type="button" onclick="deleteDonor(\'' + d.id + '\')" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"><i class="fa-solid fa-trash"></i> Hapus</button></div></div></div>';
    }).join('');
}

function filterDonors() {
    applyDonorFilter();
}

// ============================================
// IMAGE UPLOAD & PREVIEW (Drag & Drop + File + URL)
// ============================================

var currentImageData = '';

function switchImageTab(tab) {
    var uploadZone = document.getElementById('imageUploadZone');
    var urlInput = document.getElementById('imageUrlInput');
    var tabUpload = document.getElementById('imageTabUpload');
    var tabUrl = document.getElementById('imageTabUrl');

    if (tab === 'upload') {
        uploadZone.classList.remove('hidden');
        urlInput.classList.add('hidden');
        tabUpload.className = 'flex-1 py-2 rounded-lg bg-white text-slate-900 shadow-sm transition';
        tabUrl.className = 'flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-700 transition';
    } else {
        uploadZone.classList.add('hidden');
        urlInput.classList.remove('hidden');
        tabUpload.className = 'flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-700 transition';
        tabUrl.className = 'flex-1 py-2 rounded-lg bg-white text-slate-900 shadow-sm transition';
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    var zone = document.getElementById('imageUploadZone');
    zone.classList.add('border-brand-500', 'bg-brand-50/60');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    var zone = document.getElementById('imageUploadZone');
    zone.classList.remove('border-brand-500', 'bg-brand-50/60');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    var zone = document.getElementById('imageUploadZone');
    zone.classList.remove('border-brand-500', 'bg-brand-50/60');
    var files = e.dataTransfer.files;
    if (files && files.length > 0) processImageFile(files[0]);
}

function handleFileSelect(e) {
    var files = e.target.files;
    if (files && files.length > 0) processImageFile(files[0]);
}

function processImageFile(file) {
    var allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedTypes.indexOf(file.type) === -1) {
        showToast('Hanya file PNG, JPG, atau WebP yang diizinkan.', true);
        return;
    }
    var maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('Ukuran gambar maksimal 1MB. Pilih file yang lebih kecil.', true);
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        var base64 = e.target.result;
        currentImageData = base64;
        document.getElementById('adminImage').value = base64;
        var preview = document.getElementById('imagePreview');
        var previewContainer = document.getElementById('imagePreviewContainer');
        var placeholder = document.getElementById('imagePlaceholder');
        preview.src = base64;
        previewContainer.classList.remove('hidden');
        placeholder.classList.add('hidden');
        showToast('Gambar berhasil diupload (' + (file.size / 1024).toFixed(0) + ' KB)');
    };
    reader.onerror = function() { showToast('Gagal membaca file gambar.', true); };
    reader.readAsDataURL(file);
}

function removeUploadedImage() {
    currentImageData = '';
    document.getElementById('adminImage').value = '';
    document.getElementById('imagePreviewContainer').classList.add('hidden');
    document.getElementById('imagePlaceholder').classList.remove('hidden');
    document.getElementById('imageFileInput').value = '';
}

function previewUrlImage(url) {
    var container = document.getElementById('urlPreviewContainer');
    var preview = document.getElementById('urlPreview');
    if (!url || url.trim() === '') {
        container.classList.add('hidden');
        currentImageData = '';
        document.getElementById('adminImage').value = '';
        return;
    }
    preview.src = url;
    preview.onload = function() {
        container.classList.remove('hidden');
        currentImageData = url;
        document.getElementById('adminImage').value = url;
        document.getElementById('imagePreviewContainer').classList.add('hidden');
        document.getElementById('imagePlaceholder').classList.remove('hidden');
        document.getElementById('imageFileInput').value = '';
    };
    preview.onerror = function() {
        container.classList.add('hidden');
        currentImageData = '';
        document.getElementById('adminImage').value = '';
    };
}

function removeUrlImage() {
    document.getElementById('urlPreviewContainer').classList.add('hidden');
    document.getElementById('adminImageUrl').value = '';
    currentImageData = '';
    document.getElementById('adminImage').value = '';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    var truncated = str.slice(0, 2000);
    var amp = String.fromCharCode(38);
    var lt = String.fromCharCode(60);
    var gt = String.fromCharCode(62);
    var quot = String.fromCharCode(34);
    var apos = String.fromCharCode(39);
    return truncated
        .replace(new RegExp(amp, 'g'), amp + 'amp;')
        .replace(new RegExp(lt, 'g'), amp + 'lt;')
        .replace(new RegExp(gt, 'g'), amp + 'gt;')
        .replace(new RegExp(quot, 'g'), amp + 'quot;')
        .replace(/'/g, amp + '#x27;')
        .replace(new RegExp(String.fromCharCode(47), 'g'), amp + '#x2F;');
}

function sanitizeURL(url) {
    if (typeof url !== 'string') return '';
    try {
        const parsed = new URL(url);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
    } catch (e) {}
    return '';
}

function logoutAdmin() {
    sessionStorage.removeItem('mk_admin_logged_in');
    window.location.href = 'admin-login.html';
}

// ============================================
// CAMPAIGN STATE & STORAGE
// ============================================

const campaignsData = [
    { id: '1', title: 'Patungan Beasiswa & Perlengkapan Sekolah untuk 50 Anak Yatim Dhuafa', category: 'Pendidikan', image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop', target: 50000000, collected: 42500000, pendingCollected: 0, daysLeft: 12 },
    { id: '2', title: 'Darurat Air Bersih: Bangun Sumur Bor Abadi untuk Warga Dusun Menoreh', category: 'Infrastruktur', image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1000&auto=format&fit=crop', target: 80000000, collected: 52000000, pendingCollected: 0, daysLeft: 24 },
    { id: '3', title: 'Sedekah Paket Nutrisi & Sembako Bulanan untuk 100 Lansia Dhuafa', category: 'Sedekah Rutin', image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1000&auto=format&fit=crop', target: 30000000, collected: 12000000, pendingCollected: 0, daysLeft: 8 }
];

const STORAGE_KEY_CAMPAIGNS = 'mk_campaigns';
const STORAGE_KEY_DONORS = 'mk_donors';

// ============================================
// DONOR DATA MANAGEMENT
// ============================================

function getDonors() {
    try {
        var stored = localStorage.getItem(STORAGE_KEY_DONORS);
        if (!stored) return [];
        var parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Gagal membaca data donatur:', error);
        return [];
    }
}

function saveDonor(donor) {
    try {
        var donors = getDonors();
        donors.unshift(donor);
        localStorage.setItem(STORAGE_KEY_DONORS, JSON.stringify(donors));
        return true;
    } catch (error) {
        console.warn('Gagal menyimpan data donatur:', error);
        return false;
    }
}

function deleteDonor(donorId) {
    try {
        var donors = getDonors();
        var filtered = donors.filter(function(d) { return d.id !== donorId; });
        if (filtered.length === donors.length) return false;
        localStorage.setItem(STORAGE_KEY_DONORS, JSON.stringify(filtered));
        renderAdminDonorList();
        renderAdminDonorStats();
        return true;
    } catch (error) {
        console.warn('Gagal menghapus data donatur:', error);
        return false;
    }
}

function clearAllDonors() {
    if (!window.confirm('Yakin ingin menghapus SEMUA data donatur? Tindakan ini tidak bisa dibatalkan.')) return;
    localStorage.removeItem(STORAGE_KEY_DONORS);
    renderAdminDonorList();
    renderAdminDonorStats();
    showToast('Semua data donatur berhasil dihapus.');
}

function formatDate(dateStr) {
    try {
        var d = new Date(dateStr);
        var options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return d.toLocaleDateString('id-ID', options);
    } catch (e) { return dateStr; }
}

function recalcPendingFromDonors() {
    var donors = getDonors();
    var pendingMap = {};
    donors.forEach(function(d) {
        if (d.status === 'pending') {
            pendingMap[d.campaignId] = (pendingMap[d.campaignId] || 0) + Number(d.amount);
        }
    });
    for (var i = 0; i < campaignsData.length; i++) {
        campaignsData[i].pendingCollected = pendingMap[campaignsData[i].id] || 0;
    }
}

function renderAdminDonorStats() {
    var count = document.getElementById('adminDonorCount');
    var confirmedCount = document.getElementById('adminConfirmedCount');
    var pendingCount = document.getElementById('adminPendingCount');
    var donors = getDonors();
    if (count) count.innerText = donors.length;
    var confirmed = 0, pending = 0;
    for (var i = 0; i < donors.length; i++) {
        if (donors[i].status === 'confirmed') confirmed++;
        else pending++;
    }
    if (confirmedCount) confirmedCount.innerText = confirmed;
    if (pendingCount) pendingCount.innerText = pending;
}

function confirmDonor(donorId) {
    try {
        var donors = getDonors();
        var donor = null, donorIndex = -1;
        for (var i = 0; i < donors.length; i++) {
            if (donors[i].id === donorId && donors[i].status === 'pending') {
                donor = donors[i];
                donorIndex = i;
                break;
            }
        }
        if (!donor) { showToast('Donatur tidak ditemukan atau sudah dikonfirmasi.', true); return; }
        donors[donorIndex].status = 'confirmed';
        localStorage.setItem(STORAGE_KEY_DONORS, JSON.stringify(donors));
        var campaignIndex = findCampaignIndex(donor.campaignId);
        if (campaignIndex !== -1) {
            campaignsData[campaignIndex].collected = (campaignsData[campaignIndex].collected || 0) + Number(donor.amount);
            campaignsData[campaignIndex].pendingCollected = Math.max(0, (campaignsData[campaignIndex].pendingCollected || 0) - Number(donor.amount));
            saveCampaignsToStorage();
        }
        renderCampaigns();
        renderAdminCampaignList();
        renderAdminDonorList();
        renderAdminDonorStats();
        showToast('Donasi ' + sanitizeHTML(donor.name) + ' (Rp ' + Number(donor.amount).toLocaleString('id-ID') + ') berhasil dikonfirmasi. Progress bar terupdate!');
    } catch (error) {
        console.warn('Gagal mengkonfirmasi donatur:', error);
    }
}

// ============================================
// EXPORT TO CSV / EXCEL
// ============================================

function escapeCSV(value) {
    var str = String(value || '');
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) return '"' + str.replace(/"/g, '""') + '"';
    return str;
}

function generateCSV() {
    var donors = getDonors();
    if (donors.length === 0) { showToast('Tidak ada data donatur untuk diekspor.', true); return null; }
    var headers = ['No', 'Tanggal', 'Nama Donatur', 'Nomor WA', 'Nominal', 'Metode Pembayaran', 'Program', 'Doa', 'Status'];
    var csvRows = [headers.join(',')];
    donors.forEach(function(d, i) {
        var row = [escapeCSV(i + 1), escapeCSV(formatDate(d.date)), escapeCSV(d.name), escapeCSV(d.phone || '-'), escapeCSV(d.amount), escapeCSV(d.paymentMethod || '-'), escapeCSV(d.campaignTitle || '-'), escapeCSV(d.prayer || '-'), escapeCSV(d.status === 'confirmed' ? 'Dikonfirmasi' : 'Menunggu Konfirmasi')];
        csvRows.push(row.join(','));
    });
    return csvRows.join('\n');
}

function downloadCSV() {
    var csvContent = generateCSV();
    if (!csvContent) return;
    var filename = 'data-donatur-markas-kebaikan-' + new Date().toISOString().slice(0, 10) + '.csv';
    var bom = '\uFEFF';
    var blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    showToast('File CSV berhasil diunduh: ' + filename);
}

function downloadExcel() {
    var donors = getDonors();
    if (donors.length === 0) { showToast('Tidak ada data donatur untuk diekspor.', true); return; }
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Donatur</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    html += '<style>td,th{border:1px solid #ccc;padding:6px 10px;font-family:Inter,sans-serif;font-size:12px;} th{background:#10b981;color:#fff;font-weight:700;} </style></head><body>';
    html += '<table><thead><tr><th>No</th><th>Tanggal</th><th>Nama Donatur</th><th>Nomor WA</th><th>Nominal</th><th>Metode Pembayaran</th><th>Program</th><th>Doa</th><th>Status</th></tr></thead><tbody>';
    donors.forEach(function(d, i) {
        html += '<tr><td>' + (i + 1) + '</td><td>' + formatDate(d.date) + '</td><td>' + sanitizeHTML(d.name) + '</td><td>' + sanitizeHTML(d.phone || '-') + '</td><td>' + d.amount + '</td><td>' + sanitizeHTML(d.paymentMethod || '-') + '</td><td>' + sanitizeHTML(d.campaignTitle || '-') + '</td><td>' + sanitizeHTML(d.prayer || '-') + '</td><td>' + (d.status === 'confirmed' ? 'Dikonfirmasi' : 'Menunggu Konfirmasi') + '</td></tr>';
    });
    html += '</tbody></table></body></html>';
    var filename = 'data-donatur-markas-kebaikan-' + new Date().toISOString().slice(0, 10) + '.xls';
    var blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    showToast('File Excel berhasil diunduh: ' + filename);
}

// ============================================
// CAMPAIGN STORAGE FUNCTIONS
// ============================================

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
}

function loadCampaignsFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.length === 0) return;
        for (var i = 0; i < parsed.length; i++) {
            if (typeof parsed[i].pendingCollected === 'undefined') parsed[i].pendingCollected = 0;
        }
        campaignsData.splice(0, campaignsData.length, ...parsed);
        recalcPendingFromDonors();
    } catch (error) {
        console.warn('Tidak dapat memuat data kampanye dari storage:', error);
    }
}

function saveCampaignsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaignsData));
    } catch (error) {
        console.warn('Tidak dapat menyimpan data kampanye ke storage:', error);
    }
}

function findCampaignIndex(id) {
    return campaignsData.findIndex(c => c.id === id);
}

function generateCampaignId() {
    return Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function getCampaignById(id) {
    return campaignsData.find(c => c.id === id);
}

// ============================================
// ADMIN: RENDER CAMPAIGN LIST
// ============================================

function renderAdminCampaignList() {
    const list = document.getElementById('adminCampaignList');
    const count = document.getElementById('adminCampaignCount');
    if (!list || !count) return;
    if (campaignsData.length === 0) {
        list.innerHTML = '<div class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Belum ada kampanye. Tambahkan kampanye baru untuk ditampilkan di halaman utama.</div>';
        count.innerText = '0';
        return;
    }
    
    // Sort campaignsData: newest first (since we generate id using Date.now() / numbers, we sort descending by id)
    var sortedCampaigns = campaignsData.slice().sort(function(a, b) {
        return Number(b.id) - Number(a.id);
    });

    list.innerHTML = sortedCampaigns.map(function(c) {
        var percent = Math.min(100, Math.round((c.collected / c.target) * 100));
        var safeTitle = sanitizeHTML(c.title);
        var safeCategory = sanitizeHTML(c.category);
        var pendingInfo = (c.pendingCollected && c.pendingCollected > 0)
            ? '<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs"><span class="text-amber-700 font-semibold"><i class="fa-solid fa-clock mr-1"></i> Dana menunggu konfirmasi:</span> <strong class="text-amber-800">' + formatRupiah(c.pendingCollected) + '</strong></div>'
            : '';
        return '<div class="rounded-3xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden"><div class="p-5">' +
            '<div class="flex items-center justify-between gap-3 mb-4"><div><h3 class="text-base font-bold text-slate-900">' + safeTitle + '</h3><p class="text-xs uppercase tracking-[0.16em] text-brand-600 font-semibold mt-1">' + safeCategory + '</p></div><div class="text-right text-xs text-slate-500">' + percent + '% terkumpul</div></div>' +
            pendingInfo +
            '<p class="text-sm text-slate-600 mb-4 line-clamp-2">Target: ' + formatRupiah(c.target) + ' · Terkumpul (confirmed): ' + formatRupiah(c.collected) + '</p>' +
            '<div class="w-full bg-slate-200 rounded-full h-2.5 mb-4 overflow-hidden"><div class="bg-brand-600 h-2.5 rounded-full" style="width: ' + percent + '%"></div></div>' +
            '<div class="flex flex-wrap gap-2 text-xs text-slate-500 mb-4"><span class="px-2 py-1 rounded-full bg-white border border-slate-200">' + c.daysLeft + ' Hari</span><span class="px-2 py-1 rounded-full bg-white border border-slate-200">' + (c.image ? 'Gambar tersedia' : 'Tanpa gambar') + '</span></div>' +
            '<div class="flex flex-wrap gap-2">' +
            '<button type="button" onclick="editCampaign(\'' + c.id + '\')" class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition"><i class="fa-solid fa-pen-to-square"></i> Edit</button>' +
            '<button type="button" onclick="deleteCampaign(\'' + c.id + '\')" class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"><i class="fa-solid fa-trash"></i> Hapus</button></div></div></div>';
    }).join('');
    count.innerText = campaignsData.length;
}
>>>>+

function resetAdminForm() {
    var form = document.getElementById('adminCampaignForm');
    if (!form) return;
    form.reset();
    document.getElementById('adminCampaignId').value = '';
    document.getElementById('adminImage').value = '';
    removeUploadedImage();
    removeUrlImage();
    document.getElementById('adminSubmitBtn').innerText = 'Simpan Kampanye';
    document.getElementById('adminCancelBtn').classList.add('hidden');
}

function populateAdminForm(campaign) {
    if (!campaign) return;
    document.getElementById('adminCampaignId').value = campaign.id;
    document.getElementById('adminTitle').value = campaign.title;
    document.getElementById('adminCategory').value = campaign.category;
    document.getElementById('adminTarget').value = campaign.target;
    document.getElementById('adminCollected').value = campaign.collected;
    document.getElementById('adminDaysLeft').value = campaign.daysLeft;
    document.getElementById('adminSubmitBtn').innerText = 'Perbarui Kampanye';
    document.getElementById('adminCancelBtn').classList.remove('hidden');
    var image = campaign.image || '';
    document.getElementById('adminImage').value = image;
    if (image) {
        if (image.indexOf('data:image/') === 0) {
            var preview = document.getElementById('imagePreview');
            var previewContainer = document.getElementById('imagePreviewContainer');
            var placeholder = document.getElementById('imagePlaceholder');
            if (preview && previewContainer && placeholder) {
                preview.src = image;
                previewContainer.classList.remove('hidden');
                placeholder.classList.add('hidden');
            }
        } else if (image.indexOf('http') === 0) {
            var urlPreview = document.getElementById('urlPreview');
            var urlPreviewContainer = document.getElementById('urlPreviewContainer');
            var urlInput = document.getElementById('adminImageUrl');
            if (urlPreview && urlPreviewContainer && urlInput) {
                urlPreview.src = image;
                urlPreviewContainer.classList.remove('hidden');
                urlInput.value = image;
                var uploadTab = document.getElementById('imageTabUrl');
                if (uploadTab) uploadTab.click();
            }
        }
    }
}

function editCampaign(id) {
    var campaign = getCampaignById(id);
    if (!campaign) return;
    populateAdminForm(campaign);
    openCampaignModal();
    var title = document.getElementById('modalFormTitle');
    if (title) title.innerText = 'Edit Kampanye';
}

function deleteCampaign(id) {
    var index = findCampaignIndex(id);
    if (index === -1) return;
    campaignsData.splice(index, 1);
    saveCampaignsToStorage();
    renderCampaigns();
    renderAdminCampaignList();
    showToast('Kampanye berhasil dihapus.');
}

function handleAdminFormSubmit(event) {
    event.preventDefault();
    var id = document.getElementById('adminCampaignId').value;
    var title = sanitizeHTML(document.getElementById('adminTitle').value.trim());
    var category = sanitizeHTML(document.getElementById('adminCategory').value.trim());
    var rawImage = document.getElementById('adminImage').value.trim();
    var target = Number(document.getElementById('adminTarget').value);
    var collectedInput = document.getElementById('adminCollected').value.trim();
    var daysLeft = Number(document.getElementById('adminDaysLeft').value);
    var collected = (collectedInput === '') ? 0 : Number(collectedInput);
    var image = rawImage;
    if (!image) {
        image = 'https://placehold.co/600x400/10b981/ffffff?text=Markas+Kebaikan';
    } else if (rawImage.indexOf('data:image/') !== 0) {
        image = sanitizeURL(rawImage);
    }
    var xssPattern = /<script|onerror|onload|onclick|onmouseover|javascript:/i;
    if (xssPattern.test(title) || xssPattern.test(category)) {
        showToast('Input mengandung karakter yang tidak diizinkan.', true);
        return;
    }
    if (!title || !category || !target || target <= 0 || isNaN(collected) || collected < 0 || !daysLeft || daysLeft < 1) {
        showToast('Lengkapi semua field dengan benar (Judul, Kategori, Target, Sisa Hari).', true);
        return;
    }
    if (id) {
        var index = findCampaignIndex(id);
        if (index !== -1) {
            campaignsData[index].title = title;
            campaignsData[index].category = category;
            campaignsData[index].image = image;
            campaignsData[index].target = target;
            campaignsData[index].collected = collected;
            campaignsData[index].daysLeft = daysLeft;
        }
    } else {
        var newId = generateCampaignId();
        var campaign = {
            id: newId,
            title: title,
            category: category,
            image: image,
            target: target,
            collected: collected,
            pendingCollected: 0,
            daysLeft: daysLeft
        };
        campaignsData.push(campaign);
    }
    saveCampaignsToStorage();
    renderCampaigns();
    renderAdminCampaignList();
    closeCampaignModal();
    showToast(id ? 'Kampanye berhasil diperbarui.' : 'Kampanye baru berhasil ditambahkan.');
}

// ============================================
// RENDER CAMPAIGNS ON LANDING PAGE
// ============================================

function renderCampaigns() {
    var container = document.getElementById('campaignListContainer');
    if (!container) return;
    if (campaignsData.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500">Belum ada kampanye aktif saat ini.</div>';
        return;
    }
    recalcPendingFromDonors();
    container.innerHTML = campaignsData.map(function(c) {
        var percent = Math.min(100, Math.round((c.collected / c.target) * 100));
        var safeTitle = sanitizeHTML(c.title);
        var safeCategory = sanitizeHTML(c.category);
        var imageSrc = c.image || 'https://placehold.co/600x400/10b981/ffffff?text=Markas+Kebaikan';
        var pendingInfo = (c.pendingCollected && c.pendingCollected > 0)
            ? '<div class="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2 text-xs flex items-center gap-2"><i class="fa-solid fa-clock text-amber-600"></i><span class="text-amber-800">' + formatRupiah(c.pendingCollected) + ' <strong>menunggu konfirmasi</strong> admin. Jika disetujui, jumlah masuk ke progress bar.</span></div>'
            : '';
        return '<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"><div class="relative h-48 overflow-hidden"><img src="' + imageSrc + '" alt="' + safeTitle + '" class="w-full h-full object-cover" loading="lazy" onerror="this.src=\'https://placehold.co/600x400/10b981/ffffff?text=Markas+Kebaikan\'"></div><div class="p-5 flex flex-col flex-1"><p class="text-xs uppercase tracking-wider text-brand-600 font-semibold mb-1">' + safeCategory + '</p><h3 class="text-base font-bold text-slate-900 mb-2 line-clamp-2 min-h-[3em]">' + safeTitle + '</h3>' + pendingInfo + '<div class="mt-auto"><div class="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden"><div class="bg-brand-600 h-2.5 rounded-full" style="width: ' + percent + '%"></div></div><div class="flex justify-between text-xs font-bold mb-3"><span class="text-brand-600">' + formatRupiah(c.collected) + '</span><span class="text-slate-400">Target: ' + formatRupiah(c.target) + '</span></div><div class="flex items-center justify-between text-xs text-slate-500 mb-4"><span><i class="fa-regular fa-clock mr-1"></i> ' + c.daysLeft + ' hari lagi</span><span class="font-semibold">' + percent + '%</span></div><button onclick="openDonationModal(\'' + c.id + '\')" class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow transition"><i class="fa-solid fa-hand-holding-heart mr-2"></i> Bantu Sekarang</button></div></div></div>';
    }).join('');
}

// ============================================
// DONATION FLOW
// ============================================

function openDonationModal(campaignId) {
    var campaign = getCampaignById(campaignId);
    if (!campaign) return;
    document.getElementById('modalCampaignId').value = campaignId;
    document.getElementById('modalCampaignTitle').innerText = campaign.title;
    document.getElementById('donationForm').reset();
    var customAmount = document.getElementById('customAmount');
    if (customAmount) customAmount.value = '';
    var btns = document.querySelectorAll('.nominal-btn');
    btns.forEach(function(b) { b.classList.remove('bg-brand-600', 'text-white', 'border-brand-600'); b.classList.add('bg-white', 'text-slate-700', 'border-slate-200'); });
    document.getElementById('donationModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeDonationModal() {
    document.getElementById('donationModal').classList.add('hidden');
    document.body.style.overflow = '';
}

function selectNominal(value) {
    var customAmount = document.getElementById('customAmount');
    if (customAmount) customAmount.value = value;
    var btns = document.querySelectorAll('.nominal-btn');
    btns.forEach(function(b) {
        b.classList.remove('bg-brand-600', 'text-white', 'border-brand-600');
        b.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
    });
    event.target.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
    event.target.classList.add('bg-brand-600', 'text-white', 'border-brand-600');
}

function processDonation(event) {
    event.preventDefault();
    var campaignId = document.getElementById('modalCampaignId').value;
    var campaign = getCampaignById(campaignId);
    if (!campaign) { showToast('Kampanye tidak ditemukan.', true); return; }
    var customAmount = document.getElementById('customAmount');
    var donorName = document.getElementById('donorName');
    var donorPhone = document.getElementById('donorPhone');
    var donorPrayer = document.getElementById('donorPrayer');
    var paymentMethod = document.getElementById('paymentMethod');
    var amount = Number(customAmount.value);
    var name = donorName.value.trim();
    var phone = donorPhone.value.trim();
    var prayer = donorPrayer.value.trim();
    var payment = paymentMethod.value;
    if (!name || !phone || !amount || amount < 10000) { showToast('Lengkapi data donasi dengan benar (min Rp 10.000).', true); return; }
    if (!/^\d{6,20}$/.test(phone.replace(/[^0-9]/g, ''))) { showToast('Nomor WhatsApp tidak valid.', true); return; }
    var safeName = sanitizeHTML(name);
    var safePrayer = sanitizeHTML(prayer);
    var paymentInfo = '';
    var paymentLabel = '';
    if (payment === 'qris') { paymentLabel = 'QRIS'; paymentInfo = 'Scan QRIS berikut menggunakan GoPay, OVO, ShopeePay, atau Dana'; }
    else if (payment === 'bca') { paymentLabel = 'BCA Virtual Account'; paymentInfo = 'Transfer ke Virtual Account BCA: 8888 1234 5678 90 a.n. Yayasan Markas Kebaikan'; }
    else if (payment === 'mandiri') { paymentLabel = 'Mandiri Virtual Account'; paymentInfo = 'Transfer ke Virtual Account Mandiri: 9999 1234 5678 90 a.n. Yayasan Markas Kebaikan'; }
    else { paymentLabel = 'BSI Virtual Account'; paymentInfo = 'Transfer ke Virtual Account BSI: 7777 1234 5678 90 a.n. Yayasan Markas Kebaikan'; }
    var donorId = 'DON-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    var donorData = {
        id: donorId,
        campaignId: campaignId,
        campaignTitle: campaign.title,
        name: safeName,
        phone: phone,
        amount: amount,
        paymentMethod: paymentLabel,
        prayer: safePrayer,
        status: 'pending',
        date: new Date().toISOString()
    };
    saveDonor(donorData);
    var cIndex = findCampaignIndex(campaignId);
    if (cIndex !== -1) {
        campaignsData[cIndex].pendingCollected = (campaignsData[cIndex].pendingCollected || 0) + amount;
        saveCampaignsToStorage();
    }
    renderCampaigns();
    if (typeof renderAdminDonorList === 'function') renderAdminDonorList();
    if (typeof renderAdminDonorStats === 'function') renderAdminDonorStats();
    var waMessage = encodeURIComponent(
        'Assalamu\'alaikum, Saya ' + safeName + ' ingin mengonfirmasi donasi saya.%0A%0A' +
        '💳 *Detail Donasi*%0A' +
        'Program: ' + campaign.title + '%0A' +
        'Nominal: Rp ' + amount.toLocaleString('id-ID') + '%0A' +
        'Metode: ' + paymentLabel + '%0A' +
        'Status: Menunggu Konfirmasi Admin%0A%0A' +
        '📌 *Petunjuk Pembayaran*%0A' +
        paymentInfo + '%0A%0A' +
        'Kode Donatur: ' + donorId + '%0A%0A' +
        'Setelah transfer, silakan balas pesan ini dengan bukti transfer (screenshot).%0A' +
        'Admin akan mengonfirmasi dalam 1x24 jam.%0A%0A' +
        'Jazakumullahu Khairan Katsir 🙏'
    );
    closeDonationModal();
    showToast('✅ Donasi dicatat! Silakan transfer dan konfirmasi via WhatsApp.');
    setTimeout(function() {
        window.open('https://wa.me/6281234567890?text=' + waMessage, '_blank');
    }, 800);
}

// ============================================
// IMPACT MODAL
// ============================================

function openImpactModal(title, amount, beneficiaries, detail) {
    document.getElementById('impactTitle').innerText = title;
    document.getElementById('impactAmount').innerText = amount;
    document.getElementById('impactBeneficiaries').innerText = beneficiaries;
    document.getElementById('impactDetail').innerText = detail;
    document.getElementById('impactModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeImpactModal() {
    document.getElementById('impactModal').classList.add('hidden');
    document.body.style.overflow = '';
}

// ============================================
// TOAST NOTIFICATION
// ============================================

function showToast(message, isError) {
    var toast = document.getElementById('toast');
    var toastMessage = document.getElementById('toastMessage');
    var toastIcon = document.getElementById('toastIcon');
    if (!toast || !toastMessage || !toastIcon) return;
    toastMessage.innerText = message;
    if (isError) {
        toastIcon.className = 'fa-solid fa-circle-exclamation text-red-400 text-lg';
        toast.className = 'fixed bottom-5 right-5 z-50 transform translate-y-20 opacity-0 transition-all duration-300 bg-red-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-800';
    } else {
        toastIcon.className = 'fa-solid fa-circle-check text-brand-500 text-lg';
        toast.className = 'fixed bottom-5 right-5 z-50 transform translate-y-20 opacity-0 transition-all duration-300 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800';
    }
    requestAnimationFrame(function() {
        toast.classList.remove('translate-y-20', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(function() {
        toast.classList.add('translate-y-20', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
    }, 4000);
}

// ============================================
// PROGRAM UNGGULAN — ADMIN FUNCTIONS
// ============================================

const STORAGE_KEY_PROGRAM_DONATIONS = 'mk_program_donations';

function getProgramDonations() {
    try {
        var stored = localStorage.getItem(STORAGE_KEY_PROGRAM_DONATIONS);
        if (!stored) return [];
        var parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Gagal membaca data donasi program:', error);
        return [];
    }
}

function saveProgramDonations(donations) {
    try {
        localStorage.setItem(STORAGE_KEY_PROGRAM_DONATIONS, JSON.stringify(donations));
        return true;
    } catch (error) {
        console.warn('Gagal menyimpan data donasi program:', error);
        return false;
    }
}

function getProgramCollected(programId) {
    var donations = getProgramDonations();
    var total = 0;
    for (var i = 0; i < donations.length; i++) {
        if (donations[i].programId === programId && donations[i].status === 'confirmed') {
            total += Number(donations[i].amount);
        }
    }
    return total;
}

function getProgramPending(programId) {
    var donations = getProgramDonations();
    var total = 0;
    for (var i = 0; i < donations.length; i++) {
        if (donations[i].programId === programId && donations[i].status === 'pending') {
            total += Number(donations[i].amount);
        }
    }
    return total;
}

function renderAdminProgramDonations() {
    var container = document.getElementById('adminProgramDonationList');
    if (!container) return;

    // Update 3 cards
    var programs = ['pendidikan', 'sedekah', 'infrastruktur'];
    var barIds = ['progBarPendidikan', 'progBarSedekah', 'progBarInfrastruktur'];
    var collectedIds = ['progCollectedPendidikan', 'progCollectedSedekah', 'progCollectedInfrastruktur'];
    var pendingIds = ['progPendingPendidikan', 'progPendingSedekah', 'progPendingInfrastruktur'];
    
    for (var i = 0; i < programs.length; i++) {
        var collected = getProgramCollected(programs[i]);
        var pending = getProgramPending(programs[i]);
        var total = collected + pending;
        var percent = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
        var barEl = document.getElementById(barIds[i]);
        var colEl = document.getElementById(collectedIds[i]);
        var penEl = document.getElementById(pendingIds[i]);
        if (barEl) barEl.style.width = percent + '%';
        if (colEl) colEl.innerText = formatRupiah(collected);
        if (penEl) penEl.innerText = formatRupiah(pending) + ' pending';
    }

    // Render donation list
    var filterStatus = document.getElementById('progFilterStatus').value;
    var donations = getProgramDonations();
    var filtered = donations.filter(function(d) {
        return filterStatus === 'all' || d.status === filterStatus;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">' +
            (donations.length === 0
                ? 'Belum ada donasi program unggulan. Data akan muncul setelah ada donasi yang masuk melalui halaman utama.'
                : 'Tidak ada donasi program yang cocok dengan filter.') +
            '</div>';
        return;
    }

    container.innerHTML = filtered.map(function(d) {
        var safeName = sanitizeHTML(d.name);
        var safePhone = sanitizeHTML(d.phone || '-');
        var safePrayer = sanitizeHTML(d.prayer || '-');
        var safeProgram = sanitizeHTML(d.programName || '-');
        var safePayment = sanitizeHTML(d.paymentMethod || '-');

        // Program icon based on programId
        var progIcons = { pendidikan: 'fa-graduation-cap', sedekah: 'fa-sun', infrastruktur: 'fa-faucet-drip' };
        var progColors = { pendidikan: 'indigo', sedekah: 'amber', infrastruktur: 'emerald' };
        var icon = progIcons[d.programId] || 'fa-star';
        var color = progColors[d.programId] || 'slate';
        var colorClasses = {
            indigo: 'bg-indigo-100 text-indigo-700',
            amber: 'bg-amber-100 text-amber-700',
            emerald: 'bg-emerald-100 text-emerald-700',
            slate: 'bg-slate-100 text-slate-700'
        };
        var iconClass = colorClasses[color] || colorClasses.slate;

        var statusBadge = d.status === 'confirmed'
            ? '<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold"><i class="fa-solid fa-circle-check"></i> Dikonfirmasi</span>'
            : '<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"><i class="fa-solid fa-clock"></i> Menunggu</span>';

        return '<div class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"><div class="p-5">' +
            '<div class="flex items-center justify-between gap-3 mb-3">' +
                '<div class="flex items-center gap-3">' +
                    '<div class="w-10 h-10 rounded-xl ' + iconClass + ' font-bold flex items-center justify-center text-sm">' +
                        '<i class="fa-solid ' + icon + '"></i>' +
                    '</div>' +
                    '<div>' +
                        '<h4 class="text-sm font-bold text-slate-900">' + safeName + '</h4>' +
                        '<p class="text-xs text-slate-500">' + safePhone + '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="text-xs">' + statusBadge + '</div>' +
            '</div>' +
            '<div class="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">' +
                '<div><span class="text-slate-400">Nominal:</span> <strong class="text-slate-900">' + formatRupiah(d.amount) + '</strong></div>' +
                '<div><span class="text-slate-400">Pembayaran:</span> <strong class="text-slate-900">' + safePayment + '</strong></div>' +
                '<div class="col-span-2"><span class="text-slate-400">Program Unggulan:</span> <strong class="text-slate-900">' + safeProgram + '</strong></div>' +
                '<div class="col-span-2"><span class="text-slate-400">Doa:</span> <em class="text-slate-700">"' + safePrayer + '"</em></div>' +
                '<div class="col-span-2"><span class="text-slate-400">Tanggal:</span> ' + formatDate(d.date) + '</div>' +
            '</div>' +
            '<div class="flex flex-wrap gap-2">' +
            (d.status === 'pending'
                ? '<button type="button" onclick="confirmProgramDonor(\'' + d.id + '\')" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"><i class="fa-solid fa-check"></i> Konfirmasi</button>'
                : '') +
            '<button type="button" onclick="deleteProgramDonor(\'' + d.id + '\')" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"><i class="fa-solid fa-trash"></i> Hapus</button>' +
            '</div></div></div>';
    }).join('');
}

function filterProgramDonations() {
    renderAdminProgramDonations();
}

function confirmProgramDonor(donorId) {
    try {
        var donations = getProgramDonations();
        var donor = null, donorIndex = -1;
        for (var i = 0; i < donations.length; i++) {
            if (donations[i].id === donorId && donations[i].status === 'pending') {
                donor = donations[i];
                donorIndex = i;
                break;
            }
        }
        if (!donor) { showToast('Donasi program tidak ditemukan atau sudah dikonfirmasi.', true); return; }
        donations[donorIndex].status = 'confirmed';
        saveProgramDonations(donations);
        renderAdminProgramDonations();
        showToast('Donasi program ' + sanitizeHTML(donor.name) + ' (Rp ' + Number(donor.amount).toLocaleString('id-ID') + ') berhasil dikonfirmasi.');
    } catch (error) {
        console.warn('Gagal mengkonfirmasi donasi program:', error);
    }
}

function deleteProgramDonor(donorId) {
    try {
        var donations = getProgramDonations();
        var filtered = donations.filter(function(d) { return d.id !== donorId; });
        if (filtered.length === donations.length) return false;
        saveProgramDonations(filtered);
        renderAdminProgramDonations();
        showToast('Donasi program berhasil dihapus.');
        return true;
    } catch (error) {
        console.warn('Gagal menghapus donasi program:', error);
        return false;
    }
}

// ============================================
// MOBILE MENU TOGGLE
// ============================================

(function() {
    var btn = document.getElementById('mobileMenuBtn');
    var menu = document.getElementById('mobileMenu');
    if (btn && menu) {
        btn.addEventListener('click', function() {
            menu.classList.toggle('hidden');
        });
    }
})();

// ============================================
// INITIALIZATION
// ============================================

(function init() {
    loadCampaignsFromStorage();
    renderCampaigns();
    renderAdminCampaignList();
    renderAdminDonorList();
    renderAdminDonorStats();
    var cancelBtn = document.getElementById('adminCancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeCampaignModal();
        });
    }
    // Close modal on overlay click
    var modal = document.getElementById('campaignModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeCampaignModal();
        });
    }
})();
