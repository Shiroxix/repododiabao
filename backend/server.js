import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import axios from "axios";
import axiosRetry from "axios-retry";
import { LRUCache } from "lru-cache";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDb, setTrackingEnabled, getTrackingEnabled, saveSnapshot, saveBattlelog, getHistory } from "./src/db.js";
import { normalizeTag, validateTagOrThrow } from "./src/tags.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 4000);
const TOKEN = (process.env.BRAWL_TOKEN || "").trim();
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 45);
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 7000);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 90);
const TRACK_AUTOMATIC = String(process.env.TRACK_AUTOMATIC || "true").toLowerCase() === "true";

const UPSTREAM_BASE = "https://api.brawlstars.com/v1";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use(rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: { code: "RATE_LIMIT", message: "Muitas requisições. Tente novamente em instantes." } }
}));

axiosRetry(axios, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) => {
    const status = err?.response?.status;
    return axiosRetry.isNetworkOrIdempotentRequestError(err) || (status && status >= 500);
  }
});

const cache = new LRUCache({
  max: 1500,
  ttl: CACHE_TTL_SECONDS * 1000,
  allowStale: true,
  updateAgeOnGet: true
});

/**
 * cache entry shape:
 * { data, etag, status, headers: { ... }, cachedAt }
 */

function jsonOk(res, data, meta = {}) {
  res.json({ ok: true, data, meta });
}
function jsonErr(res, code, message, status = 400, details) {
  res.status(status).json({ ok: false, error: { code, message, details } });
}

function upstreamHeaders() {
  const h = {
    "Accept": "application/json",
    "User-Agent": "brawl-lookup-proxy/1.0"
  };
  if (TOKEN) h["Authorization"] = `Bearer ${TOKEN}`;
  return h;
}

async function proxyGet(req, res, upstreamPath, { cacheKey, trackTag, trackKind } = {}) {
  const key = cacheKey || upstreamPath;
  const cached = cache.get(key);

  const headers = upstreamHeaders();
  if (cached?.etag) headers["If-None-Match"] = cached.etag;

  try {
    const url = `${UPSTREAM_BASE}${upstreamPath}`;
    const resp = await axios.get(url, {
      headers,
      timeout: UPSTREAM_TIMEOUT_MS,
      validateStatus: () => true
    });

    if (resp.status === 304 && cached?.data) {
      res.set("X-Cache", "HIT-304");
      return jsonOk(res, cached.data, { cached: true, upstreamStatus: 304 });
    }

    if (resp.status === 401) {
      return jsonErr(res, "UNAUTHORIZED", "Token inválido/ausente na API oficial.", 401);
    }
    if (resp.status === 404) {
      return jsonErr(res, "NOT_FOUND", "Recurso não encontrado.", 404);
    }
    if (resp.status >= 400) {
      return jsonErr(res, "UPSTREAM_ERROR", `Falha na API upstream (status ${resp.status}).`, 502, resp.data);
    }

    const data = resp.data;
    const etag = resp.headers?.etag;

    cache.set(key, { data, etag, status: resp.status, cachedAt: Date.now() });

    // tracking (best-effort)
    if (trackTag && (TRACK_AUTOMATIC || await getTrackingEnabled(trackTag))) {
      if (trackKind === "player") await saveSnapshot(trackTag, data);
      if (trackKind === "battlelog") await saveBattlelog(trackTag, data);
      if (trackKind === "club") await saveSnapshot(trackTag, data);
    }

    res.set("X-Cache", "MISS");
    return jsonOk(res, data, { cached: false, upstreamStatus: resp.status });
  } catch (e) {
    // fallback to stale cache if available
    if (cached?.data) {
      res.set("X-Cache", "STALE");
      return jsonOk(res, cached.data, { cached: true, stale: true });
    }
    return jsonErr(res, "NETWORK", "Erro de rede ao consultar a API upstream.", 502, String(e?.message || e));
  }
}

app.get("/api/health", (req, res) => {
  jsonOk(res, {
    tokenPresent: Boolean(TOKEN),
    cacheTtlSeconds: CACHE_TTL_SECONDS,
    trackingAutomatic: TRACK_AUTOMATIC
  });
});

