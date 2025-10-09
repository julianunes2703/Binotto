// src/components/ComprasDashboard.jsx
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import ComprasCharts from "./ComprasCharts";
import "./ComprasDashboard.css";

const URL_COMPRAS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRf2jB_-_oOoD8pNJoMx2xDSmeOhx8Ct6vSofNv0EY7h5_rhR0l-yz6lfFByM3Xkg/pub?gid=72467004&single=true&output=csv";

export default function ComprasDashboard() {
  const [data, setData] = useState([]);
  const [obraSelecionada, setObraSelecionada] = useState("SEFAZ");
  const [mesSelecionado, setMesSelecionado] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(URL_COMPRAS);
      const text = await res.text();
      const parsed = Papa.parse(text, { header: false }).data;

      const linhasValidas = parsed.filter((r) =>
        /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)$/i.test(r?.[1] || "")
      );

      const num = (v) => {
        const t = String(v ?? "")
          .replace(/[^\d,.-]/g, "")
          .replace(/\./g, "")
          .replace(",", ".");
        const n = parseFloat(t);
        return Number.isFinite(n) ? n : 0;
      };

      // ...dentro do useEffect onde você monta "dados":
const dados = linhasValidas.map((row) => ({
  Obra: "SEFAZ",
  Mes: row[1],

  // PRAZO SOL × PEDIDO (Meta / Real / %)
  PrazoSolPedidoMeta: num(row[3]),
  PrazoSolPedidoReal: num(row[4]),
  PrazoSolPedidoPerc: num(row[5]),

  // PRAZO SOL × ENTREGA (Meta / Real / %)
  PrazoSolEntregaMeta: num(row[6]),
  PrazoSolEntregaReal: num(row[7]),
  PrazoSolEntregaPerc: num(row[8]),

  // Indicadores
  Pontualidade: num(row[10] ?? row[11]),
  NivelRuptura: num(row[13] ?? row[14]),
  Negociacao: num(row[16] ?? row[17]),
  Estoque: num(row[19] ?? row[20]),
  Avaliacao: num(row[22] ?? row[23]),
}));


      setData(dados);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="loading">Carregando dados...</p>;

  const obras = ["SEFAZ"];
  const meses = ["Todos", ...new Set(data.map((d) => d.Mes))];

  const filtrados = data.filter(
    (d) =>
      (obraSelecionada === "Todas" || d.Obra === obraSelecionada) &&
      (mesSelecionado === "Todos" || d.Mes === mesSelecionado)
  );

  const fmtInt = (v) =>
    (Number(v) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const fmtPct = (v) => `${(Number(v) || 0).toFixed(1)}%`;

  return (
    <div className="compras-container">
      <header className="compras-header">
        <h1>Painel de Compras</h1>
        <p>Indicadores de Suprimentos e Fornecedores</p>
      </header>

      {/* Filtros */}
      <div className="filters">
        <div className="filter">
          <label>Obra:</label>
          <select
            value={obraSelecionada}
            onChange={(e) => setObraSelecionada(e.target.value)}
          >
            {obras.map((obra) => (
              <option key={obra} value={obra}>
                {obra}
              </option>
            ))}
          </select>
        </div>

        <div className="filter">
          <label>Mês:</label>
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
          >
            {meses.map((mes) => (
              <option key={mes} value={mes}>
                {mes}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela branca, igual ao padrão de obras */}
      <div className="table-container">
        <table className="compras-table">
          <thead>
            <tr>
              <th className="sticky-col second">Mês</th>
              <th colSpan={3} className="grp-title">Prazo Sol. × Pedido</th>
              <th colSpan={3} className="grp-title">Prazo Sol. × Entrega</th>
              <th>Pontualidade</th>
              <th>Nível de Ruptura</th>
              <th>% Negociação</th>
              <th>Estoque</th>
              <th>Avaliação</th>
            </tr>
            <tr className="subheader">
              <th className="sticky-col second"></th>
              <th>Meta</th>
              <th>Real</th>
              <th>%</th>
              <th>Meta</th>
              <th>Real</th>
              <th>%</th>
              <th>%</th>
              <th>%</th>
              <th>%</th>
              <th>%</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((d, i) => (
              <tr key={i}>
                <td className="sticky-col second">{d.Mes}</td>

                <td className="num">{fmtInt(d.PrazoSolPedidoMeta)}</td>
                <td className="num">{fmtInt(d.PrazoSolPedidoReal)}</td>
                <td className="num">{fmtPct(d.PrazoSolPedidoPerc)}</td>

                <td className="num">{fmtInt(d.PrazoSolEntregaMeta)}</td>
                <td className="num">{fmtInt(d.PrazoSolEntregaReal)}</td>
                <td className="num">{fmtPct(d.PrazoSolEntregaPerc)}</td>

                <td className="num">{fmtPct(d.Pontualidade)}</td>
                <td className="num">{fmtPct(d.NivelRuptura)}</td>
                <td className="num">{fmtPct(d.Negociacao)}</td>
                <td className="num">{fmtPct(d.Estoque)}</td>
                <td className="num">{fmtPct(d.Avaliacao)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gráficos de Meta × Real */}
      <div className="compras-charts">
        <ComprasCharts data={filtrados} />
      </div>
    </div>
  );
}
