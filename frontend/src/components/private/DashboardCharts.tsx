import { useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Pie,
    PieChart,
    Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Record {
    data: string;
    descricao: string;
    categoria: string;
    valor: number;
    tipo: string;
}

interface DashboardChartsProps {
    records: Record[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name, fill }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill={fill}
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
            fontSize={12}
            fontWeight={500}
        >
            {`${name} (${(percent * 100).toFixed(0)}%)`}
        </text>
    );
};

export default function DashboardCharts({ records }: DashboardChartsProps) {
    const stats = useMemo(() => {
        const receitas = records.filter((r) => r.tipo === "receita");
        const despesas = records.filter((r) => r.tipo === "despesa");

        const totalReceita = receitas.reduce((sum, r) => sum + r.valor, 0);
        const totalDespesa = despesas.reduce((sum, r) => sum + r.valor, 0);
        const saldo = totalReceita - totalDespesa;

        const monthlyData: { [key: string]: { receita: number; despesa: number } } = {};
        records.forEach((r) => {
            const month = r.data.substring(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = { receita: 0, despesa: 0 };
            }
            if (r.tipo === "receita") {
                monthlyData[month].receita += r.valor;
            } else {
                monthlyData[month].despesa += r.valor;
            }
        });

        const monthlyChartData = Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({
                month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
                receita: data.receita,
                despesa: data.despesa,
                saldo: data.receita - data.despesa,
            }));

        const categoryData: { [key: string]: number } = {};
        records.forEach((r) => {
            categoryData[r.categoria] = (categoryData[r.categoria] || 0) + r.valor;
        });

        const categoryChartData = Object.entries(categoryData)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 6)
            .map(([name, value]) => ({ name, value: value as number }));

        return {
            totalReceita,
            totalDespesa,
            saldo,
            monthlyChartData,
            categoryChartData,
        };
    }, [records]);

    if (records.length === 0) {
        return null;
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <TrendingUp size={16} className="text-emerald-400" />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Receitas</p>
                    </div>
                    <p className="font-display text-xl font-bold text-emerald-400">
                        R$ {stats.totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
                            <TrendingDown size={16} className="text-rose-400" />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Despesas</p>
                    </div>
                    <p className="font-display text-xl font-bold text-rose-400">
                        R$ {stats.totalDespesa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg ${stats.saldo >= 0 ? "bg-blue-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
                            <DollarSign size={16} className={stats.saldo >= 0 ? "text-blue-400" : "text-amber-400"} />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Saldo</p>
                    </div>
                    <p className={`font-display text-xl font-bold ${stats.saldo >= 0 ? "text-blue-400" : "text-amber-400"}`}>
                        R$ {stats.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {stats.monthlyChartData.length > 0 && (
                    <div className="glass-card p-5">
                        <h3 className="font-display font-semibold text-white text-sm mb-4">Fluxo Mensal</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={stats.monthlyChartData}>
                                <defs>
                                    <linearGradient id="gradReceitaDash" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradDespesaDash" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fb7185" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1f2738",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "10px",
                                        fontSize: "12px",
                                        color: "#ffffff",
                                    }}
                                    itemStyle={{
                                        color: "#ffffff",
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                                <Area type="monotone" dataKey="receita" stroke="#10b981" fill="url(#gradReceitaDash)" name="Receita" />
                                <Area type="monotone" dataKey="despesa" stroke="#fb7185" fill="url(#gradDespesaDash)" name="Despesa" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {stats.categoryChartData.length > 0 && (
                    <div className="glass-card p-5">
                        <h3 className="font-display font-semibold text-white text-sm mb-4">Top 6 Categorias</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={stats.categoryChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    outerRadius={70}
                                    dataKey="value"
                                >
                                    {stats.categoryChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "#1f2738",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "10px",
                                        fontSize: "12px",
                                        color: "#ffffff",
                                    }}
                                    itemStyle={{
                                        color: "#ffffff",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </>
    );
}
