import mockPlayer from "../data/mock/player.json";
import mockClub from "../data/mock/club.json";
import mockBattlelog from "../data/mock/battlelog.json";
import mockRankPlayers from "../data/mock/rank_players.json";
import mockRankClubs from "../data/mock/rank_clubs.json";
import mockRankBrawlers from "../data/mock/rank_brawlers.json";

export function normalizeTag(input) {
  const raw = String(input || "").toUpperCase().trim();
  return raw.replace(/^#/, "").replace(/[^A-Z0-9]/g, "").replace(/O/g, "0");
}

export async function health() {
  try {
    const r = await fetch("/api/health");
    const j = await r.json();
    return j?.data || { tokenPresent: false };
  } catch {
    return { tokenPresent: false, offline: true };
  }
}

async function requestJson(url, options) {
  const r = await fetch(url, options);
  const j = await r.json();
  if (!j?.ok) {
    const msg = j?.error?.message || "Erro desconhecido.";
    const code = j?.error?.code || "ERROR";
    const err = new Error(msg);
    err.code = code;
    err.details = j?.error?.details;
    throw err;
  }
  return j.data;
}

export async function fetchPlayer(tag, demoMode) {
  if (demoMode) return mockPlayer;
  return requestJson(`/api/player/${encodeURIComponent(tag)}`);
}
export async function fetchClub(tag, demoMode) {
  if (demoMode) return mockClub;
  return requestJson(`/api/club/${encodeURIComponent(tag)}`);
}
export async function fetchBattlelog(tag, demoMode) {
  if (demoMode) return mockBattlelog;
  return requestJson(`/api/battlelog/${encodeURIComponent(tag)}`);
}
export async function fetchRankings(kind, country, brawlerId, demoMode) {
  if (demoMode) {
    if (kind==="players") return mockRankPlayers;
    if (kind==="clubs") return mockRankClubs;
    return mockRankBrawlers;
  }
  if (kind==="brawlers") {
    return requestJson(`/api/rankings/brawlers/${encodeURIComponent(country)}?brawlerId=${encodeURIComponent(String(brawlerId||""))}`);
  }
  return requestJson(`/api/rankings/${kind}/${encodeURIComponent(country)}`);
}
export async function fetchHistory(tag, demoMode) {
  if (demoMode) return { tag, snapshots: [], battles: mockBattlelog.items.map(i=>({payload:i})) };
  return requestJson(`/api/track/history/${encodeURIComponent(tag)}`);
}

export async function fetchBrawlers(demoMode) {
  if (demoMode) return { items: [] };
  return requestJson(`/api/brawlers`);
}
export async function fetchBrawler(id, demoMode) {
  if (demoMode) return { id, name: "Demo Brawler", rarity: { name: "Rare" }, class: { name: "Fighter" }, gadgets: [], starPowers: [] };
  return requestJson(`/api/brawlers/${encodeURIComponent(id)}`);
}
export async function trackStart(tag, demoMode) {
  if (demoMode) return { tag, tracking: false };
  return requestJson(`/api/track/start?tag=${encodeURIComponent(tag)}`, { method: "POST" });
}
export async function trackStop(tag, demoMode) {
  if (demoMode) return { tag, tracking: false };
  return requestJson(`/api/track/stop?tag=${encodeURIComponent(tag)}`, { method: "POST" });
}
