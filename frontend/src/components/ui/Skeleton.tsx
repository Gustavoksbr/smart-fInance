// =============================================================================
// src/components/ui/Skeleton.tsx
//
// Componentes de skeleton animado usando Tailwind + animação shimmer
// definida no tailwind.config.js.
// =============================================================================
import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} />;
}

/** Skeleton para o card de gráfico (placeholder durante o carregamento) */
export function ChartSkeleton() {
  return (
    <div className="glass-card p-6 animate-fade-in">
      {/* Título */}
      <Skeleton className="h-5 w-48 mb-2" />
      <Skeleton className="h-3 w-72 mb-6" />

      {/* Barras simulando um gráfico */}
      <div className="flex items-end gap-3 h-40">
        {[65, 80, 45, 90, 55, 70, 85, 60, 75, 50, 88, 62].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      {/* Legenda */}
      <div className="flex gap-4 mt-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/** Skeleton para a lista de cards de indicadores */
export function IndicatorSkeleton() {
  return (
    <div className="glass-card p-5 animate-fade-in">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/** Skeleton para o card de fontes de API */
export function ApiSourcesSkeleton() {
  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
