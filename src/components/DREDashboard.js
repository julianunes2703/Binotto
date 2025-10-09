import React, { useMemo, useState } from "react";
import { useDREData } from "../hooks/useDREData";
import {
  ResponsiveContainer,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar,
  PieChart, Pie, Cell,
} from "recharts";
import "./DRE.css";

const CUSTO_COLORS = ["#e9a23b", "#5b8def", "#a179f2"]; // deduções, custos, despesas op
const PIE_COLORS = ["#28c76f", "#ff66a6", "#20c997"];     // composição receita

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

export default function DREDashboard() {
  const { months, loading, valueAt } = useDREData();
  const [mes, setMes] = useState(() => months?.[months.length - 1] || null);

  // atualiza combo quando meses chegam
  React.useEffect(() => {
    if (months?.length) setMes(months[months.length - 1]);
  }, [months]);

  // KPIs principais
  const receitaLiquida = useMemo(() => valueAt("receita_liquida", mes), [mes, valueAt]);
  const receitaBruta   = useMemo(() => valueAt("faturamento_bruto", mes), [mes, valueAt]);
  const custosTotais   = useMemo(() => valueAt("custos_totais", mes), [mes, valueAt]);
  const despesasAdm    = useMemo(() => valueAt("despesas_adm", mes), [mes, valueAt]);
  const despesasCom    = useMemo(() => valueAt("despesas_comercial", mes), [mes, valueAt]);
  const despesasLog    = useMemo(() => valueAt("despesas_logistica", mes), [mes, valueAt]);
  const ebitda         = useMemo(() => valueAt("ebitda", mes), [mes, valueAt]);
  const lucroLiquido   = useMemo(() => valueAt("lucro_liquido", mes), [mes, valueAt]);

  const margemEbitda = receitaLiquida ? (ebitda / receitaLiquida) * 100 : 0;

  // Estrutura DRE (barras empilhadas negativas para componentes de custo)
  const estruturaData = useMemo(() => {
    return months.map((m) => {
  const ded = valueAt("deducoes", m);
  const cus = valueAt("custos_totais", m);
  const despOp = valueAt("despesas_adm", m) + valueAt("despesas_comercial", m) + valueAt("despesas_logistica", m);
  return {
    mes: m.toUpperCase(),
    Deducoes: Math.abs(ded),
    Custos: Math.abs(cus),
    "Despesas op": Math.abs(despOp),
  };
});

  }, [months, valueAt]);

  // Receita x Custos (linhas)
  const receitaCustos = useMemo(() => {
    return months.map((m) => ({
      mes: m.toUpperCase(),
      Receita: valueAt("receita_liquida", m),
      "Custos Totais": -Math.abs(valueAt("custos_totais", m)),
    }));
  }, [months, valueAt]);

  // Quebra de Despesas no mês atual
  const despesasBreak = useMemo(() => ([
  { nome: "Administrativas", valor: Math.abs(despesasAdm) },
  { nome: "Comerciais",      valor: Math.abs(despesasCom) },
  { nome: "Logística",       valor: Math.abs(despesasLog) },
]), [despesasAdm, despesasCom, despesasLog]);


  // Composição da Receita no mês (serviços, revenda, fabricação) — se existirem
  const compReceita = useMemo(() => {
    const serv = valueAt("receitas_servicos", mes);
    const rev  = valueAt("receitas_revenda", mes);
    const fab  = valueAt("receitas_fabricacao", mes);
    const items = [
      { name: "Serviços", value: Math.max(0, serv) },
      { name: "Revenda",  value: Math.max(0, rev)  },
      { name: "Fabricação", value: Math.max(0, fab) },
    ].filter(i => i.value > 0);
    return items.length ? items : [{ name: "Receita Líquida", value: Math.max(0, receitaLiquida) }];
  }, [mes, valueAt, receitaLiquida]);

  if (loading) return <div className="dre-loading">Carregando DRE...</div>;
  if (!months?.length) return <div className="dre-loading">Não encontrei meses válidos no CSV do DRE.</div>;

  return (
    <div className="dre-page bg-gray-50">

      {/* Top bar: seletor */}
      <div className="dre-toolbar">
        <div />
        <div className="dre-select">
          <label>Competência</label>
          <select value={mes} onChange={(e) => setMes(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>{m.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      <section className="dre-cards">
        <div className="dre-card">
          <h4>Receita Bruta</h4>
          <div className="dre-card-value">{money(receitaBruta)}</div>
        </div>
        <div className="dre-card">
          <h4>Lucro Líquido</h4>
          <div className="dre-card-value">{money(lucroLiquido)}</div>
        </div>
        <div className="dre-card">
          <h4>EBITDA</h4>
          <div className="dre-card-value">{money(ebitda)}</div>
        </div>
        <div className="dre-card">
          <h4>Margem EBITDA</h4>
          <div className="dre-card-value">{margemEbitda.toFixed(1)}%</div>
        </div>
      </section>

      {/* Linha 1 de gráficos */}
      <section className="dre-grid">
        <div className="dre-panel">
          <h3>Estrutura DRE</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={estruturaData} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="Deducoes" stackId="a" fill={CUSTO_COLORS[0]} />
              <Bar dataKey="Custos" stackId="a" fill={CUSTO_COLORS[1]} />
              <Bar dataKey="Despesas op" stackId="a" fill={CUSTO_COLORS[2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dre-panel">
          <h3>Receita x Custos</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={receitaCustos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Line type="monotone" dataKey="Receita" stroke="#22c55e" dot />
              <Line type="monotone" dataKey="Custos Totais" stroke="#ef4444" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Linha 2 de gráficos */}
      <section className="dre-grid">
        <div className="dre-panel">
          <h3>Quebra de Despesas</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={despesasBreak} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="nome" />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="valor" fill="#a78bfa" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dre-panel">
          <h3>Composição da Receita</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Tooltip formatter={(v) => money(v)} />
              <Pie data={compReceita} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120} paddingAngle={2}>
                {compReceita.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
