// src/components/ComprasCharts.jsx
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Brush,
  Cell, // << IMPORTANTE para cores por barra
} from "recharts";

const MONTHS_ORDER = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

// paleta
const COLORS = {
  meta: "#cd26a3ff",
  real: "#0969da",
  realGood: "#1a7f37",
  realBad: "#d1242f",
  grid: "#e5e7eb",
};

const fmtInt0 = (v) => (Number(v) || 0).toLocaleString("pt-BR");
const fmtPct1 = (v) => `${(Number(v) || 0).toFixed(1)}%`;

const BLOCS = [
  {
    key: "prazo_pedido",
    label: "Prazo Médio — Sol × Pedido",
    fields: { meta: "prazo_pedido_meta", real: "prazo_pedido_real", perc: "prazo_pedido_perc" },
    unit: "dias",
    better: "lower",
  },
  {
    key: "prazo_entrega",
    label: "Prazo Médio — Sol × Entrega (lead time)",
    fields: { meta: "prazo_entrega_meta", real: "prazo_entrega_real", perc: "prazo_entrega_perc" },
    unit: "dias",
    better: "lower",
  },
  {
    key: "pontualidade",
    label: "Pontualidade — entrega fornecedor",
    fields: { meta: "pontualidade_meta", real: "pontualidade_real", perc: "pontualidade_perc" },
    unit: "%",       // valores em percentuais
    better: "higher"
  },
  {
    key: "negociacao",
    label: "% Negociação (orçamento × pedido)",
    fields: { meta: "negociacao_meta", real: "negociacao_real", perc: "negociacao_perc" },
    unit: "%",
    better: "higher"
  },
];

const buildMonthSkeleton = () => MONTHS_ORDER.map((m) => ({ Mes: m }));

