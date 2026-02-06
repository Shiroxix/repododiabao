import React, { useContext } from "react";
import { NavLink, Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import { AppCtx } from "./ctx.js";

export function Topbar() {
  const { demoMode, tokenPresent, theme, setTheme, user } = useContext(AppCtx);

  const envBadge = demoMode ? { text: "DEMO", cls: "badge demo" } : { text: "ONLINE", cls: "badge ok" };

  function toggleTheme() {
    const next = theme === "purple" ? "emerald" : theme === "emerald" ? "slate" : "purple";
    setTheme(next);
  }

  return (
    <div className="topbar">
      <div className="container">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" className="brand" style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none" }}>
            <img src={logo} alt="logo" style={{ width: 28, height: 28 }} />
            <div>
              <div className="title">Brawl Lookup</div>
              <div className="small">Jogador • Clube • Rankings • Tracking</div>
            </div>
          </Link>

          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <nav className="nav">
              <NavLink className={({isActive})=>`nav-item ${isActive?"active":""}`} to="/">Início</NavLink>
              <NavLink className={({isActive})=>`nav-item ${isActive?"active":""}`} to="/brawlers">Brawlers</NavLink>
              <NavLink className={({isActive})=>`nav-item ${isActive?"active":""}`} to="/rankings">Rankings</NavLink>
              <NavLink className={({isActive})=>`nav-item ${isActive?"active":""}`} to="/saved">Salvos</NavLink>
            </nav>

            <button className="btn ghost" onClick={toggleTheme} title="Mudar tema">
              Tema: {theme === "purple" ? "Roxo" : theme === "emerald" ? "Verde" : "Neutro"}
            </button>

            <Link className="btn ghost" to="/login">
              {user?.name ? `Conta: ${user.name}` : "Entrar"}
            </Link>

            <span className={envBadge.cls}>{envBadge.text}</span>
            {!tokenPresent ? <span className="badge warn">TOKEN AUSENTE</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <div style={{ borderTop: "1px solid var(--line)", background: "rgba(0,0,0,.25)" }}>
      <div className="container" style={{ padding: "14px 0", display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="small">© {year} Brawl Lookup</div>
        <div className="small">Créditos: ShiroDev</div>
      </div>
    </div>
  );
}

export function Card({ title, subtitle, right, children }) {
  return (
    <div className="card">
      <div className="card-inner">
        {(title || right) && (
          <div className="row" style={{ alignItems: "baseline" }}>
            <div>
              {title && <div className="h2">{title}</div>}
              {subtitle && <div className="p">{subtitle}</div>}
            </div>
            <div className="spacer" />
            {right}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function SkeletonBlock({ h=16, w="100%" }) {
  return <div className="skel" style={{ height: h, width: w }} />;
}

export function ErrorBox({ error }) {
  return (
    <div className="toast err">
      <div style={{ fontWeight: 900 }}>Erro</div>
      <div style={{ marginTop: 6 }}>{error?.message || "Falha ao carregar."}</div>
      {error?.code && <div className="small" style={{ marginTop: 8 }}>code: <span className="kbd">{error.code}</span></div>}
    </div>
  );
}

export function WarningBox({ title="Aviso", children }) {
  return (
    <div className="toast warn">
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

export function EmptyBox({ title="Nada aqui", children }) {
  return (
    <div className="toast">
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

export function Pill({ children }) {
  return <span className="pill">{children}</span>;
}
