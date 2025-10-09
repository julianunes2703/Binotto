import { useEffect, useState } from "react";
import Papa from "papaparse";

const URL_OBRA =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTz9AkwLQwYaPebCoz8dWo_EE6ov9rKL5PclC0O4YoEefkocNBkiyIIS8Gt2lY9fA/pub?gid=72467004&single=true&output=csv";

export function useObrasData() {
  const [data, setData] = useState([]);
  const [blocksInfo, setBlocksInfo] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMonth = (v) =>
    /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)$/i.test(
      String(v || "").trim()
    );

  const num = (v) => {
    const t = String(v ?? "")
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const n = parseFloat(t);
    return isNaN(n) ? 0 : n;
  };

  useEffect(() => {
    (async () => {
      try {
        const text = await fetch(URL_OBRA).then((r) => r.text());
        const M = Papa.parse(text, { header: false }).data;

        const metaRowIdx = M.findIndex((row) => {
          const count = row.reduce(
            (acc, c) =>
              acc + (String(c).trim().toLowerCase() === "meta r$" ? 1 : 0),
            0
          );
          return count >= 2;
        });
        if (metaRowIdx === -1) {
          setData([]);
          setBlocksInfo([]);
          setLoading(false);
          return;
        }
        const metaRow = M[metaRowIdx];

        const guessTitle = (col) => {
          for (let up = 1; up <= 3; up++) {
            const row = M[metaRowIdx - up] || [];
            const raw = String(row[col] || "").trim();
            if (raw && !/^mensal$/i.test(raw)) return raw;
          }
          return `Bloco ${col}`;
        };

        const candidates = [];
        for (let c = 0; c < metaRow.length - 1; c++) {
          const isMeta =
            String(metaRow[c] || "").trim().toLowerCase() === "meta r$";
          const isReal =
            String(metaRow[c + 1] || "").trim().toLowerCase() === "real r$";
          if (isMeta && isReal) {
            const raw = guessTitle(c);
            const key = raw
              .replace(/\s+/g, " ")
              .replace(/[^\p{L}\p{N}\s]/gu, "")
              .trim()
              .toLowerCase()
              .slice(0, 60)
              .replace(/\s+/g, "_");
            candidates.push({ title: raw, key, metaCol: c, realCol: c + 1 });
          }
        }

        const monthRows = M.filter((row) => isMonth(row?.[1]));
        const activeBlocks = candidates.filter((b) => {
          const sumMeta = monthRows.reduce(
            (acc, r) => acc + Math.abs(num(r[b.metaCol])),
            0
          );
          const sumReal = monthRows.reduce(
            (acc, r) => acc + Math.abs(num(r[b.realCol])),
            0
          );
          return sumMeta + sumReal > 0;
        });

        const obras = monthRows.map((r) => {
          const out = { Obra: "SMF", Mes: String(r[1]).trim() };
          activeBlocks.forEach((b) => {
            const meta = num(r[b.metaCol]);
            const real = num(r[b.realCol]);
            const desvio = meta ? ((real - meta) / meta) * 100 : 0;
            out[`${b.key}__meta`] = meta;
            out[`${b.key}__real`] = real;
            out[`${b.key}__desvio`] = desvio;
          });
          return out;
        });

        setBlocksInfo(activeBlocks);
        setData(obras);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setBlocksInfo([]);
        setData([]);
        setLoading(false);
      }
    })();
  }, []);

  return { data, blocksInfo, loading };
}
