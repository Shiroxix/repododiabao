// Offline asset helpers backed by the uploaded CDN-master pack.
// Uses Vite import.meta.glob so assets are bundled locally.

import placeholderBrawler from "../assets/ui/placeholder-brawler.png";
import placeholderAvatar from "../assets/ui/placeholder-avatar.png";

function buildIdMap(modules) {
  const out = {};
  for (const [path, src] of Object.entries(modules)) {
    const file = (path.split("/").pop() || "").toLowerCase();
    const id = file.replace(/\.png$/i, "");
    out[id] = src;
  }
  return out;
}

// Brawler portraits (file name is the brawler id, e.g. 16000000.png)
const brawlerPortraitModules = import.meta.glob(
  "../assets/cdn/brawlers/portraits/*.png",
  { eager: true, import: "default" }
);
const brawlerPortraits = buildIdMap(brawlerPortraitModules);

// Profile icons (file name is the icon id, e.g. 28000000.png)
const profileIconModules = import.meta.glob(
  "../assets/cdn/profile-icons/regular/*.png",
  { eager: true, import: "default" }
);
const profileIcons = buildIdMap(profileIconModules);

// Club badges (file name is the badge id)
const clubBadgeModules = import.meta.glob(
  "../assets/cdn/club-badges/regular/*.png",
  { eager: true, import: "default" }
);
const clubBadges = buildIdMap(clubBadgeModules);

// Game modes (file name is the mode id)
const gameModeModules = import.meta.glob(
  "../assets/cdn/game-modes/regular/*.png",
  { eager: true, import: "default" }
);
const gameModes = buildIdMap(gameModeModules);

export function getBrawlerPortraitById(id) {
  if (id === 0 || id === "0") return placeholderBrawler;
  const key = String(id || "").trim();
  return brawlerPortraits[key] || placeholderBrawler;
}

export function getProfileIconById(id) {
  const key = String(id || "").trim();
  return profileIcons[key] || placeholderAvatar;
}

export function getClubBadgeById(id) {
  const key = String(id || "").trim();
  return clubBadges[key] || placeholderAvatar;
}

export function getGameModeIconById(id) {
  const key = String(id || "").trim();
  return gameModes[key] || null;
}
