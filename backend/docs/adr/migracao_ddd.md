# 🏗️ ADR-001: Migração para Arquitetura Orientada a Módulos (DDD)

**Data:** 21 de Abril de 2026  
**Branch:** `tasks12-DDD`  
**Status:** ✅ Implementado

---

## 1. O que é Domain-Driven Design (DDD)?

**Domain-Driven Design** (Design Orientado ao Domínio) é uma abordagem de arquitetura de software criada por Eric Evans que defende organizar o código em torno das **regras de negócio reais** da aplicação — os chamados **domínios** — em vez de organizá-lo pela sua natureza técnica.

O princípio central é simples: **o código deve refletir o problema que ele resolve**.

### Arquitetura Layer-First (antiga)

Na abordagem **layer-first**, o código é agrupado pela sua função técnica:

```
app/
├── models/      ← todos os modelos do banco juntos
├── routes/      ← todas as rotas HTTP juntas
├── schemas/     ← todos os schemas Pydantic juntos
└── services/    ← toda a lógica de negócio junta
```

**Problema:** Para entender ou modificar qualquer funcionalidade — por exemplo, o módulo de **Agendamento** — você precisa abrir **4 pastas diferentes** ao mesmo tempo. O contexto fica fragmentado.

### Arquitetura Module-First (nova)

Na abordagem **module-first**, o código é agrupado pelo **domínio de negócio**:

```
app/
└── modules/
    ├── agendamento/    ← model + routes + schema + service juntos
    ├── barbeiro/       ← model + routes + schema + service juntos
    ├── cliente/        ← tudo sobre cliente em um só lugar
    └── ...
```

**Benefício:** Para entender ou modificar o módulo de **Agendamento**, você abre **uma única pasta**. O contexto está todo ali.

---

## 2. Por que foi feita essa mudança?

O projeto Barba & Byte cresceu significativamente ao longo das `tasks1` até `tasks11`, acumulando:

- **8 domínios de negócio distintos:** cliente, barbeiro, serviço, agendamento, auth, admin, financeiro e dashboard
- **~35 arquivos Python** espalhados em 4 camadas técnicas
- **Documentação desorganizada** com 20 arquivos sem hierarquia na pasta `docs/`

Com esse volume, a estrutura layer-first começou a apresentar os sintomas clássicos de **escalabilidade degradada**:

| Sintoma | Impacto |
|---------|---------|
| Para adicionar um campo ao `Agendamento`, você abria `models/`, `schemas/`, `services/` e `routes/` ao mesmo tempo | Alto custo cognitivo |
| Um desenvolvedor novo não conseguia saber de inicio aonde ficam arquivos de um domínio | Onboarding lento |
| Difícil de medir o "tamanho" de uma feature | Planejamento impreciso |
| Risco de imports cruzados entre camadas sem clareza de dependência | Bugs difíceis de rastrear |

A migração foi aprovada na sprint `tasks12-DDD` como pré-requisito para a próxima fase de crescimento do sistema.

---

## 3. Como foi feita a migração

A migração seguiu uma estratégia de **risco mínimo**: mover um módulo por vez, validando que o Flask subia sem erros a cada etapa.

### Fase 0 — Reorganização de `utils/`

Antes de mexer nos módulos, os utilitários compartilhados foram organizados em subpastas temáticas:

```
utils/          (antes: 8 arquivos soltos)
├── http/           → pagination.py, error_formatter.py
├── security/       → decorators.py, ratelimiter.py
├── logging/        → audit.py, logger_setup.py
├── email/          → email_layouts.py
└── mixins.py       ← veio de models/mixins.py (compartilhado entre domínios)
```

Todos os ~30 imports que apontavam para os paths antigos foram atualizados automaticamente.

### Fases 1–8 — Migração dos Módulos

Os módulos foram migrados na seguinte ordem (menor para maior impacto):

| Fase | Módulo | Arquivos movidos |
|------|--------|-----------------|
| 1 | `servico` | model, schema, routes |
| 2 | `admin` | model, schema, routes, service |
| 3 | `auth` | model (PasswordResetToken), schema, routes, service, email_service |
| 4 | `financeiro` | routes, service |
| 5 | `dashboard` | schema, routes, service |
| 6 | `cliente` | model, schema, routes |
| 7 | `barbeiro` | model, **association** (tabela N:N), schema, routes, service |
| 8 | `agendamento` | model, schema, routes, service |

### Fase 9 — Limpeza Final

As pastas `models/`, `routes/`, `schemas/` e `services/` foram **removidas** após confirmação de que estavam vazias.

