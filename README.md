# SmartFinance 💰

Dashboard Financeiro e Macroeconômico Inteligente com gestão de finanças pessoais e visualização de dados econômicos.

## 🚀 Tecnologias

### Backend
- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para banco de dados
- **PostgreSQL / SQLite** - Banco de dados
- **Pydantic** - Validação de dados
- **JWT** - Autenticação
- **Pandas** - Processamento de planilhas Excel
- **Bcrypt** - Criptografia de senhas

### Frontend
- **React** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **Zustand** - Gerenciamento de estado
- **React Router** - Roteamento
- **Lucide React** - Ícones

## 📋 Funcionalidades

### Autenticação
- ✅ Cadastro de usuários
- ✅ Login com JWT
- ✅ Validação de senha (bcrypt)
- ✅ Contadores de caracteres em todos os campos

### Dashboards Pessoais
- ✅ CRUD completo de dashboards
- ✅ Múltiplos dashboards por usuário
- ✅ Edição inline de nomes
- ✅ Navegação por URL amigável

### Registros Financeiros
- ✅ Inserção manual com validação
- ✅ Upload de planilhas Excel
- ✅ Exportação para Excel
- ✅ Edição e exclusão de registros
- ✅ Filtros e busca
- ✅ Validação de nomes únicos por dashboard
- ✅ Descrição opcional
- ✅ Limites de caracteres (nome: 50, descrição: 200, categoria: 50)
- ✅ Validação de valores (> 0, máx: 999.999.999,99)

### Visualização
- ✅ Gráficos de receitas e despesas
- ✅ Tabela com paginação
- ✅ Ver mais/ver menos para descrições longas
- ✅ Indicadores financeiros
- ✅ Dashboard macroeconômico público
- ✅ Bate-papo com IA contextualizado aos dados do dashboard

## 🚀 Começando
```bash
git clone https://github.com/Gustavoksbr/smart-fInance
cd smart-fInance
```

### Opção 1 — rodar com Docker

### 🛠️ Pré-requisitos

- [Docker](https://www.docker.com/)

```bash
docker compose up --build
```
Acesse o frontend em http://localhost:5173 e o backend em http://localhost:8000.

---

### Opção 2 — rodar com Python e Node

### 🛠️ Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Python](https://www.python.org/) (versão 3.10 ou superior)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# OR on macOS / Linux:
# source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env  # Windows
# OR on macOS / Linux:
# cp .env.example .env
# Atualize .env com SECRET_KEY, DATABASE_URL e API_KEY da LLM
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Em outra janela do terminal:
```bash
cd frontend
npm install
npm run dev
```
Acesse o frontend em http://localhost:5173.

## 📝 Variáveis de Ambiente

### Backend (.env)

O backend lê variáveis do arquivo `backend/.env` ou `backend/.env.example`.
Copie o exemplo e preencha as chaves antes de iniciar o servidor.

```env
# Chave secreta (gere uma nova)
SECRET_KEY=your-secret-key-here

# PostgreSQL (produção)
DATABASE_URL=postgresql://postgres:password@localhost:5432/smartfinance

# SQLite (desenvolvimento)
# DATABASE_URL=sqlite:///./smartfinance.db

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Chave de API para a LLM
API_KEY=your-llm-api-key-here

# URL da API de LLM (exemplo no)
LLM_API_URL=https://api.groq.com/v1/models/llama-3.1-8b-instant/predict
```

### Frontend (.env)

O frontend usa `frontend/.env.example` como referência. Defina a URL do backend se for diferente de `http://localhost:8000`.

```env
VITE_API_URL=http://localhost:8000
```

## 🛠️ Configurando o Banco de Dados

### SQLite (Recomendado para Desenvolvimento)

Já está configurado por padrão. O banco é criado automaticamente na primeira execução:
```env
DATABASE_URL=sqlite:///./smartfinance.db
```
✅ Sem instalação externa
✅ Perfeito para testes locais
✅ Arquivo único (`smartfinance.db`)

---