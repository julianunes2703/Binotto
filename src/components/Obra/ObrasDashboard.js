import React, { useEffect, useMemo, useState } from "react";
import { useObrasData } from "../../hooks/useObrasData";
import "./ObrasDashboard.css";
import ObrasCharts from "./ObrasCharts";

// ⚠️ confirme se o gid é da ABA que contém os meses (ex.: "AdmFin")
const OBRAS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTz9AkwLQwYaPebCoz8dWo_EE6ov9rKL5PclC0O4YoEefkocNBkiyIIS8Gt2lY9fA/pub?gid=72467004&single=true&output=csv";

// reduz títulos compridos nos chips
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

// formatações
const fmtMoney = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
const fmtPct = (v) => `${(Number(v) || 0).toFixed(1)}%`;
const pctDiff = (real, meta) =>
  meta ? ((Number(real) - Number(meta)) / Number(meta)) * 100 : 0;

export default function ObrasDashboard() {
  // hook de obras (estrutura multi-linha)
  const { loading, error, rows, months } = useObrasData(OBRAS_CSV_URL);

  // Seleções
  const [obraSelecionada, setObraSelecionada] = useState("SMF"); // há 1 obra na aba atual
  const [mesSelecionado, setMesSelecionado] = useState("Todos");

  // Definição dos blocos (como extrair meta/real/desvio a partir das chaves do hook)
  // fmt: "money" -> meta/real R$; desvio em %
  //      "percent" -> meta/real em %; desvio = diferença (p.p.)
  const blocksInfo = useMemo(
    () => [
      {
        key: "indicador",
        title: "Indicador de Produção",
        fmt: "money",
        get: (r) => ({
          meta: r.indicador_meta_rs,
          real: r.indicador_real_rs,
          desvio: pctDiff(r.indicador_real_rs, r.indicador_meta_rs),
        }),
      },
      {
        key: "medido",
        title: "Medido - Realizado obra",
        fmt: "money",
        get: (r) => ({
          meta: r.medido_meta,
          real: r.medido_valor,
          desvio: pctDiff(r.medido_valor, r.medido_meta),
        }),
      },
      {
        key: "valor_meta",
        title: "Valor referente à Meta",
        fmt: "percent",
        get: (r) => ({
          meta: r.valor_meta_pct,
          real: r.valor_real_pct,
          desvio: (Number(r.valor_real_pct) || 0) - (Number(r.valor_meta_pct) || 0),
        }),
      },
      {
        key: "contrato",
        title: "Valor Contrato — Adt 3 + Reajuste — Comprometido SIENGE",
        fmt: "money",
        get: (r) => ({
          meta: r.contrato_nfrecfat,
          real: r.contrato_med,
          desvio: Number(r.contrato_perc) || 0, // já vem em %
        }),
      },
      {
        key: "custo",
        title: "Custo da Obra",
        fmt: "money",
        get: (r) => ({
          meta: r.custo_meta_rs,
          real: r.custo_real_rs,
          desvio: Number(r.custo_perc) || 0, // já vem em %
        }),
      },
    ],
    []
  );

  // Converte rows do hook para o formato da tabela/gráfico
  const data = useMemo(() => {
    if (!rows?.length) return [];
    return rows.map((r) => {
      const base = {
        Obra: obraSelecionada,
        Mes: String(r.mes || "").toUpperCase(),
      };
      blocksInfo.forEach((b) => {
        const { meta, real, desvio } = b.get(r);
        base[`${b.key}__meta`] = Number(meta) || 0;
        base[`${b.key}__real`] = Number(real) || 0;
        base[`${b.key}__desvio`] = Number(desvio) || 0;
      });
      return base;
    });
  }, [rows, obraSelecionada, blocksInfo]);

  // chips e gráfico ativo (seleção exclusiva)
  const [visiveis, setVisiveis] = useState([]);
  const [chartBlocoKey, setChartBlocoKey] = useState(null);

  useEffect(() => {
    if (!blocksInfo.length) return;
    setVisiveis([blocksInfo[0].key]);
    setChartBlocoKey(blocksInfo[0].key);
  }, [blocksInfo]);

  const handleChipClick = (key) => {
    setVisiveis([key]);
    setChartBlocoKey(key);
  };

  const blocosAtivos = useMemo(
    () => blocksInfo.filter((b) => visiveis.includes(b.key)),
    [blocksInfo, visiveis]
  );

  const meses = useMemo(
    () => ["Todos", ...(months || []).map((m) => m.toUpperCase())],
    [months]
  );

  // aplica filtros (obra é única, mas mantém compatibilidade)
  const filtrados = useMemo(() => {
    if (!data?.length) return [];
    return data.filter(
      (d) =>
        (obraSelecionada === "Todas" || d.Obra === obraSelecionada) &&
        (mesSelecionado === "Todos" || d.Mes === mesSelecionado)
    );
  }, [data, obraSelecionada, mesSelecionado]);

  // formatação condicional para meta/real conforme bloco
  const fmtValue = (v, fmt) => (fmt === "percent" ? fmtPct(v) : fmtMoney(v));

  if (loading) return <p className="loading">Carregando dados...</p>;
  if (error) return <p style={{ color: "crimson" }}>Erro ao carregar dados.</p>;
  if (!rows?.length) return <p>Nenhum dado encontrado.</p>;

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
            <option value="SMF">Sefaz</option>
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
        {blocksInfo.map((b) => {
          const on = visiveis.includes(b.key);
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
            {/* Linha 1: grupos */}
            <tr>
              <th className="sticky-col">Mês</th>
              {blocosAtivos.map((b) => (
                <th key={`${b.key}-grp`} colSpan={3} className="grp-title">
                  {abreviarTitulo(b.title)}
                </th>
              ))}
            </tr>

            {/* Linha 2: subtítulos */}
            <tr>
              <th className="sticky-col"></th>
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
                <td className="sticky-col">{row.Mes}</td>
                {blocosAtivos.map((b) => {
                  const meta = row[`${b.key}__meta`];
                  const real = row[`${b.key}__real`];
                  const desvio = row[`${b.key}__desvio`];

                  // cor: >0 positivo, <0 negativo (inverta se seu critério for outro)
                  const cls =
                    (desvio ?? 0) > 0
                      ? "positivo"
                      : (desvio ?? 0) < 0
                      ? "negativo"
                      : "";

                  return (
                    <React.Fragment key={`${i}-${b.key}`}>
                      <td className="num">{fmtValue(meta, b.fmt)}</td>
                      <td className="num">{fmtValue(real, b.fmt)}</td>
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
                blocksInfo.find((b) => b.key === chartBlocoKey)?.title || ""
              )
            }
          />
        )}
      </div>
    </div>
  );
}
