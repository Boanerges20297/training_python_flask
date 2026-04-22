# 📚 Documentação — Barba & Byte Backend

Bem-vindo ao índice central da documentação técnica do projeto.
Os arquivos estão organizados por **audiência e finalidade**.

---

## 🗂️ Estrutura

```
docs/
├── guias/          → Onboarding e visão geral do sistema
├── modulos/        → Documentação técnica por domínio de negócio
│   ├── auth/
│   ├── financeiro/
│   ├── dashboard/
│   ├── barbeiro/
│   └── cliente/
├── infra/          → Sistemas transversais (logs, email, paginação)
│   └── email/
├── frontend/       → Contratos e guias para o time de frontend
└── adr/            → Architecture Decision Records (decisões arquiteturais)
```

---

## 🚀 Guias (comece aqui)

| Arquivo | Descrição |
|---------|-----------|
| [COMECE_AQUI.md](./guias/COMECE_AQUI.md) | Guia de aprendizado ativo — por onde começar |
| [FLUXO_BACKEND.md](./guias/FLUXO_BACKEND.md) | Visão geral do fluxo completo do backend |
| [TUTORIAL_APIS.md](./guias/TUTORIAL_APIS.md) | Tutorial interativo de uso das APIs |

---

## 🧩 Módulos

### 🔐 Auth
| Arquivo | Descrição |
|---------|-----------|
| [jwt_rs256.md](./modulos/auth/jwt_rs256.md) | Autenticação JWT com criptografia assimétrica RS256 |
| [recuperacao_senha.md](./modulos/auth/recuperacao_senha.md) | Fluxo completo de "Esqueci a Senha" |

### 💰 Financeiro
| Arquivo | Descrição |
|---------|-----------|
| [documentacao.md](./modulos/financeiro/documentacao.md) | Documentação técnica do módulo financeiro |
| [testes.md](./modulos/financeiro/testes.md) | Guia de testes QA do módulo financeiro |

### 📊 Dashboard
| Arquivo | Descrição |
|---------|-----------|
| [documentacao.md](./modulos/dashboard/documentacao.md) | Documentação técnica do dashboard |
| [logica.md](./modulos/dashboard/logica.md) | Lógica de funcionamento e cálculos do dashboard |

### ✂️ Barbeiro
| Arquivo | Descrição |
|---------|-----------|
| [servicos_barbeiros.md](./modulos/barbeiro/servicos_barbeiros.md) | Arquitetura N:N entre barbeiros e serviços |

### 👤 Cliente
| Arquivo | Descrição |
|---------|-----------|
| [status_historico.md](./modulos/cliente/status_historico.md) | Status de clientes e histórico de cortes |

### 📅 Agendamento
| Arquivo | Descrição |
|---------|-----------|
| [multi_servicos.md](./modulos/agendamento/multi_servicos.md) | Fluxo de agendamentos com múltiplos serviços (M2M) |
| [conflitos_pos_atualizacao.md](./modulos/agendamento/conflitos_pos_atualizacao.md) | Guia de erros e impactos nos módulos Dashboard/Financeiro |

---

## ⚙️ Infraestrutura

| Arquivo | Descrição |
|---------|-----------|
| [logs.md](./infra/logs.md) | Sistema de logs estruturados (JSON) |
| [paginacao.md](./infra/paginacao.md) | Padrão de respostas paginadas da API |
| [email/email.md](./infra/email/email.md) | Sistema de envio de e-mails (Flask-Mailman) |
| [email/notificacoes.md](./infra/email/notificacoes.md) | Notificações automáticas por e-mail |

---

## 🖥️ Frontend

| Arquivo | Descrição |
|---------|-----------|
| [guia_integracao.md](./frontend/guia_integracao.md) | Guia rápido de integração com a API |
| [auth.md](./frontend/auth.md) | Autenticação JWT com cookies HttpOnly + CSRF |

---

## 📋 ADR — Architecture Decision Records

Registro das decisões arquiteturais relevantes e o raciocínio por trás delas.

| Arquivo | Descrição |
|---------|-----------|
| [migracao_ddd.md](./adr/migracao_ddd.md) | **Migração para arquitetura DDD** — por quê, como e o que mudou |
| [ranking_barbeiros.md](./adr/ranking_barbeiros.md) | Refatoração do ranking de barbeiros no dashboard |
