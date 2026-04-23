# Milestone Requirements

## Infraestrutura UI & Theming
- [ ] **THEME-01**: Implementar o Design System inicial (CSS Modules) utilizando a paleta baseada em: Cliente (Azul Claro), Barbeiro (Âmbar), Serviços (Verde), Agendamentos (Roxo).
- [ ] **THEME-02**: Ajustar o background/tema escuro base (Dark Mode) para harmonizar de forma premium com a paleta de cores.
- [ ] **THEME-03**: Refatorar o sistema de Notificações (`ToastProvider`) para usar o novo design system e animações mais suaves.

## Componentes Base & Layout
- [ ] **CORE-01**: Refatorar e mover componentes globais de interface para `src/components/ui` (botões, inputs, modais base, etc).
- [ ] **CORE-02**: Garantir que as views do admin carreguem seus subcomponentes diretamente de `src/modules/admin/components` (isolamento de domínio).

## Módulo Admin - Dashboard
- [ ] **DASH-01**: Refatorar a visualização principal da Dashboard para exibição mais criativa e dinâmica de dados (abandonar telas estáticas/listas comuns em favor de uma UX rica).
- [ ] **DASH-02**: Reduzir a dependência extrema de modais, favorecendo painéis laterais ou expansão de cards quando apropriado.

## Módulo Admin - Histórico & Ranking
- [ ] **RANK-01**: Criar uma nova View dedicada para o Ranking de Barbeiros (separada da Dashboard).
- [ ] **RANK-02**: Criar uma nova View dedicada para Histórico.

## Módulo Admin - Serviços & Barbeiros
- [ ] **SERV-01**: Desacoplar a UX de "Serviços" de "Barbeiros" (serviços não precisam mais ser cadastrados obrigatoriamente dentro do modal do barbeiro).
- [ ] **SERV-02**: Refatorar a entrada de "Especialidades" dos Barbeiros de campo de texto livre para uma lista (Dropdown/Select) padronizada.

## Fluxo de Autenticação
- [ ] **AUTH-01**: Refatorar visualmente a tela de Login (`AuthContainer`).
- [ ] **AUTH-02**: Refatorar visualmente a tela de Cadastro.
- [ ] **AUTH-03**: Refatorar visualmente a tela de Recuperação de Senha ("Esqueci Senha").

---

## Future Requirements
- Testes automatizados E2E do fluxo de admin.
- Otimização do bundle (Code Splitting detalhado do CSS).

## Out of Scope
- Refatoração profunda da UX do Client Dashboard e Barber Dashboard (o foco deste Milestone é o módulo Admin e Auth).
- Mudanças drásticas na estrutura do backend (Flask), salvo adequação de IDs que já foi prevista.

---

## Traceability
*(To be populated by roadmap)*