O arquivo `tests_routes.py` foi movido para `app/` diretamente (não é um domínio de negócio, é infraestrutura de desenvolvimento).

O arquivo `deshboard_service.py` (com typo no nome) foi **deletado** — era um arquivo morto duplicado.

### Atualização de Imports

Ao todo, foram atualizados automaticamente via script PowerShell:
- **~60 declarações `import`** em routes, services, scripts de seed, tests e `__init__.py`
- `jwt_callbacks.py` também foi atualizado (importava `auth_service`)
- Scripts em `scripts/` e `tests/` também foram atualizados

---

## 4. Como o projeto está organizado agora

### Backend (`app/`)

```
app/
├── __init__.py           ← Factory Pattern (create_app) — registra todos os blueprints
├── extensions.py         ← Instâncias globais: db, jwt, limiter, cors, mail
├── jwt_callbacks.py      ← Handlers de erro/sucesso do JWT
├── tests_routes.py       ← Rotas de dev para testar rate limiting
│
├── modules/              ← Um diretório por domínio de negócio
│   ├── admin/            ← model.py | schema.py | routes.py | service.py
│   ├── agendamento/      ← model.py | schema.py | routes.py | service.py
│   ├── auth/             ← model.py | schema.py | routes.py | service.py | email_service.py
│   ├── barbeiro/         ← model.py | association.py | schema.py | routes.py | service.py
│   ├── cliente/          ← model.py | schema.py | routes.py
│   ├── dashboard/        ← schema.py | routes.py | service.py
│   ├── financeiro/       ← routes.py | service.py
│   └── servico/          ← model.py | schema.py | routes.py
│
└── utils/                ← Utilitários compartilhados entre múltiplos módulos
    ├── mixins.py          ← HashSenhaMixin (usado por barbeiro, cliente, admin)
    ├── http/              ← pagination.py | error_formatter.py
    ├── security/          ← decorators.py | ratelimiter.py
    ├── logging/           ← audit.py | logger_setup.py
    └── email/             ← email_layouts.py
```

### Documentação (`docs/`)

```
docs/
├── README.md              ← Índice central com links para todos os documentos
├── guias/                 ← Onboarding: COMECE_AQUI, FLUXO_BACKEND, TUTORIAL_APIS
├── modulos/               ← Espelha app/modules/ — docs por domínio
│   ├── auth/
│   ├── financeiro/
│   ├── dashboard/
│   ├── barbeiro/
│   └── cliente/
├── infra/                 ← Sistemas transversais: logs, paginação, email
├── frontend/              ← Contratos de API para o time de front
└── adr/                   ← Architecture Decision Records
```

---

## 5. Pontos positivos comparado com a estrutura antiga

### ✅ Coesão por domínio

Tudo sobre um domínio está na mesma pasta. Para trabalhar no módulo `agendamento`, você abre apenas `modules/agendamento/`.

### ✅ Onboarding mais rápido

Um desenvolvedor novo consegue entender o escopo completo de uma feature sem precisar navegar por 4 pastas diferentes.

### ✅ Boundaries explícitos entre domínios

Quando um módulo precisa importar de outro, o import deixa isso evidente:

```python
# Antes: ambíguo — "onde está esse modelo?"
from app.models.barbeiro import Barbeiro

# Depois: explícito — "pertence ao domínio de barbeiro"
from app.modules.barbeiro.model import Barbeiro
```

### ✅ Documentação espelha o código

A pasta `docs/modulos/` segue a mesma estrutura de `app/modules/`. A doc do módulo de auth fica em `docs/modulos/auth/`, assim como o código fica em `app/modules/auth/`.

### ✅ `utils/` temático

Os utilitários agora têm subpastas por responsabilidade (`http/`, `security/`, `logging/`, `email/`). Fica imediatamente claro o que cada utilitário faz antes de abrir o arquivo.

### ✅ Escalabilidade preparada

Adicionar um novo domínio de negócio — como por exemplo um módulo `produto/` ou `estoque/` — agora é trivial: cria-se uma pasta em `modules/` com os 4 arquivos padrão e registra o blueprint no `create_app()`.

---

## 6. O que não mudou

- **Nenhum contrato de API foi alterado.** Todos os endpoints (`/api/barbeiros`, `/api/agendamentos`, etc.) continuam com as mesmas URLs e payloads.
- **Nenhuma regra de negócio foi modificada.** A migração foi puramente estrutural.
- **O banco de dados não foi alterado.** Nenhuma migration foi necessária.
- **Os testes continuam funcionando.** Os scripts em `tests/` e `scripts/` foram atualizados apenas nos seus imports.
