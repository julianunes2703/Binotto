import React from "react";
import { useBudgetData } from "../../hooks/useBudgetData";
import { useDREData } from "../../hooks/useDREData"; // seu hook do DRE
import {
  ResponsiveContainer,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar,
} from "recharts";
import "./DREvBudget.css";

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });

const pct = (num, den) => {
  const d = Number(den) || 0;
  if (!d) return 0;
  return ((Number(num) - d) / d) * 100;
};

export default function DREvsBudgetDashboard() {
  const dre = useDREData();        // { months, valueAt, loading, ... }
  const bud = useBudgetData();     // { months, valueAt, loading, ... }

  const loading = dre.loading || bud.loading;

  // Meses em comum (ordem do Budget)
  const months = React.useMemo(() => {
    const set = new Set(dre.months || []);
    return (bud.months || []).filter((m) => set.has(m));
  }, [dre.months, bud.months]);

  const [mes, setMes] = React.useState(null);
  React.useEffect(() => {
    if (months?.length) setMes(months[0]);
  }, [months]);

  // Helpers para puxar os principais agrupamentos
  const valores = React.useMemo(() => {
    const get = (alias) => ({
      orcado: bud.valueAt(alias, mes),
      real:   dre.valueAt(alias, mes),
    });

    const receita    = get("receita_liquida");
    const custos     = get("custos_totais");
    const despAdm    = get("despesas_adm");
    const despCom    = get("despesas_comercial");
    const despLog    = get("despesas_logistica");
    const ebitda     = get("ebitda");
    const ebit       = get("lucro_operacional");
    const lbruto     = get("lucro_bruto");

    const despesasOp = {
      orcado: (despAdm.orcado + despCom.orcado + despLog.orcado),
      real:   (despAdm.real   + despCom.real   + despLog.real),
    };

    const resultado = {
      orcado: receita.orcado - custos.orcado - despesasOp.orcado,
      real:   receita.real   - custos.real   - despesasOp.real,
    };

    return { receita, custos, despAdm, despCom, despLog, despesasOp, ebitda, ebit, lbruto, resultado };
  }, [mes, bud.valueAt, dre.valueAt]);

  // Série: Resultado Orçado x Real por mês
  const serieResultado = React.useMemo(() => {
    return months.map((m) => {
      const rec  = bud.valueAt("receita_liquida", m);
      const cus  = bud.valueAt("custos_totais", m);
      const da   = bud.valueAt("despesas_adm", m);
      const dc   = bud.valueAt("despesas_comercial", m);
      const dl   = bud.valueAt("despesas_logistica", m);
      const orc  = rec - cus - (da + dc + dl);

      const recR = dre.valueAt("receita_liquida", m);
      const cusR = dre.valueAt("custos_totais", m);
      const daR  = dre.valueAt("despesas_adm", m);
      const dcR  = dre.valueAt("despesas_comercial", m);
      const dlR  = dre.valueAt("despesas_logistica", m);
      const rea  = recR - cusR - (daR + dcR + dlR);

      return { mes: m.toUpperCase(), "Orçado": orc, "Real": rea };
    });
  }, [months, bud.valueAt, dre.valueAt]);

  // Barras agrupadas: Receita e Custos (orcado x real) no mês
  const barsReceitaCustos = React.useMemo(() => ([
    { item: "Receita", Orçado: valores.receita.orcado, Real: valores.receita.real },
    { item: "Custos",  Orçado: valores.custos.orcado,  Real: valores.custos.real  },
  ]), [valores]);

  // Barras empilhadas: Despesas (adm, com, log) — orçado e real no mês
  const barsDespesas = React.useMemo(() => ([
    {
      grupo: "Orçado",
      Adm: valores.despAdm.orcado,
      Comercial: valores.despCom.orcado,
      Logística: valores.despLog.orcado,
    },
    {
      grupo: "Real",
      Adm: valores.despAdm.real,
      Comercial: valores.despCom.real,
      Logística: valores.despLog.real,
    },
  ]), [valores]);

  if (loading) return <div className="drexbudget-loading">Carregando DRE × Budget...</div>;
  if (!months?.length) return <div className="drexbudget-loading">Não há meses em comum entre DRE e Budget.</div>;

  const k = valores; // atalho

  return (
    <div className="drexbudget-page">
      <header className="drexbudget-header">
        <h1>DRE × Budget</h1>
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
      <section className="drexbudget-cards">
        <Card title="Resultado (Orçado)"
              value={money(k.resultado.orcado)} />
        <Card title="Resultado (Real)"
              value={money(k.resultado.real)} />
        <Card title="Desvio Resultado"
              value={`${pct(k.resultado.real, k.resultado.orcado).toFixed(1)}%`}
              warn />

        <Card title="Receita Líquida (Orçado)"
              value={money(k.receita.orcado)} />
        <Card title="Receita Líquida (Real)"
              value={money(k.receita.real)} />
        <Card title="Desvio Receita"
              value={`${pct(k.receita.real, k.receita.orcado).toFixed(1)}%`}
              warn />

        <Card title="Custos Totais (Orçado)"
              value={money(k.custos.orcado)} />
        <Card title="Custos Totais (Real)"
              value={money(k.custos.real)} />
        <Card title="Desvio Custos"
              value={`${pct(k.custos.real, k.custos.orcado).toFixed(1)}%`}
              warn />

        <Card title="Despesas Oper. (Orçado)"
              value={money(k.despesasOp.orcado)} />
        <Card title="Despesas Oper. (Real)"
              value={money(k.despesasOp.real)} />
        <Card title="Desvio Despesas"
              value={`${pct(k.despesasOp.real, k.despesasOp.orcado).toFixed(1)}%`}
              warn />

        <Card title="EBITDA (Orçado)"
              value={money(k.ebitda.orcado)} />
        <Card title="EBITDA (Real)"
              value={money(k.ebitda.real)} />

        <Card title="EBIT (Orçado)"
              value={money(k.ebit.orcado)} />
        <Card title="EBIT (Real)"
              value={money(k.ebit.real)} />
      </section>

      {/* Gráficos */}
      <section className="drexbudget-grid">
        <div className="panel">
          <h3>Resultado — Orçado × Real</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={serieResultado}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Line type="monotone" dataKey="Orçado" stroke="#1d4ed8" dot />
              <Line type="monotone" dataKey="Real" stroke="#10b981" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Receita × Custos — {mes?.toUpperCase()}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barsReceitaCustos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="item" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="Orçado" fill="#93c5fd" />
              <Bar dataKey="Real"   fill="#86efac" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Despesas por Grupo — {mes?.toUpperCase()}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barsDespesas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grupo" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="Adm"       stackId="a" fill="#a78bfa" />
              <Bar dataKey="Comercial" stackId="a" fill="#facc15" />
              <Bar dataKey="Logística" stackId="a" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tabela rápida */}
      <section className="panel">
        <h3>Comparativo — {mes?.toUpperCase()}</h3>
        <div className="table-wrap">
          <table className="drexbudget-table">
            <thead>
              <tr>
                <th>Conta</th>
                <th>Orçado</th>
                <th>Real</th>
                <th>Desvio (R$)</th>
                <th>Desvio (%)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { nome: "Receita Líquida", o: k.receita.orcado, r: k.receita.real },
                { nome: "Custos Totais",   o: k.custos.orcado,  r: k.custos.real  },
                { nome: "Despesas Oper.", o: k.despesasOp.orcado, r: k.despesasOp.real },
                { nome: "EBITDA",         o: k.ebitda.orcado,  r: k.ebitda.real  },
                { nome: "EBIT",           o: k.ebit.orcado,    r: k.ebit.real    },
                { nome: "Lucro Bruto",    o: k.lbruto.orcado,  r: k.lbruto.real  },
                { nome: "Resultado",      o: k.resultado.orcado, r: k.resultado.real },
              ].map((row) => {
                const desvio = row.r - row.o;
                const desPct = pct(row.r, row.o);
                return (
                  <tr key={row.nome}>
                    <td>{row.nome}</td>
                    <td className="num">{money(row.o)}</td>
                    <td className="num">{money(row.r)}</td>
                    <td className={`num ${desvio>0?'pos':'neg'}`}>{money(desvio)}</td>
                    <td className={`num ${desvio>0?'pos':'neg'}`}>{desPct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ title, value, warn }) {
  return (
    <div className={`card ${warn ? "warn" : ""}`}>
      <h4>{title}</h4>
      <div className="val">{value}</div>
    </div>
  );
}
