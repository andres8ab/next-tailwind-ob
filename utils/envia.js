const ENVIA_USUARIO = "3406795";
const ENVIA_GUIA_URL =
  "https://hub.envia.co/2impresionguias/ISticker10_15COCE.aspx";

export function enviaGuiaHref(guia) {
  if (guia == null || guia === "") return "";
  const g = String(guia).trim();
  if (!g) return "";
  const params = new URLSearchParams({
    Guia: g,
    usuario: ENVIA_USUARIO,
  });
  return `${ENVIA_GUIA_URL}?${params.toString()}`;
}

// Las guias de Envia comienzan con 047; cualquier otro texto en deliveredAt
// significa que la orden se entrego por fuera de Envia.
export function isEnviaGuia(guia) {
  return /^047/.test(String(guia ?? "").trim());
}
