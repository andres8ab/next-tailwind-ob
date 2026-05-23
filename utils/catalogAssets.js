const LOGO_PATH = "/logos/logoob.png";

/** @param {string} path */
export function resolveAssetUrl(path) {
  if (typeof window === "undefined") return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${window.location.origin}${path}`;
  return `${window.location.origin}/${path}`;
}

export { LOGO_PATH };

/** @param {string} url */
async function fetchAsDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load: ${url}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(/** @type {string} */ (r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** @param {string} dataUrl */
function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image decode failed"));
    img.src = dataUrl;
  });
}

/**
 * @param {string} url
 * @param {{ maxWidth?: number; maxHeight?: number; quality?: number; cornerRadiusPx?: number }} opts
 */
export async function optimizeCatalogImage(url, opts = {}) {
  const {
    maxWidth = 900,
    maxHeight = 520,
    quality = 0.68,
    cornerRadiusPx = 0,
  } = opts;

  const original = await fetchAsDataUrl(url);
  const img = await loadImageElement(original);
  const sourceW = img.naturalWidth || img.width || 1;
  const sourceH = img.naturalHeight || img.height || 1;
  const scale = Math.min(1, maxWidth / sourceW, maxHeight / sourceH);
  const targetW = Math.max(1, Math.round(sourceW * scale));
  const targetH = Math.max(1, Math.round(sourceH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { dataUrl: original, w: sourceW, h: sourceH };
  }

  const drawRoundedRectPath = (x, y, w, h, radius) => {
    const r = Math.max(0, Math.min(radius, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  };

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetW, targetH);

  if (cornerRadiusPx > 0) {
    drawRoundedRectPath(0, 0, targetW, targetH, cornerRadiusPx);
    ctx.clip();
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);
  const optimized = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl: optimized, w: targetW, h: targetH };
}
