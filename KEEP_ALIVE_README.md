# Sistema de Keep-Alive para Render e Supabase

## 📋 Resumo

Sistema implementado para **minimizar** (não eliminar completamente) as pausas automáticas do backend no Render e do banco de dados no Supabase.

**Estratégia**: A cada 10 minutos, o sistema faz uma requisição ao endpoint `/health` que executa uma consulta SQL simples no banco, mantendo tanto o Render quanto o Supabase ativos.

## ⚠️ IMPORTANTE: Limitações do Plano Gratuito

### Supabase Free Tier
- **Pausa automática após 7 dias de inatividade** (política do Supabase)
- O keep-alive ajuda a manter ativo, mas **não garante 100%** que o projeto não será pausado
- Se o Supabase considerar que não há "atividade real de usuários", pode pausar mesmo assim
- Quando pausado, você recebe um email e precisa **reativar manualmente** no dashboard
- Link para reativar: https://app.supabase.com
- Erro típico quando pausado: `FATAL: (ENOTFOUND) tenant/user postgres.xxx not found`

### Render Free Tier
- Pausa após 15 minutos sem requisições HTTP
- O keep-alive **resolve esse problema efetivamente** ✅

## 🔧 Como Funciona

### Arquitetura Simplificada

```
[Keep-Alive Task]
      ↓
   (a cada 10 min)
      ↓
[GET /health] ───→ [SELECT 1] ───→ [Supabase]
      ↓                               ↓
  [Response]                   [Mantém ativo]
      ↓
[Log resultado]
```

### Fluxo Detalhado

1. **Startup**: Task assíncrona inicia em background
2. **Aguarda 2 minutos**: Delay inicial para estabilização
3. **Loop infinito**:
   - Aguarda 10 minutos
   - Faz `GET {BACKEND_URL}/health`
   - `/health` executa `SELECT 1` no banco
   - Loga resultado (sucesso, erro, banco pausado)
4. **Shutdown**: Task é cancelada graciosamente

### Vantagens desta Abordagem

✅ **Código mais limpo**: Lógica de DB em um endpoint, não na task  
✅ **Testável**: Você pode chamar `/health` manualmente  
✅ **Logs centralizados**: Erros de DB ficam no endpoint  
✅ **Reutilizável**: Outros serviços podem usar `/health` para monitoramento  
✅ **Padrão estabelecido**: Mesma estratégia usada no projeto UrbanReport

## 🎯 Endpoints Disponíveis

### 1. `/health` - Health Check Completo ⭐
```bash
GET /health
```
**Usado pelo keep-alive** - Faz consulta ao banco de dados.

Resposta (sucesso):
```json
{
  "status": "ok",
  "service": "SmartFinance API",
  "database": "connected"
}
```

Resposta (erro - banco pausado):
```json
{
  "status": "ok",
  "service": "SmartFinance API",
  "database": "error",
  "database_error": "FATAL: (ENOTFOUND) tenant/user postgres.xxx not found"
}
```

### 2. `/ping` - Ping Simples
```bash
GET /ping
```
Endpoint leve sem consulta ao banco.

Resposta:
```json
{
  "status": "pong",
  "message": "API está acordada"
}
```

### 3. `/db-health` - Legacy (Compatibilidade)
```bash
GET /db-health
```
Mantido para compatibilidade. Use `/health` em novos códigos.

## 📊 Logs

O sistema usa o logger Python para monitoramento detalhado:

### Sucesso Total:
```
🚀 Keep-alive task iniciada (primeiro ping em 2 minutos)
keep-alive health-check -> https://sua-api.onrender.com/health 200
✓ Keep-alive successful | Database status: connected
```

### Banco Pausado (comum após 7 dias):
```
keep-alive health-check -> https://sua-api.onrender.com/health 200
✓ Keep-alive successful | Database status: error
⚠ Database pausado pelo Supabase
ℹ️  Acesse https://app.supabase.com para reativar
```

### Erro de Conexão:
```
✗ Keep-alive falhou: Connection timeout
```

## ⚙️ Configuração

### Variáveis de Ambiente Necessárias

