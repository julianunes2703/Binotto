import React, { useMemo } from "react";

const moneyFmt = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });

const pctFmt = (v) => `${(Number(v) || 0).toFixed(1)}%`;

export default function ObrasKpis({ data, blocoKey }) {
  const isValorMeta = blocoKey === "valor_meta"; // esse bloco é percentual

  const resumo = useMemo(() => {
    if (!data?.length) {
      return { metaYTD: 0, realYTD: 0, percMetaReal: 0, percAlvo75: 0, meses: 0 };
    }

    let metaAcum = 0;
    let realAcum = 0;
    let meses = 0;

    for (const d of data) {
      const meta = Number(d[`${blocoKey}__meta`] || 0);
      const real = Number(d[`${blocoKey}__real`] || 0);

      // ignora linhas vazias
      if (!meta && !real) continue;

      metaAcum += meta;
      realAcum += real;
      meses += 1;
    }

    // se é percentual, usamos média (em vez de somar%)
    const metaYTD = isValorMeta ? (meses ? metaAcum / meses : 0) : metaAcum;
    const realYTD = isValorMeta ? (meses ? realAcum / meses : 0) : realAcum;

    // Real / Meta (quanto do planejado foi feito)
    const percMetaReal = metaYTD ? (realYTD / metaYTD) * 100 : 0;
    // Real / (Meta * 75%) — % do alvo de 75%
    const alvo75 = metaYTD * 0.75;
    const percAlvo75 = alvo75 ? (realYTD / alvo75) * 100 : 0;

    return { metaYTD, realYTD, percMetaReal, percAlvo75, meses };
  }, [data, blocoKey, isValorMeta]);

  // cores (bom quando >= alvo)
  const statusClass =
    resumo.percAlvo75 >= 100 ? "verde" : resumo.percAlvo75 >= 90 ? "amarelo" : "vermelho";

  // barra entre 0 e 200% para visualizar superação
  const progressWidth = Math.max(0, Math.min(200, resumo.percAlvo75));

  return (
    <div className="obras-kpis">
      {/* Meta YTD */}
      <div className="kpi-card">
        <div className="kpi-label">Meta YTD</div>
        <div className="kpi-value green">
          {isValorMeta ? pctFmt(resumo.metaYTD) : moneyFmt(resumo.metaYTD)}
        </div>
      </div>

      {/* Real YTD */}
      <div className="kpi-card">
        <div className="kpi-label">Real YTD</div>
        <div className="kpi-value red">
          {isValorMeta ? pctFmt(resumo.realYTD) : moneyFmt(resumo.realYTD)}
        </div>
      </div>

      {/* Comprometimento da Meta (75%) */}
      <div className="kpi-card">
        <div className="kpi-label">Comprometimento da Meta (75%)</div>

        <div className={`kpi-progress ${statusClass}`} aria-label="Progresso do alvo 75%">
          <div style={{ width: `${progressWidth}%` }} />
        </div>

        <div className="kpi-sub">
          {/* ex.: “177,8% do alvo (75%) — 132,0% do planejado” */}
          <strong>{pctFmt(resumo.percAlvo75)}</strong> do alvo (75%) —{" "}
          <span>{pctFmt(resumo.percMetaReal)} do planejado</span>
        </div>
      </div>

      {/* Status com dot */}
      <div className="kpi-card kpi-status">
        <div className="kpi-label">Status</div>
        <div className="kpi-status-row">
          <span className={`dot ${statusClass}`} />
          <span className="kpi-status-text">{statusClass.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
