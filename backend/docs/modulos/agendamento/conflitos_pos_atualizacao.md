# Documentação de Conflitos e Impactos: Múltiplos Serviços

A migração do sistema de agendamento de uma relação **1:1** (um serviço por agendamento) para **N:N** (múltiplos serviços por agendamento via Many-to-Many) introduziu mudanças estruturais profundas. Esta documentação detalha os conflitos identificados nos módulos de **Dashboard** e **Financeiro** que precisam de correção imediata para garantir a integridade dos dados.

---

## ⚠️ Conflitos Críticos Identificados

### 1. Cálculo de Receita e Valores Brutos
Muitos métodos ainda tentam acessar o preço do serviço através da propriedade antiga `agendamento.servico.preco`.

*   **Localização**: `TransacaoFinanceiraService.registrar_pagamento` (Financeiro) e diversos pontos em `DashboardService`.
*   **Problema**: Com a remoção ou depreciação da coluna `servico_id` no modelo `Agendamento`, a propriedade `.servico` retornará `None` ou um dado incorreto/desatualizado.
*   **Impacto**: Transações financeiras sendo registradas com valor R$ 0,00 ou falha total (Crash 500) ao tentar acessar atributos de um objeto nulo.

### 2. Consultas SQL com Join (Quebra de Queries)
As consultas que utilizam agregação via SQLAlchemy (`func.sum`, `func.count`) realizam o join baseado na coluna antiga.

*   **Localização**: `DashboardService.get_ganhos_totais`, `DashboardService.get_ganhos_barbeiros`, `DashboardService.get_servico_mais_procurado`.
*   **Trecho Problemático**: `.join(Agendamento, Agendamento.servico_id == Servico.id)`
*   **Problema**: Como a relação agora é via tabela associativa (`agendamento_servico`), o join direto entre `Agendamento` e `Servico` não é mais possível/válido.
*   **Impacto**: Dashboards não carregam (Erro 500) ou exibem dados zerados.

### 3. Estatísticas de Frequência de Serviços
O cálculo de "serviço mais procurado" agora deve considerar que um único agendamento pode conter vários serviços.

*   **Localização**: `DashboardService._formatar_servicos_realizados`.
*   **Problema**: O loop atual percorre os agendamentos e pega "o" serviço de cada um.
*   **Solução Necessária**: O loop deve percorrer `agendamento.servicos` (lista) para contabilizar cada serviço individualmente dentro de um mesmo agendamento.

---

## 🛠️ Plano de Correção Sugerido

### No Módulo Financeiro
Alterar a lógica de busca de preço em `TransacaoFinanceiraService`:
```python
# ANTES
valor_bruto = agendamento.servico.preco

# DEPOIS
valor_bruto = sum(s.preco for s in agendamento.servicos)
```

### No Módulo Dashboard
1.  **Refatorar Joins**: Substituir joins diretos pela tabela associativa.
2.  **Soma de Receita**: Utilizar uma subquery ou somar manualmente os itens da lista `servicos` em loops de Python (para KPIs simples).
3.  **Duração Total**: Atualizar o cálculo de "Tempo Total em Atendimento" para usar a soma das durações de todos os serviços do agendamento, não apenas um.

---

## 📊 Resumo de Riscos por Módulo

| Módulo | Tipo de Erro | Gravidade | Descrição |
| :--- | :--- | :--- | :--- |
| **Financeiro** | Lógica de Valor | **Crítica** | Pagamentos registrados com valores errados (ignora multi-serviços). |
| **Dashboard** | SQL Join | **Alta** | Queries quebram ao tentar acessar a coluna `servico_id` inexistente. |
| **Dashboard** | KPI de Receita | **Alta** | Ticket médio e receita total subestimados (conta apenas 1 serviço). |
| **Barbeiro** | Performance | **Média** | Tempo total de trabalho calculado de forma errada. |

---

> [!CAUTION]
> **AÇÃO REQUERIDA**: Não utilize os relatórios financeiros do dashboard como fonte de verdade até que os joins SQL sejam atualizados para a nova estrutura Many-to-Many.
