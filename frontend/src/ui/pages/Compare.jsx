import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { fetchPlayer, normalizeTag } from "../api.js";
import { useAsync } from "../hooks.js";
import { Card, ErrorBox, SkeletonBlock, Pill, EmptyBox, WarningBox } from "../components.jsx";

function Stat({ label, a, b }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
      <div className="small" style={{ opacity: .75 }}>{label}</div>
      <div className="row" style={{ gap: 10, alignItems: "baseline" }}>
        <span style={{ fontWeight: 800 }}>{a ?? "—"}</span>
        <span style={{ opacity: .4 }}>vs</span>
        <span style={{ fontWeight: 800 }}>{b ?? "—"}</span>
      </div>
    </div>
  );
}

export default function Compare() {
  const { demoMode, user } = useContext(AppCtx);
  const [tagA, setTagA] = useState(user?.mainTag || "");
  const [tagB, setTagB] = useState("");

  const a = useMemo(() => (tagA ? normalizeTag(tagA) : ""), [tagA]);
  const b = useMemo(() => (tagB ? normalizeTag(tagB) : ""), [tagB]);

  const left = useAsync(() => (a ? fetchPlayer(a, demoMode) : Promise.resolve(null)), [a, demoMode]);
  const right = useAsync(() => (b ? fetchPlayer(b, demoMode) : Promise.resolve(null)), [b, demoMode]);

  const ready = !!left.data && !!right.data;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="Comparar jogadores" subtitle="Comparações úteis (sem competição de ego)">
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <input className="input" value={tagA} onChange={(e)=>setTagA(e.target.value)} placeholder="#ABCDEFG" style={{ minWidth: 220 }} />
          <input className="input" value={tagB} onChange={(e)=>setTagB(e.target.value)} placeholder="#H1J2K3L" style={{ minWidth: 220 }} />
          <div className="row" style={{ gap: 8 }}>
            {a ? <Pill text={a} /> : null}
            {b ? <Pill text={b} /> : null}
          </div>
        </div>
        <div className="small" style={{ opacity: .75, marginTop: 8 }}>
          Dica: compare um main contra outro para ver diferença de modos, consistência e foco de brawlers.
        </div>
      </Card>

      {left.error || right.error ? <ErrorBox title="Erro ao carregar" details={(left.error || right.error)?.message || "Falha"} /> : null}
      {(left.loading || right.loading) && (a || b) ? (
        <Card title="Carregando">
          <SkeletonBlock h={16} />
          <SkeletonBlock h={16} />
          <SkeletonBlock h={16} />
        </Card>
      ) : null}

      {ready ? (
        <Card title="Resumo lado a lado">
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900 }}>{left.data.name}</div>
              <div className="small"><Link to={`/player/${a}`}>Abrir perfil</Link></div>
            </div>
            <div>
              <div style={{ fontWeight: 900 }}>{right.data.name}</div>
              <div className="small"><Link to={`/player/${b}`}>Abrir perfil</Link></div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <Stat label="Troféus" a={left.data.trophies} b={right.data.trophies} />
            <Stat label="Melhor marca" a={left.data.highestTrophies} b={right.data.highestTrophies} />
            <Stat label="Vitórias 3v3" a={left.data["3vs3Victories"]} b={right.data["3vs3Victories"]} />
            <Stat label="Solo" a={left.data.soloVictories} b={right.data.soloVictories} />
            <Stat label="Duo" a={left.data.duoVictories} b={right.data.duoVictories} />
            <Stat label="Experiência" a={left.data.expLevel} b={right.data.expLevel} />
          </div>

          <WarningBox title="Limitação de histórico">
            A API oficial retorna apenas as 25 últimas batalhas. Comparações avançadas (streaks, variações em 2h/24h) dependem do rastreamento salvo.
          </WarningBox>
        </Card>
      ) : (a || b) ? (
        <EmptyBox title="Informe duas TAGs" subtitle="Preencha as duas TAGs para ver o comparativo." />
      ) : null}
    </div>
  );
}
