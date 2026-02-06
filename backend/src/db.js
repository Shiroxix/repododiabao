import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";

const DB_PATH = (process.env.DB_PATH || "./data/tracking.sqlite").trim();

let db;

/** tiny promise helpers */
function run(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err){ if (err) reject(err); else resolve(this); });
  });
}
function all(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows)=>{ if (err) reject(err); else resolve(rows); });
  });
}
function get(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row)=>{ if (err) reject(err); else resolve(row); });
  });
}

const trackingCache = new Map(); // tag -> { enabled, ts }

export async function initDb() {
  const dir = path.dirname(DB_PATH);
  fs.mkdirSync(dir, { recursive: true });
  db = new sqlite3.Database(DB_PATH);

  await run(`PRAGMA journal_mode=WAL;`);
  await run(`
    CREATE TABLE IF NOT EXISTS tracking (
      tag TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL,
      kind TEXT NOT NULL, -- player|club
      ts INTEGER NOT NULL,
      payload TEXT NOT NULL
    );
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_snapshots_tag_ts ON snapshots(tag, ts DESC);`);

  await run(`
    CREATE TABLE IF NOT EXISTS battles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL,
      battle_time TEXT NOT NULL,
      event_id TEXT,
      mode TEXT,
      result TEXT,
      brawler_id TEXT,
      payload TEXT NOT NULL,
      UNIQUE(tag, battle_time, event_id, mode, brawler_id)
    );
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_battles_tag_time ON battles(tag, battle_time DESC);`);
}

export async function getTrackingEnabled(tag) {
  const cached = trackingCache.get(tag);
  if (cached && (Date.now() - cached.ts) < 15000) return cached.enabled;

  const row = await get(`SELECT enabled FROM tracking WHERE tag=?`, [tag]);
  const enabled = row ? !!row.enabled : false;
  trackingCache.set(tag, { enabled, ts: Date.now() });
  return enabled;
}

export async function setTrackingEnabled(tag, enabled) {
  const ts = Date.now();
  await run(`
    INSERT INTO tracking(tag, enabled, updated_at)
    VALUES(?, ?, ?)
    ON CONFLICT(tag) DO UPDATE SET enabled=excluded.enabled, updated_at=excluded.updated_at;
  `, [tag, enabled ? 1 : 0, ts]);
  trackingCache.set(tag, { enabled: !!enabled, ts: Date.now() });
}

export async function saveSnapshot(tag, payload) {
  const ts = Date.now();
  const kind = payload?.members ? "club" : "player";
  await run(`INSERT INTO snapshots(tag, kind, ts, payload) VALUES(?,?,?,?)`, [tag, kind, ts, JSON.stringify(payload)]);
}

export async function saveBattlelog(tag, battlelog) {
  const items = Array.isArray(battlelog?.items) ? battlelog.items : [];
  for (const it of items) {
    const battleTime = String(it?.battleTime || "");
    const eventId = it?.event?.id != null ? String(it.event.id) : "";
    const mode = String(it?.battle?.mode || "");
    const result = String(it?.battle?.result || "");
    const brawlerId =
      it?.battle?.starPlayer?.brawler?.id != null ? String(it.battle.starPlayer.brawler.id) :
      it?.battle?.teams?.[0]?.[0]?.brawler?.id != null ? String(it.battle.teams[0][0].brawler.id) :
      it?.battle?.players?.[0]?.brawler?.id != null ? String(it.battle.players[0].brawler.id) :
      "";
    try {
      await run(`
        INSERT OR IGNORE INTO battles(tag, battle_time, event_id, mode, result, brawler_id, payload)
        VALUES(?,?,?,?,?,?,?)
      `, [tag, battleTime, eventId, mode, result, brawlerId, JSON.stringify(it)]);
    } catch {
      // ignore
    }
  }
}

export async function getHistory(tag) {
  const snapRows = await all(`SELECT kind, ts, payload FROM snapshots WHERE tag=? ORDER BY ts DESC LIMIT 200`, [tag]);
  const battleRows = await all(`SELECT battle_time, event_id, mode, result, brawler_id, payload FROM battles WHERE tag=? ORDER BY battle_time DESC LIMIT 500`, [tag]);

  return {
    tag,
    snapshots: snapRows.map(r => ({ kind: r.kind, ts: r.ts, payload: JSON.parse(r.payload) })),
    battles: battleRows.map(r => ({ battleTime: r.battle_time, eventId: r.event_id, mode: r.mode, result: r.result, brawlerId: r.brawler_id, payload: JSON.parse(r.payload) }))
  };
}
