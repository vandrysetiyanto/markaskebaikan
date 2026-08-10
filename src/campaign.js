export const campaign = {
  name: "Markas Kebaikan",
  tagline: "Ubah Uang Cangkir Kopi Jadi Senyum dan Masa Depan Mereka.",
  taglineFull:
    "Gabung bersama puluhan ribu dermawan muda. Salurkan sedekah secara transparan, mudah, dan berdampak nyata mulai dari Rp 10.000.",
  category: "Platform Sedekah & Donasi",
  location: "Indonesia",
  goal: 0,
  contactWhatsApp: "6281234567890",
  stats: [
    { label: "Total Dana Tersalurkan", value: "Rp 1.450.000.000+", display: "Rp 1.450.000.000+", numeric: 1450000000, accent: true },
    { label: "Penerima Manfaat", value: "12.400+ Jiwa", display: "12.400+", numeric: 12400 },
    { label: "Program Terlaksana", value: "180+ Proyek", display: "180+", numeric: 180 },
    { label: "Donatur Aktif", value: "45.000+ Orang", display: "45.000+", numeric: 45000 },
  ],
  heroTrust: [
    { text: "Transparan & Terlapor" },
    { text: "Donasi Tanpa Login" },
    { text: "Mulai dari Rp 10.000" },
  ],
  categories: {
    pendidikan: "Pendidikan",
    pembangunan: "Pembangunan",
    sedekah_subuh: "Sedekah Subuh",
    sosial: "Sosial",
  },
  categoryOptions: ["Pendidikan", "Infrastruktur", "Sedekah Rutin"],
  activeCampaigns: [
    {
      id: "1",
      title: "Patungan Beasiswa & Perlengkapan Sekolah untuk 50 Anak Yatim Dhuafa",
      category: "Pendidikan",
      image:
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop",
      target: 50000000,
      collected: 42500000,
      pendingCollected: 0,
      daysLeft: 12,
    },
    {
      id: "2",
      title: "Darurat Air Bersih: Bangun Sumur Bor Abadi untuk Warga Dusun Menoreh",
      category: "Infrastruktur",
      image:
        "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1000&auto=format&fit=crop",
      target: 80000000,
      collected: 52000000,
      pendingCollected: 0,
      daysLeft: 24,
    },
    {
      id: "3",
      title: "Sedekah Paket Nutrisi & Sembako Bulanan untuk 100 Lansia Dhuafa",
      category: "Sedekah Rutin",
      image:
        "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1000&auto=format&fit=crop",
      target: 30000000,
      collected: 12000000,
      pendingCollected: 0,
      daysLeft: 8,
    },
  ],
  programs: [
    {
      id: "pendidikan",
      title: "Orang Tua Asuh Pendidikan",
      description:
        "Tanggung biaya SPP, perlengkapan sekolah, dan beasiswa bulanan untuk anak yatim & dhuafa. Transparansi alokasi dana per anak dilaporkan tiap bulan.",
      points: ["SPP & beasiswa bulanan", "Perlengkapan sekolah", "Laporan per anak tiap bulan"],
      cta: "Jadilah Orang Tua Asuh",
      theme: "book",
    },
    {
      id: "sedekah",
      title: "Sedekah Rutin",
      description:
        "Salurkan sedekah harian, mingguan, atau bulanan yang dialokasikan ke program paling membutuhkan: pangan lansia, beasiswa, dan infrastruktur air.",
      points: ["Alokasi ke program prioritas", "Laporan bulanan", "Mudah dijadwalkan"],
      cta: "Sedekah Rutin Sekarang",
      theme: "dawn",
    },
    {
      id: "infrastruktur",
      title: "Infrastruktur",
      description:
        "Patungan pembangunan masjid, pesantren, dan sarana air bersih. Progres fisik dilaporkan dengan foto realisasi sampai bangunan berdiri.",
      points: ["Material bangunan", "Progres fisik + foto", "Dampak jangka panjang"],
      cta: "Patungan Material",
      theme: "mosque",
    },
  ],
  completedCampaigns: [
    {
      id: 101,
      title: "Santunan Anak Yatim 2025",
      slug: "santunan-anak-yatim-2025",
      category: "pendidikan",
      targetAmount: 125000000,
      currentAmount: 125000000,
      donors: 1843,
      theme: "book",
      report: {
        title: "Laporan Santunan Anak Yatim 2025",
        items: [
          { label: "Paket sembako & lebaran (320 anak)", amount: 48000000 },
          { label: "Beasiswa pendidikan 1 semester (120 anak)", amount: 54000000 },
          { label: "Peralatan sekolah (120 paket)", amount: 14800000 },
          { label: "Biaya operasional penyaluran", amount: 8300000 },
        ],
        total: 125000000,
        note: "Penyaluran diverifikasi dengan foto & kuitansi. Sisa dana Rp 0 — seluruh donasi tersalurkan.",
      },
    },
    {
      id: 102,
      title: "Sumur Bor Desa Sukamaju",
      slug: "sumur-bor-desa-sukamaju",
      category: "pembangunan",
      targetAmount: 95000000,
      currentAmount: 95000000,
      donors: 731,
      theme: "umbrella",
      report: {
        title: "Laporan Sumur Bor Desa Sukamaju",
        items: [
          { label: "Pengeboran & pipa (60 m)", amount: 41000000 },
          { label: "Mesin pompa & panel surya", amount: 33500000 },
          { label: "Bak penampungan & talang", amount: 15200000 },
          { label: "Tenaga kerja lokal", amount: 5300000 },
        ],
        total: 95000000,
        note: "Sumur aktif melayani ± 300 KK. Kuitansi pembelian tersedia untuk audit.",
      },
    },
    {
      id: 103,
      title: "Paket Sembako Ramadhan",
      slug: "paket-sembako-ramadhan",
      category: "sosial",
      targetAmount: 210000000,
      currentAmount: 210000000,
      donors: 3902,
      theme: "dawn",
      report: {
        title: "Laporan Paket Sembako Ramadhan",
        items: [
          { label: "Paket sembako (1.050 paket)", amount: 178500000 },
          { label: "Logistik & distribusi", amount: 18900000 },
          { label: "Daging & lauk tambahan", amount: 12600000 },
        ],
        total: 210000000,
        note: "Terdistribusi ke 9 wilayah. Dokumentasi penyerahan tersedia pada laporan foto.",
      },
    },
  ],
  paymentMethods: [
    { id: "qris", label: "QRIS", note: "Semua E-Wallet", kind: "qris" },
    { id: "gopay", label: "GoPay", note: "E-Wallet", kind: "qris" },
    { id: "ovo", label: "OVO", note: "E-Wallet", kind: "qris" },
    { id: "shopeepay", label: "ShopeePay", note: "E-Wallet", kind: "qris" },
    { id: "bca", label: "BCA VA", note: "Virtual Account", kind: "va", vaName: "Yayasan Markas Kebaikan", vaNumber: "8899 0077 5511 0001" },
    { id: "mandiri", label: "Mandiri VA", note: "Virtual Account", kind: "va", vaName: "Yayasan Markas Kebaikan", vaNumber: "8850 0077 5511 0002" },
  ],
  nominalPresets: [10000, 25000, 50000, 100000],
  recurring: { presets: [10000, 25000, 50000, 100000] },
  contact: {
    whatsapp: "https://wa.me/6281234567890",
    instagram: "https://instagram.com/markaskebaikan",
    email: "halo@markaskebaikan.id",
  },
  ai: {
    defaultModel: "llama3.2",
    models: ["llama3.2", "llama3.1", "qwen2.5", "mistral", "gemma2", "phi3"],
    endpoint: "http://localhost:11434",
  },
};

