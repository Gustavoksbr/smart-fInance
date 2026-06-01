// =============================================================================
// src/data/apiSources.ts
//
// Mapeamento dos endpoints públicos reais consumidos pelo dashboard.
// Ao alterar País/Ano nos selects, este mapa dita quais URLs serão
// exibidas no card de transparência E efetivamente buscadas.
// =============================================================================

export type Country = "BR" | "US" | "EU";

export interface ApiSource {
  label: string;
  url: string;
  description: string;
  series: string; // identificador interno
}

export interface CountryApiConfig {
  countryName: string;
  flag: string;
  sources: ApiSource[];
}

/**
 * Retorna a configuração de APIs para o par (país, ano) selecionado.
 * Para o Brasil, usamos a API pública do Banco Central (SGS/PTAX).
 * Para EUA e Europa, usamos a FRED (Federal Reserve) e ECB Data Portal.
 */
export function getApiSources(country: Country, year: string): CountryApiConfig {
  const configs: Record<Country, CountryApiConfig> = {
    BR: {
      countryName: "Brasil",
      flag: "🇧🇷",
      sources: [
        {
          label: "IPCA (Inflação)",
          series: "ipca",
          description: "Índice de Preços ao Consumidor Amplo — Banco Central do Brasil (SGS #433)",
          url: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01/01/${year}&dataFinal=31/12/${year}`,
        },
        {
          label: "Taxa Selic",
          series: "selic",
          description: "Taxa básica de juros da economia — Banco Central do Brasil (SGS #11)",
          url: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json&dataInicial=01/01/${year}&dataFinal=31/12/${year}`,
        },
        {
          label: "PIB Mensal",
          series: "pib",
          description: "Produto Interno Bruto mensal — Banco Central do Brasil (SGS #4380)",
          url: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.4380/dados?formato=json&dataInicial=01/01/${year}&dataFinal=31/12/${year}`,
        },
      ],
    },

    US: {
      countryName: "Estados Unidos",
      flag: "🇺🇸",
      sources: [
        {
          label: "CPI (Inflação)",
          series: "cpi",
          description: "Consumer Price Index — Federal Reserve Economic Data (FRED)",
          url: `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&observation_start=${year}-01-01&observation_end=${year}-12-31&api_key=DEMO&file_type=json`,
        },
        {
          label: "Federal Funds Rate",
          series: "fed_rate",
          description: "Taxa básica de juros do Fed — FRED Series FEDFUNDS",
          url: `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&observation_start=${year}-01-01&observation_end=${year}-12-31&api_key=DEMO&file_type=json`,
        },
        {
          label: "GDP Growth",
          series: "gdp",
          description: "Crescimento do PIB trimestral (A215RL1Q225SBEA) — FRED",
          url: `https://api.stlouisfed.org/fred/series/observations?series_id=A215RL1Q225SBEA&observation_start=${year}-01-01&observation_end=${year}-12-31&api_key=DEMO&file_type=json`,
        },
      ],
    },

    EU: {
      countryName: "Zona do Euro",
      flag: "🇪🇺",
      sources: [
        {
          label: "HICP (Inflação)",
          series: "hicp",
          description: "Harmonised Index of Consumer Prices — ECB Data Portal",
          url: `https://data-api.ecb.europa.eu/service/data/ICP/M.U2.N.000000.4.ANR?startPeriod=${year}-01&endPeriod=${year}-12&format=jsondata`,
        },
        {
          label: "ECB Main Rate",
          series: "ecb_rate",
          description: "Taxa de refinanciamento do BCE — ECB Statistical Data Warehouse",
          url: `https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.MRR_FR.LEV?startPeriod=${year}-01&endPeriod=${year}-12&format=jsondata`,
        },
      ],
    },
  };

  return configs[country];
}

export const AVAILABLE_COUNTRIES: { value: Country; label: string; flag: string }[] = [
  { value: "BR", label: "Brasil", flag: "🇧🇷" },
  // Temporariamente desabilitado - apenas Brasil disponível
  // { value: "US", label: "Estados Unidos", flag: "🇺🇸" },
  // { value: "EU", label: "Zona do Euro", flag: "🇪🇺" },
];

export const AVAILABLE_YEARS: string[] = ["2021", "2022", "2023", "2024", "2025"];
