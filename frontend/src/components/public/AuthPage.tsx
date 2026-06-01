// =============================================================================
// src/components/public/AuthPage.tsx
//
// Página de autenticação (Login / Cadastro).
//
// VALIDAÇÃO DE SENHA NO FRONT-END (espelho do backend):
//   - Mínimo 8 caracteres
//   - MÁXIMO 72 caracteres ← limite bcrypt exposto ao usuário com contador
//   - Ao menos 1 maiúscula e 1 número (mesmas regras do schema Pydantic)
//
// O atributo `maxLength={72}` no <input> impede fisicamente a digitação
// de mais de 72 chars. O contador visual e a mensagem de erro reforçam
// a transparência sobre o limite.
// =============================================================================
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TrendingUp, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

// ── Constantes espelhadas do backend (app/schemas/user.py) ──
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // limite estrutural bcrypt
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface FormState {
  name: string;
  email: string;
  password: string;
}

function validatePassword(pwd: string): string[] {
  const errs: string[] = [];
  if (pwd.length < PASSWORD_MIN) errs.push(`Mínimo ${PASSWORD_MIN} caracteres.`);
  if (pwd.length > PASSWORD_MAX) errs.push(`Máximo ${PASSWORD_MAX} caracteres (limite bcrypt).`);
  if (!/[A-Z]/.test(pwd)) errs.push("Ao menos uma letra maiúscula.");
  if (!/[0-9]/.test(pwd)) errs.push("Ao menos um número.");
  return errs;
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState<FormState>({ name: "", email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const pwdErrors = mode === "register" ? validatePassword(form.password) : [];
  const pwdStrength = Math.min(100, ((PASSWORD_MAX - pwdErrors.length * 20) / PASSWORD_MAX) * 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setApiError("");
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (mode === "register" && pwdErrors.length > 0) return;

    setLoading(true);
    setApiError("");

    try {
      const endpoint = mode === "login" ? `${API_BASE_URL}/api/auth/login` : `${API_BASE_URL}/api/auth/register`;
      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        // Trata erros de validação do Pydantic
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // Erros de validação do Pydantic vêm como array
            const errorMessages = data.detail.map((err: any) => {
              const field = err.loc?.[1] || err.loc?.[0] || "campo";
              const msg = err.msg || "inválido";
              return `${field}: ${msg}`;
            }).join(", ");
            throw new Error(errorMessages);
          } else if (typeof data.detail === "string") {
            throw new Error(data.detail);
          } else {
            throw new Error(JSON.stringify(data.detail));
          }
        }
        throw new Error("Erro desconhecido ao processar requisição.");
      }

      setAuth(data.access_token, data.user);
      navigate("/app");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("Erro desconhecido. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <TrendingUp size={16} className="text-emerald-400" />
        </div>
        <span className="font-display font-bold text-white text-base tracking-tight">SmartFinance</span>
      </Link>

      {/* Card */}
      <div className="glass-card p-8 w-full max-w-md animate-slide-up">
        {/* Tabs */}
        <div className="flex gap-1 bg-obsidian-900 rounded-xl p-1 mb-7">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setApiError(""); }}
              className={`flex-1 py-2 text-sm font-display font-semibold rounded-lg transition-all ${mode === m
                ? "bg-obsidian-700 text-white"
                : "text-slate-500 hover:text-slate-300"
                }`}
            >
              {m === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          {mode === "register" && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-slate-400 font-medium">Nome</label>
                <span className="text-[10px] font-mono text-slate-500">
                  {form.name.length}/50
                </span>
              </div>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Seu nome"
                maxLength={50}
                className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-slate-400 font-medium">E-mail</label>
              {mode === "register" && (
                <span className="text-[10px] font-mono text-slate-500">
                  {form.email.length}/255
                </span>
              )}
            </div>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="voce@email.com"
              maxLength={255}
              className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Senha com validação visual */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-slate-400 font-medium">Senha</label>
              {mode === "register" && (
                <span
                  className={`text-[10px] font-mono font-semibold ${form.password.length > PASSWORD_MAX - 10
                    ? "text-rose-400"
                    : "text-slate-500"
                    }`}
                >
                  {form.password.length}/{PASSWORD_MAX}
                  {form.password.length > PASSWORD_MAX - 10 && " ⚠ limite bcrypt"}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                name="password"
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                maxLength={PASSWORD_MAX} /* ← impedimento físico de digitação além de 72 chars */
                className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
              />
              <button
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Barra de força da senha (cadastro) */}
            {mode === "register" && form.password.length > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-obsidian-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${pwdStrength < 40
                      ? "bg-rose-500"
                      : pwdStrength < 70
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                      }`}
                    style={{ width: `${pwdStrength}%` }}
                  />
                </div>
              </div>
            )}

            {/* Lista de erros de validação */}
            {mode === "register" && form.password.length > 0 && pwdErrors.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {pwdErrors.map((err) => (
                  <li key={err} className="flex items-center gap-1.5 text-[11px] text-rose-400">
                    <AlertCircle size={10} />
                    {err}
                  </li>
                ))}
              </ul>
            )}

            {mode === "register" && form.password.length >= PASSWORD_MIN && pwdErrors.length === 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
                <CheckCircle2 size={10} />
                Senha válida
              </p>
            )}
          </div>
        </div>

        {/* Aviso bcrypt (somente no cadastro) */}
        {mode === "register" && (
          <div className="mt-4 flex gap-2 bg-amber-400/5 border border-amber-400/15 rounded-xl p-3">
            <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              <strong>Limite de 72 caracteres:</strong> o algoritmo bcrypt ignora bytes após o 72º.
              Este campo impede fisicamente senhas maiores para evitar a vulnerabilidade de truncamento.
            </p>
          </div>
        )}

        {/* Erro de API */}
        {apiError && (
          <div className="mt-4 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
            <AlertCircle size={13} className="text-rose-400 flex-shrink-0" />
            <p className="text-xs text-rose-300">{apiError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || (mode === "register" && pwdErrors.length > 0)}
          className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-obsidian-950 font-display font-bold text-sm py-3 rounded-xl transition-colors"
        >
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </div>
    </div>
  );
}
