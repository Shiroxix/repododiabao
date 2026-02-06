import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components.jsx";

export default function NotFound() {
  return (
    <Card title="404" subtitle="Página não encontrada">
      <div className="p" style={{ marginTop: 10 }}>O caminho acessado não existe.</div>
      <div className="hr" />
      <Link className="btn secondary" to="/">Voltar para Stats</Link>
    </Card>
  );
}
