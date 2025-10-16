import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  ComposedChart,
} from "recharts";

const META_COLOR = "#16a34a"; // verde
const REAL_COLOR = "#dc2626"; // vermelho
const GAP_POS = "#dc2626";    // gap acima da meta
const GAP_NEG = "#16a34a";    // gap abaixo da meta

const moneyFmt = (val) =>
  Number(val).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });

const pctFmt = (v) => `${(Number(v) || 0).toFixed(1)}%`;

export default function ObrasCharts({ data, blocoKey, blocoTitle }) {
  const isValorMeta = blocoKey === "valor_meta";

  const chartData = useMemo(() => {
    if (!data?.length || !blocoKey) return [];
    return data.map((d) => ({
      Mes: d.Mes,
      Meta: Number(d[`${blocoKey}__meta`] || 0),
      Real: Number(d[`${blocoKey}__real`] || 0),
    }));
  }, [data, blocoKey]);

  const chartDataAcum = useMemo(() => {
    let accMeta = 0, accReal = 0;
    return chartData.map((it) => {
      accMeta += it.Meta || 0;
      accReal += it.Real || 0;
      return { Mes: it.Mes, MetaAcum: accMeta, RealAcum: accReal };
    });
  }, [chartData]);

  // evolução do custo: só quando o bloco = "custo"
  const evolucaoCusto = useMemo(() => {
    if (!data?.length) return [];
    const serie = data.map((d) => ({
      Mes: d.Mes,
      Meta: Number(d["custo__meta"] || 0),
      Real: Number(d["custo__real"] || 0),
    }));
    let wnd = [];
    return serie.map((p) => {
      wnd.push(p.Real);
      if (wnd.length > 3) wnd.shift();
      const mm3 = wnd.reduce((a, b) => a + b, 0) / wnd.length;
      const gap = (p.Real || 0) - (p.Meta || 0);
      return {
        Mes: p.Mes,
        Meta: p.Meta,
        Real: p.Real,
        TrendRealMM3: mm3,
        GapPos: gap > 0 ? gap : 0,
        GapNeg: gap < 0 ? Math.abs(gap) : 0,
      };
    });
  }, [data]);

  if (!data?.length || !blocoKey) return null;

  // formatadores condicionais (R$ x %)
  const yTick = (v) => (isValorMeta ? `${Number(v).toFixed(0)}%` : moneyFmt(v));
  const tooltipFmt = (val, name) => (isValorMeta ? [pctFmt(val), name] : [moneyFmt(val), name]);

  const labelMetaMensal = isValorMeta ? "Meta (%)" : "Meta (R$)";
  const labelRealMensal = isValorMeta ? "Real (%)" : "Real (R$)";
  const labelMetaAcum   = isValorMeta ? "Meta acumulada (%)" : "Meta acumulada (R$)";
  const labelRealAcum   = isValorMeta ? "Real acumulado (%)" : "Real acumulado (R$)";

  return (
    <div className="obras-charts-grid">
      {/* 1) Mensal */}
      <div className="chart-card">
        <h3>Meta × Real (Mensal) — {blocoTitle}</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Mes" />
            <YAxis tickFormatter={yTick} width={80} />
            <Tooltip formatter={tooltipFmt} labelFormatter={(l) => `${l}`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Meta"
              name={labelMetaMensal}
              stroke={META_COLOR}
              strokeWidth={2}
              dot
            />
            <Line
              type="monotone"
              dataKey="Real"
              name={labelRealMensal}
              stroke={REAL_COLOR}
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2) Acumulado */}
      <div className="chart-card">
        <h3>Meta × Real (Acumulado — Geral) — {blocoTitle}</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartDataAcum}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Mes" />
            <YAxis tickFormatter={yTick} width={80} />
            <Tooltip formatter={tooltipFmt} labelFormatter={(l) => `${l}`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="MetaAcum"
              name={labelMetaAcum}
              stroke={META_COLOR}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="RealAcum"
              name={labelRealAcum}
              stroke={REAL_COLOR}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 3) Evolução do Custo (tendência + gap) */}
      {blocoKey === "custo" && (
        <div className="chart-card">
          <h3>Evolução do Custo da Obra — Tendência e Gap</h3>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={evolucaoCusto}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Mes" />
              <YAxis tickFormatter={moneyFmt} width={90} />
              <Tooltip
                formatter={(v, n) =>
                  [moneyFmt(v), n === "GapPos" ? "Gap acima da meta" : n === "GapNeg" ? "Gap abaixo da meta" : n]
                }
              />
              <Legend />
              {/* barras do gap (positivo/negativo) */}
              <Bar dataKey="GapPos" name="Gap acima da meta" fill={GAP_POS} />
              <Bar dataKey="GapNeg" name="Gap abaixo da meta" fill={GAP_NEG} />
              {/* linhas */}
              <Line type="monotone" dataKey="Meta" name="Meta (R$)" stroke={META_COLOR} strokeWidth={2} dot />
              <Line type="monotone" dataKey="Real" name="Real (R$)" stroke={REAL_COLOR} strokeWidth={2} dot />
              <Line
                type="monotone"
                dataKey="TrendRealMM3"
                name="Real — tendência (MM3)"
                stroke={REAL_COLOR}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
