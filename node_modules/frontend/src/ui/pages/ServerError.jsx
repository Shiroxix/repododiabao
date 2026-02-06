import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components.jsx";

export default function ServerError() {
  return (
    <Card title="500" subtitle="Erro interno">
      <div className="p" style={{ marginTop: 10 }}>Ocorreu um erro no app. Verifique os logs do backend e tente novamente.</div>
      <div className="hr" />
      <Link className="btn secondary" to="/">Voltar para Stats</Link>
    </Card>
  );
}
