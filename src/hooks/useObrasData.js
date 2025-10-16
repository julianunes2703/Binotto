import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";

const MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

/* -------- utils -------- */
const norm = (s) =>
  String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();

const onlyLetters = (s) => norm(s).replace(/[^a-z]/g, "");
const parseMonth = (s) => {
  const t = onlyLetters(s);
  return MONTHS.find((m) => t.startsWith(m)) || null;
};

// toNumber robusto (pt-BR e US) — não remove ponto decimal por engano
const toNumber = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  let s = String(v).trim();
  if (!s) return 0;

  // sinal/() negativos e limpa moeda/espacos
  const neg = /^-/.test(s) || /\(.*\)/.test(s);
  s = s.replace(/[^\d.,()-]/g, "").replace(/[()]/g, "");
  if (!s) return 0;

  const hasComma = s.includes(",");
  const hasDot   = s.includes(".");

  // 🔎 Padrão BR só com milhar: "1.234" ou "12.345.678" (sem vírgula)
  const thousandsOnlyBR = !hasComma && hasDot && /^\d{1,3}(\.\d{3})+$/.test(s);

  if (thousandsOnlyBR) {
    // "484.093" -> "484093"
    s = s.replace(/\./g, "");
  } else if (hasComma && hasDot) {
    // usa o último separador como decimal
    const lastComma = s.lastIndexOf(",");
    const lastDot   = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      // "1.234,56" -> BR
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // "1,234.56" -> US
      s = s.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    // "1234,56" -> "1234.56"
    s = s.replace(/\./g, "").replace(",", ".");
  }
  // só ponto (e não thousandsOnlyBR) ou inteiro: mantém

  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : (neg ? -Math.abs(n) : n);
};


const medianAbs = (arr) => {
  const x = arr.map(v => Math.abs(Number(v) || 0)).filter(Number.isFinite);
  if (!x.length) return 0;
  x.sort((a,b)=>a-b);
  return x[Math.floor(x.length/2)];
};

/* -------- banners -------- */
const whichBanner = (text) => {
  const h = norm(text);
  if (/indicador.*producao|indicador.*produ[cç][aã]o/.test(h)) return "indicador";
  if (/medido|realizado.*obra/.test(h)) return "medido";
  if (/valor.*referente.*meta/.test(h)) return "valor_meta";
  if (/contrato|reajuste|comprometido|sienge|adt/.test(h)) return "contrato";
  if (/custo.*obra/.test(h)) return "custo";
  return "";
};

function classifyWithBanner(headerStack, banner) {
  const h = norm(headerStack);

  const hasMetaRs    = /meta\s*r\$|meta rs/.test(h);
  const hasRealRs    = /real\s*r\$|real rs/.test(h);
  const hasPerc      = /%/.test(h);
  const hasMeta      = /\bmeta\b(?!\s*r\$)/.test(h);
  const hasMedido    = /\bmedido\b/.test(h);
  const hasMetaPct   = /meta\s*%/.test(h);
  const hasRealPct   = /\breal\s*%/.test(h);
  const hasValorReal = /valor\s*real/.test(h);
  const hasNFREC     = /nf|rec|fat/.test(h);
  const hasMED       = /\bmed\b/.test(h);

  // detectores extras p/ custo
  const hasMetaWord = /\b(meta|orcad[oa]|orcamento|previst[oa]|planejad[oa])\b/.test(h);
  const hasRealWord = /\b(real|realizad[oa]|executad[oa]|apurad[oa])\b/.test(h);
  const hasMensal   = /\bmensal\b/.test(h);

  const b2 = whichBanner(h) || banner;

  if (b2 === "indicador") {
    if (hasMetaRs) return "indicador_meta_rs";
    if (hasRealRs) return "indicador_real_rs";
    if (hasPerc)   return "indicador_perc";
  }
  if (b2 === "medido") {
    if (hasMeta && !hasPerc && !hasMetaRs) return "medido_meta";
    if (hasMedido)                          return "medido_valor";
    if (hasPerc)                            return "medido_perc";
  }
  if (b2 === "valor_meta") {
  // detecta colunas típicas da seção “Valor referente à Meta”
  const hasRealPctAny = /(\breal\b.*%)|(%\s*.*\breal\b)/.test(h); // "Valor REAL em % em relação à meta"
  const hasBelowMeta  = /(abaixo.*meta|gap.*meta|diferen[çc]a.*meta|abaixo.*alvo)/.test(h); // "Valor REAL abaixo da meta"
  const hasMoney      = /(r\$|,|\.|mil|valor)/.test(h); // valores monetários, heurística extra

  // “Meta %” (valor percentual fixo)
  if (hasMetaPct) return "valor_meta_pct";

  // “Valor REAL em % em relação à meta” (percentual)
  if (hasRealPct || hasRealPctAny) return "valor_real_pct";

  // “Valor REAL abaixo da meta” (R$ absoluto, gap monetário)
  if (hasBelowMeta || hasMoney) return "valor_meta_gap_rs";
}




  if (b2 === "contrato") {
    if (hasNFREC) return "contrato_nfrecfat";
    if (hasMED)   return "contrato_med";
    if (hasPerc)  return "contrato_perc";
  }
  if (b2 === "custo") {
    // aceita com ou sem “R$” + sinônimos + “Mensal”
    if (hasMetaRs || (hasMeta && !hasPerc) || hasMetaWord) return "custo_meta_rs";
    if (hasRealRs || hasValorReal || hasRealWord || hasMensal) return "custo_real_rs";
    if (hasPerc) return "custo_perc";
  }

  // fallbacks qualificados
  if (hasMetaRs && b2) return `${b2}_meta_rs`;
  if (hasRealRs && b2) return `${b2}_real_rs`;
  if (hasPerc   && b2) return `${b2}_perc`;

  // últimos recursos
  if (hasMetaRs)    return "meta_rs";
  if (hasRealRs)    return "real_rs";
  if (hasMetaPct)   return "meta_pct";
  if (hasRealPct)   return "real_pct";
  if (hasValorReal) return "valor_real";
  if (hasPerc)      return "perc";

  return "";
}

