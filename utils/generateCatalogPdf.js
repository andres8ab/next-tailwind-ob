import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LOGO_PATH,
  optimizeCatalogImage,
  resolveAssetUrl,
} from "@/utils/catalogAssets";
import { formatCatalogPrice, splitCatalogName } from "@/utils/catalogFormat";

const TITLE = "CATÁLOGO DE PRODUCTOS";

/**
 * @param {Array<{
 *   _id: string;
 *   slug: string;
 *   name: string;
 *   image: string;
 *   price: number;
 *   category: string;
 *   group?: string;
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
      const optimized = await optimizeCatalogImage(url, {
        maxWidth: 900,
        maxHeight: 520,
        quality: 0.68,
      });
      imageMeta.set(key, optimized);
    } catch {
      imageMeta.set(key, null);
    }
  }

  let logoDataUrl = null;
  try {
    logoDataUrl = await optimizeCatalogImage(resolveAssetUrl(LOGO_PATH), {
      maxWidth: 420,
      maxHeight: 200,
      quality: 0.72,
      cornerRadiusPx: 24,
    });
  } catch {
    logoDataUrl = null;
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const headerY = margin;
  const logoBox = 22;

  if (logoDataUrl) {
    try {
      const { w: lw, h: lh } = logoDataUrl;
      const scale = Math.min(logoBox / lw, logoBox / lh);
      const dw = lw * scale;
      const dh = lh * scale;
      doc.addImage(
        logoDataUrl.dataUrl,
        "JPEG",
        margin,
        headerY,
        dw,
        dh,
      );
    } catch {
      doc.addImage(
        logoDataUrl.dataUrl,
        "JPEG",
        margin,
        headerY,
        logoBox,
        logoBox,
      );
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

  const tableInnerWidth = pageWidth - 2 * margin;
  const colRef = 34;
  const colImg = 42;
  const colPrice = 28;
  const colName = Math.max(48, tableInnerWidth - colRef - colImg - colPrice);

  const body = [];

  /** @type {Map<number, { dataUrl: string; w: number; h: number } | null>} */
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
      doc.addImage(meta.dataUrl, "JPEG", x, y, dw, dh);
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
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  return { blobUrl, fileName: safeName };
}
