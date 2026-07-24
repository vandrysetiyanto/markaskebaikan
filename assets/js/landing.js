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
const STORAGE_KEY_PROGRAM_DONATIONS = 'mk_program_donations';

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

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
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
// CAMPAIGN STORAGE FUNCTIONS
// ============================================

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

function getCampaignById(id) {
    return campaignsData.find(c => c.id === id);
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

// ============================================
// DONOR DATA MANAGEMENT (read-only for landing)
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

function openDonationModal(campaignId, source, programName) {
    var campaign = getCampaignById(campaignId);
    if (!campaign) return;
    document.getElementById('modalCampaignId').value = campaignId;
    document.getElementById('modalCampaignTitle').innerText = campaign.title;
    document.getElementById('donationForm').reset();
    var customAmount = document.getElementById('customAmount');
    if (customAmount) customAmount.value = '';
    var btns = document.querySelectorAll('.nominal-btn');
    btns.forEach(function(b) { b.classList.remove('bg-brand-600', 'text-white', 'border-brand-600'); b.classList.add('bg-white', 'text-slate-700', 'border-slate-200'); });

    // Source context handling
    var sourceBadge = document.getElementById('donationSourceBadge');
    var sourceInfo = document.getElementById('donationSourceInfo');
    var headerDivider = document.getElementById('donationHeaderDivider');
    if (source === 'program' && programName) {
        sourceBadge.innerHTML = '<span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md"><i class="fa-solid fa-star mr-1"></i> PROGRAM UNGGULAN</span>';
        sourceInfo.innerHTML = '<div class="flex items-center gap-2 text-sm"><i class="fa-solid fa-arrow-right text-brand-600"></i><span class="text-slate-600">Donasi melalui program <strong class="text-slate-900">' + programName + '</strong></span></div>';
        sourceInfo.classList.remove('hidden');
        headerDivider.classList.remove('hidden');
    } else {
        sourceBadge.innerHTML = '<span class="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wider">Formulir Sedekah</span>';
        sourceInfo.classList.add('hidden');
        headerDivider.classList.add('hidden');
    }

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
    if (window.event) {
        window.event.target.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
        window.event.target.classList.add('bg-brand-600', 'text-white', 'border-brand-600');
    }
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
// PROGRAM DONATION FORM (LANGSUNG DI MODAL PROGRAM)
// ============================================

function selectProgNominal(value) {
    var customAmount = document.getElementById('progCustomAmount');
    if (customAmount) customAmount.value = value;
    var btns = document.querySelectorAll('.prog-nominal-btn');
    btns.forEach(function(b) {
        b.classList.remove('bg-brand-600', 'text-white', 'border-brand-600');
        b.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
    });
    if (window.event) {
        window.event.target.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
        window.event.target.classList.add('bg-brand-600', 'text-white', 'border-brand-600');
    }
}

// ============================================
// PROGRAM UNGGULAN — DONATION STORAGE (INDEPENDENT FROM CAMPAIGNS)
// ============================================

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

function saveProgramDonation(donation) {
    try {
        var donations = getProgramDonations();
        donations.unshift(donation);
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
    donations.forEach(function(d) {
        if (d.programId === programId && d.status === 'confirmed') {
            total += Number(d.amount);
        }
    });
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

function renderHeroProgramCards() {
    var programs = ['pendidikan', 'sedekah', 'infrastruktur'];
    var programIds = ['pendidikan', 'sedekah', 'infrastruktur'];
    var labelIds = ['heroPendLabel', 'heroSedLabel', 'heroInfLabel'];
    var amountIds = ['heroProgPendidikan', 'heroProgSedekah', 'heroProgInfrastruktur'];
    var barIds = ['heroBarPendidikan', 'heroBarSedekah', 'heroBarInfrastruktur'];
    // Target per program (soft target untuk progress bar)
    var targets = { pendidikan: 50000000, sedekah: 30000000, infrastruktur: 80000000 };

    for (var i = 0; i < programs.length; i++) {
        var collected = getProgramCollected(programs[i]);
        var target = targets[programs[i]] || 1;
        var percent = Math.min(100, Math.round((collected / target) * 100));
        var amountEl = document.getElementById(amountIds[i]);
        var barEl = document.getElementById(barIds[i]);
        var labelEl = document.getElementById(labelIds[i]);
        if (amountEl) amountEl.innerText = formatRupiah(collected);
        if (barEl) barEl.style.width = percent + '%';
        if (labelEl) labelEl.innerText = percent + '% terkumpul';
    }
}

function processProgramDonation(event) {
    event.preventDefault();
    var customAmount = document.getElementById('progCustomAmount');
    var donorName = document.getElementById('progDonorName');
    var donorPhone = document.getElementById('progDonorPhone');
    var donorPrayer = document.getElementById('progDonorPrayer');
    var paymentMethod = document.getElementById('progPaymentMethod');
    var amount = Number(customAmount.value);
    var name = donorName.value.trim();
    var phone = donorPhone.value.trim();
    var prayer = donorPrayer.value.trim();
    var payment = paymentMethod.value;
    var progTitle = document.getElementById('progTitle').innerText;
    // Determine programId from title
    var programId = 'pendidikan';
    if (progTitle.indexOf('Subuh') !== -1 || progTitle.indexOf('Rutin') !== -1) programId = 'sedekah';
    else if (progTitle.indexOf('Bangun') !== -1 || progTitle.indexOf('Infrastruktur') !== -1 || progTitle.indexOf('Pembangunan') !== -1) programId = 'infrastruktur';

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
    var donorId = 'PRG-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    var donationData = {
        id: donorId,
        programId: programId,
        programName: progTitle,
        campaignId: document.getElementById('progCampaignId').value,
        name: safeName,
        phone: phone,
        amount: amount,
        paymentMethod: paymentLabel,
        prayer: safePrayer,
        status: 'pending',
        date: new Date().toISOString()
    };
    saveProgramDonation(donationData);
    // NOTE: Program donations are independent — they do NOT affect campaignsData or mk_donors
    var waMessage = encodeURIComponent(
        'Assalamu\'alaikum, Saya ' + safeName + ' ingin mengonfirmasi donasi program unggulan.%0A%0A' +
        '💳 *Detail Donasi*%0A' +
        'Program Unggulan: ' + progTitle + '%0A' +
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
    closeProgramDetail();
    showToast('✅ Donasi program unggulan dicatat! Silakan transfer dan konfirmasi via WhatsApp.');
    setTimeout(function() {
        window.open('https://wa.me/6281234567890?text=' + waMessage, '_blank');
    }, 800);
}

// ============================================
// PROGRAM DETAIL MODAL
// ============================================

const programData = {
    pendidikan: {
        id: 'pendidikan',
        icon: 'fa-graduation-cap',
        iconBg: 'indigo',
        title: 'Orang Tua Asuh Pendidikan',
        subtitle: 'Jadi Alasan Mereka Tidak Putus Sekolah',
        tagline: 'Dampingi anak-anak kurang mampu agar tidak putus sekolah. Jadi alasan mereka meraih mimpi dan cita-cita masa depan.',
        narasi: 'Setiap anak berhak bermimpi. Tapi tidak semua punya kesempatan yang sama. Dengan menjadi Orang Tua Asuh, kamu bukan sekadar membiayai sekolah — kamu memberi mereka alasan untuk percaya bahwa masa depan cerah itu nyata. Satu langkah kecilmu bisa mengubah seluruh hidup mereka.',
        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1000&auto=format&fit=crop',
        color: '#4f46e5',
        impactStats: [
            { label: 'Penerima Manfaat', value: '50+ Anak', icon: 'fa-child' },
            { label: 'Biaya per Anak', value: 'Rp 150.000/bln', icon: 'fa-wallet' },
            { label: 'Sudah Berjalan', value: '3 Tahun', icon: 'fa-calendar' }
        ],
        testimoni: {
            name: 'Aisyah',
            role: 'Penerima Manfaat',
            text: 'Aku dulu hampir putus sekolah karena orang tua tidak mampu. Berkat program Orang Tua Asuh Markas Kebaikan, sekarang aku bisa lanjut kuliah. Terima kasih untuk semua kakak donatur yang sudah menjadi orang tua asuhku.'
        },
        ctaText: 'Saya Ingin Jadi Orang Tua Asuh',
        ctaCampaignId: '1',
        benefitList: [
            'Santunan SPP & biaya sekolah setiap bulan',
            'Perlengkapan sekolah baru setiap semester',
            'Bimbingan belajar & mentoring mingguan',
            'Kebutuhan seragam & alat tulis lengkap',
            'Doa dari anak-anak yatim setiap hari'
        ]
    },
    sedekah: {
        id: 'sedekah',
        icon: 'fa-sun',
        iconBg: 'amber',
        title: 'Sedekah Rutin & Subuh',
        subtitle: 'Berkah Sepanjang Hari, Setiap Hari',
        tagline: 'Mulai harimu dengan keberkahan. Sedekah harian untuk penyediaan pangan, kesehatan lansia, dan bantuan tanggap bencana.',
        narasi: 'Rasulullah SAW bersabda: "Setiap persendian kalian harus bersedekah setiap pagi." Subuh adalah waktu yang penuh keberkahan — saat pintu langit terbuka dan doa-doa mustajab. Sedekah Subuh adalah kebiasaan ringan yang pahalanya luar biasa. Bayangkan, setiap pagi ada lansia yang tersenyum karena sarapan dari sedekah subuhmu.',
        image: 'https://images.unsplash.com/photo-1601024445121-e5b82f020549?q=80&w=1000&auto=format&fit=crop',
        color: '#d97706',
        impactStats: [
            { label: 'Paket per Bulan', value: '300+ Porsi', icon: 'fa-utensils' },
            { label: 'Lansia Dibantu', value: '100+ Orang', icon: 'fa-heart' },
            { label: 'Distribusi Rutin', value: 'Setiap Jumat', icon: 'fa-clock' }
        ],
        testimoni: {
            name: 'Ibu Sari',
            role: 'Penerima Manfaat',
            text: 'Setiap Jumat, saya selalu menunggu paket sembako dari Markas Kebaikan. Rasanya masih diperhatikan dan disayang. Terima kasih untuk donatur yang selalu setia berbagi.'
        },
        ctaText: 'Saya Ingin Sedekah Subuh',
        ctaCampaignId: '3',
        benefitList: [
            'Paket nutrisi & sembako untuk lansia dhuafa',
            'Susu & makanan bergizi setiap minggu',
            'Pemeriksaan kesehatan gratis berkala',
            'Bantuan tanggap darurat bencana',
            'Santunan harian untuk janda & yatim'
        ]
    },
    infrastruktur: {
        id: 'infrastruktur',
        icon: 'fa-faucet-drip',
        iconBg: 'emerald',
        title: 'Pembangunan & Infrastruktur',
        subtitle: 'Amal Jariah yang Pahalanya Tak Pernah Putus',
        tagline: 'Tanam amalan jariah yang pahalanya terus mengalir dengan membantu pembangunan sumur air bersih, madrasah, dan jembatan.',
        narasi: 'Rasulullah SAW bersabda: "Amal yang paling utama adalah engkau memberikan minum (air)." Saat kamu membantu membangun sumur bor atau madrasah, setiap tetes air yang diminum, setiap huruf Al-Qur\'an yang dibaca di madrasah itu — pahalanya terus mengalir untukmu, bahkan setelah engkau tiada. Inilah investasi akhirat terbaik.',
        image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1000&auto=format&fit=crop',
        color: '#059669',
        impactStats: [
            { label: 'KK Terbantu Air', value: '200+ KK', icon: 'fa-house' },
            { label: 'Sumur Bor Dibangun', value: '12 Titik', icon: 'fa-water' },
            { label: 'Madrasah Direnovasi', value: '5 Unit', icon: 'fa-school' }
        ],
        testimoni: {
            name: 'Pak Rahmat',
            role: 'Tokoh Masyarakat',
            text: 'Dulu kami harus jalan 3 kilometer setiap hari untuk mengambil air bersih. Sekarang di halaman masjid ada sumur bor dari Markas Kebaikan. Alhamdulillah, seluruh desa terbantu.'
        },
        ctaText: 'Saya Ingin Bangun Amal Jariah',
        ctaCampaignId: '2',
        benefitList: [
            'Pembangunan sumur bor air bersih desa',
            'Renovasi madrasah & mushola tidak layak',
            'Pembangunan jembatan akses desa terpencil',
            'Instalasi pipa air bersih ke rumah warga',
            'Sanitasi & MCK umum untuk pemukiman padat'
        ]
    }
};

function openProgramDetail(programId) {
    var prog = programData[programId];
    if (!prog) return;

    document.getElementById('progIcon').className = 'fa-solid ' + prog.icon + ' text-3xl';
    var iconColors = { indigo: 'indigo', amber: 'amber', emerald: 'emerald' };
    var colorMap = { indigo: 'bg-indigo-100 text-indigo-600', amber: 'bg-amber-100 text-amber-600', emerald: 'bg-emerald-100 text-emerald-600' };
    document.getElementById('progIconWrap').className = 'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ' + (colorMap[prog.iconBg] || 'bg-emerald-100 text-emerald-600');

    document.getElementById('progBadge').innerText = prog.subtitle;
    document.getElementById('progTitle').innerText = prog.title;
    document.getElementById('progTagline').innerText = prog.tagline;
    document.getElementById('progNarasi').innerText = prog.narasi;
    document.getElementById('progImage').src = prog.image;
    document.getElementById('progImage').alt = prog.title;
    document.getElementById('progImage').onerror = function() {
        this.src = 'https://placehold.co/800x400/059669/ffffff?text=Markas+Kebaikan';
    };

    // Stats
    var statsContainer = document.getElementById('progStats');
    statsContainer.innerHTML = prog.impactStats.map(function(s) {
        return '<div class="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-100"><div class="text-slate-400 text-lg mb-2"><i class="fa-solid ' + s.icon + '"></i></div><span class="text-lg font-extrabold text-slate-900">' + s.value + '</span><span class="text-xs text-slate-500 font-medium">' + s.label + '</span></div>';
    }).join('');

    // Benefits
    document.getElementById('progBenefits').innerHTML = prog.benefitList.map(function(b) {
        return '<li class="flex items-start gap-3"><div class="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 mt-0.5"><i class="fa-solid fa-check text-xs"></i></div><span class="text-sm text-slate-600">' + b + '</span></li>';
    }).join('');

    // Testimoni
    document.getElementById('progTestiName').innerText = prog.testimoni.name;
    document.getElementById('progTestiRole').innerText = prog.testimoni.role;
    document.getElementById('progTestiText').innerText = '"' + prog.testimoni.text + '"';
    var nameParts = prog.testimoni.name.split(' ');
    var initial = nameParts.length > 1 ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() : nameParts[0][0].toUpperCase();
    document.getElementById('progTestiNameInitial').innerText = initial;

    // Set campaign ID dan label tombol di form donasi langsung
    document.getElementById('progCampaignId').value = prog.ctaCampaignId;
    document.getElementById('progCtaLabel').innerText = prog.ctaText;

    // Reset form
    document.getElementById('progForm').reset();
    document.getElementById('progCustomAmount').value = '';
    var btns = document.querySelectorAll('.prog-nominal-btn');
    btns.forEach(function(b) { b.classList.remove('bg-brand-600', 'text-white', 'border-brand-600'); b.classList.add('bg-white', 'text-slate-700', 'border-slate-200'); });

    document.getElementById('programModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeProgramDetail() {
    document.getElementById('programModal').classList.add('hidden');
    document.body.style.overflow = '';
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
    renderHeroProgramCards();
})();
