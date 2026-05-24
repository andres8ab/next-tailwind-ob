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
/**
 * @param {Array<object>} products
 * @param {{ catalogUrl?: string }} options
 */
export async function generateCatalogHtml(products, options = {}) {
  const catalogUrl = options.catalogUrl || "";
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
      padding-bottom: calc(120px + env(safe-area-inset-bottom));
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
    .table-wrap { margin: 12px 6px 0; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #111;
    }
    col.col-ref { width: 13%; }
    col.col-desc { width: 26%; }
    col.col-img { width: 22%; }
    col.col-price { width: 19%; }
    col.col-qty { width: 20%; }
    th, td { border: 1px solid #111; padding: 7px 5px; text-align: center; vertical-align: middle; }
    th { background: #f5f5f5; font-size: 0.75rem; }
    th.col-ref, td.ref {
      padding: 7px 5px;
      font-size: 0.72rem;
      line-height: 1.25;
      letter-spacing: -0.02em;
    }
    tr.category-row td {
      background: #111;
      color: #fff;
      font-weight: 700;
      font-size: 0.8rem;
    }
    td.ref { font-weight: 700; white-space: normal; word-break: break-word; }
    td.desc {
      text-align: left;
      font-size: 0.72rem;
      line-height: 1.25;
      overflow: hidden;
      word-break: break-word;
    }
    td.img img { max-width: 100%; max-height: 46px; object-fit: contain; display: block; margin: 0 auto; }
    td.price { font-weight: 700; white-space: normal; font-size: 0.72rem; line-height: 1.2; word-break: break-word; }
    .qty-input {
      width: 100%;
      max-width: 52px;
      padding: 7px 3px;
      font-size: 16px;
      text-align: center;
      border: 1px solid #a1a1aa;
      border-radius: 6px;
    }
    .ios-wa-hint {
      display: none;
      margin: 12px 16px 0;
      padding: 12px;
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      border-radius: 10px;
      font-size: 0.85rem;
      line-height: 1.45;
      color: #065f46;
    }
    .ios-wa-hint.visible { display: block; }
    .file-preview-warn {
      margin: 12px 16px 0;
      padding: 14px;
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 10px;
      font-size: 0.9rem;
      line-height: 1.5;
      color: #78350f;
    }
    .file-preview-warn a {
      color: #b45309;
      font-weight: 700;
      word-break: break-all;
    }
    .bar .btn-whatsapp {
      display: block;
      width: 100%;
      padding: 14px;
      font-size: 1rem;
      font-weight: 700;
      color: #fff !important;
      background: #128c7e;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      margin-bottom: 8px;
      text-align: center;
      text-decoration: none;
      line-height: 1.25;
      -webkit-tap-highlight-color: transparent;
    }
    .bar .btn-whatsapp:active { opacity: 0.92; }
    .bar .btn-select-text {
      display: none;
      width: 100%;
      margin-top: 8px;
      padding: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #18181b;
      background: #fff;
      border: 2px solid #128c7e;
      border-radius: 10px;
      cursor: pointer;
    }
    .bar .btn-select-text.visible { display: block; }
    .manual-copy.visible .hint { color: #065f46; font-weight: 600; }
    #order-preview:focus {
      outline: 2px solid #128c7e;
      border-color: #128c7e;
      background: #fff;
    }
    .bar {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
      background: #fff;
      border-top: 1px solid #e4e4e7;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
      z-index: 100;
    }
    .bar button {
      position: relative;
      z-index: 101;
    }
    .bar .btn-primary {
      width: 100%;
      padding: 14px;
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      background: #18181b;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .bar .btn-primary:active { opacity: 0.9; }
    .bar .btn-secondary {
      display: none;
      width: 100%;
      margin-top: 8px;
      padding: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #18181b;
      background: #f4f4f5;
      border: 1px solid #d4d4d8;
      border-radius: 10px;
      cursor: pointer;
    }
    .bar .btn-secondary.visible { display: block; }
    #copy-helper {
      position: fixed;
      top: 0;
      left: 0;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: 0;
      border: 0;
      opacity: 0.01;
      font-size: 16px;
      z-index: 1;
      pointer-events: none;
    }
    .toast {
      display: none;
      margin-top: 8px;
      padding: 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      text-align: center;
      line-height: 1.35;
    }
    .toast.ok { display: block; background: #dcfce7; color: #166534; }
    .toast.err { display: block; background: #fee2e2; color: #991b1b; }
    .manual-copy { display: none; margin-top: 8px; max-height: 38vh; overflow-y: auto; }
    .manual-copy.visible { display: block; }
    .manual-copy .hint {
      margin: 0 0 6px;
      font-size: 0.8rem;
      color: #52525b;
    }
    #order-preview {
      width: 100%;
      min-height: 72px;
      font-family: ui-monospace, monospace;
      font-size: 13px;
      line-height: 1.4;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #d4d4d8;
      background: #fafafa;
      resize: none;
      -webkit-user-select: all;
      user-select: all;
    }
  </style>
</head>
<body>
  ${
    catalogUrl
      ? `<div class="file-preview-warn">
    <p><strong>⚠️ iPhone / vista previa de archivo</strong></p>
    <p>En WhatsApp los botones de este archivo <strong>no funcionan</strong> (iOS bloquea JavaScript).</p>
    <p>Abrí el catálogo en el navegador (Safari o Chrome):</p>
    <p><a href="${escapeHtml(catalogUrl)}">${escapeHtml(catalogUrl)}</a></p>
    <p>Mantené pulsado el enlace → <strong>Abrir en Safari</strong></p>
  </div>`
      : ""
  }
  <header class="header">
    ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="OB" />` : ""}
    <h1>${escapeHtml(TITLE)}</h1>
    <p class="date">${escapeHtml(dateLabel)}</p>
  </header>
  <p class="help" id="help-text">
    <strong>Cómo pedir:</strong> escribí la cantidad en <strong>Cant.</strong>, tocá
    <strong>Copiar pedido</strong> y pegá el texto en WhatsApp.
  </p>
  <p class="ios-wa-hint" id="ios-wa-hint">
    <strong>iPhone / WhatsApp:</strong> tocá <strong>Compartir pedido</strong> y elegí
  <strong>WhatsApp</strong> o <strong>Copiar</strong>. Si no aparece, mantené pulsado
  el texto del pedido (abajo) y elegí <strong>Copiar</strong>.
  </p>
  <div class="table-wrap">
    <table>
      <colgroup>
        <col class="col-ref" />
        <col class="col-desc" />
        <col class="col-img" />
        <col class="col-price" />
        <col class="col-qty" />
      </colgroup>
      <thead>
        <tr>
          <th class="col-ref">Ref.</th>
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
    <textarea id="copy-helper" aria-hidden="true" tabindex="-1"></textarea>
    <button type="button" class="btn-whatsapp" id="share-wa-btn" onclick="window.OBCatalog.shareOrder(event)">Compartir pedido en WhatsApp</button>
    <button type="button" class="btn-primary" id="copy-btn" onclick="window.OBCatalog.copyOrder(event)">Copiar pedido para WhatsApp</button>
    <button type="button" class="btn-select-text" id="select-text-btn" onclick="window.OBCatalog.showOrderText(event)">Seleccionar texto del pedido</button>
    <p id="toast" class="toast" role="status"></p>
    <div id="manual-copy" class="manual-copy">
      <p class="hint" id="manual-hint">Mantené pulsado el texto y elegí <strong>Copiar</strong>:</p>
      <textarea id="order-preview" aria-label="Texto del pedido" rows="5"></textarea>
    </div>
  </div>
  <script>
    window.OBCatalog = window.OBCatalog || {};
    (function(OB) {
      var SUCCESS_MSG = "Pedido copiado. Pegalo en WhatsApp.";
      var helper = document.getElementById("copy-helper");
      var preview = document.getElementById("order-preview");
      var manualBox = document.getElementById("manual-copy");
      var shareWaBtn = document.getElementById("share-wa-btn");
      var copyBtn = document.getElementById("copy-btn");
      var iosHint = document.getElementById("ios-wa-hint");
      var helpText = document.getElementById("help-text");
      var manualHint = document.getElementById("manual-hint");

      function buildOrderText() {
        var lines = ["PEDIDO OB"];
        document.querySelectorAll("tr[data-ref]").forEach(function(row) {
          var input = row.querySelector(".qty-input");
          var qty = parseInt(input && input.value, 10);
          if (qty > 0) lines.push(row.getAttribute("data-ref") + " x" + qty);
        });
        return lines.join("\\n");
      }

      function orderLineCount(text) {
        var n = 0;
        text.split("\\n").forEach(function(line) {
          if (line && line.indexOf("PEDIDO") !== 0) n++;
        });
        return n;
      }

      function showToast(msg, ok) {
        var el = document.getElementById("toast");
        el.textContent = msg;
        el.className = "toast " + (ok ? "ok" : "err");
      }

      function hideManual() {
        manualBox.classList.remove("visible");
      }

      function showManual(text) {
        preview.value = text;
        manualBox.classList.add("visible");
        selectPreviewText();
      }

      function selectPreviewText() {
        try {
          preview.focus();
          preview.select();
          preview.setSelectionRange(0, preview.value.length);
        } catch (e) {
          try { preview.select(); } catch (e2) {}
        }
      }

      function scrollToOrderText() {
        try {
          manualBox.scrollIntoView({ behavior: "smooth", block: "end" });
        } catch (e) {
          try { preview.scrollIntoView(false); } catch (e2) {}
        }
      }

      function presentOrderText(text, toastMsg, ok) {
        showManual(text);
        scrollToOrderText();
        showToast(toastMsg, ok !== false);
      }

      function onCopySuccess(msg) {
        showToast(msg || SUCCESS_MSG, true);
        hideManual();
      }

      function isIOS() {
        var ua = navigator.userAgent || "";
        if (/iPhone|iPad|iPod/i.test(ua)) return true;
        return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
      }

      function isInsideWhatsApp() {
        return /WhatsApp/i.test(navigator.userAgent || "");
      }

      function isLimitedCopyEnv() {
        return isIOS() || isInsideWhatsApp();
      }

      function setupPlatformUi() {
        if (isLimitedCopyEnv()) {
          iosHint.classList.add("visible");
          selectTextBtn.classList.add("visible");
          shareWaBtn.style.display = "block";
          copyBtn.textContent = "Intentar copiar pedido";
          if (!navigator.share) {
            shareWaBtn.textContent = "Mostrar pedido para copiar";
          }
          if (helpText) {
            helpText.innerHTML =
              "<strong>Cómo pedir:</strong> cantidad en <strong>Cant.</strong>, luego " +
              "<strong>Compartir pedido</strong> o copiá el texto de abajo.";
          }
          if (manualHint) {
            manualHint.innerHTML =
              "Mantené pulsado sobre el texto y elegí <strong>Copiar</strong>:";
          }
        } else {
          shareWaBtn.style.display = "none";
        }
      }
      setupPlatformUi();

      function tryNativeShare(text) {
        if (typeof navigator.share !== "function") return null;
        try {
          var p = navigator.share({ title: "Pedido OB", text: text });
          if (p && typeof p.then === "function") {
            p.then(function() {
              showToast("Elegí WhatsApp o Copiar en el menú.", true);
            }).catch(function(err) {
              if (err && err.name === "AbortError") return;
              presentOrderText(
                text,
                "Mantené pulsado el texto → Copiar.",
                false
              );
            });
          } else {
            showToast("Elegí WhatsApp o Copiar en el menú.", true);
          }
          return p;
        } catch (err) {
          if (err && err.name === "AbortError") return null;
          return null;
        }
      }

      OB.getOrderText = function() {
        return buildOrderText();
      };

      OB.shareOrder = function(ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        var text = buildOrderText();
        if (orderLineCount(text) < 1) {
          showToast("Ingresá al menos una cantidad.", false);
          hideManual();
          return false;
        }
        presentOrderText(
          text,
          "Si aparece Compartir, elegí WhatsApp. Si no, mantené pulsado el texto → Copiar.",
          true
        );
        tryNativeShare(text);
        return false;
      };

      OB.showOrderText = function(ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        var text = buildOrderText();
        if (orderLineCount(text) < 1) {
          showToast("Ingresá al menos una cantidad.", false);
          return false;
        }
        presentOrderText(
          text,
          "Mantené pulsado el texto → Copiar.",
          false
        );
        return false;
      };

      OB.copyOrder = function(ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        var text = buildOrderText();
        if (orderLineCount(text) < 1) {
          showToast("Ingresá al menos una cantidad.", false);
          hideManual();
          return false;
        }
        if (isLimitedCopyEnv()) {
          showManual(text);
          scrollToOrderText();
          if (copySync(text)) {
            onCopySuccess();
          } else {
            showToast("Mantené pulsado el texto → Copiar.", false);
          }
          return false;
        }
        runCopyFlow(text);
        return false;
      };

      /** Sync copy — must run in the same tap/click handler (mobile WebViews). */
      function copySync(text) {
        helper.value = text;
        helper.removeAttribute("readonly");
        helper.style.display = "block";
        helper.style.pointerEvents = "auto";
        var ok = false;
        try {
          helper.focus({ preventScroll: true });
          helper.select();
          helper.setSelectionRange(0, text.length);
          ok = document.execCommand("copy");
        } catch (e) {}
        if (!ok) {
          try {
            var range = document.createRange();
            range.selectNodeContents(helper);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            ok = document.execCommand("copy");
            sel.removeAllRanges();
          } catch (e2) {}
        }
        helper.style.display = "";
        helper.style.pointerEvents = "none";
        helper.setAttribute("readonly", "readonly");
        return ok;
      }

      function copyViaClipboardApi(text) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          return Promise.reject(new Error("clipboard unavailable"));
        }
        return navigator.clipboard.writeText(text);
      }

      function runCopyFlow(text) {
        function tryClipboardThenManual() {
          copyViaClipboardApi(text)
            .then(function() { onCopySuccess(); })
            .catch(function() {
              showManual(text);
              showToast("Mantené pulsado el texto y elegí Copiar.", false);
            });
        }

        function trySyncThenClipboard() {
          if (copySync(text)) {
            onCopySuccess();
            return;
          }
          tryClipboardThenManual();
        }

        trySyncThenClipboard();
      }

      preview.addEventListener("focus", selectPreviewText);
      preview.addEventListener("click", selectPreviewText);
    })(window.OBCatalog);
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const fileName = `catalogo-ob-${new Date().toISOString().slice(0, 10)}.html`;
  return { blobUrl, fileName };
}
