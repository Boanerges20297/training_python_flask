# Project Name: Barbabyte Frontend
**Core Value:** A modern, role-based barber shop management system providing a tailored experience for admins, clients, and barbers.
**What This Is:** The React 19 frontend for Barbabyte, utilizing Vite, TypeScript, and React Router.

## Current Milestone: v1.0 Refatoração Estética e UX do Módulo Admin

**Goal:** Refatorar a estética e UX do módulo Admin, implementando um design system mais criativo e desacoplado, focado no uso de CSS Modules e isolamento de componentes.

**Target features:**
- Refatoração da Dashboard (criatividade, apresentação de dados)
- Novo layout para histórico e ranking de barbeiros (separado em nova view)
- Desacoplamento de Modais e Serviços x Barbeiros
- Padronização de Especialidades via Dropdown
- Refatoração do fluxo de Auth (Login, Cadastro, Esqueci Senha)
- Atualização do sistema de Notificações
- Ajuste de Paleta Escura para integrar as cores (Azul claro, Âmbar, Verde, Roxo)

## Active Requirements
(To be defined in REQUIREMENTS.md)

## Key Decisions
- **Estilização:** Migração de CSS global para **CSS Modules**.
- **Arquitetura de Componentes:** Componentes globais em `src/components/ui`. Componentes específicos de módulo em `src/modules/[module_name]/components`.

## Evolution
This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
