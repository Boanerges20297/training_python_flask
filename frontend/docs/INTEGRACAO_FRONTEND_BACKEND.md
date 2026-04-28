# 🔗 Guia de Integração — Frontend ↔ Backend

> **Versão:** 1.0 — 28/04/2026  
> **Autor:** Gabriel Castro (Frontend Lead)  
> **Objetivo:** Fornecer ao time de backend e integração tudo que é necessário para conectar o frontend elevado ao backend Flask real.  
> **Status:** 🟡 Documento vivo — será atualizado conforme novas features.

---

## Índice

1. [Desligando os Mocks (MSW)](#1-desligando-os-mocks-msw)
2. [Arquitetura da Camada de API](#2-arquitetura-da-camada-de-api)
3. [Mapa de Rotas — Frontend vs Backend](#3-mapa-de-rotas)
4. [Contratos de Dados (Types/Schemas)](#4-contratos-de-dados)
5. [Dashboard — O que o backend precisa entregar](#5-dashboard)
6. [Financeiro — Dados reais vs Mock](#6-financeiro)
7. [Persistência de Imagens](#7-persistência-de-imagens)
8. [Inadimplência e Status de Clientes](#8-inadimplência)
9. [Sistema de Notificações](#9-notificações)
10. [Campos Faltantes nos Models](#10-campos-faltantes)
11. [Checklist de Tarefas por Módulo](#11-checklist)

---

## 1. Desligando os Mocks (MSW)

O frontend usa [MSW (Mock Service Worker)](https://mswjs.io/) para interceptar requisições HTTP e simular respostas enquanto o backend está em desenvolvimento.

### Arquivos envolvidos:
| Arquivo | Função |
|---------|--------|
| `frontend/src/main.tsx` | Inicializa o worker MSW antes de renderizar o app |
| `frontend/src/mocks/browser.ts` | Configura o Service Worker |
| `frontend/src/mocks/handlers.ts` | Define TODOS os interceptadores de rota |
| `frontend/src/mocks/db.ts` | Banco de dados in-memory com dados fake |

### Como desligar TODOS os mocks:

Edite `frontend/src/main.tsx` e substitua:

```diff
- async function enableMocking() {
-   const { worker } = await import('./mocks/browser')
-   return worker.start({ onUnhandledRequest: 'warn' })
- }
-
- enableMocking().then(() => {
+ // Mocks desativados — conectando ao backend real
+ {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        ...
      </StrictMode>,
    )
- })
+ }
```

### Como desligar UM mock de cada vez (recomendado):

No arquivo `frontend/src/mocks/handlers.ts`, comente os handlers individuais que já possuem backend real. Exemplo:

```typescript
export const handlers = [
  // Backend pronto — mock desativado
  // http.get(`${API_BASE}/clientes`, async ...),
  
  // Backend pendente — mock ativo
  http.get(`${API_BASE}/dashboard/geral`, async ...),
];
```

> **⚠️ IMPORTANTE:** O `onUnhandledRequest: 'warn'` faz com que requisições sem mock gerem warning no console. Quando tudo estiver integrado, basta remover toda a função `enableMocking()`.

### Variável de ambiente (sugestão futura):

```typescript
// main.tsx — usar .env para controlar
const ENABLE_MOCKS = import.meta.env.VITE_ENABLE_MOCKS === 'true';

if (ENABLE_MOCKS) {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'warn' });
}
```

---

## 2. Arquitetura da Camada de API

O frontend já possui uma camada de abstração pronta em `frontend/src/api/`:

```
api/
├── config.ts       ← Axios instance + interceptors (CSRF, JWT refresh)
├── auth.ts         ← login, logout, register, getMe, refreshSession
├── clients.ts      ← getClientes, createCliente, updateCliente, deleteCliente
├── barbers.ts      ← getBarbeiros, createBarbeiro, updateBarbeiro, deleteBarbeiro
├── services.ts     ← getServicos, createServico, updateServico, deleteServico
├── appointments.ts ← getAgendamentos, createAgendamento, updateAgendamento, deleteAgendamento
└── dashboard.ts    ← getDashboardInfo(dias)
```

### Configuração base (`config.ts`):
- **Base URL:** `http://localhost:5000/api`
- **Cookies:** `withCredentials: true` (JWT via HttpOnly cookies)
- **CSRF:** Injeta `X-CSRF-TOKEN` automaticamente em POST/PATCH/PUT/DELETE
- **Auto-refresh:** Token expirado → tenta `POST /auth/refresh` → re-envia requisição original
- **Logout global:** Se refresh falhar → dispara `window.dispatchEvent(new Event('auth:logout'))`

> **Backend não precisa mudar nada aqui.** Apenas garantir que as rotas retornem o JSON no formato esperado.

---

## 3. Mapa de Rotas

### Legenda: ✅ Backend existe | 🔶 Backend existe mas precisa ajuste | ❌ Backend não existe

| Método | Rota Frontend Consome | Rota Backend | Status |
|--------|-----------------------|--------------|--------|
| **AUTH** | | | |
| POST | `/api/auth/login` | `auth_routes.py` | ✅ |
| POST | `/api/auth/register` | `auth_routes.py` | ✅ |
| POST | `/api/auth/logout` | `auth_routes.py` | ✅ |
| POST | `/api/auth/refresh` | `auth_routes.py` | ✅ |
| GET | `/api/auth/protected` | `auth_routes.py` | ✅ |
| POST | `/api/auth/forgot-password` | `auth_routes.py` | ✅ |
| **CLIENTES** | | | |
| GET | `/api/clientes?page=&per_page=` | `client_routes.py` | ✅ |
| POST | `/api/clientes` | `client_routes.py` | 🔶 ver campos |
| PATCH | `/api/clientes/:id` | `client_routes.py` | 🔶 ver campos |
| DELETE | `/api/clientes/:id` | `client_routes.py` | ✅ |
| **BARBEIROS** | | | |
| GET | `/api/barbeiros?page=&per_page=` | `barbeiro_routes.py` | ✅ |
| POST | `/api/barbeiros` | `barbeiro_routes.py` | 🔶 ver campos |
| PATCH | `/api/barbeiros/:id` | `barbeiro_routes.py` | 🔶 ver campos |
| DELETE | `/api/barbeiros/:id` | `barbeiro_routes.py` | ✅ |
| **SERVIÇOS** | | | |
| GET | `/api/servicos/?page=&per_page=` | `servico_routes.py` | ✅ |
| POST | `/api/servicos/` | `servico_routes.py` | 🔶 ver campos |
| PATCH | `/api/servicos/:id` | `servico_routes.py` | 🔶 ver campos |
| DELETE | `/api/servicos/:id` | `servico_routes.py` | ✅ |
| **AGENDAMENTOS** | | | |
| GET | `/api/agendamento?page=&per_page=` | `agendamento_routes.py` | ✅ |
| POST | `/api/agendamento` | `agendamento_routes.py` | ✅ |
| PATCH | `/api/agendamento/:id` | `agendamento_routes.py` | 🔶 `pago` |
| DELETE | `/api/agendamento/:id` | `agendamento_routes.py` | ✅ |
| **DASHBOARD** | | | |
| GET | `/api/dashboard/geral?dias=` | `dashboard_routes.py` | 🔶 ver seção 5 |
| **FINANCEIRO** | | | |
| GET | `/api/financeiro/relatorio?mes=&ano=` | `financeiro_routes.py` | ✅ (não consumido pelo front atual) |

---

## 4. Contratos de Dados

### Resposta Paginada (TODAS as listagens):

O frontend espera este formato em `response.data.dados`:

```json
{
  "items": [],
  "total": 42,
  "items_nessa_pagina": 10,
  "pagina": 1,
  "per_page": 10,
  "total_paginas": 5,
  "tem_proxima": true,
  "tem_pagina_anterior": false
}
```

### Resposta de Criação:

```
POST /api/clientes      → response.data.dados.cliente
POST /api/barbeiros     → response.data.dados.barbeiro
POST /api/servicos/     → response.data.dados.servico
POST /api/agendamento   → response.data.dados.agendamento
```

### Resposta de Erro:

```json
{ "erro": "Mensagem de erro legível" }
// ou
{ "erros_validacao": { "campo": "mensagem" } }
```

---

## 5. Dashboard — O que o backend precisa entregar

### Rota: `GET /api/dashboard/geral?dias=30`

O frontend espera `response.data.data` (atenção: **data.data**, não data.dados) com esta estrutura:

```typescript
interface DashboardData {
  periodo_inicio: string;        // ISO datetime
  periodo_fim: string;           // ISO datetime
  receita_total: number;         // Soma de precos de agendamentos concluídos
  receita_liquidada: number;     // Soma de precos onde pago=true
  receita_pendente: number;      // receita_total - receita_liquidada
  total_dividas: number;         // Soma de divida_total de todos os clientes
  agendamentos_total: number;
  agendamentos_concluidos: number;
  agendamentos_cancelados: number;
  agendamentos_pendentes: number;
  ticket_medio: number;          // receita_total / agendamentos_concluidos
  top_5_horarios: {
    hora: number;                // 8, 10, 14...
    total_agendamentos: number;
  }[];
  receita_diaria: {
    data: string;                // "YYYY-MM-DD"
    receita: number;
    agendamentos_concluidos: number;
    agendamentos_pendentes: number;
  }[];
  barbeiros_desempenho: {
    barbeiro_id: number;
    barbeiro_nome: string;
    total_agendamentos: number;
    agendamentos_concluidos: number;
    agendamentos_cancelados: number;
    receita_total: number;
    comissao_gerada: number;
    tempo_total_minutos: number;
    servicos_realizados: {
      nome: string;
      quantidade: number;
      preco_unitario: number;
      receita: number;
    }[];
    taxa_conclusao: number;         // 0-100
  }[];
}
```

### Dados MOCK que precisam virar REAIS:

| Dado | Situação atual (Mock) | O que o backend precisa fazer |
|------|----------------------|-------------------------------|
| `receita_liquidada` | `receita_total * 0.8` | Somar `preco` de agendamentos com `pago = true` |
| `receita_pendente` | `receita_total * 0.2` | `receita_total - receita_liquidada` |
| `receita_diaria[].receita` | `Math.random()` | Agrupar concluídos por dia e somar precos |
| `servicos_realizados[].preco_unitario` | Não retornado | Buscar `servico.preco` |
| `tempo_total_minutos` | Não retornado | Somar `servico.duracao_minutos` dos concluídos |

---

## 6. Financeiro — Dados Mockados na View

A `FinanceiroView.tsx` calcula vários dados derivados localmente. Quando o backend tiver rotas de analytics, esses cálculos devem migrar:

| Componente Visual | Dado Mock no Frontend | Backend deveria entregar |
|-------------------|----------------------|--------------------------|
| Cascata de Lucro | Comissões somando `barbeiros_desempenho[].comissao_gerada`. Taxas = `receita_liquidada * 0.03` | Endpoint dedicado ou campo `taxa_cartao` na dashboard |
| Treemap de Receita | Agrega `servicos_realizados[]` de todos barbeiros | Já funciona se `servicos_realizados` vier detalhado |
| Eficiência de Cadeira | `potencial = total_agendamentos * ticket_medio * 1.3` | Calcular capacidade real com base na agenda |
| Régua de Cobrança | `cobrancas = (idx % 3) + 1` (simulado por índice) | Persistir contagem de cobranças por cliente |

---

## 7. Persistência de Imagens

### Estado atual:
O frontend captura imagens via `ImageUpload.tsx` e converte para **Base64**. O campo `imagem_url` é enviado como string Base64 no body do POST/PATCH.

### O que o backend precisa fazer:

1. **Aceitar** o campo `imagem_url` (string) nos endpoints de criação/atualização
2. **Opção A (MVP):** Salvar a string Base64 direto no banco (coluna `TEXT`)
3. **Opção B (Ideal):** Interceptar Base64, salvar em storage (S3/Cloudinary/`static/uploads/`), persistir URL pública

### Campos necessários nos models:

| Model | Campo | Tipo Sugerido |
|-------|-------|---------------|
| `Cliente` | `imagem_url` | `db.Column(db.Text, nullable=True)` |
| `Barbeiro` | `imagem_url` | `db.Column(db.Text, nullable=True)` |
| `Servico` | `imagem_url` | `db.Column(db.Text, nullable=True)` |

> **NENHUM dos models atuais possui `imagem_url`. É necessário criar migrations.**

### Onde as imagens aparecem:
- Tabelas de listagem (ClientsView, BarbersView, ServicesView)
- Agenda do dia (DashboardView)
- Tabela de devedores (FinanceiroView)
- Drawers de edição/visualização
- Badge de agendamentos (AppointmentsView)
- Auditoria de produção (BarberDrawer → aba Financeiro)

---

## 8. Inadimplência e Status de Clientes

### Fluxo no frontend:

1. Admin abre `ClientDrawer` → aba Financeiro
2. Vê agendamentos concluídos com `pago = false` (pendências)
3. **Liquidar** → `PATCH /api/agendamento/:id { pago: true }`
4. **Reverter** → `PATCH /api/agendamento/:id { pago: false }` (inadimplência)
5. Frontend dispara notificação de inadimplência

### Backend — regras de negócio necessárias:

1. Campo `pago` (Boolean) no model `Agendamento` — aceitar PATCH
2. Ao mudar `pago`, **recalcular** `cliente.divida_total`:
   - `SUM(preco)` de agendamentos `status='concluido'` AND `pago=false`
3. **Status automático:**
   - `divida_total > 0` → `status = "devedor"`
   - `divida_total == 0` → `status = "ativo"`

### Campos verificar no model Agendamento:

| Campo | Necessário | Observação |
|-------|-----------|------------|
| `pago` | Sim | `db.Column(db.Boolean, default=False)` |
| `preco` | Sim | Copiar do serviço na criação |

---

## 9. Sistema de Notificações

### Estado atual: 100% Client-side
Usa `window.dispatchEvent()`. O `Header.tsx` escuta `barbabyte:notification`.

```typescript
// frontend/src/utils/notifications.ts
notify({ type: 'warning', title, message })    // Inadimplência
notifyDebt(clientName, amount)                  // Dívida criada
notifyCancel(clientName, serviceName)           // Agendamento cancelado
notifyNewAppointment(clientName, time)          // Novo agendamento
```

### NÃO precisa de backend para o MVP:
Notificações são efêmeras (session-only). O sistema funciona.

### Para evolução futura (persistir histórico):

```
POST   /api/notificacoes              → Criar
GET    /api/notificacoes?lida=false   → Listar não lidas
PATCH  /api/notificacoes/:id          → Marcar como lida
```

Model sugerido:
```python
class Notificacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(20))      # 'warning', 'error', 'success', 'info'
    titulo = db.Column(db.String(200))
    mensagem = db.Column(db.Text)
    lida = db.Column(db.Boolean, default=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    admin_id = db.Column(db.Integer, db.ForeignKey('admin.id'))
```

> **Prioridade: BAIXA.** O sistema client-side atende o MVP.

---

## 10. Campos Faltantes nos Models

### Barbeiro — model atual vs frontend:

| Campo Frontend | Existe no Backend? | Ação |
|----------------|---------------------|------|
| `nome` | ✅ | — |
| `email` | ✅ | — |
| `telefone` | ✅ | — |
| `ativo` | ✅ | — |
| `data_cadastro` | ✅ | — |
| `especialidades` (array) | 🔶 `especialidade` (string singular) | Renomear para array ou criar tabela |
| `servicos_ids` | 🔶 via M2M `barbeiro_servico` | Garantir serialização no GET |
| `imagem_url` | ❌ | Adicionar coluna `Text` |
| `comissao_percentual` | ❌ | Adicionar coluna `Float, default=40.0` |
| `justificativa` | ❌ | Adicionar coluna `Text, nullable=True` |
| `data_atualizacao` | ❌ | Adicionar `DateTime` com `onupdate` |

### Cliente — model atual vs frontend:

| Campo Frontend | Existe no Backend? | Ação |
|----------------|---------------------|------|
| `nome`, `email`, `telefone` | ✅ | — |
| `status` | ✅ | — |
| `divida_total` | ✅ | — |
| `data_cadastro` | ✅ | — |
| `imagem_url` | ❌ | Adicionar |
| `observacoes` | ❌ | Adicionar coluna `Text` |
| `data_atualizacao` | ❌ | Adicionar `DateTime` |
| `ultima_visita` | ✅ | — |

### Servico — model atual vs frontend:

| Campo Frontend | Existe no Backend? | Ação |
|----------------|---------------------|------|
| `nome`, `descricao`, `preco`, `duracao_minutos` | ✅ | — |
| `imagem_url` | ❌ | Adicionar |
| `data_criacao` | ❌ | Adicionar |
| `data_atualizacao` | ❌ | Adicionar |

### Agendamento — model atual vs frontend:

| Campo Frontend | Existe? | Ação |
|----------------|---------|------|
| `cliente_id`, `barbeiro_id` | ✅ | — |
| `servicos_ids` (array) | ❓ | Verificar se backend aceita array |
| `data_agendamento` | ✅ | — |
| `status` | ✅ | — |
| `preco` | ❓ | Verificar; essencial |
| `pago` | ❓ | Verificar; essencial para inadimplência |
| `observacoes` | ❓ | Verificar |

---

## 11. Checklist de Tarefas por Módulo

### 🔴 Prioridade ALTA (Bloqueia funcionalidades core)

- [ ] **Migration:** Adicionar `imagem_url` em Cliente, Barbeiro e Servico
- [ ] **Migration:** Adicionar `comissao_percentual` em Barbeiro
- [ ] **Migration:** Adicionar `pago` (Boolean) em Agendamento (se não existir)
- [ ] **Migration:** Adicionar `preco` (Float) em Agendamento (se não existir)
- [ ] **Dashboard:** `receita_liquidada` = soma de precos onde `pago = true`
- [ ] **Dashboard:** `receita_diaria` com dados reais agrupados por dia
- [ ] **Serialização:** GET de todos os models retornando os novos campos
- [ ] **PATCH:** Aceitar `imagem_url`, `comissao_percentual`, `pago` nos endpoints

### 🟡 Prioridade MÉDIA

- [ ] **Migration:** `data_atualizacao` com `onupdate=datetime.utcnow` em todos os models
- [ ] **Migration:** `observacoes` em Cliente
- [ ] **Migration:** `justificativa` em Barbeiro
- [ ] **Barbeiro:** Renomear `especialidade` (str) → `especialidades` (JSON array)
- [ ] **Dashboard:** Implementar `tempo_total_minutos`
- [ ] **Dashboard:** Detalhar `servicos_realizados` com `preco_unitario` real
- [ ] **Inadimplência:** Trigger automático ao alterar `pago` → recalcular `divida_total`

### 🟢 Prioridade BAIXA (Evolução futura)

- [ ] **API de Notificações:** Persistir histórico
- [ ] **Financeiro:** Endpoint de taxa de cartão configurável
- [ ] **Financeiro:** Endpoint de contagem de cobranças por cliente
- [ ] **Relatórios:** Integrar `GET /api/financeiro/relatorio` no frontend
- [ ] **Imagens:** Migrar de Base64 → Cloud Storage com URL pública

---

## Referências

| Documento | Caminho |
|-----------|---------|
| Lógica do Dashboard (backend) | `backend/docs/DASHBOARD_LOGICA.md` |
| Fluxo do Backend | `backend/docs/FLUXO_BACKEND.md` |
| JWT RS256 | `backend/docs/documentacao_jwt_rs256.md` |
| Status/Histórico Clientes | `backend/docs/documentacao_status_clientes_historico.md` |
| Paginação | `backend/docs/padronizacao_paginacao.md` |
| Serviços × Barbeiros | `backend/docs/documentacao_servicos_barbeiros.md` |
| Testes Financeiro | `backend/docs/testes_financeiro.md` |
| API Config (Frontend) | `frontend/src/api/config.ts` |
| Types (Frontend) | `frontend/src/types/index.ts` |
| Mock Handlers | `frontend/src/mocks/handlers.ts` |
