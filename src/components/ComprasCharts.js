// src/components/ComprasCharts.jsx
import React, { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

export default function ComprasCharts({ data }) {
  const safeData = Array.isArray(data) ? data : [];

  const pontualidadeRuptura = useMemo(() => (
    safeData.map(d => ({
      Mes: d.Mes,
      Pontualidade: Number(d.Pontualidade ?? 0),
      NivelRuptura: Number(d.NivelRuptura ?? 0),
    }))
  ), [safeData]);

  const negociacaoMes = useMemo(() => (
    safeData.map(d => ({
      Mes: d.Mes,
      Negociacao: Number(d.Negociacao ?? 0),
    }))
  ), [safeData]);

  const radarData = useMemo(() => {
    if (!safeData.length) return [];
    const medias = {
      Pontualidade: safeData.reduce((s, d) => s + (Number(d.Pontualidade) || 0), 0) / safeData.length,
      NivelRuptura: safeData.reduce((s, d) => s + (Number(d.NivelRuptura) || 0), 0) / safeData.length,
      Negociacao:  safeData.reduce((s, d) => s + (Number(d.Negociacao)  || 0), 0) / safeData.length,
      Estoque:     safeData.reduce((s, d) => s + (Number(d.Estoque)     || 0), 0) / safeData.length,
      Avaliacao:   safeData.reduce((s, d) => s + (Number(d.Avaliacao)   || 0), 0) / safeData.length,
    };
    return Object.entries(medias).map(([indicador, valor]) => ({
      indicador,
      valor: Number(valor.toFixed(2)),
    }));
  }, [safeData]);

  // Meta x Real – Prazo Sol. x Pedido
  const prazoPedidoMR = useMemo(() => (
    safeData.map(d => ({
      Mes: d.Mes,
      Meta: Number(d.PrazoSolPedidoMeta ?? 0),
      Real: Number(d.PrazoSolPedidoReal ?? 0), // <- aqui
    }))
  ), [safeData]);

  // Meta x Real – Prazo Sol. x Entrega
  const prazoEntregaMR = useMemo(() => (
    safeData.map(d => ({
      Mes: d.Mes,
      Meta: Number(d.PrazoSolEntregaMeta ?? 0),
      Real: Number(d.PrazoSolEntregaReal ?? 0), // <- aqui
    }))
  ), [safeData]);

  const noData = !safeData.length;

  return (
    <div className="charts-grid">
      <div className="card">
        <h3 className="card-title">Pontualidade × Nível de Ruptura</h3>
        <div className="chart-wrap">
          {noData ? <p className="chart-empty">Sem dados disponíveis.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pontualidadeRuptura}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Mes" /><YAxis /><Tooltip /><Legend />
                <Line type="monotone" dataKey="Pontualidade" name="Pontualidade (%)" stroke="#0d6efd" dot={false} />
                <Line type="monotone" dataKey="NivelRuptura"  name="Ruptura (%)"       stroke="#dc3545" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">% de Negociação por Mês</h3>
        <div className="chart-wrap">
          {noData ? <p className="chart-empty">Sem dados disponíveis.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={negociacaoMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Mes" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="Negociacao" name="Negociação (%)" fill="#198754" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Meta × Real — Prazo Sol. × Pedido (dias)</h3>
        <div className="chart-wrap">
          {noData ? <p className="chart-empty">Sem dados disponíveis.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prazoPedidoMR}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Mes" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="Meta" fill="#93c5fd" name="Meta (dias)" />
                <Bar dataKey="Real" fill="#1d4ed8" name="Real (dias)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Meta × Real — Prazo Sol. × Entrega (dias)</h3>
        <div className="chart-wrap">
          {noData ? <p className="chart-empty">Sem dados disponíveis.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prazoEntregaMR}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Mes" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="Meta" fill="#fde68a" name="Meta (dias)" />
                <Bar dataKey="Real" fill="#f59e0b" name="Real (dias)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Desempenho Médio por Indicador</h3>
        <div className="chart-wrap">
          {noData ? <p className="chart-empty">Sem dados disponíveis.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="indicador" />
                <PolarRadiusAxis />
                <Radar name="Média" dataKey="valor" stroke="#0a58ca" fill="#0a58ca" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
