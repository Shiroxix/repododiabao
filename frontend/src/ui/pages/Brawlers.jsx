import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { fetchBrawlers } from "../api.js";
import { useAsync } from "../hooks.js";
import { Card, ErrorBox, SkeletonBlock, EmptyBox, Pill } from "../components.jsx";
import { getBrawlerImage } from "../brawlerMedia.js";

export default function Brawlers() {
  const { demoMode } = useContext(AppCtx);
  const q = useAsync(() => fetchBrawlers(demoMode), [demoMode]);
  const [search, setSearch] = useState("");

  const items = useMemo(() => (q.value?.items || q.value?.data?.items || q.value?.data || q.value?.items || []), [q.value]);
  const filtered = useMemo(() => {
    const s = String(search || "").trim().toLowerCase();
    if (!s) return items;
    return items.filter((b) => String(b?.name || "").toLowerCase().includes(s));
  }, [items, search]);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <Card title="Brawlers" subtitle="Lista oficial (API do Brawl Stars).">
        <div className="row" style={{ gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <input className="input" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar brawler..." />
          <Pill label={`Total: ${items.length || 0}`} />
        </div>
      </Card>

      {q.loading && (
        <div className="grid cols-3" style={{ gap: 10 }}>
          {Array.from({ length: 12 }).map((_, i) => <SkeletonBlock key={i} h={74} />)}
        </div>
      )}

      {q.error && <ErrorBox error={q.error} />}

      {!q.loading && !q.error && !filtered.length && (
        <EmptyBox title="Sem resultados">Tente outro termo.</EmptyBox>
      )}

      {!q.loading && !q.error && filtered.length > 0 && (
        <div className="grid cols-3" style={{ gap: 10 }}>
          {filtered.map((b) => {
            const img = getBrawlerImage(b);
            return (
              <Link key={b.id} to={`/brawler/${b.id}`} className="card" style={{ textDecoration: "none" }}>
                <div className="card-inner row" style={{ gap: 12, alignItems: "center" }}>
                  <div className="thumb">
                    <img src={img} alt={b?.name || "brawler"} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, color: "rgba(255,255,255,.92)" }} className="truncate">{b?.name}</div>
                    <div className="small truncate">{b?.rarity?.name || "—"} • {b?.class?.name || "—"}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
