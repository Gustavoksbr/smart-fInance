// =============================================================================
// src/hooks/useMacroData.ts
//
// Hook que busca dados macroeconômicos diretamente das APIs públicas.
// Retorna estado de loading (para o skeleton) e os dados ou erro.
// =============================================================================
import { useEffect, useState } from "react";
import { type ApiSource } from "../data/apiSources";

export interface MacroDataPoint {
  data: string;
  valor: number;
}

export interface MacroSeriesResult {
  series: string;
  label: string;
  data: MacroDataPoint[];
  error?: string;
}

/**
 * Dado uma lista de ApiSources, busca cada endpoint e retorna os resultados.
 * O fetch é feito em paralelo (Promise.allSettled).
 */
export function useMacroData(sources: ApiSource[], country: string, year: string) {
  const [results, setResults] = useState<MacroSeriesResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setResults([]);

    const controller = new AbortController();

    async function fetchAll() {
      const promises = sources.map(async (src) => {
        try {
          const res = await fetch(src.url, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();

          // Normaliza os formatos de resposta dos diferentes provedores
          const data = normalizeResponse(json, country);
          return { series: src.series, label: src.label, data };
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") {
            return { series: src.series, label: src.label, data: [], error: "cancelado" };
          }
          // Em ambiente de demo, se a API retornar CORS ou erro, usamos mock
          return {
            series: src.series,
            label: src.label,
            data: generateFallbackData(year),
            error: `Usando dados simulados (${(err as Error).message})`,
          };
        }
      });

      const settled = await Promise.allSettled(promises);
      const parsed = settled.map((s) =>
        s.status === "fulfilled"
          ? s.value
          : { series: "unknown", label: "Erro", data: [], error: "Falha inesperada" }
      );

      if (!controller.signal.aborted) {
        setResults(parsed);
        setLoading(false);
      }
    }

    fetchAll();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, year]);

  return { loading, results };
}

// ---------------------------------------------------------------------------
// Helpers de normalização
// ---------------------------------------------------------------------------

function normalizeResponse(json: unknown, country: string): MacroDataPoint[] {
  if (country === "BR" && Array.isArray(json)) {
    // Banco Central: [{ data: "01/01/2024", valor: "10.5" }]
    return (json as { data: string; valor: string }[]).slice(0, 12).map((d) => ({
      data: d.data,
      valor: parseFloat(d.valor),
    }));
  }

  if (country === "US") {
    // FRED: { observations: [{ date: "2024-01-01", value: "..." }] }
    const obs = (json as { observations?: { date: string; value: string }[] }).observations ?? [];
    return obs.slice(0, 12).map((d) => ({ data: d.date, valor: parseFloat(d.value) || 0 }));
  }

  // ECB e fallback genérico
  return generateFallbackData("2024");
}

function generateFallbackData(year: string): MacroDataPoint[] {
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  return months.map((m, i) => ({
    data: `${year}-${m}-01`,
    valor: parseFloat((3 + Math.sin(i * 0.6) * 2).toFixed(2)),
  }));
}
