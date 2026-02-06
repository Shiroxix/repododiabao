import React, { useContext, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { fetchClub, normalizeTag } from "../api.js";
import { useAsync, formatTag, useDebounced } from "../hooks.js";
import { Card, ErrorBox, SkeletonBlock, Pill, EmptyBox } from "../components.jsx";
import { pushRecent, toggleFavorite, isFavorite } from "../storage.js";
import { getClubBadgeById } from "../cdn.js";

export default function Club() {
  const { tag: rawTag } = useParams();
  const tag = useMemo(() => normalizeTag(rawTag), [rawTag]);
  const { demoMode } = useContext(AppCtx);

  const club = useAsync(() => fetchClub(tag, demoMode), [tag, demoMode]);
  const fav = useMemo(() => isFavorite({ type: "club", tag }), [tag]);

  const [q, setQ] = useState("");
  const dq = useDebounced(q, 200);
  const [sort, setSort] = useState("trophies_desc");

  const members = useMemo(() => {
    const list = club.data?.members || [];
    const filtered = dq ? list.filter(m => (m.name||"").toLowerCase().includes(dq.toLowerCase()) || String(m.tag||"").includes(dq)) : list;
    const sorted = [...filtered].sort((a,b) => {
      if (sort==="trophies_desc") return (b.trophies||0)-(a.trophies||0);
      if (sort==="trophies_asc") return (a.trophies||0)-(b.trophies||0);
      if (sort==="name_asc") return String(a.name||"").localeCompare(String(b.name||""));
      if (sort==="role") return String(a.role||"").localeCompare(String(b.role||""));
      return 0;
    });
    return sorted;
  }, [club.data, dq, sort]);

  function onToggleFav() {
    toggleFavorite({ type: "club", tag, label: club.data?.name || tag });
    pushRecent({ type: "club", tag, label: club.data?.name || tag });
  }

  const avg = useMemo(() => {
    const list = club.data?.members || [];
    if (!list.length) return null;
    const sum = list.reduce((a,m)=>a+(m.trophies||0),0);
    return Math.round(sum / list.length);
  }, [club.data]);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="row" style={{ flexWrap:"wrap", gap: 12 }}>
        <div>
          <div className="h1">Club {formatTag(tag)}</div>
          <div className="p">Visão geral, membros, busca e ordenação.</div>
        </div>
        <div className="spacer" />
        <div className="row" style={{ gap: 10 }}>
          <button className="btn" onClick={onToggleFav}>{fav ? "Unfavorite" : "Favorite"}</button>
        </div>
      </div>

      <div className="grid cols-3">
        <Card title="Overview">
          {club.loading && (
            <div className="grid" style={{ gap: 10 }}>
              <SkeletonBlock h={18} w="60%" />
              <SkeletonBlock h={14} w="85%" />
              <SkeletonBlock h={14} w="72%" />
            </div>
          )}
          {club.error && <ErrorBox error={club.error} />}
          {club.data && (
            <>
              <div className="row" style={{ gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", background: "rgba(0,0,0,.25)" }}>
                  <img
                    src={getClubBadgeById(club.data.badgeId)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{club.data.name}</div>
                  <div className="small">{formatTag(club.data.tag)} • {club.data.type}</div>
                </div>
              </div>
              <div className="hr" />
              <div className="row" style={{ flexWrap:"wrap" }}>
                <Pill>🏆 total: <b style={{ color:"var(--text)" }}>{club.data.trophies}</b></Pill>
                <Pill>membros: <b style={{ color:"var(--text)" }}>{club.data.members?.length ?? "—"}</b></Pill>
                <Pill>média: <b style={{ color:"var(--text)" }}>{avg ?? "—"}</b></Pill>
              </div>
              {club.data.description && (
                <>
                  <div className="hr" />
                  <div className="p">{club.data.description}</div>
                </>
              )}
            </>
          )}
        </Card>

        <Card title="Top members" subtitle="Baseado nos troféus atuais">
          {club.data?.members?.length ? (
            <div className="grid" style={{ gap: 10, marginTop: 12 }}>
              {([...club.data.members].sort((a,b)=>(b.trophies||0)-(a.trophies||0)).slice(0,5)).map((m) => (
                <Link key={m.tag} to={`/player/${normalizeTag(m.tag)}`} className="btn secondary" style={{ textAlign:"left" }}>
                  <div style={{ fontWeight: 900 }}>{m.name}</div>
                  <div className="small">{formatTag(normalizeTag(m.tag))} • 🏆 {m.trophies} • {m.role}</div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBox title="Sem membros">A API não retornou lista de membros.</EmptyBox>
          )}
        </Card>

        <Card title="Ferramentas">
          <div className="p">Use busca e ordenação para navegar pela lista completa.</div>
          <div className="hr" />
          <div className="row" style={{ flexWrap:"wrap", gap: 10 }}>
            <Link className="btn secondary" to="/">Stats</Link>
            <Link className="btn secondary" to="/saved">Saved</Link>
          </div>
        </Card>
      </div>

      <Card title="Members" subtitle="Lista completa com busca e ordenação">
        {club.loading && (
          <div className="grid" style={{ gap: 10, marginTop: 12 }}>
            {Array.from({ length: 10 }).map((_, i) => <SkeletonBlock key={i} h={44} />)}
          </div>
        )}
        {club.data && (
          <>
            <div className="row" style={{ gap: 10, flexWrap:"wrap", marginTop: 12 }}>
              <input className="input" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar membro..." style={{ flex: 1, minWidth: 220 }} />
              <select className="input" value={sort} onChange={(e)=>setSort(e.target.value)} style={{ width: 240 }}>
                <option value="trophies_desc">Troféus (desc)</option>
                <option value="trophies_asc">Troféus (asc)</option>
                <option value="name_asc">Nome (A-Z)</option>
                <option value="role">Cargo</option>
              </select>
            </div>

            <div className="hr" />
            {!members.length ? (
              <EmptyBox title="Sem resultados">Nenhum membro corresponde à busca.</EmptyBox>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nome</th>
                    <th>TAG</th>
                    <th>Cargo</th>
                    <th>Troféus</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => (
                    <tr key={m.tag}>
                      <td>{idx+1}</td>
                      <td style={{ fontWeight: 800 }}>{m.name}</td>
                      <td className="small">{formatTag(normalizeTag(m.tag))}</td>
                      <td className="small">{m.role}</td>
                      <td style={{ fontWeight: 900 }}>{m.trophies}</td>
                      <td>
                        <Link className="btn secondary" to={`/player/${normalizeTag(m.tag)}`} style={{ padding: "8px 10px" }}>Ver</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
