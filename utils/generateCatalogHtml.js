import {
  LOGO_PATH,
  optimizeCatalogImage,
  resolveAssetUrl,
} from "@/utils/catalogAssets";
import {
  escapeHtml,
  formatCatalogPrice,
  splitCatalogName,
} from "@/utils/catalogFormat";

const TITLE = "CATÁLOGO DE PRODUCTOS";

/**
 * Self-contained HTML file: qty inputs + copy order. Works offline on any phone browser.
 * @param {Array<object>} products
 */
export async function generateCatalogHtml(products) {
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
    try {
      const optimized = await optimizeCatalogImage(resolveAssetUrl(p.image), {
        maxWidth: 480,
        maxHeight: 320,
        quality: 0.72,
      });
      imageMeta.set(String(p._id), optimized.dataUrl);
    } catch {
      imageMeta.set(String(p._id), null);
    }
  }

  let logoSrc = "";
  try {
    const logo = await optimizeCatalogImage(resolveAssetUrl(LOGO_PATH), {
      maxWidth: 280,
      maxHeight: 120,
      quality: 0.8,
      cornerRadiusPx: 16,
    });
    logoSrc = logo.dataUrl;
  } catch {
    logoSrc = "";
  }

  const dateLabel = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let tableRows = "";
  for (const category of categories) {
    tableRows += `<tr class="category-row"><td colspan="5">${escapeHtml(category.toUpperCase())}</td></tr>`;
    for (const p of byCategory.get(category) || []) {
      const { ref, description } = splitCatalogName(p.name);
      const img = imageMeta.get(String(p._id));
      const imgHtml = img
        ? `<img src="${img}" alt="" loading="lazy" />`
        : `<span class="no-img">—</span>`;
      tableRows += `<tr data-ref="${escapeHtml(ref)}">
        <td class="ref">${escapeHtml(ref)}</td>
        <td class="desc">${escapeHtml(description)}</td>
        <td class="img">${imgHtml}</td>
        <td class="price">${escapeHtml(formatCatalogPrice(p.price))}</td>
        <td class="qty"><input type="number" class="qty-input" min="0" step="1" inputmode="numeric" placeholder="0" aria-label="Cantidad ${escapeHtml(ref)}" /></td>
      </tr>`;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>${escapeHtml(TITLE)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      color: #111;
      background: #f4f4f5;
      padding-bottom: calc(88px + env(safe-area-inset-bottom));
    }
    .header {
      background: #fff;
      border-bottom: 1px solid #e4e4e7;
      padding: 16px;
      text-align: center;
    }
    .header img.logo { max-height: 56px; max-width: 200px; object-fit: contain; }
    .header h1 { margin: 10px 0 4px; font-size: 1.15rem; letter-spacing: 0.02em; }
    .header .date { color: #71717a; font-size: 0.85rem; }
    .help {
      margin: 12px 16px 0;
      padding: 12px;
      background: #fff;
      border: 1px solid #e4e4e7;
      border-radius: 10px;
      font-size: 0.85rem;
      line-height: 1.45;
      color: #3f3f46;
    }
    .table-wrap { margin: 12px 8px 0; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table {
      width: 100%;
      min-width: 520px;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #111;
    }
    th, td { border: 1px solid #111; padding: 8px 6px; text-align: center; vertical-align: middle; }
    th { background: #f5f5f5; font-size: 0.8rem; }
    tr.category-row td {
      background: #111;
      color: #fff;
      font-weight: 700;
      font-size: 0.85rem;
    }
    td.ref { font-weight: 700; white-space: nowrap; }
    td.desc { text-align: left; font-size: 0.8rem; max-width: 140px; }
    td.img img { max-width: 72px; max-height: 52px; object-fit: contain; display: block; margin: 0 auto; }
    td.price { font-weight: 700; white-space: nowrap; font-size: 0.85rem; }
    .qty-input {
      width: 56px;
      max-width: 100%;
      padding: 8px 4px;
      font-size: 16px;
      text-align: center;
      border: 1px solid #a1a1aa;
      border-radius: 6px;
    }
    .bar {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
      background: #fff;
      border-top: 1px solid #e4e4e7;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
      z-index: 10;
    }
    .bar button {
      width: 100%;
      padding: 14px;
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      background: #18181b;
      border: none;
      border-radius: 10px;
      cursor: pointer;
    }
    .bar button:active { opacity: 0.9; }
    .toast {
      display: none;
      margin-top: 8px;
      padding: 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      text-align: center;
    }
    .toast.ok { display: block; background: #dcfce7; color: #166534; }
    .toast.err { display: block; background: #fee2e2; color: #991b1b; }
    #order-preview {
      display: none;
      margin-top: 8px;
      width: 100%;
      min-height: 80px;
      font-family: monospace;
      font-size: 12px;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid #d4d4d8;
    }
  </style>
</head>
<body>
  <header class="header">
    ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="OB" />` : ""}
    <h1>${escapeHtml(TITLE)}</h1>
    <p class="date">${escapeHtml(dateLabel)}</p>
  </header>
  <p class="help">
    <strong>Cómo pedir:</strong> escribí la cantidad en <strong>Cant.</strong>, tocá
    <strong>Copiar pedido</strong> y pegá el texto en WhatsApp.
  </p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Ref.</th>
          <th>Descripción</th>
          <th>Imagen</th>
          <th>Precio</th>
          <th>Cant.</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>
  <div class="bar">
    <button type="button" id="copy-btn">Copiar pedido para WhatsApp</button>
    <p id="toast" class="toast" role="status"></p>
    <textarea id="order-preview" readonly aria-label="Vista del pedido"></textarea>
  </div>
  <script>
    function buildOrderText() {
      var lines = ["PEDIDO OB"];
      document.querySelectorAll("tr[data-ref]").forEach(function(row) {
        var input = row.querySelector(".qty-input");
        var qty = parseInt(input && input.value, 10);
        if (qty > 0) lines.push(row.getAttribute("data-ref") + " x" + qty);
      });
      return lines.join("\\n");
    }
    function showToast(msg, ok) {
      var el = document.getElementById("toast");
      el.textContent = msg;
      el.className = "toast " + (ok ? "ok" : "err");
    }
    document.getElementById("copy-btn").addEventListener("click", function() {
      var text = buildOrderText();
      var count = text.split("\\n").length - 1;
      if (count < 1) {
        showToast("Ingresá al menos una cantidad.", false);
        return;
      }
      var preview = document.getElementById("order-preview");
      function onSuccess() {
        showToast("Pedido copiado. Pegalo en WhatsApp.", true);
        preview.style.display = "none";
      }
      function showManual() {
        preview.value = text;
        preview.style.display = "block";
        preview.focus();
        preview.select();
        showToast("Seleccioná el texto y copiá (mantener pulsado).", false);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(showManual);
      } else {
        try {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          var ok = document.execCommand("copy");
          document.body.removeChild(ta);
          if (ok) onSuccess();
          else showManual();
        } catch (e) {
          showManual();
        }
      }
    });
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const fileName = `catalogo-ob-${new Date().toISOString().slice(0, 10)}.html`;
  return { blobUrl, fileName };
}
