const KEY_RECENT = "brawl_recent";
const KEY_FAV = "brawl_favorites";

function safeParse(v, fallback) {
  try { return JSON.parse(v); } catch { return fallback; }
}

export function getRecent() {
  return safeParse(localStorage.getItem(KEY_RECENT) || "[]", []);
}
export function pushRecent(entry) {
  const list = getRecent().filter(x => !(x.type===entry.type && x.tag===entry.tag));
  list.unshift({ ...entry, ts: Date.now() });
  localStorage.setItem(KEY_RECENT, JSON.stringify(list.slice(0, 20)));
}
export function getFavorites() {
  return safeParse(localStorage.getItem(KEY_FAV) || "[]", []);
}
export function toggleFavorite(entry) {
  const list = getFavorites();
  const idx = list.findIndex(x => x.type===entry.type && x.tag===entry.tag);
  if (idx >= 0) list.splice(idx, 1);
  else list.unshift({ ...entry, ts: Date.now() });
  localStorage.setItem(KEY_FAV, JSON.stringify(list.slice(0, 50)));
  return list;
}
export function isFavorite(entry) {
  return getFavorites().some(x => x.type===entry.type && x.tag===entry.tag);
}
