import { useState } from "react";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatbotAssistantProps {
  dashboardId: number;
  dashboardName: string;
  token: string;
}

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const suggestions = [
  {
    label: "Gerar resumo",
    value: "Faça um resumo do dashboard atual, destacando receitas, despesas, saldo e insights importantes.",
  },
  {
    label: "Gerar sugestões",
    value: "Sugira melhorias financeiras e ações com base nos dados deste dashboard.",
  },
  {
    label: "Analisar despesas",
    value: "Analise as principais despesas e indique onde posso reduzir custos.",
  },
  {
    label: "Planejar o próximo mês",
    value: "Crie um plano simples para o próximo mês com base nos registros deste dashboard.",
  },
];

export default function ChatbotAssistant({ dashboardId, dashboardName, token }: ChatbotAssistantProps) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Record<number, ChatMessage[]>>({});
  const [error, setError] = useState("");

  const messages = history[dashboardId] ?? [];

  const sendPrompt = async (prompt: string) => {
    if (!prompt.trim()) return;

    const newMessage: ChatMessage = { role: "user", text: prompt.trim() };
    const updatedMessages = [...messages, newMessage];
    setHistory((prev) => ({
      ...prev,
      [dashboardId]: updatedMessages,
    }));
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dashboard_id: dashboardId,
          prompt,
          messages: updatedMessages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Não foi possível conectar ao assistente.");
        return;
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        text: data.answer || "Sem resposta do assistente.",
      };
      setHistory((prev) => ({
        ...prev,
        [dashboardId]: [...(prev[dashboardId] ?? updatedMessages), assistantMessage],
      }));
    } catch (err: unknown) {
      setError((err as Error).message || "Erro na requisição ao assistente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendPrompt(input);
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 z-50 flex flex-col items-end sm:right-6 sm:left-auto">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400"
        aria-label="Abrir chat assistente"
      >
        <MessageSquare size={22} />
      </button>

      {open && (
        <div className="mt-3 w-full max-w-[360px] sm:w-[360px] max-h-[75vh] rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden" style={{ maxWidth: "calc(100vw - 2rem)" }}>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-white">Assistente do Dashboard</p>
              <p className="text-xs text-slate-400">{dashboardName}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Fechar chat"
            >
              <X size={16} />
            </button>
          </div>

          {messages.length === 0 && (
            <div className="px-4 py-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {suggestions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => sendPrompt(item.value)}
                    className="w-full rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-left text-xs text-slate-200 transition hover:border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-[52vh] space-y-3 overflow-y-auto px-4 pb-3 pt-1">
            {messages.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                <p>Faça uma pergunta ou selecione uma sugestão para que o assistente analise este dashboard.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`rounded-3xl p-3 text-sm ${message.role === "user" ? "bg-slate-900 text-slate-100 self-end" : "bg-slate-800 text-slate-200"}`}>
                  <div className="font-semibold text-xs uppercase tracking-[0.15em] text-slate-500">
                    {message.role === "user" ? "Você" : "Assistente"}
                  </div>
                  {message.role === "assistant" ? (
                    <div className="mt-1 break-words text-slate-200">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        className="prose prose-invert m-0 leading-relaxed"
                        components={{
                          p: ({ children }) => <p className="mt-1 break-words text-slate-200">{children}</p>,
                          ul: ({ children }) => <ul className="mt-2 list-disc pl-5 text-slate-200">{children}</ul>,
                          ol: ({ children }) => <ol className="mt-2 list-decimal pl-5 text-slate-200">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-line break-words">{message.text}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 px-4 py-3">
            {error && <p className="mb-2 text-xs text-rose-400">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="dashboard-chat-input" className="sr-only">Mensagem</label>
              <input
                id="dashboard-chat-input"
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Digite sua pergunta..."
                className="w-full flex-1 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500/40"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-emerald-500 px-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50 sm:w-auto"
              >
                {loading ? <Sparkles size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
