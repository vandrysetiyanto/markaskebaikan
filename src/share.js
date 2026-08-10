export function shareUrl(key) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#kampanye=${encodeURIComponent(key)}`;
}

function fmtRp(n) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Number(n) || 0)}`;
}

export function shareText({ key, title, collected, target, daysLeft }) {
  const lines = [`Assalamu'alaikum 🤍 Ajak kebaikanmu untuk "${title}"`];
  if (typeof collected === "number" && typeof target === "number") {
    const sisa =
      Number.isFinite(Number(daysLeft)) && Number(daysLeft) > 0
        ? ` · sisa ${daysLeft} hari`
        : "";
    lines.push(`Terkumpul ${fmtRp(collected)} dari ${fmtRp(target)}${sisa}`);
  }
  lines.push(shareUrl(key));
  lines.push("#MarkasKebaikan #Sedekah");
  return lines.join("\n");
}

export function waShareLink(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
