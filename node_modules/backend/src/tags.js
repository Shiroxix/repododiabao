const ALLOWED = "0289PYLQGRJCUV"; // alfabeto de tags da Supercell (sem 1, O, I)
export function normalizeTag(input) {
  const raw = String(input || "").toUpperCase().trim();
  const cleaned = raw.replace(/^#/, "").replace(/[^A-Z0-9]/g, "");
  // substituições comuns (O->0)
  const fixed = cleaned.replace(/O/g, "0");
  return fixed;
}
export function validateTagOrThrow(tag) {
  if (!tag || tag.length < 3 || tag.length > 14) throw new Error("TAG com tamanho inválido.");
  for (const ch of tag) {
    if (!ALLOWED.includes(ch)) throw new Error("TAG contém caracteres inválidos.");
  }
  return true;
}
