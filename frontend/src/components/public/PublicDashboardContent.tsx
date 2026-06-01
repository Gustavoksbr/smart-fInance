// =============================================================================
// src/components/public/PublicDashboardContent.tsx
// Conteúdo do dashboard público (sem header, para uso dentro do PrivateDashboard)
// =============================================================================
import { useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { BarChart2 } from "lucide-react";

import { AVAILABLE_COUNTRIES, AVAILABLE_YEARS, type Country, getApiSources } from "../../data/apiSources";
import { getMockFinancialData } from "../../data/mockFinancial";
import { useMacroData } from "../../hooks/useMacroData";
import { ChartSkeleton, IndicatorSkeleton } from "../ui/Skeleton";
import ApiTransparencyCard from "./ApiTransparencyCard";

const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function PublicDashboardContent() {
    const [country, setCountry] = useState<Country>("BR");
    const [year, setYear] = useState("2024");

    const config = getApiSources(country, year);
    const { loading, results } = useMacroData(config.sources, country, year);
    const mockData = getMockFinancialData(year);

    const primaryMacro = results[0];
    const chartData = MONTHS_SHORT.map((month, i) => {
        const macroPoint = primaryMacro?.data?.[i];
        return {
            month,
            receita: mockData[i].receita,
            despesa: mockData[i].despesa,
            saldo: mockData[i].saldo,
            macro: macroPoint ? parseFloat(macroPoint.valor.toFixed(2)) : null,
        };
    });

    const totalReceita = mockData.reduce((s, d) => s + d.receita, 0);
    const totalDespesa = mockData.reduce((s, d) => s + d.despesa, 0);
    const avgMacro = primaryMacro?.data?.length
        ? (primaryMacro.data.reduce((s, d) => s + d.valor, 0) / primaryMacro.data.length).toFixed(2)
        : "—";

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
                    Dashboard Macroeconômico
                </h1>
                <p className="text-sm text-slate-400">
                    Dados públicos oficiais cruzados com sua análise financeira pessoal.
                </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                        País
                    </label>
                    <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value as Country)}
                        className="bg-obsidian-800 border border-white/10 text-slate-200 text-sm rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                    >
                        {AVAILABLE_COUNTRIES.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.flag} {c.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                        Ano
                    </label>
                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="bg-obsidian-800 border border-white/10 text-slate-200 text-sm rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                    >
                        {AVAILABLE_YEARS.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {loading ? (
                    <>
                        <IndicatorSkeleton />
                        <IndicatorSkeleton />
                        <IndicatorSkeleton />
                    </>
                ) : (
                    <>
                        <div className="glass-card p-5 animate-slide-up">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">
                                Receita Total
                            </p>
                            <p className="font-display text-xl font-bold text-emerald-400">
                                R$ {totalReceita.toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Dados simulados — {year}</p>
                        </div>

                        <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: "60ms" }}>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">
                                Despesa Total
                            </p>
                            <p className="font-display text-xl font-bold text-rose-400">
                                R$ {totalDespesa.toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Dados simulados — {year}</p>
                        </div>

                        <div
                            className="glass-card p-5 animate-slide-up col-span-2 sm:col-span-1"
                            style={{ animationDelay: "120ms" }}
                        >
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">
                                {primaryMacro?.label ?? "Indicador"} (média)
                            </p>
                            <p className="font-display text-xl font-bold text-amber-400">{avgMacro}%</p>
                            <p className="text-xs text-slate-500 mt-1">Via API pública — {year}</p>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    {loading ? (
                        <ChartSkeleton />
                    ) : (
                        <div className="glass-card p-6 animate-slide-up">
                            <div className="flex items-center gap-2 mb-1">
                                <BarChart2 size={15} className="text-slate-400" />
                                <h2 className="font-display font-semibold text-white text-sm">
                                    Fluxo Financeiro × {primaryMacro?.label ?? "Indicador Macro"}
                                </h2>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-5 ml-5">
                                Dados financeiros simulados cruzados com {config.countryName} — {year}
                            </p>

                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fb7185" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: "#64748b", fontSize: 11 }}
                                        axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: "#64748b", fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#1f2738",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "10px",
                                            fontSize: "12px",
                                            color: "#e2e8f0",
                                        }}
                                        cursor={{ stroke: "rgba(255,255,255,0.08)" }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
                                    <Area
                                        type="monotone"
                                        dataKey="receita"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="url(#gradReceita)"
                                        name="Receita"
                                        dot={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="despesa"
                                        stroke="#fb7185"
                                        strokeWidth={2}
                                        fill="url(#gradDespesa)"
                                        name="Despesa"
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <ApiTransparencyCard loading={loading} config={config} year={year} />
                </div>
            </div>
        </main>
    );
}
