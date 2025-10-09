import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

export default function ComprasCharts({ data }) {
  if (!data || data.length === 0)
    return <p className="chart-empty">Sem dados disponíveis.</p>;

  const medias = {
    Pontualidade:
      data.reduce((s, d) => s + (d.Pontualidade || 0), 0) / data.length,
    NivelRuptura:
      data.reduce((s, d) => s + (d.NivelRuptura || 0), 0) / data.length,
    Negociacao:
      data.reduce((s, d) => s + (d.Negociacao || 0), 0) / data.length,
    Estoque: data.reduce((s, d) => s + (d.Estoque || 0), 0) / data.length,
    Avaliacao: data.reduce((s, d) => s + (d.Avaliacao || 0), 0) / data.length,
  };

  const radarData = Object.entries(medias).map(([indicador, valor]) => ({
    indicador,
    valor,
  }));

  return (
    <div className="compras-charts-grid">
      {/* Pontualidade x Ruptura */}
      <div className="chart-card">
        <h3>Pontualidade × Nível de Ruptura</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Pontualidade" name="Pontualidade (%)" stroke="#0d6efd" />
            <Line type="monotone" dataKey="NivelRuptura" name="Ruptura (%)" stroke="#dc3545" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* % Negociação por mês */}
      <div className="chart-card">
        <h3>% de Negociação por Mês</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Negociacao" name="Negociação (%)" fill="#198754" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar médio */}
      <div className="chart-card">
        <h3>Desempenho Médio por Indicador</h3>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="indicador" />
            <PolarRadiusAxis />
            <Radar name="Média" dataKey="valor" stroke="#0a58ca" fill="#0a58ca" fillOpacity={0.6} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
