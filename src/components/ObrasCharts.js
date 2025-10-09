import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export default function ObrasCharts({ data, blocoKey, blocoTitle }) {
  if (!data?.length || !blocoKey) return null;

  // prepara dados para os gráficos
  const chartData = data.map((d) => ({
    Mes: d.Mes,
    Meta: Number(d[`${blocoKey}__meta`] || 0),
    Real: Number(d[`${blocoKey}__real`] || 0),
    Desvio: Number(d[`${blocoKey}__desvio`] || 0),
  }));

  return (
    <div className="obras-charts-grid">
      <div className="chart-card">
        <h3>Meta × Real — {blocoTitle}</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Mes" />
            <YAxis />
            <Tooltip formatter={(val, name) =>
              name === "Desvio" ? [`${val.toFixed(2)}%`, name] :
              [val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }), name]
            }/>
            <Legend />
            <Line type="monotone" dataKey="Meta" name="Meta (R$)" stroke="#0a58ca" dot />
            <Line type="monotone" dataKey="Real" name="Real (R$)" stroke="#dc3545" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Desvio (%) por mês — {blocoTitle}</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Mes" />
            <YAxis />
            <Tooltip formatter={(val) => [`${Number(val).toFixed(2)}%`, "Desvio (%)"]} />
            <Legend />
            <Bar dataKey="Desvio" name="Desvio (%)" fill="#198754" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
