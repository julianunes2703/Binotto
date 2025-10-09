import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import ComprasCharts from "./ComprasCharts";
import "./ComprasDashboard.css";

const URL_COMPRAS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRf2jB_-_oOoD8pNJoMx2xDSmeOhx8Ct6vSofNv0EY7h5_rhR0l-yz6lfFByM3Xkg/pub?gid=72467004&single=true&output=csv";

export default function ComprasDashboard() {
  const [data, setData] = useState([]);
  const [obraSelecionada, setObraSelecionada] = useState("SMF");
  const [mesSelecionado, setMesSelecionado] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(URL_COMPRAS);
      const text = await res.text();
      const parsed = Papa.parse(text, { header: false }).data;

      // pega somente as linhas que tem meses
      const linhasValidas = parsed.filter((r) =>
        /Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez/i.test(r?.[1] || "")
      );

      // helper pra converter "R$ 1.234,56" ou "33,3%" em número
      const num = (v) => {
        const t = String(v ?? "")
          .replace(/[^\d,.-]/g, "") // remove R$, %, espaços
          .replace(/\./g, "") // remove milhar
          .replace(",", "."); // vírgula -> ponto
        const n = parseFloat(t);
        return isNaN(n) ? 0 : n;
      };

      // mapeamento de colunas conforme sua planilha
      const dados = linhasValidas.map((row) => ({
        Obra: "SMF",
        Mes: row[1],

        // PRAZO SOL × PEDIDO (Meta / Real / %)
        PrazoSolPedidoMeta: num(row[3]),
        PrazoSolPedido: num(row[4]),
        PrazoSolPedidoPerc: num(row[5]),

        // PRAZO SOL × ENTREGA (Meta / Real / %)
        PrazoSolEntregaMeta: num(row[6]),
        PrazoSolEntrega: num(row[7]),
        PrazoSolEntregaPerc: num(row[8]),

        // Indicadores (com tolerância de 1 coluna)
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

  const obras = ["SMF"]; // ajuste se vierem outras obras
  const meses = ["Todos", ...new Set(data.map((d) => d.Mes))];

  const filtrados = data.filter(
    (d) =>
      (obraSelecionada === "Todas" || d.Obra === obraSelecionada) &&
      (mesSelecionado === "Todos" || d.Mes === mesSelecionado)
  );

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

      {/* Tabela */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Obra</th>
              <th>Mês</th>
              <th>Prazo Sol. × Pedido</th>
              <th>% Pedido</th>
              <th>Prazo Sol. × Entrega</th>
              <th>% Entrega</th>
              <th>Pontualidade</th>
              <th>Nível de Ruptura</th>
              <th>% Negociação</th>
              <th>Estoque</th>
              <th>Avaliação</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((d, i) => (
              <tr key={i}>
                <td>{d.Obra}</td>
                <td>{d.Mes}</td>
                <td>{d.PrazoSolPedido}</td>
                <td>{d.PrazoSolPedidoPerc}%</td>
                <td>{d.PrazoSolEntrega}</td>
                <td>{d.PrazoSolEntregaPerc}%</td>
                <td>{d.Pontualidade}%</td>
                <td>{d.NivelRuptura}%</td>
                <td>{d.Negociacao}%</td>
                <td>{d.Estoque}%</td>
                <td>{d.Avaliacao}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gráficos */}
      <div className="compras-charts">
        <ComprasCharts data={filtrados} />
      </div>
    </div>
  );
}
