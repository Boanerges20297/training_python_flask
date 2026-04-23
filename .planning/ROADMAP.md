# Project Roadmap

## Milestone v1.0: Refatoração Estética e UX do Módulo Admin

### Phase 1: Fundações do Design System & Theming
**Goal:** Estabelecer o uso de CSS Modules, definir a paleta de cores harmonizada com o tema escuro, e migrar componentes globais e notificações.
**Requirements:**
- THEME-01: Implementar o Design System inicial (CSS Modules) e paleta.
- THEME-02: Ajustar o background/tema escuro base (Dark Mode).
- THEME-03: Refatorar o sistema de Notificações (`ToastProvider`).
- CORE-01: Refatorar e mover componentes globais de interface para `src/components/ui`.
**Success Criteria:**
1. Variáveis de CSS/Tokens configuradas globalmente sem vazar estilos de componentes.
2. Novo `ToastProvider` testado e animado, substituindo os `alert()` ou notificações cruas.
3. Componentes genéricos como botões e inputs migrados para o novo padrão.

### Phase 2: Refatoração do Fluxo de Autenticação
**Goal:** Aplicar a nova identidade visual e UX às telas de Login, Cadastro e Recuperação de Senha.
**Requirements:**
- AUTH-01: Refatorar visualmente a tela de Login.
- AUTH-02: Refatorar visualmente a tela de Cadastro.
- AUTH-03: Refatorar visualmente a tela de Recuperação de Senha.
**Success Criteria:**
1. Telas de Auth isoladas, responsivas e visualmente deslumbrantes.
2. Validações de erro exibidas usando o novo sistema de notificações (THEME-03).
3. Transições suaves entre login, cadastro e esqueci senha.

### Phase 3: Estrutura Base do Admin e Desacoplamento de Entidades
**Goal:** Iniciar as regras arquiteturais dentro do módulo Admin e aplicar as correções de UX exigidas (serviços separados de barbeiros e dropdown de especialidades).
**Requirements:**
- CORE-02: Mover subcomponentes de views admin para `src/modules/admin/components`.
- SERV-01: Desacoplar UX de "Serviços" de "Barbeiros" (rotas ou views distintas para gestão).
- SERV-02: Refatorar "Especialidades" dos Barbeiros para uso de Dropdown list (Select).
**Success Criteria:**
1. Criar/Editar um serviço não exige a abertura do modal de um barbeiro.
2. Formulário de barbeiro oferece apenas opções pré-definidas para especialidade (evitando textos livres e divergentes).
3. Componentes do admin importados de caminhos isolados e não globais.

### Phase 4: Novas Views do Admin (Histórico & Ranking)
**Goal:** Limpar a visão principal da Dashboard extraindo informações que merecem destaque (Histórico e Ranking) para views dedicadas.
**Requirements:**
- RANK-01: Criar uma nova View dedicada para o Ranking de Barbeiros.
- RANK-02: Criar uma nova View dedicada para Histórico.
**Success Criteria:**
1. Acesso à visualização do Ranking de forma independente na navegação do Admin.
2. Acesso ao Histórico do sistema de forma independente.
3. Componentização visual forte para cartões de barbeiro no ranking.

### Phase 5: Refatoração Criativa da Dashboard Admin
**Goal:** Remodelar completamente a Dashboard, entregando dados métricos vitais com riqueza visual, reduzindo dependência de modais.
**Requirements:**
- DASH-01: Refatorar a visualização principal da Dashboard para exibição mais criativa e dinâmica de dados.
- DASH-02: Reduzir a dependência extrema de modais para exibição de detalhes, favorecendo painéis expansíveis ou side-panels.
**Success Criteria:**
1. Dashboard principal apresenta gráficos/contadores com uso das cores definidas no sistema.
2. Ações de clique sobre listas (ex: listar um agendamento) não bloqueiam a tela toda com um modal agressivo.
3. UI sênior e premium, wow-factor perceptível logo na primeira renderização da dashboard.

---

*This roadmap defines the sequenced execution plan. Requirements map 1:1 to phases.*
