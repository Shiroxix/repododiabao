import React, { useContext, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { fetchHistory, normalizeTag, fetchBattlelog } from "../api.js";
import { useAsync, formatTag, uniqBy } from "../hooks.js";
import { Card, ErrorBox, SkeletonBlock, Pill, WarningBox, EmptyBox } from "../components.jsx";

function pct(n) {
  if (!isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
}
function grade(score) {
  if (!isFinite(score)) return "—";
  if (score >= 0.75) return "S";
  if (score >= 0.62) return "A";
  if (score >= 0.52) return "B";
  if (score >= 0.45) return "C";
  return "D";
}

export default function PlayerInsights() {
  const { tag: rawTag } = useParams();
  const tag = useMemo(() => normalizeTag(rawTag), [rawTag]);
  const { demoMode } = useContext(AppCtx);

  const live = useAsync(() => fetchBattlelog(tag, demoMode), [tag, demoMode]);
  const history = useAsync(() => fetchHistory(tag, demoMode), [tag, demoMode]);

  const merged = useMemo(() => {
    const liveItems = live.value?.items || [];
    const histItems = (history.value?.battles || []).map((b) => b?.payload).filter(Boolean);
    const all = [...liveItems, ...histItems];
    return uniqBy(all, (it) => it?.battleTime || JSON.stringify(it).slice(0, 80));
  }, [live.value, history.value]);

  const stats = useMemo(() => {
    const rows = merged.map((it) => it?.battle || {}).filter(Boolean);
    let wins=0, losses=0, draws=0, star=0, trophy=0;
    const byMode = {};
    const byBrawler = {};
    for (const b of rows) {
      const r = String(b.result || "unknown").toLowerCase();
      if (r === "victory") wins++;
      else if (r === "defeat") losses++;
      else if (r === "draw") draws++;
      if (b.starPlayer) star++;
      trophy += Number(b.trophyChange || 0);

      const m = b.mode || "unknown";
      byMode[m] = byMode[m] || { n:0, w:0, l:0, t:0 };
      byMode[m].n++;
      byMode[m].t += Number(b.trophyChange || 0);
      if (r==="victory") byMode[m].w++;
      if (r==="defeat") byMode[m].l++;

      const bn = b.starPlayer?.brawler?.name || b.teams?.[0]?.[0]?.brawler?.name || b.players?.[0]?.brawler?.name || "unknown";
      byBrawler[bn] = byBrawler[bn] || { n:0, w:0, l:0, t:0 };
      byBrawler[bn].n++;
      byBrawler[bn].t += Number(b.trophyChange || 0);
      if (r==="victory") byBrawler[bn].w++;
      if (r==="defeat") byBrawler[bn].l++;
    }
    const total = wins+losses+draws;
    return { total, wins, losses, draws, star, trophy, byMode, byBrawler };
  }, [merged]);

  const topBrawlers = useMemo(() => {
    const entries = Object.entries(stats.byBrawler || {}).map(([name, v]) => {
      const wr = v.n ? v.w / v.n : 0;
      const score = Math.min(1, Math.max(0, wr + (v.t/Math.max(1,v.n))/20)); // small trophy impact
      return { name, ...v, wr, score, grade: grade(score) };
    });
    entries.sort((a,b)=> b.score - a.score);
    return entries.slice(0, 12);
  }, [stats.byBrawler]);

  const modes = useMemo(() => {
    const entries = Object.entries(stats.byMode || {}).map(([name, v]) => {
      const wr = v.n ? v.w / v.n : 0;
      return { name, ...v, wr };
    });
    entries.sort((a,b)=> b.n - a.n);
    return entries;
  }, [stats.byMode]);

  const trackedCount = (history.value?.battles || []).length;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Link className="btn secondary" to={`/player/${tag}`}>← Perfil</Link>
        <Link className="btn secondary" to={`/player/${tag}/battles`}>Battle Log</Link>
        <Link className="btn secondary" to={`/player/${tag}/activity`}>Atividade</Link>
        <div className="spacer" />
        <Pill label={`TAG: ${formatTag(tag)}`} />
      </div>

      <WarningBox title="Transparência (tracking)">
        A API oficial retorna apenas as 25 batalhas mais recentes. Qualquer estatística além disso depende do histórico rastreado e salvo pelo backend.
        <div className="small" style={{ marginTop: 8 }}>No seu banco: <span className="kbd">{trackedCount}</span> batalhas salvas para este perfil.</div>
      </WarningBox>

      {(live.loading || history.loading) && (
        <div className="grid" style={{ gap: 10 }}>
          <SkeletonBlock h={110} />
          <SkeletonBlock h={180} />
        </div>
      )}
      {(live.error || history.error) && <ErrorBox error={live.error || history.error} />}

      {!live.loading && !history.loading && !stats.total && (
        <EmptyBox title="Sem dados suficientes">Abra o perfil e o battle log algumas vezes para acumular tracking.</EmptyBox>
      )}

      {!live.loading && !history.loading && stats.total > 0 && (
        <>
          <Card title="Resumo">
            <div className="grid cols-4" style={{ gap: 10, marginTop: 12 }}>
              <div className="pill wide"><div className="small">Partidas</div><div style={{ fontWeight: 900 }}>{stats.total}</div></div>
              <div className="pill wide"><div className="small">Winrate</div><div style={{ fontWeight: 900 }}>{pct(stats.wins / Math.max(1, stats.total))}</div></div>
              <div className="pill wide"><div className="small">Star Player</div><div style={{ fontWeight: 900 }}>{pct(stats.star / Math.max(1, stats.total))}</div></div>
              <div className="pill wide"><div className="small">Saldo troféus</div><div style={{ fontWeight: 900 }}>{stats.trophy >= 0 ? `+${stats.trophy}` : stats.trophy}</div></div>
            </div>
          </Card>

          <div className="grid cols-2" style={{ gap: 14 }}>
            <Card title="Winrate por modo" subtitle="Baseado no histórico disponível (tracking + 25 recentes).">
              <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                {modes.map((m) => (
                  <div key={m.name} className="barrow">
                    <div className="row" style={{ alignItems: "baseline" }}>
                      <div style={{ fontWeight: 900 }} className="truncate">{m.name}</div>
                      <div className="spacer" />
                      <div className="small">{pct(m.wr)} • {m.n}</div>
                    </div>
                    <div className="bar">
                      <div className="bar-fill" style={{ width: `${Math.max(2, Math.round(m.wr*100))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Top brawlers (avaliação)" subtitle="Nota combina winrate e saldo de troféus (apenas dados rastreados/retornados).">
              <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                {topBrawlers.map((b) => (
                  <div key={b.name} className="row" style={{ padding: 10, border: "1px solid var(--line)", borderRadius: 14, background: "rgba(255,255,255,.02)", alignItems: "center" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(255,255,255,.06)", fontWeight: 900 }}>{b.grade}</div>
                    <div style={{ marginLeft: 10, minWidth: 0 }}>
                      <div style={{ fontWeight: 900 }} className="truncate">{b.name}</div>
                      <div className="small">{pct(b.wr)} • {b.n} • {b.t >= 0 ? `+${b.t}` : b.t}</div>
                    </div>
                    <div className="spacer" />
                    <div className="small">{Math.round(b.score*100)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
