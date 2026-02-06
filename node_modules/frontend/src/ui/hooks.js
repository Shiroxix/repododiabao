import { useEffect, useMemo, useRef, useState } from "react";

export function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, data: null });
    fn()
      .then((data) => alive && setState({ loading: false, error: null, data }))
      .catch((error) => alive && setState({ loading: false, error, data: null }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function useDebounced(value, delay=250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function formatTag(tag) {
  const t = String(tag || "").replace(/^#/, "");
  return t ? `#${t}` : "";
}

export function formatBattleTime(battleTime) {
  // battleTime is like 20260205T120000.000Z or similar
  const s = String(battleTime || "");
  if (!s) return "";
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!m) return s;
  const [_, Y, M, D, h, mi, se] = m;
  return `${D}/${M}/${Y} ${h}:${mi}:${se}`;
}

export function uniqBy(arr, keyFn) {
  const out = [];
  const seen = new Set();
  for (const it of arr || []) {
    const k = keyFn(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}