app.get("/api/player/:tag", async (req, res) => {
  try {
    const tag = normalizeTag(req.params.tag);
    validateTagOrThrow(tag);
    await proxyGet(req, res, `/players/%23${encodeURIComponent(tag)}`, {
      cacheKey: `player:${tag}`,
      trackTag: tag,
      trackKind: "player"
    });
  } catch (e) {
    jsonErr(res, "BAD_TAG", e.message || "TAG inválida.", 400);
  }
});

app.get("/api/club/:tag", async (req, res) => {
  try {
    const tag = normalizeTag(req.params.tag);
    validateTagOrThrow(tag);
    await proxyGet(req, res, `/clubs/%23${encodeURIComponent(tag)}`, {
      cacheKey: `club:${tag}`,
      trackTag: tag,
      trackKind: "club"
    });
  } catch (e) {
    jsonErr(res, "BAD_TAG", e.message || "TAG inválida.", 400);
  }
});

app.get("/api/battlelog/:tag", async (req, res) => {
  try {
    const tag = normalizeTag(req.params.tag);
    validateTagOrThrow(tag);
    await proxyGet(req, res, `/players/%23${encodeURIComponent(tag)}/battlelog`, {
      cacheKey: `battlelog:${tag}`,
      trackTag: tag,
      trackKind: "battlelog"
    });
  } catch (e) {
    jsonErr(res, "BAD_TAG", e.message || "TAG inválida.", 400);
  }
});

// Rankings proxies (country: global or ISO 2-letter)
app.get("/api/rankings/players/:country", async (req, res) => {
  const country = String(req.params.country || "global").toLowerCase();
  const path = country === "global" ? "/rankings/global/players" : `/rankings/${country}/players`;
  await proxyGet(req, res, path, { cacheKey: `rank:players:${country}` });
});

app.get("/api/rankings/clubs/:country", async (req, res) => {
  const country = String(req.params.country || "global").toLowerCase();
  const path = country === "global" ? "/rankings/global/clubs" : `/rankings/${country}/clubs`;
  await proxyGet(req, res, path, { cacheKey: `rank:clubs:${country}` });
});

app.get("/api/rankings/brawlers/:country", async (req, res) => {

// Brawlers (official API)
app.get("/api/brawlers", async (req, res) => {
  return proxyGet(req, res, "/brawlers", { cacheKey: "brawlers:list" });
});

app.get("/api/brawlers/:id", async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!/^\d+$/.test(id)) return jsonErr(res, "BAD_ID", "ID de brawler inválido.", 400);
  return proxyGet(req, res, `/brawlers/${id}`, { cacheKey: `brawlers:${id}` });
});

  const country = String(req.params.country || "global").toLowerCase();
  const brawlerId = String(req.query.brawlerId || "").trim();
  if (!/^\d+$/.test(brawlerId)) return jsonErr(res, "BAD_REQUEST", "brawlerId é obrigatório e deve ser numérico.", 400);
  const path = country === "global"
    ? `/rankings/global/brawlers/${brawlerId}`
    : `/rankings/${country}/brawlers/${brawlerId}`;
  await proxyGet(req, res, path, { cacheKey: `rank:brawlers:${country}:${brawlerId}` });
});

// Tracking controls
app.post("/api/track/start", async (req, res) => {
  try {
    const tag = normalizeTag(String(req.query.tag || ""));
    validateTagOrThrow(tag);
    await setTrackingEnabled(tag, true);
    jsonOk(res, { tag, tracking: true });
  } catch (e) {
    jsonErr(res, "BAD_TAG", e.message || "TAG inválida.", 400);
  }
});
app.post("/api/track/stop", async (req, res) => {
  try {
    const tag = normalizeTag(String(req.query.tag || ""));
    validateTagOrThrow(tag);
    await setTrackingEnabled(tag, false);
    jsonOk(res, { tag, tracking: false });
  } catch (e) {
    jsonErr(res, "BAD_TAG", e.message || "TAG inválida.", 400);
  }
});
app.get("/api/track/history/:tag", async (req, res) => {
  try {
    const tag = normalizeTag(req.params.tag);
    validateTagOrThrow(tag);
    const history = await getHistory(tag);
    jsonOk(res, history);
  } catch (e) {
    jsonErr(res, "BAD_TAG", e.message || "TAG inválida.", 400);
  }
});

// Serve frontend build in production (optional)
const distPath = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => res.type("text/plain").send("Backend online. Rode o frontend em dev (Vite) ou gere o build do frontend."));
}

// Init DB then start server
await initDb();

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT} | token=${TOKEN ? "present" : "missing"}`);
});