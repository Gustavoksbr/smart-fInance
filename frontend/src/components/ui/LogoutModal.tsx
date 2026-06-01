import { X } from "lucide-react";

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 max-w-sm w-full animate-slide-up">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-display font-bold text-white text-lg">Confirmar Logout</h3>
                        <p className="text-sm text-slate-400 mt-1">Tem certeza que deseja sair?</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-obsidian-700 hover:bg-obsidian-600 text-slate-200 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
                    >
                        Sair
                    </button>
                </div>
            </div>
        </div>
    );
}
