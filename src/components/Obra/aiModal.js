import React, { useEffect, useMemo, useState } from "react";
import { AnalyzerAPI } from "../../services/analyzer";

const ORDER = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const normMes = (m) => String(m || "").trim().slice(0, 3).toUpperCase();

export default function AiAnaliseModal({
  open,
  onClose,
  rowsRaw,          // linhas brutas do useObrasData
  obraSelecionada,  // "SMF" etc.
  mesSelecionado,   // "Todos" ou "JAN"/"FEV"/...
  metricKey,        // chip ativo (indicador|medido|valor_meta|contrato|custo)
}) {
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState(null);
  const [err, setErr] = useState(null);

  const ano = useMemo(() => new Date().getFullYear(), []);

  const mesAlvo = useMemo(() => {
    if (mesSelecionado && mesSelecionado !== "Todos") return normMes(mesSelecionado);
    const mesesEncontrados = Array.from(new Set((rowsRaw || []).map(r => normMes(r.mes)))).filter(Boolean);
    const idxs = mesesEncontrados.map(m => ORDER.indexOf(m)).filter(i => i >= 0);
    if (!idxs.length) return "JAN";
    return ORDER[Math.max(...idxs)];
  }, [mesSelecionado, rowsRaw]);

  const mesAnterior = useMemo(() => {
    const i = ORDER.indexOf(mesAlvo);
    return i > 0 ? ORDER[i - 1] : null;
  }, [mesAlvo]);

  const isTodos = useMemo(
    () => String(mesSelecionado || "").trim().toLowerCase() === "todos",
    [mesSelecionado]
  );

  // mapeia a "metric" só pra dar contexto ao modelo
  const metric = useMemo(() => {
    const map = {
      indicador: "indicador_producao",
      medido: "medido_realizado",
      valor_meta: "valor_meta_percentual",
      contrato: "valor_contrato_comprometido",
      custo: "custo_obra",
    };
    return map[metricKey] || "geral";
  }, [metricKey]);

  // resumo leve (usado apenas no modo mês-a-mês)
  const resumo = useMemo(() => {
    const rowsObra = (rowsRaw || []).filter(r =>
      !obraSelecionada || obraSelecionada === "Todas" || String(r.obra || r.Obra || "SMF") === obraSelecionada
    );
    const atual = rowsObra.filter(r => normMes(r.mes) === mesAlvo);
    const prev = mesAnterior ? rowsObra.filter(r => normMes(r.mes) === mesAnterior) : [];

    const pick = (r) => ({
      mes: normMes(r.mes),
      indicador_meta_rs: r.indicador_meta_rs,
      indicador_real_rs: r.indicador_real_rs,
      medido_meta: r.medido_meta,
      medido_valor: r.medido_valor,
      valor_meta_pct: r.valor_meta_pct,
      valor_real_pct: r.valor_real_pct,
      valor_meta_gap_rs: r.valor_meta_gap_rs,
      contrato_nfrecfat: r.contrato_nfrecfat,
      contrato_med: r.contrato_med,
      contrato_perc: r.contrato_perc,
      custo_meta_rs: r.custo_meta_rs,
      custo_real_rs: r.custo_real_rs,
      custo_perc: r.custo_perc,
    });

    return {
      obra: obraSelecionada || "Todas",
      mesAtual: mesAlvo,
      mesAnterior: mesAnterior,
      atual: atual.map(pick),
      anterior: prev.map(pick),
    };
  }, [rowsRaw, obraSelecionada, mesAlvo, mesAnterior]);

  // chamada à API
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setErr(null);
    setResp(null);

    const payload = {
      ano,
      mes: isTodos ? "TODOS" : mesAlvo,
      metric: isTodos ? "geral" : metric,
      resumo: isTodos ? rowsRaw : resumo,
    };

    AnalyzerAPI.analyze(payload)
      .then((r) => setResp(r.data))
      .catch((e) => setErr(e.message || "Falha ao analisar"))
      .finally(() => setLoading(false));
  }, [open, ano, isTodos, mesAlvo, metric, rowsRaw, resumo]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          width: "min(900px, 94vw)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>
            Análise de IA — {obraSelecionada} — {isTodos ? ano : `${mesAlvo}/${ano}`}
          </h2>
          <button onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {loading && <p>Rodando análise…</p>}
        {err && <p style={{ color: "#b00" }}>Erro: {err}</p>}

        {resp && (
          <>
            <p>
              <strong>Resumo:</strong> {resp.resumo}
            </p>

            {!!resp.destaques?.length && (
              <>
                <h3>Destaques</h3>
                <ul>{resp.destaques.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </>
            )}

            {!!resp.riscos?.length && (
              <>
                <h3>Riscos</h3>
                <ul>{resp.riscos.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </>
            )}

            {!!resp.oportunidades?.length && (
              <>
                <h3>Oportunidades</h3>
                <ul>{resp.oportunidades.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </>
            )}

            {!!resp.acoesRecomendadas?.length && (
              <>
                <h3>Ações recomendadas</h3>
                <ul>{resp.acoesRecomendadas.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </>
            )}

            {!!resp.tarefas?.length && (
              <>
                <h3>Tarefas</h3>
                <ul>
                  {resp.tarefas.map((t, i) => (
                    <li key={i}>
                      <strong>{t.titulo}</strong> — {t.descricao} [{t.prioridade}] · impacto:{" "}
                      {t.impacto} · prazo: {t.prazoDias}d
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
