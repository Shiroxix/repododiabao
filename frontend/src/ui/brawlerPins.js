// Auto-load local Brawler pins (offline-friendly).
// Files live in: src/assets/brawlers/pins/*_gg_pin.png
import placeholder from "../assets/ui/placeholder-brawler.png";

const modules = import.meta.glob("../assets/brawlers/pins/*_gg_pin.png", {
  eager: true,
  import: "default",
});

// Build key -> src map, where key is filename without suffix.
const pinMap = {};
for (const [path, src] of Object.entries(modules)) {
  const file = path.split("/").pop() || "";
  // e.g. "shelly_gg_pin.png" -> "shelly"
  const key = file.replace(/_gg_pin\.png$/i, "").toLowerCase();
  pinMap[key] = src;
}

// Normalize API names to our keys.
// Examples:
// "8-BIT" -> "8bit"
// "R-T" -> "rt"
// "Mr. P" -> "mrp"
export function brawlerKeyFromName(name) {
  if (!name) return "";
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, ""); // keep only a-z0-9
}

export function getBrawlerPin(name) {
  const k = brawlerKeyFromName(name);
  return pinMap[k] || placeholder;
}

export function hasBrawlerPin(name) {
  const k = brawlerKeyFromName(name);
  return !!pinMap[k];
}
