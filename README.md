# SmartFinance 💰

Dashboard Financeiro com gestão de finanças pessoais e visualização de dados econômicos, com assistente de IA via chatbot

Acesse em https://smart-finance-nu-seven.vercel.app

![alt text](image.png)

## 🚀 Tecnologias

### Backend
- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para banco de dados
- **PostgreSQL / SQLite** - Banco de dados
- **Pydantic** - Validação de dados
- **JWT** - Autenticação
- **Pandas** - Processamento de planilhas Excel
- **Bcrypt** - Criptografia de senhas
- **httpx** - Cliente HTTP assíncrono usado para chamar a API da LLM


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
- ✅ Criptografia de senha (bcrypt)


### Registros Financeiros
- ✅ CRUD completo
- ✅ Importação/export de planilhas Excel
- ✅ Edição e exclusão de registros
- ✅ Filtros e busca
- ✅ Validação de nomes únicos por dashboard
- ✅ Limites de caracteres e de valores

### Visualização
- ✅ Gráficos de receitas e despesas
- ✅ Indicadores financeiros
- ✅ Bate-papo com IA contextualizado aos dados do dashboard

## 🚀 Como rodar na sua máquina:

Comece fazendo o git clone (ou extraia com zip se não tiver git)

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

# URL da API de LLM (exemplo no Groq)
LLM_API_URL=https://api.groq.com/v1/models/llama-3.1-8b-instant/predict
```

### Frontend (.env)

O frontend usa `frontend/.env.example` como referência. Defina a URL do backend se for diferente de `http://localhost:8000`.

```env
VITE_API_URL=http://localhost:8000
```

## Próximos passos

- **Adicionar mais filtros e paginação:** permitir filtragem por período, categoria e tipo, e paginar a lista de registros para melhorar a performance e usabilidade.
- **Criar gráfico de soma:** implementar um gráfico que mostre a soma total de `receita` e `despesa` separadamente.
- **Sincronizar gráfico com filtros:** garantir que o gráfico reflita exatamente os filtros aplicados (período, categoria, tipo, search), atualizando dinamicamente os dados exibidos.
