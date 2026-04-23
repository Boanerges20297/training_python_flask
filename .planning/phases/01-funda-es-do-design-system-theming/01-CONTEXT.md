# Phase 1 Context

This document captures implementation decisions made during the discussion phase. Downstream agents (researcher, planner) use this to know what is locked and what approach to take.

## <decisions>
- **Estilização e Tokens:** Implementar um arquivo central de Design Tokens (`src/assets/styles/tokens.css` ou equivalente) contendo variáveis CSS de cor, espaçamento e tipografia. Esse arquivo deve ser consumido localmente nos arquivos `.module.css` para evitar vazamentos enquanto mantém a consistência da marca.
- **Acoplamento a Modais:** A diretriz geral de UX para o admin é priorizar *Side-Panels* (drawers laterais) e *Expandable Cards* no lugar de modais intrusivos para visualização/edição rápida. Modais devem ser usados com extrema moderação.
- **Desacoplamento Serviços x Barbeiros:** A gestão de Serviços será uma entidade de primeira classe com sua própria interface CRUD. O cadastro/edição de um Barbeiro apenas selecionará Serviços existentes em vez de criá-los inline.
- **Tematização (Theming):** Implementar suporte a **ambos os modos Light e Dark**. O design deve buscar um visual "mais vivo/neutro" nas duas variantes. O Dark mode não deve utilizar pretos muito profundos ou escuros que prejudiquem esse tom vibrante (evitar `background: #000000`, preferir tons levemente acinzentados ou azuis pastéis escuros para manter a vivacidade das cores de destaque).
</decisions>

## <specifics>
- As cores da marca para integração aos temas são:
  - Cliente: Azul claro
  - Barbeiro: Âmbar
  - Serviços: Verde
  - Agendamentos: Roxo
</specifics>

## <deferred>
- N/A
</deferred>

## <canonical_refs>
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
</canonical_refs>