function fmtRp(n) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;
}

export const aiContext = `Kamu adalah asisten ramah untuk platform donasi "${campaign.name}" — platform sedekah dan penggalangan dana sosial berbasis komunitas di Indonesia.

Fakta yang kamu ketahui:
- Platform: ${campaign.tagline}
- Tagline: ${campaign.taglineFull}
- Dampak komunitas: ${campaign.stats.map((s) => s.label + " " + s.display).join("; ")}
- Kampanye berjalan: ${campaign.activeCampaigns.map((c) => `"${c.title}" (${c.category}, target ${fmtRp(c.target)}, terkumpul ${fmtRp(c.collected)}, sisa ${c.daysLeft} hari)`).join("; ")}
- Program unggulan: ${campaign.programs.map((p) => `${p.title} — ${p.cta}`).join("; ")}
- Kampanye selesai & tersalurkan: ${campaign.completedCampaigns.map((c) => c.title).join("; ")}
- Metode pembayaran: ${campaign.paymentMethods.map((m) => m.label).join(", ")}
- Donasi minimum Rp 1.000, tanpa login. Opsi anonim "Hamba Allah" tersedia.
- Donasi mengunggah bukti transfer lalu diverifikasi (di-approve) admin sebelum masuk total terkumpul.

Aturan:
- Jawab hanya tentang platform donasi ini dan sedekah. Ramah, ringkas, dan membantu.
- Jika ditanya hal yang tidak kamu tahu, katakan akan dicek ke tim — jangan mengarang.
- Tidak memberi nasihat investasi atau menjanjikan imbalan.
- Jawab dalam Bahasa Indonesia, maksimal 120 kata kecuali pengunjung minta detail.`;
