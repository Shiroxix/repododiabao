import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Topbar, Footer } from "./components.jsx";
import { AppCtx } from "./ctx.js";
import { health } from "./api.js";

import Home from "./pages/Home.jsx";
import Player from "./pages/Player.jsx";
import PlayerBattles from "./pages/PlayerBattles.jsx";
import PlayerInsights from "./pages/PlayerInsights.jsx";
import PlayerActivity from "./pages/PlayerActivity.jsx";
import Club from "./pages/Club.jsx";
import Rankings from "./pages/Rankings.jsx";
import Brawlers from "./pages/Brawlers.jsx";
import BrawlerDetail from "./pages/BrawlerDetail.jsx";
import Saved from "./pages/Saved.jsx";
import Login from "./pages/Login.jsx";
import Compare from "./pages/Compare.jsx";
import NotFound from "./pages/NotFound.jsx";
import ServerError from "./pages/ServerError.jsx";

export default function App() {
  const [h, setH] = useState({ tokenPresent: false, offline: true });

  const [theme, setTheme] = useState(() => localStorage.getItem("bl_theme") || "purple");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bl_user") || "null"); } catch { return null; }
  });

  useEffect(() => {
    let alive = true;
    health().then((v) => alive && setH(v));
    const t = setInterval(() => health().then((v) => alive && setH(v)), 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    localStorage.setItem("bl_theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("bl_user", JSON.stringify(user));
  }, [user]);

  const demoMode = !h?.tokenPresent;
  const value = useMemo(
    () => ({ demoMode, tokenPresent: !!h?.tokenPresent, health: h, theme, setTheme, user, setUser }),
    [demoMode, h, theme, user]
  );

  return (
    <AppCtx.Provider value={value}>
      <Topbar />
      <div className="container" style={{ paddingTop: 18, paddingBottom: 40 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/compare" element={<Compare />} />

          <Route path="/player/:tag" element={<Player />} />
          <Route path="/player/:tag/battles" element={<PlayerBattles />} />
          <Route path="/player/:tag/insights" element={<PlayerInsights />} />
          <Route path="/player/:tag/activity" element={<PlayerActivity />} />

          <Route path="/club/:tag" element={<Club />} />
          <Route path="/rankings" element={<Rankings />} />

          <Route path="/brawlers" element={<Brawlers />} />
          <Route path="/brawler/:id" element={<BrawlerDetail />} />

          <Route path="/saved" element={<Saved />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </AppCtx.Provider>
  );
}