export default function ComprasCharts({ data }) {
  const [bloco, setBloco] = useState(BLOCS[0].key);
  const [view, setView] = useState("valores"); // "valores" | "percent"
  const [chartKind, setChartKind] = useState("area"); // "area" | "line" | "bar" (para 'valores')

  const bloc = BLOCS.find((b) => b.key === bloco) || BLOCS[0];

  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const byMes = new Map(data.map((d) => [String(d.Mes || d.mes || "").toUpperCase(), d]));

    return buildMonthSkeleton().map((row) => {
      const src = byMes.get(row.Mes) || {};
      const meta = Number(src[bloc.fields.meta]) || 0;
      const real = Number(src[bloc.fields.real]) || 0;
      const perc = Number(src[bloc.fields.perc]) || 0;
      const good =
        bloc.better === "lower" ? real !== 0 && meta !== 0 && real <= meta
        : bloc.better === "higher" ? real !== 0 && meta !== 0 && real >= meta
        : false;

      return { Mes: row.Mes, meta, real, perc, good, delta: real - meta };
    });
  }, [data, bloc]);

  if (!chartData.length) return null;

  // formatadores para “valores”
  const yFmtValores = bloc.unit === "%" ? fmtPct1 : fmtInt0;
  const tooltipFmtValores = (value, name) =>
    bloc.unit === "%" ? [fmtPct1(value), name] : [fmtInt0(value), name];

  const ValoresArea = (
    <AreaChart data={chartData} margin={{ top: 12, right: 20, left: 4, bottom: 0 }}>
      <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
      <XAxis dataKey="Mes" />
      <YAxis tickFormatter={yFmtValores} />
      <Tooltip formatter={tooltipFmtValores} labelFormatter={(m) => `Mês: ${m}`} contentStyle={{ borderRadius: 10 }} />
      <Legend />
      <Line type="monotone" dataKey="meta" name="Meta" stroke={COLORS.meta} strokeWidth={2} dot={false} />
      <Area type="monotone" dataKey="real" name="Real" stroke={COLORS.real} fillOpacity={0.2} fill={COLORS.real} activeDot={{ r: 4 }} />
      {bloc.unit !== "%" && <ReferenceLine y={0} stroke="#aaa" />}
      <Brush dataKey="Mes" height={18} stroke={COLORS.meta} travellerWidth={10} />
    </AreaChart>
  );

  const ValoresLine = (
    <LineChart data={chartData} margin={{ top: 12, right: 20, left: 4, bottom: 0 }}>
      <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
      <XAxis dataKey="Mes" />
      <YAxis tickFormatter={yFmtValores} />
      <Tooltip formatter={tooltipFmtValores} labelFormatter={(m) => `Mês: ${m}`} contentStyle={{ borderRadius: 10 }} />
      <Legend />
      <Line type="monotone" dataKey="meta" name="Meta" stroke={COLORS.meta} strokeWidth={2} dot={false} />
      <Line type="monotone" dataKey="real" name="Real" stroke={COLORS.real} strokeWidth={2} />
      {bloc.unit !== "%" && <ReferenceLine y={0} stroke="#aaa" />}
      <Brush dataKey="Mes" height={18} stroke={COLORS.meta} travellerWidth={10} />
    </LineChart>
  );

  const ValoresBar = (
    <BarChart data={chartData} margin={{ top: 12, right: 20, left: 4, bottom: 0 }}>
      <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
      <XAxis dataKey="Mes" />
      <YAxis tickFormatter={yFmtValores} />
      <Tooltip formatter={tooltipFmtValores} labelFormatter={(m) => `Mês: ${m}`} contentStyle={{ borderRadius: 10 }} />
      <Legend />
      <Bar dataKey="meta" name="Meta" fill={COLORS.meta} />
      <Bar dataKey="real" name="Real">
        {chartData.map((d, idx) => (
          <Cell key={`vr-${idx}`} fill={d.good ? COLORS.realGood : COLORS.realBad} />
        ))}
      </Bar>
      <Brush dataKey="Mes" height={18} stroke={COLORS.meta} travellerWidth={10} />
    </BarChart>
  );

  const renderValores = () => {
    if (chartKind === "line") return ValoresLine;
    if (chartKind === "bar") return ValoresBar;
    return ValoresArea; // default
  };

  const renderPercent = () => (
    <BarChart data={chartData} margin={{ top: 12, right: 20, left: 4, bottom: 0 }}>
      <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
      <XAxis dataKey="Mes" />
      <YAxis tickFormatter={fmtPct1} domain={[0, (dataMax) => Math.max(100, Math.ceil(dataMax / 10) * 10)]} />
      <Tooltip formatter={(v) => fmtPct1(v)} labelFormatter={(m) => `Mês: ${m}`} contentStyle={{ borderRadius: 10 }} />
      <Legend />
      <Bar dataKey="perc" name="%">
        {chartData.map((d, idx) => (
          <Cell
            key={`pc-${idx}`}
            fill={
              bloc.better === "higher"
                ? d.perc >= 100 ? COLORS.realGood : COLORS.realBad
                : d.perc <= 100 ? COLORS.realGood : COLORS.realBad
            }
          />
        ))}
      </Bar>
      <ReferenceLine y={100} label="Meta 100%" stroke={COLORS.meta} strokeDasharray="4 4" />
      <Brush dataKey="Mes" height={18} stroke={COLORS.meta} travellerWidth={10} />
    </BarChart>
  );

  return (
    <div className="compras-charts-card" style={{ marginTop: 16 }}>
      <div
        className="compras-charts-toolbar"
        style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}
      >
        <strong>Gráfico:</strong>
       <div className="select-wrap">
  <select
    className="select-ghost"
    value={bloco}
    onChange={(e) => setBloco(e.target.value)}
    aria-label="Selecionar gráfico"
  >
    {BLOCS.map((b) => (
      <option key={b.key} value={b.key}>{b.label}</option>
    ))}
  </select>
</div>


        {/* seletor do tipo de gráfico só quando estamos em "valores" */}
        {view === "valores" && (
          <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
            <button
              className={chartKind === "area" ? "chip chip-on" : "chip"}
              onClick={() => setChartKind("area")}
              title="Área (Meta × Real)"
            >
              Área
            </button>
            <button
              className={chartKind === "line" ? "chip chip-on" : "chip"}
              onClick={() => setChartKind("line")}
              title="Linhas (Meta × Real)"
            >
              Linha
            </button>
            <button
              className={chartKind === "bar" ? "chip chip-on" : "chip"}
              onClick={() => setChartKind("bar")}
              title="Colunas (Meta × Real)"
            >
              Coluna
            </button>
          </div>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            className={view === "valores" ? "chip chip-on" : "chip"}
            onClick={() => setView("valores")}
            title={bloc.unit === "%" ? "Meta × Real em %" : `Meta × Real em ${bloc.unit}`}
          >
            Valores
          </button>
          <button
            className={view === "percent" ? "chip chip-on" : "chip"}
            onClick={() => setView("percent")}
            title="% do atingimento no mês"
          >
            %
          </button>
        </div>
      </div>

      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          {view === "valores" ? renderValores() : renderPercent()}
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
        {bloc.better === "lower"
          ? "Verde = dentro da meta (menor é melhor)."
          : "Verde = dentro da meta (maior é melhor)."}
      </div>
    </div>
  );
}
