import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, EmptyBox } from "../components.jsx";
import { getFavorites, getRecent, toggleFavorite } from "../storage.js";
import { formatTag } from "../hooks.js";

function List({ title, items }) {
  if (!items?.length) return <EmptyBox title={title}>Nenhum item.</EmptyBox>;
  return (
    <div className="card">
      <div className="card-inner">
        <div className="h2">{title}</div>
        <div className="hr" />
        <div className="grid" style={{ gap: 10 }}>
          {items.map((it) => (
            <div key={`${it.type}:${it.tag}`} className="row" style={{ gap: 10 }}>
              <Link className="btn secondary" to={`/${it.type}/${it.tag}`} style={{ flex: 1, textAlign:"left" }}>
                <div style={{ fontWeight: 900 }}>{it.label || it.tag}</div>
                <div className="small">{it.type.toUpperCase()} • {formatTag(it.tag)}</div>
              </Link>
              <button className="btn secondary" onClick={()=>{ toggleFavorite({ type: it.type, tag: it.tag, label: it.label || it.tag }); window.location.reload(); }}>
                ★
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Saved() {
  const recent = useMemo(() => getRecent(), []);
  const favs = useMemo(() => getFavorites(), []);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div>
        <div className="h1">Saved</div>
        <div className="p">Perfis salvos, vistos recentemente e favoritos.</div>
      </div>

      <div className="grid cols-3">
        <Card title="Atalhos">
          <div className="row" style={{ flexWrap:"wrap", gap: 10, marginTop: 12 }}>
            <Link className="btn secondary" to="/">Stats</Link>
            <Link className="btn secondary" to="/rankings">Rankings</Link>
          </div>
        </Card>
        <List title="Favorites" items={favs} />
        <List title="Recently Viewed" items={recent} />
      </div>
    </div>
  );
}
