// =============================================================================
// src/utils/fetchWithAuth.ts — Wrapper do fetch com tratamento de erro 401
// =============================================================================

import { useAuthStore } from "../store/authStore";

/**
 * Wrapper do fetch que automaticamente:
 * - Adiciona o header de autenticação se um token estiver disponível
 * - Detecta erros 401 (token expirado/inválido)
 * - Limpa o localStorage e redireciona para a página inicial
 */
export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const { token, logout } = useAuthStore.getState();

    // Adiciona o header de autorização se houver token
    const headers = new Headers(options.headers);
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    // Não adicionar Content-Type para FormData (o navegador define automaticamente)
    // Isso é importante para upload de arquivos
    const isFormData = options.body instanceof FormData;
    if (!isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Se receber 401, significa que o token está inválido/expirado
    if (response.status === 401) {
        // Limpa o estado de autenticação
        logout();

        // Redireciona para a página inicial
        window.location.href = "/macro";

        // Lança um erro para interromper o fluxo
        throw new Error("Token expirado. Redirecionando para login...");
    }

    return response;
}

/**
 * Função auxiliar para criar headers de autenticação
 */
export function authHeader(token: string, contentType = "application/json") {
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
    };
}