No arquivo `.env`:

```env
# URL do backend (para self-ping)
BACKEND_URL=https://seu-app.onrender.com

# URL do banco Supabase
DATABASE_URL=postgresql://user:pass@db.xxx.supabase.co:5432/postgres
```

**Nota**: Não são necessárias credenciais extras do Supabase. A consulta SQL via `DATABASE_URL` é suficiente!

### Ajustando Intervalos

Para modificar os intervalos de tempo, edite o arquivo `backend/app/main.py`:

```python
async def keep_alive_task():
    # Aguarda inicial (em segundos)
    await asyncio.sleep(120)  # 2 minutos
    
    while True:
        # ... execuções ...
        
        # Intervalo entre execuções (em segundos)
        await asyncio.sleep(600)  # 10 minutos
```

**Sugestões:**
- Para ser mais agressivo: `await asyncio.sleep(300)` (5 minutos)
- Cuidado: intervalos muito curtos podem consumir recursos desnecessariamente

## 🚀 Benefícios e Limitações

### ✅ O que funciona bem:
1. **Render**: Mantém o backend ativo 24/7 (100% efetivo)
2. **Monitoramento**: Logs detalhados para debug
3. **Resiliente**: Erros não param o serviço
4. **Zero Configuração**: Funciona automaticamente

### ⚠️ Limitações conhecidas:
1. **Supabase Free**: Pode pausar após 7 dias mesmo com keep-alive
2. **Reativação Manual**: Se pausado, precisa acessar o dashboard
3. **Não é mágico**: Supabase detecta "atividade real" vs "keep-alive"

### 💡 Soluções Alternativas:

**Para evitar pausa do Supabase:**
1. **Upgrade para Pro**: $25/mês, sem pausa automática
2. **Múltiplos projetos**: Criar novo projeto free a cada 7 dias (não recomendado)
3. **Acesso manual**: Entrar no dashboard uma vez por semana
4. **Scheduler externo**: Usar cron-job.org ou similar para fazer requisições reais

## 🔍 Testando Localmente

```bash
# 1. Ative o ambiente virtual
cd backend
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate  # Windows

# 2. Configure as variáveis de ambiente no .env
# BACKEND_URL=http://localhost:8000
# DATABASE_URL=postgresql://...

# 3. Inicie o servidor
uvicorn app.main:app --reload

# 4. Em outro terminal, teste os endpoints
curl http://localhost:8000/health
curl http://localhost:8000/ping
```

**Esperado após 2 minutos**:
```
🚀 Keep-alive task iniciada (primeiro ping em 2 minutos)
keep-alive health-check -> http://localhost:8000/health 200
✓ Keep-alive successful | Database status: connected
```

**A cada 10 minutos**: Novas entradas de log similares.

## 🐛 Troubleshooting

### Backend não responde ao ping
- ✅ Verifique se `BACKEND_URL` está configurado corretamente
- ✅ Em produção, use a URL do Render (não localhost)
- ✅ Confirme que o Render permite tráfego de saída

### Banco de dados não responde
- ✅ Verifique se `DATABASE_URL` está correto
- ✅ Confirme se o Supabase não está pausado (acesse o dashboard)
- ✅ Verifique os logs para mensagens específicas

### Erro "ENOTFOUND tenant/user not found"
- ⚠️ **Seu projeto Supabase foi pausado**
- 🔧 Solução: Acesse https://app.supabase.com e clique em "Resume project"
- 💡 Configure `SUPABASE_URL` e `SUPABASE_ANON_KEY` para tentar evitar

### Task não inicia
- ✅ Verifique se há erros no startup da aplicação
- ✅ Confirme que o evento `lifespan` está sendo executado
- ✅ Procure por "Keep-alive task iniciada" nos logs

## 📝 Notas Finais

- O keep-alive ajuda **significativamente**, mas não é uma solução perfeita
- Para projetos em produção, considere o upgrade para planos pagos
- O Render é mantido ativo com 100% de eficácia
- O Supabase pode eventualmente pausar (política do free tier)
- Sempre monitore os logs e emails do Supabase
