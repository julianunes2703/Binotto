import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";

/* ---------------- utils ---------------- */
const MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

const norm = (s) =>
  String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();

const onlyLetters = (s) => norm(s).replace(/[^a-z]/g, "");
const parseMonth = (s) => {
  const t = onlyLetters(s);
  return MONTHS.find((m) => t.startsWith(m)) || null;
};

const toNumber = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v).trim();
  if (!s) return 0;
  const neg = /^-/.test(s) || /\(.*\)/.test(s);
  s = s.replace(/[^\d,.-]/g, "").replace(/[()]/g, "");
  if (/,/.test(s) && /\.\d{3}/.test(s)) s = s.replace(/\./g, "");
  s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : (neg ? -Math.abs(n) : n);
};

const isPercentCell = (raw) => /%/.test(String(raw ?? ""));
const isNumberish = (raw) => /^-?\s*\d+(?:[\.,]\d+)?$/.test(String(raw ?? "").replace(/\./g,"").replace(",","."));

/* ---------------- HOOK ---------------- */
export function useComprasData(csvUrl) {
  const [rows, setRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [obras, setObras] = useState([]);
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
        if (!Array.isArray(data) || !data.length) {
          if (!cancelled) { setRows([]); setMonths([]); setObras([]); setLoading(false); }
          return;
        }

        const H = data.length;
        const out = [];
        const monthsSet = new Set();
        const obrasSet = new Set();
        const obraRe = /\bobra\s*[:\-]\s*(.+)/i;

        // acha "Obra: ..." perto do bloco (prioriza abaixo; fallback acima)
        function findObraNear(fromRow, toRow) {
          // abaixo — varre até 200 linhas
          for (let r = toRow; r <= Math.min(H - 1, toRow + 200); r++) {
            const row = data[r] || [];
            for (let c = 0; c < row.length; c++) {
              const m = String(row[c] ?? "").match(obraRe);
              if (m && m[1]) return m[1].replace(/\u00A0/g, " ").trim();
            }
          }
          // acima — varre 200 linhas
          for (let r = fromRow; r >= Math.max(0, fromRow - 200); r--) {
            const row = data[r] || [];
            for (let c = 0; c < row.length; c++) {
              const m = String(row[c] ?? "").match(obraRe);
              if (m && m[1]) return m[1].replace(/\u00A0/g, " ").trim();
            }
          }
          return "";
        }

        // percorre procurando a 1ª linha de mês => início de bloco
        for (let i = 0; i < H; i++) {
          const row = data[i] || [];
          const m0 = parseMonth(row?.[0]);
          const m1 = parseMonth(row?.[1]);
          if (!(m0 || m1)) continue;

          // delimita o bloco até TOTAL/vazio/próximo "Obra:"
          let end = i + 1;
          while (end < H) {
            const rrow = data[end] || [];
            const t0 = norm(`${rrow?.[0] ?? ""} ${rrow?.[1] ?? ""}`);
            const hasObra = rrow.some((cell) => obraRe.test(String(cell ?? "")));
            if (!t0 || t0.startsWith("total") || hasObra) break;
            end++;
          }
          const blockStart = i;
          const blockEnd   = end - 1;

          // nome da obra do bloco
          const obra = findObraNear(blockStart, blockEnd);
          if (!obra) { i = end; continue; }
          obrasSet.add(obra);

          // lista de linhas de meses dentro do bloco
          const monthRows = [];
          for (let r = blockStart; r <= blockEnd; r++) {
            const rr = data[r] || [];
            const mes = parseMonth(rr?.[0]) || parseMonth(rr?.[1]);
            if (mes) monthRows.push({ r, mes });
          }
          if (!monthRows.length) { i = end; continue; }

          // função: dado um índice de linha de mês, retorna os 4 trios na ordem que aparecem
          function extractTriosFromMonthRow(r) {
            const raw = data[r] || [];
            // a linha tem o mês nas 1-2 primeiras colunas => começamos a partir da col 2
            const startC = 0; // segura: varre a linha toda
            const triples = [];

            // ache TODAS as colunas que têm '%' — elas são o 3º elemento de cada trio
            const pctCols = [];
            for (let c = startC; c < raw.length; c++) {
              if (isPercentCell(raw[c])) pctCols.push(c);
            }

            // para cada célula de %, pegue os dois números imediatamente à esquerda
            for (const pc of pctCols) {
              // ande para trás pegando dois números
              let realCol = null, metaCol = null;
              for (let c = pc - 1; c >= Math.max(0, pc - 5); c--) {
                if (realCol == null && isNumberish(String(raw[c]).replace(/\s/g,""))) { realCol = c; continue; }
                if (realCol != null && metaCol == null && isNumberish(String(raw[c]).replace(/\s/g,""))) { metaCol = c; break; }
              }
              if (metaCol != null && realCol != null) {
                triples.push({ meta: metaCol, real: realCol, perc: pc });
              }
            }

            // ordene pelo índice do % para preservar a ordem de aparição
            triples.sort((a,b)=>a.perc-b.perc);

            // devolva somente os quatro primeiros (pedido, entrega, pontualidade, negociação)
            return triples.slice(0, 4);
          }

          // mapeamento de colunas usando a primeira linha de mês válida do bloco
          const firstMonthRow = monthRows[0].r;
          const trios = extractTriosFromMonthRow(firstMonthRow);
          // se não achou nada, siga para o próximo bloco
          if (trios.length === 0) { i = end; continue; }

          // função para ler valores de um trio numa linha específica
          const readTriple = (r, trio) => {
            const line = data[r] || [];
            return {
              meta: toNumber(line[trio.meta]),
              real: toNumber(line[trio.real]),
              perc: toNumber(line[trio.perc]),
            };
          };

          // agora, percorra cada mês do bloco e popule saída
          for (const { r, mes } of monthRows) {
            const pedido = trios[0] ? readTriple(r, trios[0]) : {meta:0,real:0,perc:0};
            const entrega = trios[1] ? readTriple(r, trios[1]) : {meta:0,real:0,perc:0};
            const pont = trios[2] ? readTriple(r, trios[2]) : {meta:0,real:0,perc:0};
            const nego = trios[3] ? readTriple(r, trios[3]) : {meta:0,real:0,perc:0};

            out.push({
              obra, mes,
              prazo_pedido_meta:   pedido.meta,
              prazo_pedido_real:   pedido.real,
              prazo_pedido_perc:   pedido.perc,
              prazo_entrega_meta:  entrega.meta,
              prazo_entrega_real:  entrega.real,
              prazo_entrega_perc:  entrega.perc,
              pontualidade_meta:   pont.meta,
              pontualidade_real:   pont.real,
              pontualidade_perc:   pont.perc,
              negociacao_meta:     nego.meta,
              negociacao_real:     nego.real,
              negociacao_perc:     nego.perc,
            });
            monthsSet.add(mes);
          }

          i = end; // pula para o próximo bloco
        }

        if (!cancelled) {
          setRows(out);
          setMonths(Array.from(monthsSet));
          setObras(Array.from(obrasSet));
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled && e.name !== "AbortError") {
          setError(e);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; ctrl.abort(); };
  }, []);

  const byMonthByObra = useMemo(() => {
    const m = new Map();
    for (const o of rows) m.set(`${o.obra}::${o.mes}`, o);
    return m;
  }, [rows]);

  return { loading, error, rows, months, obras, byMonthByObra };
}
