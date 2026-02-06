import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { fetchRankings } from "../api.js";
import { useAsync } from "../hooks.js";
import { Card, ErrorBox, SkeletonBlock, Pill, WarningBox } from "../components.jsx";

const COUNTRIES = [
  { code: "global", name: "Global" },
  { code: "br", name: "Brasil" },
  { code: "us", name: "EUA" },
  { code: "es", name: "Espanha" },
  { code: "fr", name: "França" },
  { code: "de", name: "Alemanha" }
];

export default function Rankings() {
  const { demoMode, tokenPresent } = useContext(AppCtx);
  const [kind, setKind] = useState("players"); // players | clubs | brawlers
  const [country, setCountry] = useState("global");
  const [brawlerId, setBrawlerId] = useState("16000000");

  const data = useAsync(() => fetchRankings(kind, country, brawlerId, demoMode), [kind, country, brawlerId, demoMode]);

  return (
    <div className="grid" style={{ gap: 14 }}>
      {!tokenPresent && (
        <WarningBox title="Modo demo">
          Rankings em modo offline são demonstrativos. Para rankings reais, configure <span className="kbd">BRAWL_TOKEN</span> no backend.
        </WarningBox>
      )}

      <div className="row" style={{ flexWrap:"wrap", gap: 10 }}>
        <div>
          <div className="h1">Rankings</div>
          <div className="p">Leaderboards inspirados no Brawlify.</div>
        </div>
      </div>

      <div className="grid cols-3">
        <Card title="Configuração">
          <div className="grid" style={{ gap: 10, marginTop: 12 }}>
            <div>
              <div className="small">Tipo</div>
              <select className="input" value={kind} onChange={(e)=>setKind(e.target.value)}>
                <option value="players">Players</option>
                <option value="clubs">Clubs</option>
                <option value="brawlers">Brawlers</option>
              </select>
            </div>
            <div>
              <div className="small">Região</div>
              <select className="input" value={country} onChange={(e)=>setCountry(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            {kind === "brawlers" && (
              <div>
                <div className="small">Brawler ID</div>
                <input className="input" value={brawlerId} onChange={(e)=>setBrawlerId(e.target.value)} placeholder="ex: 16000000" />
                <div className="small" style={{ marginTop: 8 }}>Use IDs oficiais (ex: Shelly = 16000000).</div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Legenda">
          <div className="row" style={{ flexWrap:"wrap", marginTop: 10 }}>
            <Pill>Global = <b style={{ color:"var(--text)" }}>global</b></Pill>
            <Pill>País = <b style={{ color:"var(--text)" }}>ISO (ex: br)</b></Pill>
          </div>
          <div className="hr" />
          <div className="small">A API oficial pode variar o suporte por região/caso. Erros são tratados com mensagens amigáveis.</div>
        </Card>

        <Card title="Atalhos">
          <div className="row" style={{ flexWrap:"wrap", gap: 10 }}>
            <Link className="btn secondary" to="/">Stats</Link>
            <Link className="btn secondary" to="/saved">Saved</Link>
          </div>
        </Card>
      </div>

      <Card title="Leaderboard">
        {data.loading && (
          <div className="grid" style={{ gap: 10, marginTop: 12 }}>
            {Array.from({ length: 12 }).map((_, i) => <SkeletonBlock key={i} h={42} />)}
          </div>
        )}
        {data.error && <ErrorBox error={data.error} />}
        {data.data && (
          <Leaderboard kind={kind} data={data.data} />
        )}
      </Card>
    </div>
  );
}

function Leaderboard({ kind, data }) {
  const items = data?.items || [];
  if (!items.length) return <div className="toast">Sem dados.</div>;

  return (
    <table className="table" style={{ marginTop: 8 }}>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Nome</th>
          <th>TAG</th>
          <th>{kind === "clubs" ? "Membros" : kind === "brawlers" ? "Brawler" : "Troféus"}</th>
          <th>Troféus</th>
        </tr>
      </thead>
      <tbody>
        {items.slice(0, 100).map((it) => (
          <tr key={it.tag}>
            <td style={{ fontWeight: 900 }}>{it.rank}</td>
            <td style={{ fontWeight: 800 }}>
              {kind === "players" ? <Link to={`/player/${it.tag}`}>{it.name}</Link> : kind === "clubs" ? <Link to={`/club/${it.tag}`}>{it.name}</Link> : it.name}
            </td>
            <td className="small">{it.tag}</td>
            <td className="small">
              {kind === "clubs" ? (it.memberCount ?? "—") : kind === "brawlers" ? (it.brawler?.name ?? "—") : "—"}
            </td>
            <td style={{ fontWeight: 900 }}>{it.trophies}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
