import React from "react";
import { useBudgetData } from "../hooks/useBudgetData";
import {
  ResponsiveContainer,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar,
} from "recharts";
import "./Budget.css";

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

export default function BudgetDashboard() {
  const { months, loading, valueAt } = useBudgetData();
  const [mes, setMes] = React.useState(null);

  React.useEffect(() => {
    if (months?.length) setMes(months[0]); // começa no primeiro mês disponível
  }, [months]);

  // KPIs no mês selecionado
  const receitaLiquida = React.useMemo(() => valueAt("receita_liquida", mes), [mes, valueAt]);
  const custosTotais   = React.useMemo(() => valueAt("custos_totais", mes), [mes, valueAt]);
  const despesasAdm    = React.useMemo(() => valueAt("despesas_adm", mes), [mes, valueAt]);
  const despesasCom    = React.useMemo(() => valueAt("despesas_comercial", mes), [mes, valueAt]);
  const despesasLog    = React.useMemo(() => valueAt("despesas_logistica", mes), [mes, valueAt]);
  const ebitda         = React.useMemo(() => valueAt("ebitda", mes), [mes, valueAt]);
  const lucroOper      = React.useMemo(() => valueAt("lucro_operacional", mes), [mes, valueAt]);
  const lucroBruto     = React.useMemo(() => valueAt("lucro_bruto", mes), [mes, valueAt]);

  const despesasOp = despesasAdm + despesasCom + despesasLog;

  // Série de linha: principais contas por mês
  const linhas = React.useMemo(() => {
    return months.map((m) => ({
      mes: m.toUpperCase(),
      "Receita Líquida": valueAt("receita_liquida", m),
      "Custos Totais": valueAt("custos_totais", m),
      EBITDA: valueAt("ebitda", m),
      "Lucro Oper. (EBIT)": valueAt("lucro_operacional", m),
    }));
  }, [months, valueAt]);

  // Barras: despesas por grupo no mês selecionado
  const barrasDespesas = React.useMemo(() => ([
    { nome: "Adm",      valor: despesasAdm },
    { nome: "Comercial",valor: despesasCom },
    { nome: "Logística",valor: despesasLog },
  ]), [despesasAdm, despesasCom, despesasLog]);

  if (loading) return <div className="budget-loading">Carregando Budget...</div>;
  if (!months?.length) return <div className="budget-loading">Não encontrei meses válidos no CSV do Budget.</div>;

  return (
    <div className="budget-page">
      <header className="budget-header">
        <h1>Budget</h1>
        <div className="right">
          <label>Competência</label>
          <select value={mes || ""} onChange={(e) => setMes(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>{m.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Cards */}
      <section className="budget-cards">
        <div className="card">
          <h4>Receita Líquida (Orçado)</h4>
          <div className="val">{money(receitaLiquida)}</div>
        </div>
        <div className="card">
          <h4>Custos Totais</h4>
          <div className="val">{money(custosTotais)}</div>
        </div>
        <div className="card">
          <h4>Despesas Operacionais</h4>
          <div className="val">{money(despesasOp)}</div>
        </div>
        <div className="card">
          <h4>EBITDA</h4>
          <div className="val">{money(ebitda)}</div>
        </div>
        <div className="card">
          <h4>Lucro Operacional (EBIT)</h4>
          <div className="val">{money(lucroOper)}</div>
        </div>
        <div className="card">
          <h4>Lucro Bruto</h4>
          <div className="val">{money(lucroBruto)}</div>
        </div>
      </section>

      {/* Gráficos */}
      <section className="budget-grid">
        <div className="panel">
          <h3>Evolução — Receita, Custos, EBITDA, EBIT</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={linhas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Line type="monotone" dataKey="Receita Líquida" stroke="#22c55e" dot />
              <Line type="monotone" dataKey="Custos Totais" stroke="#ef4444" dot />
              <Line type="monotone" dataKey="EBITDA" stroke="#3b82f6" dot />
              <Line type="monotone" dataKey="Lucro Oper. (EBIT)" stroke="#8b5cf6" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Despesas por Grupo — {mes?.toUpperCase()}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barrasDespesas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="valor" fill="#a78bfa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
