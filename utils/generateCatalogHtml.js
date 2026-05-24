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
    .bar .btn-whatsapp {
      display: none;
      width: 100%;
      padding: 14px;
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      background: #128c7e;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      margin-bottom: 8px;
      -webkit-tap-highlight-color: transparent;
    }
    .bar .btn-whatsapp.visible { display: block; }
    .bar .btn-whatsapp:active { opacity: 0.92; }
    .bar {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
      background: #fff;
      border-top: 1px solid #e4e4e7;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
      z-index: 10;
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
    .manual-copy { display: none; margin-top: 8px; }
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
    <strong>iPhone en WhatsApp:</strong> el portapapeles no está disponible aquí. Usá
    <strong>Enviar pedido en WhatsApp</strong> (abre el mensaje listo) o mantené pulsado
    el texto del pedido y elegí <strong>Copiar</strong>.
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
    <button type="button" class="btn-whatsapp" id="wa-btn">Enviar pedido en WhatsApp</button>
    <button type="button" class="btn-primary" id="copy-btn">Copiar pedido para WhatsApp</button>
    <button type="button" class="btn-secondary" id="share-btn">Compartir pedido</button>
    <p id="toast" class="toast" role="status"></p>
    <div id="manual-copy" class="manual-copy">
      <p class="hint">Mantené pulsado el texto y elegí <strong>Copiar</strong>:</p>
      <textarea id="order-preview" aria-label="Texto del pedido"></textarea>
    </div>
  </div>
  <script>
    (function() {
      var SUCCESS_MSG = "Pedido copiado. Pegalo en WhatsApp.";
      var helper = document.getElementById("copy-helper");
      var preview = document.getElementById("order-preview");
      var manualBox = document.getElementById("manual-copy");
      var shareBtn = document.getElementById("share-btn");
      var waBtn = document.getElementById("wa-btn");
      var copyBtn = document.getElementById("copy-btn");
      var iosHint = document.getElementById("ios-wa-hint");
      var helpText = document.getElementById("help-text");

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
        try {
          preview.focus({ preventScroll: true });
          preview.select();
          preview.setSelectionRange(0, text.length);
        } catch (e) {}
      }

      function onCopySuccess(msg) {
        showToast(msg || SUCCESS_MSG, true);
        hideManual();
      }

      function isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
      }

      function isRestrictedWebView() {
        var ua = navigator.userAgent || "";
        if (/WhatsApp|Instagram|FBAN|FBAV|Line\\//i.test(ua)) return true;
        if (isIOS() && /AppleWebKit/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)) {
          return !/Safari/i.test(ua);
        }
        return false;
      }

      function isIosInAppBrowser() {
        return isIOS() && isRestrictedWebView();
      }

      /** iOS in-app browsers block clipboard; WhatsApp URL opens composer with text. */
      function sendViaWhatsAppLink(text) {
        var encoded = encodeURIComponent(text);
        var url = isIOS()
          ? "whatsapp://send?text=" + encoded
          : "https://api.whatsapp.com/send?text=" + encoded;
        var link = document.createElement("a");
        link.href = url;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }

      function setupIosWhatsAppUi() {
        if (!isIosInAppBrowser()) return;
        waBtn.classList.add("visible");
        iosHint.classList.add("visible");
        copyBtn.textContent = "Copiar pedido (si no funciona, usá Enviar arriba)";
        if (helpText) {
          helpText.innerHTML =
            "<strong>Cómo pedir:</strong> cantidad en <strong>Cant.</strong>, luego " +
            "<strong>Enviar pedido en WhatsApp</strong> (recomendado en iPhone).";
        }
      }
      setupIosWhatsAppUi();

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

      function shareViaNative(text) {
        if (!navigator.share) {
          return Promise.reject(new Error("share unavailable"));
        }
        return navigator.share({ title: "Pedido OB", text: text });
      }

      function runCopyFlow(text) {
        function tryClipboardThenManual() {
          copyViaClipboardApi(text)
            .then(function() { onCopySuccess(); })
            .catch(function() {
              showManual(text);
              if (isIosInAppBrowser()) {
                showToast("Mantené pulsado el texto de abajo → Copiar.", false);
              } else {
                showToast("Mantené pulsado el texto y elegí Copiar.", false);
              }
            });
        }

        function trySyncThenClipboard() {
          if (copySync(text)) {
            onCopySuccess();
            return;
          }
          tryClipboardThenManual();
        }

        if (isIosInAppBrowser()) {
          showManual(text);
          trySyncThenClipboard();
          return;
        }

        if (navigator.share && isRestrictedWebView()) {
          shareViaNative(text)
            .then(function() {
              onCopySuccess("Pedido listo. Elegí WhatsApp en compartir.");
            })
            .catch(function() {
              trySyncThenClipboard();
            });
          return;
        }

        trySyncThenClipboard();
      }

      if (navigator.share && !isIosInAppBrowser()) {
        shareBtn.classList.add("visible");
      }

      waBtn.addEventListener("click", function() {
        var text = buildOrderText();
        if (orderLineCount(text) < 1) {
          showToast("Ingresá al menos una cantidad.", false);
          return;
        }
        showManual(text);
        if (sendViaWhatsAppLink(text)) {
          showToast("Elegí el chat de WhatsApp para enviar el pedido.", true);
        } else {
          showToast("No se pudo abrir WhatsApp. Copiá el texto de abajo.", false);
        }
      }, false);

      copyBtn.addEventListener("click", function() {
        var text = buildOrderText();
        if (orderLineCount(text) < 1) {
          showToast("Ingresá al menos una cantidad.", false);
          hideManual();
          return;
        }
        runCopyFlow(text);
      }, false);

      shareBtn.addEventListener("click", function() {
        var text = buildOrderText();
        if (orderLineCount(text) < 1) {
          showToast("Ingresá al menos una cantidad.", false);
          return;
        }
        shareViaNative(text)
          .then(function() {
            onCopySuccess("Pedido listo. Elegí WhatsApp en compartir.");
          })
          .catch(function() {
            runCopyFlow(text);
          });
      }, false);

      preview.addEventListener("focus", function() {
        try {
          preview.select();
          preview.setSelectionRange(0, preview.value.length);
        } catch (e) {}
      });

      preview.addEventListener("click", function() {
        var text = preview.value;
        if (!text) return;
        if (isIosInAppBrowser()) {
          try {
            preview.focus();
            preview.select();
            preview.setSelectionRange(0, text.length);
          } catch (e) {}
          showToast("Mantené pulsado → Copiar", false);
          return;
        }
        if (copySync(text)) {
          onCopySuccess();
        } else {
          try {
            preview.focus();
            preview.select();
            preview.setSelectionRange(0, text.length);
          } catch (e) {}
        }
      });
    })();
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const fileName = `catalogo-ob-${new Date().toISOString().slice(0, 10)}.html`;
  return { blobUrl, fileName };
}
