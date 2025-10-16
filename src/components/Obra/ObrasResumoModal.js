import React, { useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import "./ObrasResumoModal.css";

const GREEN = "#16a34a";
const RED   = "#dc2626";

const money = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
const pct = (v) => `${(Number(v) || 0).toFixed(1)}%`;

export default function ObrasResumoModal({ open, onClose, data, blocksInfo }) {
  // trava/destrava o scroll do body e fecha no ESC
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const resumo = useMemo(() => {
    if (!open || !data?.length || !blocksInfo?.length) return [];

    // último mês baseado na última linha disponível
    const ultimoMes = data[data.length - 1]?.Mes || "";

    return blocksInfo.map((b) => {
      const key = b.key;
      let metaYTD = 0, realYTD = 0, desvios = [];
      let lastMeta = 0, lastReal = 0, lastDesvio = 0;

      for (const d of data) {
        const m = Number(d[`${key}__meta`] || 0);
        const r = Number(d[`${key}__real`] || 0);
        const dv = Number(d[`${key}__desvio`] || 0);
        metaYTD += m; realYTD += r;
        if (!Number.isNaN(dv)) desvios.push(dv);
        if (d.Mes === ultimoMes) { lastMeta = m; lastReal = r; lastDesvio = dv; }
      }

      const desvioMedio = desvios.length
        ? (desvios.reduce((a, b) => a + b, 0) / desvios.length)
        : 0;

      // status 75% só para custo
      let status75 = null, perc75 = null;
      if (key === "custo") {
        const alvo75 = metaYTD * 0.75;
        perc75 = alvo75 > 0 ? (realYTD / alvo75) * 100 : 0;
        status75 = perc75 >= 90 ? "vermelho" : perc75 >= 75 ? "amarelo" : "verde";
      }

      return {
        key, title: b.title, fmt: b.fmt,
        ultimoMes, lastMeta, lastReal, lastDesvio,
        metaYTD, realYTD, desvioMedio, status75, perc75
      };
    });
  }, [open, data, blocksInfo]);

  if (!open) return null;

  const destaque = resumo.find(r => r.key === "custo");
  const outros   = resumo.filter(r => r.key !== "custo");
  const renderValor = (r, v) => (r.fmt === "percent" ? pct(v) : money(v));

  // 👉 render como portal no <body>
  return ReactDOM.createPortal(
    <div className="resumo-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="resumo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="resumo-modal-header">
          <h3>Resumo Geral — Principais Números</h3>
          <button className="close-btn" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        {/* DESTAQUE — CUSTO */}
        {destaque && (
          <div className="resumo-feature">
            <div className="feature-title">Custo da Obra (Destaque)</div>

            <div className="feature-grid">
              <div className="feature-block">
                <div className="lbl">Meta YTD</div>
                <div className="big" style={{ color: GREEN }}>
                  {renderValor(destaque, destaque.metaYTD)}
                </div>
              </div>
              <div className="feature-block">
                <div className="lbl">Real YTD</div>
                <div className="big" style={{ color: RED }}>
                  {renderValor(destaque, destaque.realYTD)}
                </div>
              </div>
              <div className="feature-block">
                <div className="lbl">Desvio (últ. mês • {destaque.ultimoMes})</div>
                <div
                  className="big"
                  style={{ color: destaque.lastDesvio > 0 ? GREEN : destaque.lastDesvio < 0 ? RED : "#111827" }}
                >
                  {pct(destaque.lastDesvio)}
                </div>
              </div>
              <div className="feature-block">
                <div className="lbl">Comprometimento da Meta (75%)</div>
                {destaque.perc75 != null ? (
                  <>
                    <div className={`progress-bar ${destaque.status75}`} style={{ width: "100%" }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, destaque.perc75))}%` }} />
                    </div>
                    <div className="sub">{(destaque.perc75).toFixed(1)}% do alvo (75%)</div>
                  </>
                ) : (
                  <div className="sub">—</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* OUTROS BLOCOS */}
        <div className="resumo-grid">
          {outros.map((r) => {
            const lastColor = r.lastDesvio > 0 ? GREEN : r.lastDesvio < 0 ? RED : "#111827";
            const avgColor  = r.desvioMedio > 0 ? GREEN : r.desvioMedio < 0 ? RED : "#111827";
            const moneyFmt  = r.fmt !== "percent";

            return (
              <div key={r.key} className="resumo-card-mini">
                <div className="resumo-card-title">{r.title}</div>

                <div className="row">
                  <span className="lbl">Último mês ({r.ultimoMes})</span>
                  <span className="val">
                    <b style={{ color: GREEN }}>Meta:</b> {moneyFmt ? money(r.lastMeta) : pct(r.lastMeta)} &nbsp;|&nbsp;
                    <b style={{ color: RED }}>Real:</b> {moneyFmt ? money(r.lastReal) : pct(r.lastReal)}
                  </span>
                </div>

                <div className="row">
                  <span className="lbl">Desvio (último mês)</span>
                  <span className="val" style={{ color: lastColor }}>{pct(r.lastDesvio)}</span>
                </div>

                <div className="row">
                  <span className="lbl">Acumulado no ano</span>
                  <span className="val">
                    <b style={{ color: GREEN }}>Meta:</b> {moneyFmt ? money(r.metaYTD) : pct(r.metaYTD)} &nbsp;|&nbsp;
                    <b style={{ color: RED }}>Real:</b> {moneyFmt ? money(r.realYTD) : pct(r.realYTD)}
                  </span>
                </div>

                <div className="row">
                  <span className="lbl">Desvio médio</span>
                  <span className="val" style={{ color: avgColor }}>{pct(r.desvioMedio)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
