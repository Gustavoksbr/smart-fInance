// =============================================================================
// src/data/mockFinancial.ts
//
// Dados financeiros mockados (receitas e despesas mensais) que serão
// cruzados com os dados macroeconômicos reais no Recharts.
// =============================================================================

export interface MockFinancialPoint {
  month: string;   // "Jan", "Fev", ...
  receita: number;
  despesa: number;
  saldo: number;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Gera dados mockados com variação aleatória mas determinística por ano. */
export function getMockFinancialData(year: string): MockFinancialPoint[] {
  const seed = parseInt(year, 10) % 100;
  return MONTHS.map((month, i) => {
    const receita = 5000 + ((seed * (i + 1) * 137) % 2000);
    const despesa = 3000 + ((seed * (i + 2) * 97) % 1800);
    return { month, receita, despesa, saldo: receita - despesa };
  });
}
