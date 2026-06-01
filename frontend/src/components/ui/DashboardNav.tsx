import { TrendingUp, Globe, Wallet, LogOut, Github } from "lucide-react";

interface DashboardNavProps {
    currentView: "macro" | "personal";
    onViewChange: (view: "macro" | "personal") => void;
    userName?: string;
    onLogoutClick: () => void;
}

export default function DashboardNav({ currentView, onViewChange, userName, onLogoutClick }: DashboardNavProps) {
    return (
        <header className="border-b border-white/[0.06] bg-obsidian-900/80 backdrop-blur-md sticky top-0 z-50">
            {/* Layout Desktop: tudo em uma linha */}
            <div className="hidden md:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                            <TrendingUp size={14} className="text-emerald-400" />
                        </div>
                        <span className="font-display font-bold text-white text-sm tracking-tight">SmartFinance</span>
                        <a
                            href="https://github.com/Gustavoksbr/smart-fInance"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-200 hover:bg-obsidian-700 transition-colors"
                            title="GitHub"
                        >
                            <Github size={14} />
                            <span className="ml-1 text-[12px] font-medium">github</span>
                        </a>
                    </div>

                    {/* Navegação entre views */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onViewChange("macro")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${currentView === "macro"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                : "text-slate-400 hover:bg-obsidian-700 hover:text-slate-200"
                                }`}
                        >
                            <Globe size={12} /> Dashboard Macro
                        </button>
                        <button
                            onClick={() => onViewChange("personal")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${currentView === "personal"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                : "text-slate-400 hover:bg-obsidian-700 hover:text-slate-200"
                                }`}
                        >
                            <Wallet size={12} /> Meus Dashboards
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{userName}</span>
                        <button
                            onClick={onLogoutClick}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
                        >
                            <LogOut size={13} /> Sair
                        </button>
                    </div>
                </div>
            </div>

            {/* Layout Mobile: SmartFinance + userName/Sair em cima, botões embaixo */}
            <div className="md:hidden">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Linha superior: Logo + User/Sair */}
                    <div className="h-12 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <TrendingUp size={14} className="text-emerald-400" />
                            </div>
                            <span className="font-display font-bold text-white text-sm tracking-tight">SmartFinance</span>
                            <a
                                href="https://github.com/Gustavoksbr/smart-fInance"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-200 hover:bg-obsidian-700 transition-colors"
                                title="GitHub"
                            >
                                <Github size={14} />
                                <span className="ml-1 text-[12px] font-medium">github</span>
                            </a>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{userName}</span>
                            <button
                                onClick={onLogoutClick}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
                            >
                                <LogOut size={13} /> Sair
                            </button>
                        </div>
                    </div>

                    {/* Linha inferior: Botões de navegação */}
                    <div className="pb-3 flex items-center gap-2">
                        <button
                            onClick={() => onViewChange("macro")}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${currentView === "macro"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                : "text-slate-400 hover:bg-obsidian-700 hover:text-slate-200"
                                }`}
                        >
                            <Globe size={12} /> Dashboard Macro
                        </button>
                        <button
                            onClick={() => onViewChange("personal")}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${currentView === "personal"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                : "text-slate-400 hover:bg-obsidian-700 hover:text-slate-200"
                                }`}
                        >
                            <Wallet size={12} /> Meus Dashboards
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
