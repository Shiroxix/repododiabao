import React, { useContext, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AppCtx } from "../ctx.js";
import { fetchHistory, normalizeTag } from "../api.js";
import { useAsync, formatTag } from "../hooks.js";
import { Card, ErrorBox, SkeletonBlock, WarningBox, Pill, EmptyBox } from "../components.jsx";

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

function parseBattleTime(bt) {
  // "YYYYMMDDThhmmss.000Z"
  const m = String(bt || "").match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  const [_,Y,M,D,h,mi,s]=m;
  return new Date(Date.UTC(+Y,+M-1,+D,+h,+mi,+s));
}

export default function PlayerActivity() {
  const { tag: rawTag } = useParams();
  const tag = useMemo(() => normalizeTag(rawTag), [rawTag]);
  const { demoMode } = useContext(AppCtx);
  const history = useAsync(() => fetchHistory(tag, demoMode), [tag, demoMode]);

  const { counts, maxCount, days } = useMemo(() => {
    const battles = (history.value?.battles || []).map((b)=>b?.payload).filter(Boolean);
    const map = {};
    for (const it of battles) {
      const d = parseBattleTime(it?.battleTime);
      if (!d) continue;
      const k = toDateKey(d);
      map[k] = (map[k] || 0) + 1;
    }
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 97); // ~14 weeks
    const list = [];
    for (let i=0;i<=97;i++){
      const d = new Date(start);
      d.setDate(start.getDate()+i);
      list.push(d);
    }
    const max = Math.max(1, ...Object.values(map));
    return { counts: map, maxCount: max, days: list };
  }, [history.value]);

  const tracked = (history.value?.battles || []).length;

  function level(c) {
    if (!c) return 0;
    const t = c / maxCount;
    if (t <= 0.20) return 1;
    if (t <= 0.45) return 2;
    if (t <= 0.70) return 3;
    return 4;
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Link className="btn secondary" to={`/player/${tag}`}>← Perfil</Link>
        <Link className="btn secondary" to={`/player/${tag}/battles`}>Battle Log</Link>
        <Link className="btn secondary" to={`/player/${tag}/insights`}>Insights</Link>
        <div className="spacer" />
        <Pill label={`TAG: ${formatTag(tag)}`} />
      </div>

      <WarningBox title="Transparência (tracking)">
        O calendário mostra apenas atividades registradas pelo backend (tracking). Se estiver vazio, visite o perfil regularmente para acumular histórico.
        <div className="small" style={{ marginTop: 8 }}>No seu banco: <span className="kbd">{tracked}</span> batalhas salvas para este perfil.</div>
      </WarningBox>

      {history.loading && <SkeletonBlock h={220} />}
      {history.error && <ErrorBox error={history.error} />}

      {!history.loading && !history.error && tracked === 0 && (
        <EmptyBox title="Sem tracking">Ative/visite o perfil para gerar histórico.</EmptyBox>
      )}

      {!history.loading && !history.error && (
        <Card title="Atividade" subtitle="Últimas ~14 semanas (intensidade por número de partidas no dia).">
          <div className="activity-wrap" style={{ marginTop: 12 }}>
            <div className="activity-grid">
              {days.map((d) => {
                const k = toDateKey(d);
                const c = counts[k] || 0;
                const lv = level(c);
                return (
                  <div key={k} className={`day lv${lv}`} title={`${k}: ${c} partidas`} />
                );
              })}
            </div>
            <div className="legend row" style={{ gap: 8, marginTop: 10, alignItems: "center", justifyContent: "flex-end" }}>
              <div className="small">Menos</div>
              <div className="day lv0" />
              <div className="day lv1" />
              <div className="day lv2" />
              <div className="day lv3" />
              <div className="day lv4" />
              <div className="small">Mais</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
