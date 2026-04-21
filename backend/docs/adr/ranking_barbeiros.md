# Documentação de Refatoração: Desacoplamento do Ranking de Barbeiros

**Data:** 20 de Abril de 2026
**Objetivo:** Mover as métricas de desempenho (ranking de receita e ganhos individuais) do módulo geral do Dashboard para um módulo especialista dedicado aos Barbeiros.

## 1. Motivação Arquitetural
Antes da refatoração, o serviço do Dashboard atuava como um *God Object* – ele mesmo vasculhava as tabelas de Agendamentos para calcular o tempo total e os lucros de cada barbeiro. 
Para aplicar um princípio de *Backend for Frontend (BFF)* e *Domain-Driven Design (DDD)* prático, extraímos toda a parte que é responsabilidade do RH/Barbeiro para um serviço isolado de Barbeiros. O Dashboard agora foca puramente em métricas estratégicas globais.

---

## 2. O que mudou no código?

### 2.1. Novo Serviço Especialista
**Arquivo Criado:** `app/services/barbeiro_service.py`
Foi criada a classe `BarbeiroService` contendo três métodos centrais:
- `obter_ranking_desempenho(dias: int)`: Calcula os ganhos ordenados de toda a equipe de barbeiros no tempo especificado.
- `_to_desempenho_barbeiro(...)`: Responsável pela métrica analítica de cada trabalhador (concluídos, cancelados, soma do tempo e conversão/taxa de conclusão).
- `_formatar_servicos_realizados(...)`: Mapeia quais e quantos serviços cada barbeiro fez.

Esses métodos **foram extraídos** e não habitam mais o `dashboard_service.py`.

### 2.2. Contratos (Schemas) Movidos
- **Removidos de:** `app/schemas/dashboard_chema.py`
- **Trazidos para:** `app/schemas/barbeiro_schema.py`

Movimentamos o `ServicoRealizadoSchema` e o grandioso `BarbeiroDesempenhoSchema` para seu domínio nativo. Consequentemente, a chave de resposta `barbeiros_desempenho` foi permanentemente **deletada** da resposta principal do Dashboard (`DashboardResumoSchema`).

### 2.3. Rotas (Endpoints)
- **`GET /api/dashboard/geral`**: Não reporta mais os barbeiros individualmente. Ficou mais rápido e enxuto.
- **`GET /api/barbeiros/ranking`**: **[NOVO]** Ponto de acesso restrito (apenas administradores) para capturar exclusivamente o quadro de desempenho da equipe.

---

## 3. Contrato da Nova API (Postman/Insomnia)

### Rota: `GET /api/barbeiros/ranking`
**Segurança:** Autenticação necessária (Bearer Token) e exclusividade Role = `admin`.

**Query Parameters Opcionais:**
- `dias` (integer): Quantidade de dias retroativos de busca. Padrão: 30.

**Exemplo de Resposta de Sucesso (200 OK):**
```json
{
  "message": "Ranking de barbeiros obtido com sucesso",
  "data": [
    {
      "barbeiro_id": 2,
      "barbeiro_nome": "João do Corte",
      "total_agendamentos": 45,
      "agendamentos_concluidos": 40,
      "agendamentos_cancelados": 5,
      "receita_total": 1250.00,
      "tempo_total_minutos": 1600,
      "taxa_conclusao": 88.89,
      "servicos_realizados": [
        {
          "nome": "Corte Degradê",
          "quantidade": 30,
          "preco_unitario": 35.0,
          "receita": 1050.0
        }
      ]
    }
  ]
}
```

## 4. Conclusão Operacional e Próximos Passos
Esta alteração limpa completamente o módulo de Ranking da tela inicial do Dashboard, exigindo que as Interfaces Frontend façam a requisição direta à rota inteligente do Barbeiro caso desejem montar a tela de "Top Barbeiros" ou "Comissões Sugeridas". Em refatorações futuras, métricas focadas em receitas pesadas deverão migrar para o isolamento no `financeiro_service.py`.
