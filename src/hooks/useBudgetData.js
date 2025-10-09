import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

// CSV público do Budget
const BUDGET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTb5Vp1jLwcRarrpAc1VWVgwr5PJgalzgXtNn_bTrdF8pydNIEDPHEd85qNc6aWvg/pub?gid=415784550&single=true&output=csv";

const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// aceita formatos tipo "jul", "out./25", "jan./25", etc.
const isMonthHeader = (cell) => {
  const s = norm(cell);
  if (!s) return false;
  // remove sufixos do tipo ". /25"
  const slim = s.replace(/[./\s]/g, "");
  const meses = [
    "jan","fev","mar","abr","mai","jun",
    "jul","ago","set","out","nov","dez",
    "jan25","fev25","mar25","abr25","mai25","jun25",
    "jul25","ago25","set25","out25","nov25","dez25",
  ];
  // ignora "base"
  if (slim.startsWith("base")) return false;
  return meses.some((m) => slim.startsWith(m));
};

export function useBudgetData() {
  const [rows, setRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const csv = await fetch(BUDGET_CSV_URL).then((r) => r.text());
        const { data } = Papa.parse(csv, { header: false, skipEmptyLines: false });

        // encontra a linha de cabeçalho que contém meses
        let headerIdx = -1;
        let header = [];
        for (let i = 0; i < data.length; i++) {
          const row = data[i] || [];
          const hits = row.filter(isMonthHeader).length;
          if (hits >= 2) {
            headerIdx = i;
            header = row;
            break;
          }
        }
        if (headerIdx === -1) {
          setRows([]); setMonths([]); setLoading(false);
          return;
        }

        // coluna dos títulos das contas (na sua planilha é a B => índice 1)
        const titleCol = 1;

        // mapeia colunas que são meses
        const monthCols = [];
        header.forEach((c, idx) => {
          if (isMonthHeader(c)) monthCols.push({ label: String(c).trim(), col: idx });
        });

        // percorre linhas de dados
        const result = [];
        for (let r = headerIdx + 1; r < data.length; r++) {
          const row = data[r] || [];
          const title = (row[titleCol] || "").toString().trim();
          if (!title) continue;

          const values = {};
          monthCols.forEach(({ label, col }) => {
            const raw = String(row[col] ?? "")
              .replace(/[^\d,.-]/g, "")
              .replace(/\./g, "")
              .replace(",", ".");
            const v = parseFloat(raw);
            values[label] = isNaN(v) ? 0 : v;
          });

          result.push({
            name: title,
            key: norm(title).replace(/\s+/g, "_").slice(0, 80),
            values,
          });
        }

        setRows(result);
        setMonths(monthCols.map((m) => m.label));
      } catch (e) {
        console.error(e);
        setRows([]); setMonths([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // índice rápido por key
  const map = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => m.set(r.key, r));
    return m;
  }, [rows]);

  // apelidos das linhas principais do Budget (ajuste aqui se mudar)
  const aliases = useMemo(
    () => ({
      faturamento_bruto: ["faturamento bruto"],
      receita_liquida: ["receita liquida"],
      custos_totais: ["custos totais"],
      custos_operacionais: ["custos operacionais"],
      mao_de_obra: ["mao de obra"],
      despesas_adm: ["despesas adm"],
      despesas_comercial: ["despesas comercial"],
      despesas_logistica: ["despesas com logistica", "despesas com logística"],
      ebitda: ["ebitda"],
      lucro_operacional: ["lucro operacional (ebit)", "lucro operacional ebit"],
      lucro_bruto: ["lucro bruto"],
    }),
    []
  );

  const findRow = (aliasKey) => {
    const opts = aliases[aliasKey] || [];
    for (const opt of opts) {
      const k = norm(opt).replace(/\s+/g, "_");
      if (map.has(k)) return map.get(k);
      for (const [key, obj] of map.entries()) if (key.includes(k)) return obj;
    }
    return null;
  };

  const valueAt = (aliasKey, monthLabel) => {
    const row = findRow(aliasKey);
    if (!row) return 0;
    return Number(row.values?.[monthLabel] || 0);
  };

  return { rows, months, loading, findRow, valueAt };
}
