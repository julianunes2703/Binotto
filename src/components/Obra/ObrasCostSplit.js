import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const moneyFmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

// mapeamento de colunas (ajuste os nomes aqui se precisar)
const COLS = {
  material: ["custo_material_rs", "custo_material"],
  mao: ["custo_mao_obra_rs", "custo_mao_obra"],
  servicos: ["custo_servicos_rs", "custo_servicos"],
};

const getNum = (row, keys) => {
  for (const k of keys) {
    if (row[k] != null && !Number.isNaN(Number(row[k]))) return Number(row[k]);
  }
  return 0;
};

export default function ObrasCostSplit({ rawRows /* rows originais do hook */, months /* months do hook */ }) {
  const [modo, setModo] = useState("mensal"); // mensal | ytd

  const mensal = useMemo(() => {
    if (!rawRows?.length) return [];
    return rawRows.map((r) => ({
      Mes: String(r.mes || "").toUpperCase(),
      Material: getNum(r, COLS.material),
      MaoDeObra: getNum(r, COLS.mao),
      Servicos: getNum(r, COLS.servicos),
    }));
  }, [rawRows]);

  const ytd = useMemo(() => {
    let m = 0, mO = 0, s = 0;
    mensal.forEach((x) => {
      m += x.Material; mO += x.MaoDeObra; s += x.Servicos;
    });
    return [{ Mes: "YTD", Material: m, MaoDeObra: mO, Servicos: s }];
  }, [mensal]);

  const data = modo === "mensal" ? mensal : ytd;

  if (!data.length) return null;

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>Divisão de Custos por Tipo</h3>
        <div className="segmented">
          <button className={modo === "mensal" ? "on" : ""} onClick={() => setModo("mensal")}>Mensal</button>
          <button className={modo === "ytd" ? "on" : ""} onClick={() => setModo("ytd")}>YTD</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} stackOffset="expand">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Mes" />
          <YAxis />
          <Tooltip formatter={(v, n) => [moneyFmt(v), n]} />
          <Legend />
          <Bar dataKey="Material" name="Material" stackId="1" />
          <Bar dataKey="MaoDeObra" name="Mão de Obra" stackId="1" />
          <Bar dataKey="Servicos" name="Serviços" stackId="1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
