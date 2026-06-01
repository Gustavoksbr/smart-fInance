// =============================================================================
// src/components/public/ApiTransparencyCard.tsx
//
// Card de transparência: exibe os links reais das APIs públicas que estão
// sendo consumidas com base no País e Ano selecionados.
// Quando `loading` é true, exibe o skeleton animado.
// =============================================================================
import { ExternalLink, Radio, Wifi } from "lucide-react";
import { ApiSourcesSkeleton } from "../ui/Skeleton";
import { type CountryApiConfig } from "../../data/apiSources";

interface Props {
  loading: boolean;
  config: CountryApiConfig;
  year: string;
}

export default function ApiTransparencyCard({ loading, config, year }: Props) {
  if (loading) return <ApiSourcesSkeleton />;

  return (
    <div className="glass-card p-4 sm:p-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-2.5 mb-4 sm:mb-5">
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <Wifi size={13} className="text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] sm:text-xs font-display font-semibold text-emerald-400 uppercase tracking-widest truncate">
            Fontes de Dados ao Vivo
          </span>
        </div>
      </div>

      {/* Country & year badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl sm:text-2xl flex-shrink-0">{config.flag}</span>
        <div className="min-w-0">
          <p className="text-sm font-display font-semibold text-white truncate">{config.countryName}</p>
          <p className="text-xs text-slate-400">Ano de referência: {year}</p>
        </div>
      </div>

      {/* API source list */}
      <div className="flex flex-col gap-3">
        {config.sources.map((src) => (
          <div key={src.series} className="group">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Radio size={11} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-300 break-words">{src.label}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mb-1.5 ml-4 leading-relaxed">{src.description}</p>
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="api-pill ml-4 group/link max-w-full"
              title={src.url}
            >
              <ExternalLink size={10} className="flex-shrink-0" />
              <span className="truncate text-[10px] sm:text-xs">{src.url}</span>
            </a>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="mt-4 sm:mt-5 text-[10px] text-slate-600 border-t border-white/5 pt-3 leading-relaxed">
        Os dados são buscados diretamente pelo navegador a partir das APIs públicas oficiais.
        Nenhum dado é armazenado em nossos servidores nesta fase.
      </p>
    </div>
  );
}
