// src/components/ComprasDashboard.jsx
import React, { useMemo, useState } from "react";
import { useComprasData } from "../../hooks/useCompraData"; // ajuste se preciso
import ComprasCharts from "./ComprasCharts";
import "./ComprasDashboard.css";

const URL_COMPRAS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRf2jB_-_oOoD8pNJoMx2xDSmeOhx8Ct6vSofNv0EY7h5_rhR0l-yz6lfFByM3Xkg/pub?gid=72467004&single=true&output=csv";

const fmtInt = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtPct = (v) => `${(Number(v) || 0).toFixed(1)}%`;

/* ---- ordenação de meses ---- */
const MONTHS_ORDER = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
const norm = (s) =>
  String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().toUpperCase();
const monthIdx = (s) => {
  const t = norm(s);
  // aceita "Jan", "Janeiro", "JAN", etc. (pega o prefixo)
  const found = MONTHS_ORDER.findIndex((m) => t.startsWith(m));
  return found === -1 ? 999 : found;
};

export default function ComprasDashboard() {
  const { loading, error, rows, months, obras } = useComprasData(URL_COMPRAS);
  const [obraSel, setObraSel] = useState("Todas");
  const [mesSel, setMesSel] = useState("Todos");

  const obrasOpts = useMemo(
    () => ["Todas", ...Array.from(obras || [])],
    [obras]
  );
  const mesesOpts = useMemo(
    () => ["Todos", ...Array.from(new Set((months || []).map((m) => norm(m))))],
    [months]
  );

  const filtrados = useMemo(() => {
    const arr = rows.filter(
      (r) =>
        (obraSel === "Todas" || r.obra === obraSel) &&
        (mesSel === "Todos" || norm(r.mes) === mesSel)
    );
    // ordena pelos meses corretos
    arr.sort((a, b) => monthIdx(a.mes) - monthIdx(b.mes));
    return arr;
  }, [rows, obraSel, mesSel]);

  if (loading) return <p className="loading">Carregando dados…</p>;
  if (error) return <p style={{ color: "crimson" }}>Erro ao carregar.</p>;
  if (!rows.length) return <p>Nenhum dado encontrado.</p>;

  return (
    <div className="compras-container">
      <header className="compras-header">
        <h1>Indicadores de Suprimentos por Obra</h1>
      </header>

      {/* Filtros */}
      <div className="filters">
        <div className="filter">
          <label>Obra:</label>
          <select value={obraSel} onChange={(e) => setObraSel(e.target.value)}>
            {obrasOpts.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="filter">
          <label>Mês:</label>
          <select value={mesSel} onChange={(e) => setMesSel(e.target.value)}>
            {mesesOpts.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="table-container">
        <table className="compras-table">
          <thead>
            <tr>
              <th className="sticky-col second">Mês</th>
              <th colSpan={3} className="grp-title">PRAZO MÉDIO SOL × PEDIDO</th>
              <th colSpan={3} className="grp-title">PRAZO MÉDIO SOL × ENTREGA (lead time)</th>
              <th colSpan={3} className="grp-title">Pontualidade entrega de fornecedor</th>
              <th colSpan={3} className="grp-title">% negociação (orçamento × pedido)</th>
            </tr>
            <tr className="subheader">
              <th className="sticky-col second"></th>
              <th>Meta R$</th><th>Real R$</th><th>%</th>
              <th>Meta R$</th><th>Real R$</th><th>%</th>
              <th>Meta R$</th><th>Real R$</th><th>%</th>
              <th>Meta R$</th><th>Real R$</th><th>%</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((d, i) => (
              <tr key={i}>
                <td className="sticky-col second">{norm(d.mes)}</td>

                <td className="num">{fmtInt(d.prazo_pedido_meta)}</td>
                <td className="num">{fmtInt(d.prazo_pedido_real)}</td>
                <td className="num">{fmtPct(d.prazo_pedido_perc)}</td>

                <td className="num">{fmtInt(d.prazo_entrega_meta)}</td>
                <td className="num">{fmtInt(d.prazo_entrega_real)}</td>
                <td className="num">{fmtPct(d.prazo_entrega_perc)}</td>

                <td className="num">{fmtInt(d.pontualidade_meta)}</td>
                <td className="num">{fmtInt(d.pontualidade_real)}</td>
                <td className="num">{fmtPct(d.pontualidade_perc)}</td>

                <td className="num">{fmtInt(d.negociacao_meta)}</td>
                <td className="num">{fmtInt(d.negociacao_real)}</td>
                <td className="num">{fmtPct(d.negociacao_perc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gráficos (usa os próprios dados filtrados, já ordenados) */}
      <ComprasCharts data={filtrados} />
    </div>
  );
}
