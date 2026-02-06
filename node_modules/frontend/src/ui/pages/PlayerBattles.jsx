import React, { useContext, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { fetchBattlelog, fetchHistory, normalizeTag } from "../api.js";
import { useAsync, formatBattleTime, formatTag, uniqBy } from "../hooks.js";
import { Card, ErrorBox, SkeletonBlock, Pill, EmptyBox, WarningBox } from "../components.jsx";
import { getBrawlerImage } from "../brawlerMedia.js";
import trophyIcon from "../../assets/icons/trophy.svg";

function Select({ value, onChange, children }) {
  return (
    <select className="input" value={value} onChange={(e)=>onChange(e.target.value)} style={{ padding: "10px 12px" }}>
      {children}
    </select>
  );
}

export default function PlayerBattles() {
  const { tag: rawTag } = useParams();
  const tag = useMemo(() => normalizeTag(rawTag), [rawTag]);
  const { demoMode } = useContext(AppCtx);

  const live = useAsync(() => fetchBattlelog(tag, demoMode), [tag, demoMode]);
  const history = useAsync(() => fetchHistory(tag, demoMode), [tag, demoMode]);

  const [mode, setMode] = useState("all");
  const [result, setResult] = useState("all");
  const [brawler, setBrawler] = useState("all");
  const [period, setPeriod] = useState("all"); // all / 24h / 7d

  const merged = useMemo(() => {
    const liveItems = live.data?.items || [];
    const trackedItems = (history.data?.battles || []).map(b => b.payload).filter(Boolean);
    // keep order: newest first (battleTime lexicographically works)
    const all = uniqBy([...liveItems, ...trackedItems], (it) => {
      const bt = it?.battleTime || "";
      const eid = it?.event?.id ?? "";
      const mode = it?.battle?.mode ?? "";
      const bid = it?.battle?.starPlayer?.brawler?.id ?? it?.battle?.teams?.[0]?.[0]?.brawler?.id ?? "";
      return `${bt}|${eid}|${mode}|${bid}`;
    });
    return all.sort((a,b)=>String(b?.battleTime||"").localeCompare(String(a?.battleTime||"")));
  }, [live.data, history.data]);

  const modes = useMemo(() => {
    const s = new Set();
    for (const it of merged) s.add(it?.battle?.mode || it?.event?.mode || "unknown");
    return Array.from(s).sort();
  }, [merged]);

  const brawlers = useMemo(() => {
    const s = new Set();
    for (const it of merged) {
      const sp = it?.battle?.starPlayer?.brawler?.name;
      const b0 = it?.battle?.teams?.[0]?.[0]?.brawler?.name;
      const b1 = it?.battle?.players?.[0]?.brawler?.name;
      s.add(sp || b0 || b1 || "unknown");
    }
    return Array.from(s).sort();
  }, [merged]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return merged.filter((it) => {
      const m = it?.battle?.mode || it?.event?.mode || "unknown";
      const r = it?.battle?.result || "unknown";
      const bn = it?.battle?.starPlayer?.brawler?.name || it?.battle?.teams?.[0]?.[0]?.brawler?.name || it?.battle?.players?.[0]?.brawler?.name || "unknown";
      if (mode !== "all" && m !== mode) return false;
      if (result !== "all" && r !== result) return false;
      if (brawler !== "all" && bn !== brawler) return false;

      if (period !== "all") {
        const bt = String(it?.battleTime || "");
        const match = bt.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
        if (!match) return true;
        const [_, Y, M, D, h, mi, se] = match;
        const dt = Date.UTC(Number(Y), Number(M)-1, Number(D), Number(h), Number(mi), Number(se));
        const delta = now - dt;
        if (period === "24h" && delta > 24*3600*1000) return false;
        if (period === "7d" && delta > 7*24*3600*1000) return false;
      }
      return true;
    });
  }, [merged, mode, result, brawler, period]);

  const derived = useMemo(() => {
    const total = filtered.length;
    const wins = filtered.filter(x => x?.battle?.result === "victory").length;
    const losses = filtered.filter(x => x?.battle?.result === "defeat").length;
    const star = filtered.filter(x => x?.battle?.starPlayer?.tag && String(x.battle.starPlayer.tag).replace(/^#/, "") === tag).length;
    const trophies = filtered.reduce((a,it)=>a+(Number(it?.battle?.trophyChange)||0),0);
    const winrate = total ? Math.round((wins/total)*100) : 0;
    const starPct = total ? Math.round((star/total)*100) : 0;
    return { total, wins, losses, winrate, trophies, starPct };
  }, [filtered, tag]);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="row" style={{ flexWrap:"wrap", gap: 12 }}>
        <div>
          <div className="h1">Battle Log {formatTag(tag)}</div>
          <div className="p">Live (25 últimas) + histórico rastreado (se houver).</div>
        </div>
        <div className="spacer" />
        <Link className="btn secondary" to={`/player/${tag}`}>Voltar</Link>
      </div>

      <WarningBox title="Transparência">
        Live: 25 batalhas recentes pela API. Histórico maior só aparece se o backend já tiver guardado visitas anteriores (tracking).
      </WarningBox>

      <div className="grid cols-3">
        <Card title="Filtros">
          <div className="grid" style={{ gap: 10, marginTop: 12 }}>
            <div>
              <div className="small">Modo</div>
              <Select value={mode} onChange={setMode}>
                <option value="all">Todos</option>
                {modes.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>
            <div>
              <div className="small">Resultado</div>
              <Select value={result} onChange={setResult}>
                <option value="all">Todos</option>
                <option value="victory">Vitória</option>
                <option value="defeat">Derrota</option>
              </Select>
            </div>
            <div>
              <div className="small">Brawler</div>
              <Select value={brawler} onChange={setBrawler}>
                <option value="all">Todos</option>
                {brawlers.map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
            </div>
            <div>
              <div className="small">Período</div>
              <Select value={period} onChange={setPeriod}>
                <option value="all">Tudo</option>
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7d</option>
              </Select>
            </div>
          </div>
        </Card>

        <Card title="Stats (filtrado)">
          <div className="row" style={{ flexWrap:"wrap", marginTop: 10 }}>
            <Pill>Total: <b style={{ color:"var(--text)" }}>{derived.total}</b></Pill>
            <Pill>Winrate: <b style={{ color:"var(--text)" }}>{derived.winrate}%</b></Pill>
            <Pill>Saldo 🏆: <b style={{ color:"var(--text)" }}>{derived.trophies}</b></Pill>
            <Pill>Star Player: <b style={{ color:"var(--text)" }}>{derived.starPct}%</b></Pill>
          </div>
          <div className="hr" />
          <div className="small">*derivado apenas do que está visível aqui (não é histórico completo).</div>
        </Card>

        <Card title="Fonte de dados">
          <div className="p">Live: {live.data?.items?.length ?? 0} itens.</div>
          <div className="p">Rastreado: {(history.data?.battles?.length ?? 0)} itens.</div>
          <div className="hr" />
          <div className="small">Se o tracking estiver vazio, visite o perfil regularmente para acumular histórico.</div>
        </Card>
      </div>

      <Card title="Batalhas">
        {(live.loading || history.loading) && (
          <div className="grid" style={{ gap: 10, marginTop: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} h={64} />)}
          </div>
        )}
        {(live.error || history.error) && <ErrorBox error={live.error || history.error} />}
        {!live.loading && !history.loading && !filtered.length && (
          <EmptyBox title="Sem batalhas">Nenhuma batalha corresponde aos filtros.</EmptyBox>
        )}
        {!live.loading && !history.loading && filtered.length > 0 && (
          <div className="grid" style={{ gap: 10, marginTop: 12 }}>
            {filtered.map((it, idx) => (
              <BattleRow key={idx} it={it} selfTag={tag} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


function BattleRow({ it }) {
  const battle = it?.battle || {};
  const event = it?.event || {};
  const mode = battle.mode || event.mode || "unknown";
  const map = event.map || "—";
  const result = String(battle.result || "unknown").toLowerCase();
  const trophyChange = Number(battle.trophyChange ?? 0);
  const timeLabel = formatBattleTime(it?.battleTime);

  const headerClass =
    result === "victory" ? "battle-head win" :
    result === "defeat" ? "battle-head loss" :
    "battle-head neutral";

  // Collect participants for any mode:
  // - 3v3/duels: battle.teams: [ [p,p,p], [p,p,p] ]
  // - showdown/duo: sometimes battle.teams is an array of teams, or battle.players is a flat array
  const teams = Array.isArray(battle.teams) ? battle.teams : [];
  const flatTeams = teams.filter(Array.isArray).map(t => t.filter(Boolean));
  const flatPlayers = Array.isArray(battle.players) ? battle.players.filter(Boolean) : [];

  // Prefer teams when present, else players
  let groups = flatTeams.length ? flatTeams : (flatPlayers.length ? [flatPlayers] : []);

  // Limit to 12 visible players (duo = 10, trio/5v5 could be 10-12+; we cap for UI)
  const maxPlayers = 12;
  let count = 0;
  groups = groups
    .map(g => g.slice(0, Math.max(0, maxPlayers - count)).map(p => (count++, p)))
    .filter(g => g.length);

  const totalPlayers = (flatTeams.length ? flatTeams.reduce((a,g)=>a+g.length,0) : flatPlayers.length);

  return (
    <div className="card battle">
      <div className={headerClass}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div className="battle-title">
              <span className="mode">{String(mode).toUpperCase()}</span>
              <span className="sep">•</span>
              <span className="map">{map}</span>
            </div>
            <div className="small">{timeLabel} • {totalPlayers ? `${totalPlayers} jogadores` : "—"}</div>
          </div>

          <div className="battle-right">
            <div className="pill" title="Variação de troféus">
              <img src={trophyIcon} alt="trophy" />
              <span className={trophyChange >= 0 ? "pos" : "neg"}>
                {trophyChange >= 0 ? `+${trophyChange}` : trophyChange}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="battle-body">
        {groups.length ? (
          <div className="battle-roster">
            {groups.map((g, gi) => (
              <div key={gi} className="team-block">
                {groups.length > 1 ? <div className="team-label">Time {gi + 1}</div> : null}
                <div className="roster-grid">
                  {g.map((p, i) => <PlayerCell key={`${gi}-${i}`} p={p} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="small" style={{ padding: 12, color: "rgba(255,255,255,0.6)" }}>
            Sem dados de jogadores para esta partida.
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerCell({ p }) {
  const name = p?.name || formatTag(p?.tag) || "—";
  const bName = p?.brawler?.name || "—";
  const img = getBrawlerImage({ id: p?.brawler?.id, name: bName });
  const trophies = p?.brawler?.trophies ?? p?.brawlerTrophies ?? null;

  return (
    <div className="player-cell">
      <img className="thumb" src={img} alt={bName} loading="lazy" />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="n truncate">{name}</div>
        <div className="sub truncate">
          {trophies != null ? (
            <>
              <img src={trophyIcon} alt="t" />
              <span>{trophies}</span>
              <span style={{ opacity: .5 }}>•</span>
            </>
          ) : null}
          <span className="truncate">{bName}</span>
        </div>
      </div>
    </div>
  );
}

