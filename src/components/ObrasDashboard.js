import React, { useEffect, useMemo, useState } from "react";
import { useObrasData } from "../hooks/useObrasData";
import "./ObrasDashboard.css";
import ObrasCharts from "./ObrasCharts";

const abreviarTitulo = (t) =>
  String(t)
    .replace(/\s{2,}/g, " ")
    .replace(/\(.*?\)/g, "")
    .replace(/comprometido/gi, "Comprom.")
    .replace(/reajuste/gi, "Reaj.")
    .replace(/valor contrato/gi, "Contrato")
    .replace(/medido|realizado/gi, "Medido")
    .replace(/m[aã]o de obra/gi, "Mão de Obra")
    .trim();

export default function ObrasDashboard() {
  const { data, blocksInfo, loading } = useObrasData();
  const [obraSelecionada, setObraSelecionada] = useState("SMF");
  const [mesSelecionado, setMesSelecionado] = useState("Todos");

  // visíveis (na versão exclusiva sempre terá 1)
  const [visiveis, setVisiveis] = useState([]);
  // bloco selecionado para os gráficos
  const [chartBlocoKey, setChartBlocoKey] = useState(null);


  // inicializa quando os blocos chegam: deixa só o 1º ativo
  useEffect(() => {
    if ((blocksInfo?.length || 0) > 0 && visiveis.length === 0) {
      const first = blocksInfo[0].key;
      setVisiveis([first]);
      setChartBlocoKey(first);
    }
  }, [blocksInfo, visiveis.length]);

  // seleção EXCLUSIVA: sempre apenas 1 chip
  const handleChipClick = (key: string) => {
    setVisiveis([key]);
    setChartBlocoKey(key);
  };

  const blocosAtivos = useMemo(
    () => (blocksInfo || []).filter((b) => visiveis.includes(b.key)),
    [blocksInfo, visiveis]
  );

  const meses = useMemo(() => {
    if (!data || data.length === 0) return ["Todos"];
    return ["Todos", ...new Set(data.map((d) => d.Mes))];
  }, [data]);

  const filtrados = useMemo(() => {
    if (!data) return [];
    return data.filter(
      (d) =>
        (obraSelecionada === "Todas" || d.Obra === obraSelecionada) &&
        (mesSelecionado === "Todos" || d.Mes === mesSelecionado)
    );
  }, [data, obraSelecionada, mesSelecionado]);

  const fmtMoney = (v: number) =>
    (v ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    });

  const fmtPct = (v: number) => `${(Number(v) || 0).toFixed(2)}%`;

  if (loading) return <p className="loading">Carregando dados...</p>;
  if (!data || data.length === 0) return <p>Nenhum dado encontrado.</p>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Painel de Obras</h1>
        <p>Acompanhe metas, realizados e desvios</p>
      </header>

      {/* Filtros */}
      <div className="filters">
        <div className="filter">
          <label>Obra:</label>
          <select
            value={obraSelecionada}
            onChange={(e) => setObraSelecionada(e.target.value)}
          >
            <option value="SMF">SMF</option>
          </select>
        </div>
        <div className="filter">
          <label>Mês:</label>
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
          >
            {meses.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chips (seleção exclusiva) */}
      <div className="blocos-toolbar">
        {(blocksInfo || []).map((b) => {
          const on = visiveis.includes(b.key); // só 1 ficará true
          const active = chartBlocoKey === b.key;
          return (
            <button
              key={b.key}
              className={`chip ${on ? "chip-on" : ""} ${
                active ? "chip-active" : ""
              }`}
              onClick={() => handleChipClick(b.key)}
              title={b.title}
            >
              {abreviarTitulo(b.title)}
            </button>
          );
        })}
      </div>

      {/* Tabela com header agrupado */}
      <div className="table-container wide-scroll">
        <table className="obras-table">
          <thead>
            <tr>
              <th className="sticky-col">Obra</th>
              <th className="sticky-col second">Mês</th>
              {blocosAtivos.map((b) => (
                <th key={`${b.key}-grp`} colSpan={3} className="grp-title">
                  {abreviarTitulo(b.title)}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky-col"></th>
              <th className="sticky-col second"></th>
              {blocosAtivos.map((b) => (
                <React.Fragment key={`${b.key}-subs`}>
                  <th>Meta</th>
                  <th>Real</th>
                  <th>Desvio</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtrados.map((row, i) => (
              <tr key={i}>
                <td className="sticky-col">{row.Obra}</td>
                <td className="sticky-col second">{row.Mes}</td>
                {blocosAtivos.map((b) => {
                  const meta = row[`${b.key}__meta`];
                  const real = row[`${b.key}__real`];
                  const desvio = row[`${b.key}__desvio`];
                  const cls =
                    (desvio ?? 0) > 0 ? "negativo" : (desvio ?? 0) < 0 ? "positivo" : "";
                  return (
                    <React.Fragment key={`${i}-${b.key}`}>
                      <td className="num">{fmtMoney(meta)}</td>
                      <td className="num">{fmtMoney(real)}</td>
                      <td className={`num ${cls}`}>{fmtPct(desvio)}</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gráficos do bloco selecionado */}
      <div style={{ marginTop: 18 }}>
        {chartBlocoKey && (
          <ObrasCharts
            data={filtrados}
            blocoKey={chartBlocoKey}
            blocoTitle={
              abreviarTitulo(
                (blocksInfo.find((b) => b.key === chartBlocoKey)?.title) || ""
              )
            }
          />
        )}
      </div>
    </div>
  );
}