/* -------- hook -------- */
export function useObrasData(csvUrl) {
  const [rows, setRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const urlRef = useRef(csvUrl);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true); setError(null);
        const text = await fetch(urlRef.current, { cache: "no-store", signal: ctrl.signal }).then(r => r.text());
        const { data } = Papa.parse(text, { header: false, skipEmptyLines: false });
        if (!Array.isArray(data) || !data.length) { if (!cancelled) { setRows([]); setMonths([]); setLoading(false); } return; }

        // 1) primeira linha de mês (A ou B)
        let monthRow = -1;
        for (let i = 0; i < data.length; i++) {
          const c0 = parseMonth(data[i]?.[0] ?? "");
          const c1 = parseMonth(data[i]?.[1] ?? "");
          if (c0 || c1) { monthRow = i; break; }
        }
        if (monthRow === -1) { if (!cancelled) { setRows([]); setMonths([]); setLoading(false); } return; }

        // 2) janela de cabeçalho
        const headerEnd = monthRow - 1;
        const headerStart = Math.max(0, headerEnd - 25);

        // 3) maxCols (header + algumas linhas de dados)
        const sampleRows = [monthRow, monthRow + 1, monthRow + 2, monthRow + 3]
          .filter((r) => r >= 0 && r < data.length);
        const maxColsHeader = Math.max(...data.slice(headerStart, headerEnd + 1).map(r => r?.length || 0), 0);
        const maxColsData   = Math.max(...sampleRows.map(r => (data[r]?.length || 0)), 0);
        const maxCols = Math.max(maxColsHeader, maxColsData);

        // 4) headerStacks
        const headerStacks = Array.from({ length: maxCols }, () => "");
        for (let c = 0; c < maxCols; c++) {
          const parts = [];
          for (let r = headerStart; r <= headerEnd; r++) {
            const cell = norm(data[r]?.[c] ?? "");
            if (cell) parts.push(cell);
          }
          headerStacks[c] = parts.join(" | ");
        }

        // 4.1) bannerByCol (varre + propaga)
        const bannerByCol = Array.from({ length: maxCols }, () => "");
        let currentBanner = "";
        for (let c = 0; c < maxCols; c++) {
          let b = whichBanner(headerStacks[c]);
          if (!b) {
            for (let r = headerStart; r <= headerEnd; r++) {
              b = whichBanner(data[r]?.[c] ?? "");
              if (b) break;
            }
          }
          if (b) currentBanner = b;
          bannerByCol[c] = currentBanner;
        }

        // 5) classificar (cidx -> key) — rótulos gerais
        const colMap = new Map();
        for (let c = 0; c < maxCols; c++) {
          const key = classifyWithBanner(headerStacks[c], bannerByCol[c]);
          if (key) colMap.set(c, key);
        }

        /* 5.A — Seleção do bloco "custo" por posição/dados (funciona mesmo sem nomes) */

        // linhas de meses
        const monthRowsIdx = [];
        for (let r = monthRow; r < data.length; r++) {
          const c0 = data[r]?.[0] ?? ""; const c1 = data[r]?.[1] ?? "";
          const tk = norm(`${c0} ${c1}`);
          if (!tk || tk.startsWith("total")) break;
          if (parseMonth(c0) || parseMonth(c1)) monthRowsIdx.push(r);
        }

        // helpers
        const header = (c) => headerStacks[c] || "";
        const medAt = (c) => {
          const vals = monthRowsIdx.map(r => toNumber((data[r] || [])[c]));
          return medianAbs(vals);
        };
        const isPctCol = (c) => /%/.test(header(c));

        // todas as colunas do banner "custo" (ordem visual)
        const custoCols = [...Array.from({ length: maxCols }, (_, i) => i)]
          .filter(c => bannerByCol[c] === "custo")
          .sort((a,b)=>a-b);

        // separa % e numéricas
        const pctCols    = custoCols.filter(isPctCol);
        const numericAll = custoCols.filter(c => !isPctCol(c));

        // numéricas com dado (>0)
        const numericWithData = numericAll
          .map(c => ({ c, med: medAt(c) }))
          .filter(x => x.med > 0)
          .map(x => x.c);

        // REAL = última numérica com dado; fallback: última numérica
        let custoRealCol = null;
        if (numericWithData.length) {
          custoRealCol = numericWithData[numericWithData.length - 1];
        } else if (numericAll.length) {
          custoRealCol = numericAll[numericAll.length - 1];
        }

        // META = numérica mais próxima à esquerda do REAL com dado; fallbacks descritos
        let custoMetaCol = null;
        if (custoRealCol != null) {
          const leftAll  = numericAll.filter(c => c < custoRealCol);
          const leftData = numericWithData.filter(c => c < custoRealCol);
          if (leftData.length) {
            custoMetaCol = leftData[leftData.length - 1]; // a mais à direita entre as que têm dado
          } else if (leftAll.length) {
            custoMetaCol = leftAll[leftAll.length - 1];    // a mais à direita mesmo sem dado
          }
        }
        if (custoMetaCol == null && numericAll.length) {
          custoMetaCol = numericAll[0]; // fallback: 1ª numérica do bloco
        }

        // PERC = 1ª % com mediana plausível; fallback: 1ª %
        let custoPercCol = null;
        for (const c of pctCols) {
          const med = medAt(c);
          if (med > 0 && med <= 300) { custoPercCol = c; break; }
        }
        if (custoPercCol == null) custoPercCol = pctCols[0] ?? null;

        // 5.B) mapa final (key -> col): mantém não-custo como estava, injeta custo mapeado
        const keyToCol = new Map();
        for (const [cidx, key] of colMap.entries()) {
          if (bannerByCol[cidx] === "custo") continue;
          if (!keyToCol.has(key)) keyToCol.set(key, cidx);
        }
        if (custoMetaCol != null) keyToCol.set("custo_meta_rs", custoMetaCol);
        if (custoRealCol != null) keyToCol.set("custo_real_rs", custoRealCol);
        if (custoPercCol != null) keyToCol.set("custo_perc", custoPercCol);

        // 6) montar linhas por mês
        const out = [];
        let r = monthRow;
        while (r < data.length) {
          const c0 = data[r]?.[0] ?? "";
          const c1 = data[r]?.[1] ?? "";
          const kBoth = norm(`${c0} ${c1}`);
          if (!kBoth || kBoth.startsWith("total")) break;

          const mes = parseMonth(c0) || parseMonth(c1);
          if (!mes) { r++; continue; }

          const rowArr = data[r] || [];
          const obj = { mes };

          for (const [key, cidx] of keyToCol.entries()) {
            obj[key] = toNumber(rowArr[cidx]);
          }

          out.push(obj);
          r++;
        }

        if (!cancelled) {
          setRows(out);
          setMonths(out.map(o => o.mes));
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled && e.name !== "AbortError") { setError(e); setLoading(false); }
      }
    })();

    return () => { cancelled = true; ctrl.abort(); };
  }, []);

  const byMonth = useMemo(() => {
    const m = new Map();
    for (const o of rows) m.set(o.mes, o);
    return m;
  }, [rows]);

  const sum = (field) => rows.reduce((a,b)=> a + toNumber(b?.[field]), 0);

  return { loading, error, months, rows, byMonth, sum };
}
