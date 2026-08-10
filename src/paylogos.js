import qris from "idn-finlogos/icons/qris";
import gopay from "idn-finlogos/icons/gopay";
import ovo from "idn-finlogos/icons/ovo";
import shopeepay from "idn-finlogos/icons/shopeepay";
import dana from "idn-finlogos/icons/dana";
import linkaja from "idn-finlogos/icons/linkaja";
import bca from "idn-finlogos/icons/bca";
import mandiri from "idn-finlogos/icons/mandiri";
import bri from "idn-finlogos/icons/bri";
import bni from "idn-finlogos/icons/bni";
import bsi from "idn-finlogos/icons/bsi";
import permata from "idn-finlogos/icons/permata";
import astrapay from "idn-finlogos/icons/astrapay";
import grabpay from "idn-finlogos/icons/grab-pay";
import jenius from "idn-finlogos/icons/jenius";
import jago from "idn-finlogos/icons/jago";
import seabank from "idn-finlogos/icons/seabank";

export const PAY_BRANDS = [
  { slug: "qris", label: "QRIS", group: "E-Wallet" },
  { slug: "gopay", label: "GoPay", group: "E-Wallet" },
  { slug: "ovo", label: "OVO", group: "E-Wallet" },
  { slug: "shopeepay", label: "ShopeePay", group: "E-Wallet" },
  { slug: "dana", label: "DANA", group: "E-Wallet" },
  { slug: "linkaja", label: "LinkAja", group: "E-Wallet" },
  { slug: "bca", label: "BCA", group: "Bank" },
  { slug: "mandiri", label: "Mandiri", group: "Bank" },
  { slug: "bri", label: "BRI", group: "Bank" },
  { slug: "bni", label: "BNI", group: "Bank" },
  { slug: "bsi", label: "BSI", group: "Bank" },
  { slug: "permata", label: "Permata", group: "Bank" },
  { slug: "astrapay", label: "AstraPay", group: "E-Wallet" },
  { slug: "grab-pay", label: "GrabPay", group: "E-Wallet" },
  { slug: "jenius", label: "Jenius", group: "Bank" },
  { slug: "jago", label: "Jago", group: "Bank" },
  { slug: "seabank", label: "SeaBank", group: "Bank" },
];

export const ID_SLUGS = {
  qris: "qris",
  gopay: "gopay",
  ovo: "ovo",
  shopeepay: "shopeepay",
  dana: "dana",
  linkaja: "linkaja",
  bca: "bca",
  mandiri: "mandiri",
  bri: "bri",
  bni: "bni",
  bsi: "bsi",
  permata: "permata",
  astrapay: "astrapay",
  "grab-pay": "grab-pay",
  jenius: "jenius",
  jago: "jago",
  seabank: "seabank",
};

const SVG_BY_SLUG = {
  qris,
  gopay,
  ovo,
  shopeepay,
  dana,
  linkaja,
  bca,
  mandiri,
  bri,
  bni,
  bsi,
  permata,
  astrapay,
  grabpay,
  jenius,
  jago,
  seabank,
};

export function logoSvg(m) {
  const slug = m.brand && SVG_BY_SLUG[m.brand] ? m.brand : ID_SLUGS[m.id];
  return (slug && SVG_BY_SLUG[slug]) || "";
}

export function payIcon(m) {
  const svg = logoSvg(m);
  if (svg) return `<span class="pay-logo" aria-hidden="true">${svg}</span>`;
  return payMonogram(m);
}

export function payMonogram(m) {
  if (m.id === "qris") {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17 14h2v2h-2zM21 17h-1v2h-2v1h3zM14 17h2v1h-2zM17 21v-1h1v-2h1v3z"/></svg>';
  }
  const marks = {
    gopay: "G",
    ovo: "O",
    shopeepay: "S",
    bca: "BCA",
    mandiri: "M",
    astrapay: "A",
    "grab-pay": "GP",
    jenius: "J",
    jago: "J",
    seabank: "SB",
  };
  const letter = marks[m.id] || (m.label || m.id).slice(0, 2).toUpperCase();
  return `<span style="font-family:var(--font-display);font-weight:800;font-size:12px;">${letter}</span>`;
}
