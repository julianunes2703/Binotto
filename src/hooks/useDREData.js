import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

// passe o seu URL publicado em CSV
const DRE_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTb5Vp1jLwcRarrpAc1VWVgwr5PJgalzgXtNn_bTrdF8pydNIEDPHEd85qNc6aWvg/pub?gid=1631772326&single=true&output=csv";

const PT_MONTHS = [
  "jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez","total"
];

const normalize = (s) =>
  String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim();

/**
 * Lê o CSV e devolve:
 * - months: array com os meses encontrados (ordem do sheet)
 * - rows: [{ name, key, values: { [mes]: number } }]
 * - view helpers: getters por apelidos de linhas
 */
export function useDREData() {
  const [rows, setRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const text = await fetch(DRE_CSV_URL).then((r) => r.text());
        const { data } = Papa.parse(text, { header: false, skipEmptyLines: false });

        // achar o header que contém pelo menos 3 meses válidos
        let headerIdx = -1;
        let header = [];
        for (let i = 0; i < data.length; i++) {
          const row = data[i] || [];
          const found = row.reduce((acc, c) => {
            const hit = PT_MONTHS.includes(normalize(c));
            return acc + (hit ? 1 : 0);
          }, 0);
          if (found >= 3) {
            headerIdx = i;
            header = row.map((c) => normalize(c));
            break;
          }
        }
        if (headerIdx === -1) {
          setMonths([]); setRows([]); setLoading(false); return;
        }

        // col B costuma ter os títulos das contas
        const titleCol = 1;

        // índices dos meses no header
        const monthCols = [];
        header.forEach((h, idx) => {
          if (PT_MONTHS.includes(h) && h !== "total") monthCols.push({ mes: h, col: idx });
        });

        // linhas úteis começam depois do header
        const resultRows = [];
        for (let r = headerIdx + 1; r < data.length; r++) {
          const row = data[r] || [];
          const title = (row[titleCol] || "").toString().trim();
          if (!title) continue;

          const values = {};
          monthCols.forEach(({ mes, col }) => {
            const raw = String(row[col] ?? "")
              .replace(/[^\d,.-]/g, "")
              .replace(/\./g, "")
              .replace(",", ".");
            const val = parseFloat(raw);
            values[mes] = isNaN(val) ? 0 : val;
          });

          resultRows.push({
            name: title,
            key: normalize(title).replace(/\s+/g, "_").slice(0, 80),
            values,
          });
        }

        const monthsFound = monthCols.map((m) => m.mes); // ordem do sheet

        setRows(resultRows);
        setMonths(monthsFound);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setRows([]); setMonths([]); setLoading(false);
      }
    })();
  }, []);

  // mapa por key pra consulta rápida
  const map = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => m.set(r.key, r));
    return m;
  }, [rows]);

  // resolver por "apelidos" (linhas importantes)
  const aliases = useMemo(() => {
    // ajuste aqui se seu DRE tiver nomes diferentes
    return {
      faturamento_bruto: ["faturamento bruto"],
      receitas_servicos: ["receita da prestacao de servicos", "receita prestação de serviços"],
      receitas_revenda: ["receita da revenda de mercadorias"],
      receitas_fabricacao: ["receita de fabricacao propria", "receita de fabricação propria"],
      deducoes: ["deducoes"],
      receita_liquida: ["receita liquida"],
      custos_totais: ["custos totais"],
      custos_operacionais: ["custos operacionais"],
      mao_de_obra: ["mao de obra"],
      despesas_adm: ["despesas adm"],
      despesas_comercial: ["despesas comercial"],
      despesas_logistica: ["despesas com logistica", "despesas com logística"],
      ebitda: ["ebitda"],
      lucro_operacional: ["lucro operacional (ebit)","lucro operacional ebit"],
      resultado_financeiro: ["resultado financeiro"],
      impostos_sobre_lucro: ["impostos sobre o lucro"],
      lucro_liquido: ["lucro liquido"],
      geracao_caixa: ["geracao de caixa","geração de caixa"],
    };
  }, []);

  const findRow = (aliasKey) => {
    const opts = aliases[aliasKey] || [];
    for (const opt of opts) {
      const k = normalize(opt).replace(/\s+/g, "_");
      if (map.has(k)) return map.get(k);
      // tenta "contains"
      for (const [key, obj] of map.entries()) {
        if (key.includes(k)) return obj;
      }
    }
    return null;
  };

  const valueAt = (aliasKey, mes) => {
    const row = findRow(aliasKey);
    if (!row) return 0;
    return Number(row.values?.[mes] || 0);
  };

  return { rows, months, loading, findRow, valueAt };
}
