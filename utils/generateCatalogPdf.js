import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LOGO_PATH = "/logos/logoob.jpg";
const TITLE = "CATÁLOGO DE PRODUCTOS";

/** @param {string} path */
function resolveAssetUrl(path) {
  if (typeof window === "undefined") return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${window.location.origin}${path}`;
  return `${window.location.origin}/${path}`;
}

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
function dataUrlFormat(dataUrl) {
  if (dataUrl.includes("image/png")) return "PNG";
  if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg"))
    return "JPEG";
  if (dataUrl.includes("image/webp")) return "WEBP";
  return "PNG";
}

/** @param {string} dataUrl */
function loadImageDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("Image decode failed"));
    img.src = dataUrl;
  });
}

/**
 * @param {number} price
 * @returns {string}
 */
function formatCatalogPrice(price) {
  return "$ " + Number(price).toLocaleString("es-AR");
}

/**
 * Name format: "AL-005 Alternador NPR" → ref "AL-005", description "Alternador NPR".
 * @returns {{ ref: string; description: string }}
 */
function splitCatalogName(rawName) {
  const s = String(rawName).trim();
  const i = s.search(/\s/);
  if (i === -1) {
    return { ref: s.toUpperCase(), description: "" };
  }
  return {
    ref: s.slice(0, i).toUpperCase(),
    description: s.slice(i + 1).trim().toUpperCase(),
  };
}

/**
 * @param {Array<{
 *   _id: string;
 *   slug: string;
 *   name: string;
 *   image: string;
 *   price: number;
 *   category: string;
 *   countInStock: number;
 * }>} products
 */
export async function generateCatalogPdf(products) {
  const inStock = products
    .filter((p) => p.countInStock > 0)
    .sort((a, b) => {
      const c = a.category.localeCompare(b.category, "es");
      if (c !== 0) return c;
      return a.slug.localeCompare(b.slug, "es");
    });

  if (inStock.length === 0) {
    throw new Error("NO_STOCK");
  }

  const byCategory = new Map();
  for (const p of inStock) {
    const list = byCategory.get(p.category) || [];
    list.push(p);
    byCategory.set(p.category, list);
  }
  const categories = [...byCategory.keys()].sort((a, b) =>
    a.localeCompare(b, "es"),
  );

  const imageMeta = new Map();
  for (const p of inStock) {
    const key = String(p._id);
    const url = resolveAssetUrl(p.image);
    try {
      const dataUrl = await fetchAsDataUrl(url);
      const { w, h } = await loadImageDimensions(dataUrl);
      imageMeta.set(key, {
        dataUrl,
        format: dataUrlFormat(dataUrl),
        w,
        h,
      });
    } catch {
      imageMeta.set(key, null);
    }
  }

  let logoDataUrl = null;
  try {
    logoDataUrl = await fetchAsDataUrl(resolveAssetUrl(LOGO_PATH));
  } catch {
    logoDataUrl = null;
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const headerY = margin;
  const logoBox = 22;

  if (logoDataUrl) {
    const fmt = dataUrlFormat(logoDataUrl);
    try {
      const { w: lw, h: lh } = await loadImageDimensions(logoDataUrl);
      const scale = Math.min(logoBox / lw, logoBox / lh);
      const dw = lw * scale;
      const dh = lh * scale;
      doc.addImage(logoDataUrl, fmt, margin, headerY, dw, dh);
    } catch {
      doc.addImage(logoDataUrl, fmt, margin, headerY, logoBox, logoBox);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(TITLE, pageWidth / 2, headerY + logoBox / 2 + 2, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    new Date().toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    pageWidth / 2,
    headerY + logoBox / 2 + 8,
    { align: "center" },
  );
  doc.setTextColor(0, 0, 0);

  const tableStartY = headerY + logoBox + 10;

  /** Use full width: fixed cols + description absorbs the remainder (no phantom column). */
  const tableInnerWidth = pageWidth - 2 * margin;
  const colRef = 34;
  const colImg = 42;
  const colPrice = 28;
  const colName = Math.max(48, tableInnerWidth - colRef - colImg - colPrice);

  const body = [];

  /** @type {Map<number, { dataUrl: string; format: string; w: number; h: number } | null>} */
  const imagesByBodyRow = new Map();

  for (const category of categories) {
    body.push([
      {
        content: category.toUpperCase(),
        colSpan: 4,
        styles: {
          fillColor: [0, 0, 0],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          minCellHeight: 8,
        },
      },
    ]);

    for (const p of byCategory.get(category) || []) {
      const rowIdx = body.length;
      const { ref, description } = splitCatalogName(p.name);
      body.push([
        {
          content: ref,
          styles: {
            fontStyle: "bold",
            halign: "center",
            valign: "middle",
          },
        },
        {
          content: description,
          styles: {
            halign: "center",
            valign: "middle",
          },
        },
        {
          content: "",
          styles: {
            minCellHeight: 30,
            fillColor: [255, 255, 255],
          },
        },
        {
          content: formatCatalogPrice(p.price),
          styles: {
            fontStyle: "bold",
            halign: "center",
            valign: "middle",
          },
        },
      ]);
      imagesByBodyRow.set(rowIdx, imageMeta.get(String(p._id)) ?? null);
    }
  }

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin, top: 0, bottom: 10 },
    tableWidth: tableInnerWidth,
    rowPageBreak: "avoid",
    theme: "grid",
    tableLineWidth: 0.15,
    tableLineColor: [0, 0, 0],
    showHead: "everyPage",
    head: [["Ref.", "Descripción", "Imagen", "Precio"]],
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      valign: "middle",
      lineWidth: 0.15,
      lineColor: [0, 0, 0],
    },
    body,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 1.8,
      valign: "middle",
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { cellWidth: colRef },
      1: { cellWidth: colName },
      2: { cellWidth: colImg },
      3: { cellWidth: colPrice },
    },
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== 2) return;
      const meta = imagesByBodyRow.get(data.row.index);
      const cell = data.cell;
      if (!meta?.dataUrl) return;

      const pad = 2;
      const maxW = cell.width - pad * 2;
      const maxH = cell.height - pad * 2;
      const scale = Math.min(maxW / meta.w, maxH / meta.h);
      const dw = meta.w * scale;
      const dh = meta.h * scale;
      const x = cell.x + (cell.width - dw) / 2;
      const y = cell.y + (cell.height - dh) / 2;
      doc.addImage(meta.dataUrl, meta.format, x, y, dw, dh);
    },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Página ${data.pageNumber}`, pageWidth / 2, pageHeight - 8, {
        align: "center",
      });
      doc.setTextColor(0, 0, 0);
    },
  });

  const safeName = `catalogo-ob-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeName);
}
