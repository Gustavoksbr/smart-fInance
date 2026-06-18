// =============================================================================
// src/components/private/PrivateDashboard.tsx
// =============================================================================
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    BarChart2,
    Download,
    Plus,
    Upload,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Edit2,
    Trash2,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import DashboardNav from "../ui/DashboardNav";
import LogoutModal from "../ui/LogoutModal";
import PublicDashboardContent from "../public/PublicDashboardContent";
import DashboardCharts from "./DashboardCharts";
import ChatbotAssistant from "./ChatbotAssistant";
import RecordTable from "./RecordTable";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

interface Dashboard { id: number; name: string; created_at: string; }
interface Record { id?: number; data: string; nome: string; descricao: string; categoria: string; valor: number; tipo: "receita" | "despesa"; }
interface UploadResult { rows_imported: number; rows_rejected: number; message: string; errors: { row: number; error: string }[]; }

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API = (path: string) => `${API_BASE_URL}/api${path}`;

export default function PrivateDashboard() {
    const { token, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { dashboardName } = useParams<{ dashboardName?: string }>();

    const [currentView, setCurrentView] = useState<"macro" | "personal">("personal");
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [selected, setSelected] = useState<Dashboard | null>(null);
    const [dashboardNotFound, setDashboardNotFound] = useState(false);
    const [records, setRecords] = useState<Record[]>([]);
    const [newDashName, setNewDashName] = useState("");
    const [loadingDash, setLoadingDash] = useState(false);
    const [loadingDashboards, setLoadingDashboards] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [uploadError, setUploadError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);
    const emptyRecord: Record = { data: "", nome: "", descricao: "", categoria: "", valor: 0, tipo: "receita" };
    const [newRecord, setNewRecord] = useState<Record>(emptyRecord);
    const [addingRecord, setAddingRecord] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [editingDashId, setEditingDashId] = useState<number | null>(null);
    const [editingDashName, setEditingDashName] = useState("");

    const updateRecord = async (id: number, record: Record) => {
        if (!selected || !token) return;
        try {
            const res = await fetchWithAuth(API(`/dashboards/${selected.id}/records/${id}`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(record),
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.detail || "Erro ao atualizar registro.");
                return;
            }
            setRecords((prev) =>
                prev.map((r) => (r.id === id ? { ...record, id } : r))
            );
        } catch (err) {
            console.error("Erro ao atualizar:", err);
        }
    };

    const deleteRecord = async (id: number) => {
        if (!selected || !token) return;
        if (!confirm("Tem certeza que deseja deletar este registro?")) return;
        try {
            const res = await fetchWithAuth(API(`/dashboards/${selected.id}/records/${id}`), {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.detail || "Erro ao deletar registro.");
                return;
            }
            setRecords((prev) => prev.filter((r) => r.id !== id));
        } catch (err) {
            console.error("Erro ao deletar:", err);
        }
    };

    const updateDashboard = async (dashId: number, newName: string) => {
        if (!token || !newName.trim()) return;
        try {
            const res = await fetchWithAuth(API(`/dashboards/${dashId}`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.slice(0, 50) }),
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.detail || "Erro ao atualizar dashboard.");
                return;
            }
            setDashboards((prev) =>
                prev.map((d) => (d.id === dashId ? { ...d, name: newName } : d))
            );
            setEditingDashId(null);
            setEditingDashName("");
        } catch (err) {
            console.error("Erro ao atualizar dashboard:", err);
        }
    };

    const deleteDashboard = async (dashId: number, dashName: string) => {
        if (!token) return;
        if (!confirm(`Tem certeza que deseja deletar "${dashName}" e todos os seus registros?`)) return;
        try {
            const res = await fetchWithAuth(API(`/dashboards/${dashId}`), {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.detail || "Erro ao deletar dashboard.");
                return;
            }
            setDashboards((prev) => prev.filter((d) => d.id !== dashId));
            if (selected?.id === dashId) {
                setSelected(null);
                navigate("/dashboards");
            }
        } catch (err) {
            console.error("Erro ao deletar:", err);
        }
    };


    useEffect(() => {
        const path = window.location.pathname;
        if (path === "/macro") {
            setCurrentView("macro");
        } else if (path.startsWith("/dashboards")) {
            setCurrentView("personal");
        }
    }, []);

    useEffect(() => {
        if (!token) return;
        setLoadingDashboards(true);
        fetchWithAuth(API("/dashboards/"))
            .then((res) => res.json())
            .then((data) => setDashboards(data))
            .catch(console.error)
            .finally(() => setLoadingDashboards(false));
    }, [token]);

    useEffect(() => {
        if (!dashboardName || dashboards.length === 0) {
            setDashboardNotFound(false);
            return;
        }

        const found = dashboards.find(
            (d) => d.name.toLowerCase().replace(/\s+/g, "-") === dashboardName.toLowerCase(),
        );

        if (found) {
            setSelected(found);
            setDashboardNotFound(false);
        } else {
            setSelected(null);
            setDashboardNotFound(true);
        }
    }, [dashboardName, dashboards]);

    useEffect(() => {
        if (!selected || !token) return;
        setLoadingRecords(true);
        setRecords([]);
        fetchWithAuth(API(`/dashboards/${selected.id}/records`))
            .then((res) => res.json())
            .then((data) => setRecords(data.records ?? []))
            .catch(console.error)
            .finally(() => setLoadingRecords(false));
    }, [selected, token]);

    const createDashboard = async () => {
        if (!newDashName.trim() || !token) return;
        setLoadingDash(true);
        const res = await fetchWithAuth(API("/dashboards/"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newDashName }),
        });
        const data = await res.json();
        setDashboards((prev) => [...prev, data]);
        setNewDashName("");
        const slug = data.name.toLowerCase().replace(/\s+/g, "-");
        navigate(`/dashboards/${slug}`);
        setLoadingDash(false);
    };

    const addRecord = async () => {
        if (!selected || !token) return;
        setAddingRecord(true);
        const res = await fetchWithAuth(API(`/dashboards/${selected.id}/records`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRecord),
        });
        const data = await res.json();
        if (res.ok) {
            // Fetch records again para obter os IDs corretos
            const recordsRes = await fetchWithAuth(API(`/dashboards/${selected.id}/records`));
            const recordsData = await recordsRes.json();
            setRecords(recordsData.records ?? []);
            setNewRecord(emptyRecord);
        } else {
            alert(data.detail || "Erro ao adicionar registro.");
        }
        setAddingRecord(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selected || !token) return;
        setUploading(true);
        setUploadResult(null);
        setUploadError("");
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetchWithAuth(API(`/dashboards/${selected.id}/upload`), {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail ?? "Erro no upload.");
            setUploadResult(data);
            const rRes = await fetchWithAuth(API(`/dashboards/${selected.id}/records`));
            const rData = await rRes.json();
            setRecords(rData.records ?? []);
        } catch (err: unknown) {
            setUploadError((err as Error).message);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (!file || !selected || !token || uploading) return;
        if (!file.name.endsWith(".xlsx")) {
            setUploadError("Apenas arquivos .xlsx são aceitos.");
            return;
        }
        setUploading(true);
        setUploadResult(null);
        setUploadError("");
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetchWithAuth(API(`/dashboards/${selected.id}/upload`), {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail ?? "Erro no upload.");
            setUploadResult(data);
            const rRes = await fetchWithAuth(API(`/dashboards/${selected.id}/records`));
            const rData = await rRes.json();
            setRecords(rData.records ?? []);
        } catch (err: unknown) {
            setUploadError((err as Error).message);
        } finally {
            setUploading(false);
        }
    };

    const handleExport = async () => {
        if (!selected || !token) return;
        try {
            const res = await fetchWithAuth(API(`/dashboards/${selected.id}/export`));
            if (!res.ok) throw new Error("Erro ao exportar registros.");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${selected.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Erro ao exportar:", err);
            alert("Erro ao exportar registros para Excel.");
        }
    };

    const handleLogout = () => { logout(); navigate("/macro"); };

    if (currentView === "macro") {
        return (
            <div className="min-h-screen bg-obsidian-950 text-slate-200">
                <DashboardNav
                    currentView={currentView}
                    onViewChange={(view) => {
                        setCurrentView(view);
                        if (view === "personal") {
                            navigate("/dashboards");
                        } else {
                            navigate("/macro");
                        }
                    }}
                    userName={user?.name}
                    onLogoutClick={() => setShowLogoutModal(true)}
                />
                <PublicDashboardContent />
                <LogoutModal
                    isOpen={showLogoutModal}
                    onClose={() => setShowLogoutModal(false)}
                    onConfirm={handleLogout}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-obsidian-950 text-slate-200">
            <DashboardNav
                currentView={currentView}
                onViewChange={(view) => {
                    setCurrentView(view);
                    if (view === "macro") {
                        navigate("/macro");
                    } else {
                        navigate("/dashboards");
                    }
                }}
                userName={user?.name}
                onLogoutClick={() => setShowLogoutModal(true)}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="font-display text-2xl font-bold text-white mb-6">Meus Dashboards</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <aside className="lg:col-span-1">
                        <div className="glass-card p-4">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Seus Dashboards</p>
                            <div className="flex flex-col gap-1 mb-4">
                                {loadingDashboards ? (
                                    <div className="flex flex-col gap-2 px-1 py-1">
                                        {[70, 50, 85].map((w, i) => (
                                            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                                                <div className="skeleton w-3 h-3 rounded flex-shrink-0" />
                                                <div
                                                    className="skeleton h-2.5"
                                                    style={{ width: `${w}%` }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {dashboards.map((d) => {
                                            const slug = d.name.toLowerCase().replace(/\s+/g, "-");
                                            const isEditing = editingDashId === d.id;
                                            return (
                                                <div key={d.id} className="flex items-center gap-1">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            maxLength={50}
                                                            value={editingDashName}
                                                            onChange={(e) => setEditingDashName(e.target.value)}
                                                            onBlur={() => updateDashboard(d.id, editingDashName)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") updateDashboard(d.id, editingDashName);
                                                                if (e.key === "Escape") setEditingDashId(null);
                                                            }}
                                                            autoFocus
                                                            className="flex-1 bg-obsidian-900 border border-emerald-500/40 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                navigate(`/dashboards/${slug}`);
                                                                setSelected(d);
                                                                setUploadResult(null);
                                                                setUploadError("");
                                                            }}
                                                            className={`flex-1 min-w-0 text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${selected?.id === d.id
                                                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                                                : "text-slate-400 hover:bg-obsidian-700 hover:text-slate-200"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <BarChart2 size={12} />
                                                                <span className="truncate block">{d.name}</span>
                                                            </div>
                                                        </button>
                                                    )}
                                                    {!isEditing && (
                                                        <div className="flex gap-1 flex-shrink-0">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingDashId(d.id);
                                                                    setEditingDashName(d.name);
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                                title="Renomear"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteDashboard(d.id, d.name)}
                                                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                                                title="Deletar"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {dashboards.length === 0 && (
                                            <p className="text-xs text-slate-600 italic px-3">Nenhum dashboard ainda.</p>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="border-t border-white/5 pt-3">
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Novo Dashboard</label>
                                    <span className="text-[9px] font-mono text-slate-500">{newDashName.length}/50</span>
                                </div>
                                <input
                                    value={newDashName}
                                    onChange={(e) => setNewDashName(e.target.value.slice(0, 50))}
                                    onKeyDown={(e) => e.key === "Enter" && createDashboard()}
                                    maxLength={50}
                                    placeholder="Nome do dashboard..."
                                    className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 mb-2"
                                />
                                <button
                                    onClick={createDashboard}
                                    disabled={loadingDash || !newDashName.trim()}
                                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 text-emerald-400 text-xs font-semibold py-2 rounded-xl transition-colors"
                                >
                                    <Plus size={12} /> Criar
                                </button>
                            </div>
                        </div>
                    </aside>

                    <div className="lg:col-span-3 flex flex-col gap-5">
                        {dashboardNotFound ? (
                            <div className="glass-card p-12 text-center">
                                <AlertCircle size={48} className="text-rose-400 mx-auto mb-4" />
                                <h2 className="font-display font-bold text-white text-xl mb-2">Dashboard não encontrado</h2>
                                <p className="text-slate-400 text-sm mb-6">
                                    O dashboard "{dashboardName}" não existe ou você não tem permissão para acessá-lo.
                                </p>
                                <button
                                    onClick={() => navigate("/dashboards")}
                                    className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
                                >
                                    Voltar para Meus Dashboards
                                </button>
                            </div>
                        ) : !selected ? (
                            <div className="glass-card p-12 text-center">
                                <BarChart2 size={32} className="text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">Selecione ou crie um dashboard para começar.</p>
                            </div>
                        ) : (
                            <>
                                <div className="glass-card p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                        <div>
                                            <h2 className="font-display font-semibold text-white text-sm">{selected.name}</h2>
                                            <p className="text-xs text-slate-500">Importar ou inserir registros financeiros</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={`${API_BASE_URL}/api/dashboards/template`}
                                                download
                                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 px-3 py-2 rounded-xl transition-colors"
                                            >
                                                <Download size={12} />
                                                Template Excel
                                            </a>
                                            <button
                                                onClick={handleExport}
                                                disabled={records.length === 0}
                                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 px-3 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={records.length === 0 ? "Nenhum registro para exportar" : "Exportar todos os registros"}
                                            >
                                                <Download size={12} />
                                                Exportar Excel
                                            </button>
                                        </div>
                                    </div>

                                    <label
                                        htmlFor="excel-upload"
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onDragEnter={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onDrop={handleDrop}
                                        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-emerald-500/30 rounded-xl p-6 cursor-pointer transition-colors group"
                                    >
                                        {uploading ? (
                                            <Loader2 size={22} className="text-emerald-400 animate-spin" />
                                        ) : (
                                            <Upload size={22} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                        )}
                                        <p className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors text-center">
                                            {uploading ? "Processando planilha..." : "Clique ou arraste um arquivo .xlsx"}
                                        </p>
                                        <input
                                            id="excel-upload"
                                            ref={fileRef}
                                            type="file"
                                            accept=",.xlsx"
                                            className="hidden"
                                            onChange={handleUpload}
                                            disabled={uploading}
                                        />
                                    </label>

                                    {uploadResult && (
                                        <div className={`mt-3 flex items-start gap-2 rounded-xl p-4 animate-fade-in ${uploadResult.rows_rejected === 0 ? "bg-emerald-500/8 border border-emerald-500/20" : "bg-amber-500/8 border border-amber-500/20"}`}>
                                            <CheckCircle2 size={14} className={`flex-shrink-0 mt-0.5 ${uploadResult.rows_rejected === 0 ? "text-emerald-400" : "text-amber-400"}`} />
                                            <div className="w-full">
                                                <p className={`text-xs font-semibold ${uploadResult.rows_rejected === 0 ? "text-emerald-300" : "text-amber-300"}`}>{uploadResult.message}</p>
                                                {uploadResult.errors.length > 0 && (
                                                    <div className="mt-2 max-h-48 overflow-y-auto">
                                                        <ul className="flex flex-col gap-1">
                                                            {uploadResult.errors.map((e) => (
                                                                <li key={e.row} className="text-[10px] text-rose-400 pl-2 border-l border-rose-400/30">
                                                                    <span className="font-semibold">Linha {e.row}:</span> {e.error}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {uploadResult.errors.length > 10 && (
                                                            <p className="text-[9px] text-slate-500 mt-2 italic">
                                                                ... e mais {uploadResult.errors.length - 10} erro(s)
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {uploadError && (
                                        <div className="mt-3 flex items-center gap-2 bg-rose-500/8 border border-rose-500/20 rounded-xl p-3 animate-fade-in">
                                            <AlertCircle size={13} className="text-rose-400 flex-shrink-0" />
                                            <p className="text-xs text-rose-300">{uploadError}</p>
                                        </div>
                                    )}
                                </div>

                                <DashboardCharts records={records} loading={loadingRecords} />

                                <div className="glass-card p-5">
                                    <h3 className="font-display font-semibold text-white text-sm mb-4">Inserção Manual</h3>
                                    <div className="grid grid-cols-1 gap-3 mb-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">
                                                    Data
                                                </label>
                                                <input
                                                    type="date"
                                                    value={newRecord.data}
                                                    onChange={(e) => setNewRecord((prev) => ({ ...prev, data: e.target.value }))}
                                                    className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Nome</label>
                                                    <span className="text-[9px] font-mono text-slate-500">{newRecord.nome.length}/50</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    maxLength={50}
                                                    placeholder="Nome do registro"
                                                    value={newRecord.nome}
                                                    onChange={(e) => setNewRecord((prev) => ({ ...prev, nome: e.target.value.slice(0, 50) }))}
                                                    className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Descrição</label>
                                                <span className="text-[9px] font-mono text-slate-500">{newRecord.descricao.length}/200</span>
                                            </div>
                                            <textarea
                                                maxLength={200}
                                                placeholder="Descrição (opcional)"
                                                value={newRecord.descricao}
                                                onChange={(e) => setNewRecord((prev) => ({ ...prev, descricao: e.target.value.slice(0, 200) }))}
                                                rows={2}
                                                className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 resize-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Categoria</label>
                                                    <span className="text-[9px] font-mono text-slate-500">{newRecord.categoria.length}/50</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    maxLength={50}
                                                    placeholder="Ex: Alimentação"
                                                    value={newRecord.categoria}
                                                    onChange={(e) => setNewRecord((prev) => ({ ...prev, categoria: e.target.value.slice(0, 50) }))}
                                                    className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Valor</label>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={newRecord.valor || ""}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value || "0");
                                                        if (Number.isNaN(val)) return setNewRecord((prev) => ({ ...prev, valor: 0 }));
                                                        if (val < 0) return;
                                                        if (val > 999999999.99) return; // limite máximo
                                                        setNewRecord((prev) => ({ ...prev, valor: val }));
                                                    }}
                                                    className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <select
                                                value={newRecord.tipo}
                                                onChange={(e) => setNewRecord((prev) => ({ ...prev, tipo: e.target.value as "receita" | "despesa" }))}
                                                className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/40"
                                            >
                                                <option value="receita">Receita</option>
                                                <option value="despesa">Despesa</option>
                                            </select>
                                            <button
                                                onClick={addRecord}
                                                disabled={addingRecord || !newRecord.data || !newRecord.nome || !newRecord.categoria || newRecord.valor <= 0}
                                                className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 text-emerald-400 text-xs font-semibold py-2 rounded-xl transition-colors"
                                            >
                                                {addingRecord ? "Adicionando..." : "Adicionar Registro"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <RecordTable records={records} onUpdate={updateRecord} onDelete={deleteRecord} />
                                <ChatbotAssistant dashboardId={selected.id} dashboardName={selected.name} />
                            </>
                        )}
                    </div>
                </div>
            </main>

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
}
