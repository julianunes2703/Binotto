// ObrasResumoModal.jsx — estático + semáforo + gráficos + comparativos (inclui "Meta - Total Gasto")
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";

/* ========================= Helpers ========================= */
const fmtBRL = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
const fmtPct = (v) => `${(Number(v) || 0).toFixed(1)}%`;
const fmtBRLmi = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2)} mi`;
  return fmtBRL(n);
};

/* ========================= Valores estáticos ========================= */
const VALORES = {
  nfrecfat: 3875507.94,   // F
  medComp: 3574873.40,    // G
  totalGasto: 7450381.34, // F + G
  meta: 7973304.65,       // E
  medido: 10631072.87,    // D
  orcamentoTotal: 12797444.88,
};

/* ========================= Cálculos ========================= */
// Folgas (>=0)
const FOLGA_META_MENOS_GASTO   = Math.max(VALORES.meta   - VALORES.totalGasto, 0);
const FOLGA_MEDIDO_MENOS_GASTO = Math.max(VALORES.medido - VALORES.totalGasto, 0);

// % de folga
const PCT_FOLGA_META   = VALORES.meta
  ? (FOLGA_META_MENOS_GASTO / VALORES.meta) * 100
  : 0;
const PCT_FOLGA_MEDIDO = VALORES.medido
  ? (FOLGA_MEDIDO_MENOS_GASTO / VALORES.medido) * 100
  : 0;

// % de consumo do orçamento
const PCT_CONSUMO_ORC = VALORES.orcamentoTotal
  ? (VALORES.totalGasto / VALORES.orcamentoTotal) * 100
  : 0;

/* ========================= Status (semáforo) ========================= */
const STATUS =
  VALORES.totalGasto <= VALORES.meta
    ? { label: "VERDE", bg: "#16a34a", fg: "#ffffff" }
    : VALORES.totalGasto <= VALORES.orcamentoTotal
    ? { label: "AMARELO", bg: "#f59e0b", fg: "#111827" }
    : { label: "VERMELHO", bg: "#ef4444", fg: "#ffffff" };

/* ========================= Dados dos gráficos ========================= */
const dataComparativo = [
  { nome: "NF/REC/FAT", valor: VALORES.nfrecfat },
  { nome: "MED", valor: VALORES.medComp },
  { nome: "Total Gasto", valor: VALORES.totalGasto },
  { nome: "META", valor: VALORES.meta },
  { nome: "Medido", valor: VALORES.medido },
  { nome: "Orçamento", valor: VALORES.orcamentoTotal },
];

const dataLinhaComparativo = [
  { nome: "Meta", valor: VALORES.meta },
  { nome: "Total Gasto", valor: VALORES.totalGasto },
  { nome: "Orçamento", valor: VALORES.orcamentoTotal },
];

/* ========================= UI ========================= */
function Card({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,.08)",
        minHeight: 70,
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{children}</div>
    </div>
  );
}

export default function ObrasResumoModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(980px, 92vw)",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 10px 30px rgba(0,0,0,.2)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Cabeçalho + badge */}
        <div
          style={{
            padding: 18,
            borderBottom: "1px solid #eef2f7",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0 }}>Resumo Geral</h2>
          <div
            title={`Total Gasto ${fmtBRL(VALORES.totalGasto)} | Meta ${fmtBRL(
              VALORES.meta
            )} | Orçamento ${fmtBRL(VALORES.orcamentoTotal)}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: STATUS.bg,
              color: STATUS.fg,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: STATUS.fg,
                opacity: 0.85,
              }}
            />
            {STATUS.label}
          </div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: 22 }}
          >
            ✕
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div style={{ padding: 18, overflowY: "auto" }}>
          {/* KPIs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: 12,
            }}
          >
            <Card title="NF/REC/FAT (F)">{fmtBRL(VALORES.nfrecfat)}</Card>
            <Card title="MED (G)">{fmtBRL(VALORES.medComp)}</Card>
            <Card title="Total Gasto (F + G)">{fmtBRL(VALORES.totalGasto)}</Card>

            <Card title="META (E)">{fmtBRL(VALORES.meta)}</Card>
            <Card title="Medido (D)">{fmtBRL(VALORES.medido)}</Card>
            <Card title="Orçamento total">{fmtBRL(VALORES.orcamentoTotal)}</Card>
          </div>

          {/* Comparativos */}
          <h3 style={{ marginTop: 16 }}>Comparativos</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: 12,
            }}
          >
            {/* 1) pedido explícito: Meta - Total Gasto */}
            <Card title="Meta - Total Gasto (folga)">
              {fmtBRL(FOLGA_META_MENOS_GASTO)} ({fmtPct(PCT_FOLGA_META)})
            </Card>

            {/* 2) Medido - Gasto */}
            <Card title="Medido - Gasto (folga)">
              {fmtBRL(FOLGA_MEDIDO_MENOS_GASTO)} ({fmtPct(PCT_FOLGA_MEDIDO)})
            </Card>

            {/* 3) Consumo do orçamento */}
            <Card title="Consumo do orçamento total">
              {fmtPct(PCT_CONSUMO_ORC)}
            </Card>
          </div>

          {/* Gráfico 1 — Barras: visão geral */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,.08)",
              padding: 10,
              marginTop: 14,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Comparativo geral (valores absolutos)
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dataComparativo} margin={{ left: 6, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" interval={0} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={fmtBRLmi} />
                <Tooltip
                  formatter={(v) => fmtBRL(v)}
                  labelFormatter={(l) => l}
                  wrapperStyle={{ outline: "none" }}
                />
                <Legend />
                <Bar dataKey="valor" name="Valor" barSize={28} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico 2 — Linha: Meta × Total Gasto × Orçamento */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,.08)",
              padding: 10,
              marginTop: 14,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Comparativo (linha): Meta × Total Gasto × Orçamento
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dataLinhaComparativo} margin={{ left: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={fmtBRLmi} />
                <Tooltip
                  formatter={(v) => fmtBRL(v)}
                  labelFormatter={(l) => l}
                  wrapperStyle={{ outline: "none" }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  name="Valor"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <ReferenceLine
                  y={VALORES.meta}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  label={{
                    value: `META ${fmtBRLmi(VALORES.meta)}`,
                    position: "right",
                    fill: "#3b82f6",
                  }}
                />
                <ReferenceLine
                  y={VALORES.orcamentoTotal}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `ORÇAMENTO ${fmtBRLmi(VALORES.orcamentoTotal)}`,
                    position: "right",
                    fill: "#ef4444",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
              Total Gasto: <b>{fmtBRL(VALORES.totalGasto)}</b> • Meta:{" "}
              <b>{fmtBRL(VALORES.meta)}</b> • Orçamento:{" "}
              <b>{fmtBRL(VALORES.orcamentoTotal)}</b> — Consumo:{" "}
              <b>{fmtPct(PCT_CONSUMO_ORC)}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
