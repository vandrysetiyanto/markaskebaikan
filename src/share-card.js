const W = 1080;
const H = 1920;
const FONT = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
const MUTED = "rgba(255,255,255,0.72)";
const FAINT = "rgba(255,255,255,0.55)";

export function slugify(key) {
  const s = String(key)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "kampanye";
}

export function shareFileName(key) {
  return `markas-kebaikan-${slugify(key)}.png`;
}

function fmtRp(n) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Number(n) || 0)}`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  let used = 0;
  for (const w of words) {
    used++;
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) {
        used = words.length;
        break;
      }
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (used < words.length && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[\s,.;:!?…]*$/, "") + "…";
  }
  return lines;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function drawBackground(ctx, imageUrl) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0f9488");
  g.addColorStop(0.55, "#0f766e");
  g.addColorStop(1, "#134e4a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#ffffff";
  for (const [cx, cy, r] of [[100, 260, 220], [980, 700, 300], [160, 1650, 260], [900, 1500, 200]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCover(ctx, img) {
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const ov = ctx.createLinearGradient(0, 0, 0, H);
  ov.addColorStop(0, "rgba(15,23,42,0.85)");
  ov.addColorStop(0.45, "rgba(15,23,42,0.4)");
  ov.addColorStop(1, "rgba(15,23,42,0.9)");
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, W, H);
}

function drawContent(ctx, data) {
  const { title, category, description, collected, target, daysLeft, donors, url, isProgram } = data;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = `800 46px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Markas Kebaikan", 80, 150);
  ctx.font = `400 30px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Sedekah · Donasi · Transparan", 82, 202);

  const chipLabel = category || "Kampanye Kebaikan";
  ctx.font = `600 34px ${FONT}`;
  const chipW = ctx.measureText(chipLabel).width + 64;
  roundRect(ctx, 80, 268, chipW, 76, 38);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(chipLabel, 112, 268 + 38);
  ctx.textBaseline = "alphabetic";

  ctx.font = `800 66px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  const titleLines = wrapText(ctx, title, 920, 5);
  let y = 900;
  for (const line of titleLines) {
    ctx.fillText(line, 80, y);
    y += 84;
  }
  const titleBottom = y;

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, titleBottom + 40);
  ctx.lineTo(W - 80, titleBottom + 40);
  ctx.stroke();

  let contentY = titleBottom + 110;

  if (isProgram) {
    ctx.font = `400 44px ${FONT}`;
    ctx.fillStyle = MUTED;
    for (const line of wrapText(ctx, description || "", 920, 6)) {
      ctx.fillText(line, 80, contentY);
      contentY += 62;
    }
    contentY += 40;
    const cta = "Bagikan Kebaikan";
    ctx.font = `700 40px ${FONT}`;
    const ctaW = ctx.measureText(cta).width + 90;
    roundRect(ctx, 80, contentY, ctaW, 92, 46);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.fillStyle = "#0f766e";
    ctx.textBaseline = "middle";
    ctx.fillText(cta, 80 + 45, contentY + 46);
    ctx.textBaseline = "alphabetic";
  } else {
    ctx.font = `500 34px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText("TERKUMPUL", 80, contentY);
    ctx.font = `800 78px ${FONT}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(fmtRp(collected), 80, contentY + 82);
    contentY += 104;
    const sub = [`dari ${fmtRp(target)}`];
    if (Number(daysLeft) > 0) sub.push(`sisa ${daysLeft} hari`);
    if (Number(donors) > 0) sub.push(`${Number(donors).toLocaleString("id-ID")} donatur`);
    ctx.font = `400 38px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(sub.join(" · "), 80, contentY);
    contentY += 78;
    const pct = Math.max(0, Math.min(1, (Number(collected) || 0) / (Number(target) || 1)));
    roundRect(ctx, 80, contentY, 920, 26, 13);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fill();
    if (pct > 0) {
      roundRect(ctx, 80, contentY, Math.max(26, 920 * pct), 26, 13);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();
    }
  }

  let urlSize = 32;
  ctx.font = `500 ${urlSize}px ${FONT}`;
  while (ctx.measureText(url).width > 900 && urlSize > 20) {
    urlSize -= 2;
    ctx.font = `500 ${urlSize}px ${FONT}`;
  }
  ctx.textAlign = "center";
  ctx.fillStyle = FAINT;
  ctx.fillText(url, W / 2, H - 130);
  ctx.font = `400 30px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("#MarkasKebaikan #Sedekah", W / 2, H - 78);
}

export async function makeShareCardFile({ key, title, image, category, description, collected, target, daysLeft, donors, url }) {
  const isProgram = collected === undefined || collected === null;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak didukung");

  drawBackground(ctx, image);
  if (image) {
    const img = await loadImage(image);
    if (img) drawCover(ctx, img);
  }
  drawContent(ctx, {
    title,
    category,
    description,
    collected,
    target,
    daysLeft,
    donors,
    url,
    isProgram,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Gagal membuat gambar"));
      resolve(new File([blob], shareFileName(key), { type: "image/png" }));
    }, "image/png");
  });
}
