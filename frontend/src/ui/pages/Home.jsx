import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { normalizeTag } from "../api.js";
import { Card, EmptyBox, WarningBox, Pill } from "../components.jsx";
import { getFavorites, getRecent, pushRecent } from "../storage.js";
import { formatTag } from "../hooks.js";

function SearchPanel({ kind, disabled, onGo }) {
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    const tag = normalizeTag(raw);
    if (!tag || tag.length < 3) {
      setErr("TAG inválida.");
      return;
    }
    setErr("");
    onGo(tag);
  }

  return (
    <form onSubmit={submit} className="row" style={{ gap: 10, marginTop: 12, flexWrap: "wrap" }}>
      <input
        className="input"
        value={raw}
        onChange={(e)=>setRaw(e.target.value)}
        placeholder={kind === "player" ? "TAG do jogador (ex: #ABCDEFG)" : "TAG do clube (ex: #2PPQQVV)"}
        spellCheck={false}
      />
      <button className="btn" disabled={disabled} type="submit">Buscar</button>
      {err && <div className="small" style={{ color: "rgba(239,68,68,.95)" }}>{err}</div>}
    </form>
  );
}

function CompactList({ title, items, onOpen }) {
  return (
    <div>
      <div className="row" style={{ alignItems:"baseline" }}>
        <div className="h2">{title}</div>
        <div className="spacer" />
        <div className="small">{items.length}</div>
      </div>
      <div className="hr" />
      {!items.length ? (
        <EmptyBox title={title}>Nenhum item.</EmptyBox>
      ) : (
        <div className="grid" style={{ gap: 8 }}>
          {items.slice(0, 8).map((it) => (
            <button key={`${it.type}:${it.tag}`} className="btn secondary" onClick={()=>onOpen(it)} style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 900 }} className="truncate">{it.label || it.tag}</div>
              <div className="small">{it.type.toUpperCase()} • {formatTag(it.tag)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const nav = useNavigate();
  const { tokenPresent } = useContext(AppCtx);

  const [tab, setTab] = useState("player");
  const recent = useMemo(() => getRecent(), []);
  const favs = useMemo(() => getFavorites(), []);

  function goPlayer(tag) {
    pushRecent({ type: "player", tag, label: tag });
    nav(`/player/${tag}`);
  }
  function goClub(tag) {
    pushRecent({ type: "club", tag, label: tag });
    nav(`/club/${tag}`);
  }
  function openItem(it) {
    if (it.type === "player") return nav(`/player/${it.tag}`);
    return nav(`/club/${it.tag}`);
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      {!tokenPresent && (
        <WarningBox title="Token ausente (modo demo)">
          O backend está sem <span className="kbd">BRAWL_TOKEN</span>. O site abre normalmente, mas buscas reais ficam desabilitadas.
        </WarningBox>
      )}

      <div className="grid cols-3" style={{ gap: 14 }}>
        <Card title="Stats" subtitle="Player Lookup / Club Lookup — tracking e histórico baseado em visitas." right={<Pill label={tab === "player" ? "Player" : "Club"} />}>
          <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button className={`btn ${tab==="player" ? "" : "secondary"}`} onClick={()=>setTab("player")}>Player</button>
            <button className={`btn ${tab==="club" ? "" : "secondary"}`} onClick={()=>setTab("club")}>Club</button>
          </div>

          {tab === "player" ? (
            <>
              <div className="small" style={{ marginTop: 10 }}>Ver perfil, brawlers e battle log.</div>
              <SearchPanel kind="player" disabled={!tokenPresent} onGo={goPlayer} />
            </>
          ) : (
            <>
              <div className="small" style={{ marginTop: 10 }}>Ver membros, troféus e info do clube.</div>
              <SearchPanel kind="club" disabled={!tokenPresent} onGo={goClub} />
            </>
          )}

          <div className="hr" />
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <button className="btn secondary" onClick={()=>nav("/rankings")}>Rankings</button>
            <button className="btn secondary" onClick={()=>nav("/brawlers")}>Brawlers</button>
            <button className="btn secondary" onClick={()=>nav("/saved")}>Saved</button>
          </div>
        </Card>

        <Card title="Favorites" subtitle="Acesso rápido aos seus perfis favoritos.">
          <CompactList title="Favoritos" items={favs} onOpen={openItem} />
        </Card>

        <Card title="Recently Viewed" subtitle="Últimos perfis acessados no seu dispositivo.">
          <CompactList title="Recentes" items={recent} onOpen={openItem} />
        </Card>
      </div>
    </div>
  );
}
