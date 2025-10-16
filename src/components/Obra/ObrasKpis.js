import React, { useMemo } from "react";

const moneyFmt = (v) =>
  Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });

const pctFmt = (v) => `${(Number(v) || 0).toFixed(1)}%`;

export default function ObrasKpis({ data, blocoKey }) {
  const isValorMeta = blocoKey === "valor_meta";

  const resumo = useMemo(() => {
    if (!data?.length) {
      return {
        metaYTD: 0,
        realYTD: 0,
        percMetaReal: 0,     // Real / Meta (100% = bateu a meta)
        percAlvo75: 0,       // Real / (Meta * 75%) em %
      };
    }

    let metaYTD = 0;
    let realYTD = 0;
    for (const d of data) {
      metaYTD += Number(d[`${blocoKey}__meta`] || 0);
      realYTD += Number(d[`${blocoKey}__real`] || 0);
    }

    const percMetaReal = metaYTD ? (realYTD / metaYTD) * 100 : 0;

    const alvo75 = metaYTD * 0.75;
    const percAlvo75 = alvo75 ? (realYTD / alvo75) * 100 : 0;

    return { metaYTD, realYTD, percMetaReal, percAlvo75 };
  }, [data, blocoKey]);

  // status baseado no atingimento do alvo de 75%
  // (>= 90% vermelho; >= 75% amarelo; < 75% verde) — igual usamos no resto do painel
  const status =
    resumo.percAlvo75 >= 90 ? "vermelho" : resumo.percAlvo75 >= 75 ? "amarelo" : "verde";

  // largura da barrinha (0–100)
  const progressWidth = Math.max(0, Math.min(100, resumo.percAlvo75));

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

      {/* Comprometimento da Meta (75%) — barra fina + legenda à direita */}
      <div className="kpi-card">
        <div className="kpi-label">Comprometimento da Meta (75%)</div>
        <div className={`kpi-progress ${status}`}>
          <div style={{ width: `${progressWidth}%` }} />
        </div>
        <div className="kpi-sub">
          {pctFmt(resumo.percAlvo75)} do alvo (75%)
        </div>
      </div>

      {/* Status com dot */}
      <div className="kpi-card kpi-status">
        <div className="kpi-label">Status</div>
        <div className="kpi-status-row">
          <span className={`dot ${status}`} />
          <span className="kpi-status-text">
            {status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
