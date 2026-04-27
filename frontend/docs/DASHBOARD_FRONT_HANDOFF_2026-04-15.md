# Dashboard - Handoff para Frontend (15/04/2026)

## 1) O que ja esta pronto (backend - Josue)
- Estruturas de dados (schemas) do dashboard.
- Regra de negocio/calculos (service) do dashboard.

Arquivos de referencia atuais:
- `app/schemas/dashboard_chema.py`
- `app/services/deshboard_service.py`

## 2) O que o front vai receber (contrato de dados)

### Dashboard Geral
Campos principais:
- `periodo_inicio` (datetime)
- `periodo_fim` (datetime)
- `receita_total` (float)
- `agendamentos_total` (int)
- `agendamentos_concluidos` (int)
- `agendamentos_cancelados` (int)
- `agendamentos_pendentes` (int)
- `ticket_medio` (float)
- `top_5_horarios` (lista)
- `receita_diaria` (lista)
- `barbeiros_desempenho` (lista)

### Dashboard por Barbeiro
Campos principais:
- `barbeiro_id` (int)
- `barbeiro_nome` (string)
- `periodo_inicio` (datetime)
- `periodo_fim` (datetime)
- `receita_total` (float)
- `agendamentos_concluidos` (int)
- `agendamentos_cancelados` (int)
- `servicos_realizados` (lista)
- `taxa_conclusao` (float, percentual)

## 3) Regras de negocio importantes
- Receita conta apenas agendamentos com status `concluido`.
- `ticket_medio = receita_total / concluidos` (se 0 concluidos, retorna 0).
- Horarios populares consideram apenas `concluido`.
- Receita diaria agrupa por data (`YYYY-MM-DD`).

## 4) Liberacao dos endpoints e permissoes de acesso
- Criar/registrar rotas HTTP do dashboard.
- Validacao do parametro `dias` (1 a 365).
- Controle de acesso por role nos endpoints.

## 5) Decisoes que o front precisa tomar agora
- Layout inicial:
  - Cards: receita total, ticket medio, total de agendamentos.
  - Grafico de linha: `receita_diaria`.
  - Grafico de barras: `top_5_horarios`.
  - Tabela: `barbeiros_desempenho`.
- Filtro unico de periodo (`dias`: 7, 15, 30, 60, 90).
- Estado de loading/erro/sem dados para cada bloco.

## 6) Exemplo de payload (mock para desenvolver ja)
```json
{
  "periodo_inicio": "2026-03-16T00:00:00Z",
  "periodo_fim": "2026-04-15T23:59:59Z",
  "receita_total": 3420.5,
  "agendamentos_total": 98,
  "agendamentos_concluidos": 76,
  "agendamentos_cancelados": 12,
  "agendamentos_pendentes": 10,
  "ticket_medio": 45.01,
  "top_5_horarios": [
    { "hora": 9, "total_agendamentos": 14 },
    { "hora": 10, "total_agendamentos": 11 }
  ],
  "receita_diaria": [
    {
      "data": "2026-04-12",
      "receita": 280.0,
      "agendamentos_concluidos": 6,
      "agendamentos_pendentes": 1
    }
  ],
  "barbeiros_desempenho": [
    {
      "barbeiro_id": 2,
      "barbeiro_nome": "Carlos",
      "total_agendamentos": 24,
      "agendamentos_concluidos": 19,
      "agendamentos_cancelados": 3,
      "receita_total": 980.0,
      "tempo_total_minutos": 760,
      "servicos_realizados": [
        {
          "nome": "Corte",
          "quantidade": 10,
          "preco_unitario": 40.0,
          "receita": 400.0
        }
      ],
      "taxa_conclusao": 79.17
    }
  ]
}
```
