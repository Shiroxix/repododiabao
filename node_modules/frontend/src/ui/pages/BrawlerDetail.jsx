import React, { useContext, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { fetchBrawler } from "../api.js";
import { useAsync } from "../hooks.js";
import { Card, ErrorBox, SkeletonBlock, Pill, EmptyBox } from "../components.jsx";
import { getBrawlerImage } from "../brawlerMedia.js";

export default function BrawlerDetail() {
  const { id } = useParams();
  const { demoMode } = useContext(AppCtx);
  const q = useAsync(() => fetchBrawler(id, demoMode), [id, demoMode]);

  const b = useMemo(() => q.value?.data || q.value || null, [q.value]);
  const img = getBrawlerImage(b);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="row" style={{ alignItems: "center" }}>
        <Link to="/brawlers" className="btn secondary">← Voltar</Link>
        <div className="spacer" />
      </div>

      {q.loading && <SkeletonBlock h={140} />}
      {q.error && <ErrorBox error={q.error} />}
      {!q.loading && !q.error && !b && <EmptyBox title="Não encontrado">Sem dados.</EmptyBox>}

      {!q.loading && !q.error && b && (
        <Card title={b?.name} subtitle={`${b?.rarity?.name || "—"} • ${b?.class?.name || "—"}`}>
          <div className="row" style={{ gap: 14, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div className="thumb xl">
              <img src={img} alt={b?.name || "brawler"} />
            </div>
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <Pill label={`ID: ${b?.id}`} />
              {b?.description && <Pill label={b.description} />}
            </div>
          </div>

          <div className="hr" />

          <div className="grid cols-2" style={{ gap: 12 }}>
            <div>
              <div className="h2">Gadgets</div>
              <div style={{ marginTop: 10 }} className="grid" >
                {(b?.gadgets || []).length ? (b.gadgets.map((g) => (
                  <div key={g.id} className="pill wide">
                    <div style={{ fontWeight: 900 }}>{g.name}</div>
                    <div className="small">{g.description || "—"}</div>
                  </div>
                ))) : <div className="small">—</div>}
              </div>
            </div>

            <div>
              <div className="h2">Star Powers</div>
              <div style={{ marginTop: 10 }} className="grid">
                {(b?.starPowers || []).length ? (b.starPowers.map((s) => (
                  <div key={s.id} className="pill wide">
                    <div style={{ fontWeight: 900 }}>{s.name}</div>
                    <div className="small">{s.description || "—"}</div>
                  </div>
                ))) : <div className="small">—</div>}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
