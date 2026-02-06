import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { normalizeTag } from "../api.js";
import { Card, Pill, WarningBox } from "../components.jsx";

export default function Login() {
  const nav = useNavigate();
  const { user, setUser } = useContext(AppCtx);
  const [name, setName] = useState(user?.name || "");
  const [mainTag, setMainTag] = useState(user?.mainTag || "");

  const normalized = useMemo(() => (mainTag ? normalizeTag(mainTag) : ""), [mainTag]);

  function submit(e) {
    e.preventDefault();
    const next = { name: name.trim() || "Jogador", mainTag: normalized || "" };
    setUser(next);
    nav("/");
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="Entrar" subtitle="Login local (salvo no seu navegador)">
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <label className="small">Nome</label>
          <input className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Seu nome" />

          <label className="small">TAG principal (opcional)</label>
          <input className="input" value={mainTag} onChange={(e)=>setMainTag(e.target.value)} placeholder="#ABCDEFG" />
          {mainTag && normalized !== normalizeTag(mainTag) ? (
            <WarningBox title="TAG normalizada">
              Vamos usar <Pill text={normalized} /> (maiúsculo, sem caracteres inválidos).
            </WarningBox>
          ) : null}

          <div className="row" style={{ gap: 10, marginTop: 6 }}>
            <button className="btn primary" type="submit">Salvar</button>
            <button className="btn" type="button" onClick={()=>{ setUser(null); nav("/"); }}>Sair</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
