import React, { useContext, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { fetchPlayer, normalizeTag, fetchHistory } from "../api.js";
import { useAsync, formatTag } from "../hooks.js";
import { Card, ErrorBox, SkeletonBlock, WarningBox, Pill, EmptyBox } from "../components.jsx";
import { pushRecent, toggleFavorite, isFavorite } from "../storage.js";
import { getBrawlerImage } from "../brawlerMedia.js";
import { getProfileIconById } from "../cdn.js";
import trophyIcon from "../../assets/icons/trophy.svg";
import starIcon from "../../assets/icons/star.svg";
import powerIcon from "../../assets/icons/power.svg";


function Stat({ label, value }) {
  return (
    <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 14, background: "rgba(255,255,255,.02)" }}>
      <div className="small">{label}</div>
      <div style={{ fontWeight: 900, fontSize: 16, marginTop: 4 }}>{value ?? "—"}</div>
    </div>
  );
}

function BrawlerCard({ b }) {
  const img = getBrawlerImage(b);
  return (
    <div className="card brawler-card" style={{ boxShadow: "none" }}>
      <div className="card-inner">
        <div className="row" style={{ alignItems: "center", gap: 12 }}>
          <div className="brawler-thumb" title={b?.name}>
            <img src={img} alt={b?.name || "Brawler"} loading="lazy" />
          </div>

          <div className="grow" style={{ minWidth: 0 }}>
            <div className="row" style={{ alignItems: "baseline", gap: 10 }}>
              <div className="truncate" style={{ fontWeight: 900 }}>{b.name}</div>
              <div className="spacer" />
              <span className="pill soft">
                <img src={powerIcon} alt="" /> Power {b.power}
              </span>
            </div>

            <div className="row" style={{ flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              <span className="pill soft">
                <img src={trophyIcon} alt="" /> {b.trophies}
              </span>
              <span className="pill soft">
                <img src={starIcon} alt="" /> max {b.highestTrophies}
              </span>
              <Pill>Rank {b.rank}</Pill>
            </div>
          </div>
        </div>

        <div className="hr" style={{ marginTop: 12 }} />
        <div className="small" style={{ display:"grid", gap: 6 }}>
          <div><b>Gadgets:</b> {b.gadgets?.length ? b.gadgets.map(x=>x.name).join(", ") : "—"}</div>
          <div><b>Star Powers:</b> {b.starPowers?.length ? b.starPowers.map(x=>x.name).join(", ") : "—"}</div>
          <div><b>Gears:</b> {b.gears?.length ? b.gears.map(x=>x.name).join(", ") : "—"}</div>
        </div>
      </div>
    </div>
  );
}


export default function Player() {
  const { tag: rawTag } = useParams();
  const tag = useMemo(() => normalizeTag(rawTag), [rawTag]);
  const { demoMode } = useContext(AppCtx);

  const player = useAsync(() => fetchPlayer(tag, demoMode), [tag, demoMode]);
  const history = useAsync(() => fetchHistory(tag, demoMode), [tag, demoMode]);

  const fav = useMemo(() => isFavorite({ type: "player", tag }), [tag]);

  function onToggleFav() {
    toggleFavorite({ type: "player", tag, label: player.data?.name || tag });
    pushRecent({ type: "player", tag, label: player.data?.name || tag });
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="row" style={{ flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="h1">Player {formatTag(tag)}</div>
          <div className="p">Perfil, brawlers, battle log e histórico rastreado.</div>
        </div>
        <div className="spacer" />
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <Link className="btn secondary" to={`/player/${tag}/battles`}>Battle Log</Link>
          <Link className="btn secondary" to={`/player/${tag}/insights`}>Insights</Link>
          <Link className="btn secondary" to={`/player/${tag}/activity`}>Atividade</Link>
          <button className="btn" onClick={onToggleFav}>{fav ? "Unfavorite" : "Favorite"}</button>
        </div>
      </div>

      {!demoMode && (
        <WarningBox title="Limite da API">
          A API oficial entrega apenas 25 batalhas recentes. Os “Insights” abaixo usam somente o que foi rastreado/guardado.
        </WarningBox>
      )}

      <div className="grid cols-3">
        <Card title="Overview">
          {player.loading && (
            <div className="grid" style={{ gap: 10 }}>
              <SkeletonBlock h={18} w="60%" />
              <SkeletonBlock h={14} w="85%" />
              <SkeletonBlock h={14} w="72%" />
            </div>
          )}
          {player.error && <ErrorBox error={player.error} />}
          {player.data && (
            <>
              <div className="row" style={{ gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", background: "rgba(0,0,0,.25)" }}>
                  <img
                    src={getProfileIconById(player.data.icon?.id)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{player.data.name}</div>
                  <div className="small">{formatTag(player.data.tag)} • exp {player.data.expLevel ?? "—"}</div>
                </div>
              </div>
              <div className="hr" />
              <div className="grid" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
                <Stat label="Troféus" value={player.data.trophies} />
                <Stat label="Melhor" value={player.data.highestTrophies} />
                <Stat label="3v3 wins" value={player.data["3vs3Victories"]} />
                <Stat label="Solo / Duo" value={`${player.data.soloVictories ?? "—"} / ${player.data.duoVictories ?? "—"}`} />
              </div>
              <div className="hr" />
              <div className="row" style={{ flexWrap:"wrap" }}>
                <Pill>Club</Pill>
                {player.data.club?.tag ? (
                  <Link className="btn secondary" to={`/club/${normalizeTag(player.data.club.tag)}`} style={{ padding: "8px 10px" }}>
                    {player.data.club.name} ({formatTag(normalizeTag(player.data.club.tag))})
                  </Link>
                ) : (
                  <span className="small">Sem clube</span>
                )}
              </div>
            </>
          )}
        </Card>

        <Card title="Insights" subtitle="Baseado no histórico rastreado no backend">
          {history.loading && (
            <div className="grid" style={{ gap: 10 }}>
              <SkeletonBlock h={16} w="70%" />
              <SkeletonBlock h={16} w="90%" />
              <SkeletonBlock h={16} w="80%" />
            </div>
          )}
          {history.error && <ErrorBox error={history.error} />}
          {history.data && (
            <Insights history={history.data} />
          )}
        </Card>

        <Card title="Ações">
          <div className="p">Para aumentar o histórico, visite o perfil regularmente (ou use tracking no backend).</div>
          <div className="hr" />
          <div className="row" style={{ flexWrap:"wrap", gap: 10 }}>
            <Link className="btn secondary" to={`/player/${tag}/battles`}>Abrir Battle Log</Link>
            <Link className="btn secondary" to={`/saved`}>Saved</Link>
          </div>
        </Card>
      </div>

      <Card title="Brawlers" subtitle="Grid completo do jogador">
        {player.loading && (
          <div className="grid cols-4" style={{ marginTop: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonBlock key={i} h={120} />)}
          </div>
        )}
        {player.data && (
          <>
            {player.data.brawlers?.length ? (
              <div className="grid cols-4" style={{ marginTop: 12 }}>
                {player.data.brawlers.map((b) => <BrawlerCard key={b.id} b={b} />)}
              </div>
            ) : (
              <EmptyBox title="Sem dados de brawlers">A API não retornou lista de brawlers.</EmptyBox>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function Insights({ history }) {
  const battles = (history?.battles || []).map(b => b.payload).filter(Boolean);

  const derived = React.useMemo(() => {
    const flat = [];
    for (const it of battles) {
      const battle = it?.battle || {};
      const mode = battle.mode || it?.event?.mode || "unknown";
      const result = battle.result || "unknown";
      const trophyChange = battle.trophyChange ?? 0;
      const starPlayer = battle.starPlayer?.tag;
      const isStar = starPlayer && history.tag && String(starPlayer).replace(/^#/, "") === history.tag;
      flat.push({ mode, result, trophyChange, isStar });
    }
    const total = flat.length;
    const wins = flat.filter(x=>x.result==="victory").length;
    const losses = flat.filter(x=>x.result==="defeat").length;
    const winrate = total ? Math.round((wins/total)*100) : 0;
    const trophies = flat.reduce((a,b)=>a+(Number(b.trophyChange)||0),0);
    const starPct = total ? Math.round((flat.filter(x=>x.isStar).length/total)*100) : 0;

    // streaks (based on order in history list)
    let bestWinStreak = 0, curWin = 0;
    for (const x of flat) {
      if (x.result==="victory") { curWin++; bestWinStreak = Math.max(bestWinStreak, curWin); }
      else curWin = 0;
    }

    const byMode = {};
    for (const x of flat) {
      byMode[x.mode] ??= { total:0, wins:0 };
      byMode[x.mode].total++;
      if (x.result==="victory") byMode[x.mode].wins++;
    }

    const topModes = Object.entries(byMode)
      .map(([k,v])=>({ mode:k, winrate: v.total ? Math.round((v.wins/v.total)*100) : 0, total:v.total }))
      .sort((a,b)=>b.total-a.total)
      .slice(0,4);

    return { total, wins, losses, winrate, trophies, starPct, bestWinStreak, topModes };
  }, [battles, history.tag]);

  return (
    <div className="grid" style={{ gap: 10, marginTop: 10 }}>
      <div className="row" style={{ flexWrap:"wrap" }}>
        <Pill>Tracked battles: <b style={{ color:"var(--text)" }}>{derived.total}</b></Pill>
        <Pill>Winrate: <b style={{ color:"var(--text)" }}>{derived.winrate}%</b></Pill>
        <Pill>Saldo 🏆: <b style={{ color:"var(--text)" }}>{derived.trophies}</b></Pill>
        <Pill>Star Player: <b style={{ color:"var(--text)" }}>{derived.starPct}%</b></Pill>
        <Pill>Best streak: <b style={{ color:"var(--text)" }}>{derived.bestWinStreak}</b></Pill>
      </div>
      <div className="hr" />
      <div className="small" style={{ fontWeight: 900, color: "rgba(255,255,255,.9)" }}>Top modos (por frequência rastreada)</div>
      <div className="grid" style={{ gridTemplateColumns:"repeat(2, minmax(0,1fr))", gap: 10 }}>
        {derived.topModes.map(m => (
          <div key={m.mode} style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 14, background: "rgba(255,255,255,.02)" }}>
            <div style={{ fontWeight: 900 }}>{m.mode}</div>
            <div className="small">{m.total} jogos • winrate {m.winrate}%</div>
          </div>
        ))}
      </div>
      <div className="small" style={{ marginTop: 8 }}>
        *Estatísticas derivadas apenas do histórico salvo no backend (não é histórico completo).
      </div>
    </div>
  );
}
