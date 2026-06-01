import { useState } from "react";
import { Edit2, Trash2, Save, X, ChevronDown, ChevronUp } from "lucide-react";

interface Record {
    id?: number;
    data: string;
    nome: string;
    descricao: string;
    categoria: string;
    valor: number;
    tipo: "receita" | "despesa";
}

interface RecordTableProps {
    records: Record[];
    onUpdate: (id: number, record: Record) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

export default function RecordTable({ records, onUpdate, onDelete }: RecordTableProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Record | null>(null);
    const [filter, setFilter] = useState("");
    const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());

    const toggleDescription = (id: number) => {
        setExpandedDescriptions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const startEdit = (id: number, record: Record) => {
        setEditingId(id);
        setEditForm({ ...record });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const saveEdit = async (id: number) => {
        if (!editForm) return;
        await onUpdate(id, editForm);
        setEditingId(null);
        setEditForm(null);
    };

    const filteredRecords = records.filter((r) =>
        r.nome?.toLowerCase().includes(filter.toLowerCase()) ||
        r.descricao?.toLowerCase().includes(filter.toLowerCase()) ||
        r.categoria.toLowerCase().includes(filter.toLowerCase()) ||
        r.tipo.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-white text-sm">
                    Registros <span className="text-xs text-slate-500 font-body font-normal">({filteredRecords.length})</span>
                </h3>
                <input
                    type="text"
                    placeholder="Filtrar por nome, descrição, categoria ou tipo..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-obsidian-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 w-80"
                />
            </div>

            {filteredRecords.length === 0 ? (
                <p className="text-xs text-slate-600 italic">Nenhum registro encontrado.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-slate-500 border-b border-white/5">
                                {["Data", "Nome", "Descrição", "Categoria", "Valor", "Tipo", "Ações"].map((h) => (
                                    <th key={h} className="text-left pb-2 pr-4 font-semibold uppercase tracking-wider text-[10px]">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((r) => {
                                const isEditing = editingId === r.id;
                                const isExpanded = r.id ? expandedDescriptions.has(r.id) : false;
                                const descricaoLimit = 100;
                                const needsTruncate = r.descricao && r.descricao.length > descricaoLimit;

                                return (
                                    <tr key={r.id || Math.random()} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                        {isEditing && editForm ? (
                                            <>
                                                <td className="py-2.5 pr-4">
                                                    <input
                                                        type="date"
                                                        value={editForm.data}
                                                        onChange={(e) => setEditForm({ ...editForm, data: e.target.value })}
                                                        className="bg-obsidian-800 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 w-full"
                                                    />
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <input
                                                        type="text"
                                                        value={editForm.nome}
                                                        onChange={(e) => setEditForm({ ...editForm, nome: e.target.value.slice(0, 50) })}
                                                        maxLength={50}
                                                        className="bg-obsidian-800 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 w-full"
                                                    />
                                                    <div className="text-[9px] text-slate-500 mt-0.5">{editForm.nome.length}/50</div>
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <textarea
                                                        value={editForm.descricao || ""}
                                                        onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value.slice(0, 200) })}
                                                        maxLength={200}
                                                        rows={3}
                                                        placeholder="Descrição (opcional)"
                                                        className="bg-obsidian-800 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 w-full resize-none"
                                                    />
                                                    <div className="text-[9px] text-slate-500 mt-0.5">{(editForm.descricao || "").length}/200</div>
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <input
                                                        type="text"
                                                        value={editForm.categoria}
                                                        onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value.slice(0, 50) })}
                                                        maxLength={50}
                                                        className="bg-obsidian-800 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 w-full"
                                                    />
                                                    <div className="text-[9px] text-slate-500 mt-0.5">{editForm.categoria.length}/50</div>
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <input
                                                        type="number"
                                                        value={editForm.valor}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (val < 0) return;
                                                            if (val > 999999999.99) return;
                                                            setEditForm({ ...editForm, valor: val });
                                                        }}
                                                        min="0"
                                                        max="999999999.99"
                                                        step="0.01"
                                                        className="bg-obsidian-800 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 w-full"
                                                    />
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <select
                                                        value={editForm.tipo}
                                                        onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value as "receita" | "despesa" })}
                                                        className="bg-obsidian-800 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 w-full"
                                                    >
                                                        <option value="receita">Receita</option>
                                                        <option value="despesa">Despesa</option>
                                                    </select>
                                                </td>
                                                <td className="py-2.5">
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        <button
                                                            onClick={() => r.id && saveEdit(r.id)}
                                                            className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                                                            title="Salvar"
                                                        >
                                                            <Save size={14} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="p-1 text-slate-400 hover:bg-slate-500/10 rounded transition-colors"
                                                            title="Cancelar"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="py-2.5 pr-4 text-slate-400 font-mono align-top">{r.data}</td>
                                                <td className="py-2.5 pr-4 text-slate-200 align-top">{r.nome}</td>
                                                <td className="py-2.5 pr-4 text-slate-300 align-top" style={{ maxWidth: "300px" }}>
                                                    {r.descricao ? (
                                                        <div className="break-words">
                                                            {isExpanded || !needsTruncate ? (
                                                                <span className="whitespace-pre-wrap">{r.descricao}</span>
                                                            ) : (
                                                                <span>{r.descricao.slice(0, descricaoLimit)}...</span>
                                                            )}
                                                            {needsTruncate && (
                                                                <button
                                                                    onClick={() => r.id && toggleDescription(r.id)}
                                                                    className="ml-2 text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-0.5 text-[10px] transition-colors whitespace-nowrap"
                                                                >
                                                                    {isExpanded ? (
                                                                        <>
                                                                            ver menos <ChevronUp size={10} />
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            ver mais <ChevronDown size={10} />
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600 italic text-[10px]">Sem descrição</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 pr-4 text-slate-400 align-top">{r.categoria}</td>
                                                <td className={`py-2.5 pr-4 font-mono font-semibold align-top ${r.tipo === "receita" ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {r.tipo === "receita" ? "+" : "-"}R$ {Number(r.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-2.5 pr-4 align-top">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.tipo === "receita" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                                                        {r.tipo}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 align-top">
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => r.id && startEdit(r.id, r)}
                                                            className="p-1 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => r.id && onDelete(r.id)}
                                                            className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                                            title="Deletar"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
