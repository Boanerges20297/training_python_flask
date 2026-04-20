# Documentação Técnica: Módulo Financeiro

**Data:** 20 de Abril de 2026
**Módulo:** `app/services/financeiro_service.py` + `app/routes/financeiro_routes.py`

---

## 1. Visão Geral

O módulo financeiro é um sistema de **relatórios somente leitura** (read-only). Ele não cria nem altera dados — apenas agrega, consolida e apresenta informações financeiras já existentes na base de agendamentos.

> **Regra de ouro:** O financeiro escuta o que aconteceu no módulo de Agendamentos. Quando um agendamento é `concluído` e marcado como `pago`, ele se torna parte da fonte da verdade financeira.

---

## 2. Arquitetura

```
financeiro_routes.py   →  recebe request, valida params, monta response
       ↓
financeiro_service.py  →  executa as 3 queries SQL, retorna dados crus
       ↓
Banco de Dados         →  func.sum, func.count, group_by (sem trazer tudo pro Python)
```

O service **nunca** monta envelopes JSON — devolve um dicionário Python puro. A rota é responsável por chamar `formatar_retorno_paginacao()` e empacotar a resposta final.

---

## 3. As 3 Consultas Internas

### Consulta 1 — Resumo Agregado (receita e ticket médio)
Usa `func.sum` e `func.count` diretamente no banco. Opera em O(1) independente de quantos registros existam.

### Consulta 2 — Ranking de Lucro por Barbeiro
Usa `group_by(Barbeiro.id)` para compactar todos os cortes de cada barbeiro em uma única linha de resultado, já ordenada decrescentemente por lucro.

### Consulta 3 — Extrato (Notas Fiscais Paginadas)
Usa `offset` e `limit` para nunca trazer mais do que `N` registros para a memória Python de uma vez. Previne travamento em bases com dezenas de milhares de registros.

---

## 4. Filtros da Fonte da Verdade

Um agendamento só entra nos cálculos financeiros se satisfizer **todas** as condições:

| Condição | Campo | Valor |
|---|---|---|
| Serviço foi realizado | `status` | `concluido` |
| Cliente pagou | `pago` | `True` |
| Dentro do período | `data_agendamento` | Entre o 1º e último dia do mês |

---

## 5. Rota da API

### `GET /api/financeiro/relatorio`
**Segurança:** JWT obrigatório + Role `admin`.

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `mes` | int | ✅ Sim | — | Mês de referência (1–12) |
| `ano` | int | ✅ Sim | — | Ano de referência |
| `pagina` | int | ❌ Não | `1` | Página do extrato |
| `limite` | int | ❌ Não | `50` | Itens por página |

**Exemplo de Resposta (200 OK):**
```json
{
  "sucesso": true,
  "dados": {
    "items": [
      {
        "agendamento_id": 12,
        "data": "2026-04-15T14:00:00+00:00",
        "barbeiro_nome": "João",
        "cliente_nome": "Carlos",
        "servico": "Corte Degradê",
        "valor": 55.00
      }
    ],
    "total": 23,
    "items_nessa_pagina": 10,
    "pagina": 1,
    "per_page": 50,
    "total_paginas": 1,
    "tem_proxima": false,
    "tem_pagina_anterior": false,
    "resumo": {
      "receita_total": 985.00,
      "ticket_medio": 42.83,
      "total_agendamentos_pagos": 23
    },
    "lucro_por_barbeiro": [
      { "barbeiro_nome": "João", "lucro": 550.00 },
      { "barbeiro_nome": "Pedro", "lucro": 435.00 }
    ]
  }
}
```

---

## 6. Guia de Testes

### 6.1 Segurança (Nível 1)

**Teste A — Sem autenticação:**
```
GET /api/financeiro/relatorio?mes=4&ano=2026
(Sem Header Authorization)
```
✅ Esperado: `401 Unauthorized`

**Teste B — Role insuficiente:**
```
GET /api/financeiro/relatorio?mes=4&ano=2026
(Com Token de barbeiro ou cliente)
```
✅ Esperado: `403 Forbidden`

### 6.2 Validação de Parâmetros (Nível 2)

**Teste C — Sem parâmetros:**
```
GET /api/financeiro/relatorio
```
✅ Esperado: `400 Bad Request` — *"parâmetros 'mes' e 'ano' são obrigatórios"*

**Teste D — Mês inválido:**
```
GET /api/financeiro/relatorio?mes=14&ano=2026
```
✅ Esperado: `400 Bad Request` — *"Mês logicamente inválido"*

### 6.3 Caminho Feliz (Nível 3)

**Teste E — Mês com dados:**
```
GET /api/financeiro/relatorio?mes=4&ano=2026
(Com Token admin)
```
✅ `receita_total` deve ser calculada somente de agendamentos `status=concluido` e `pago=True`.
✅ `lucro_por_barbeiro` deve estar ordenado do maior para o menor lucro.

**Teste F — Mês sem dados (resiliência):**
```
GET /api/financeiro/relatorio?mes=12&ano=2099
(Com Token admin)
```
✅ Esperado: `200 OK` com `receita_total: 0.0` e `items: []` — nunca `null` ou `500`.

### 6.4 Paginação (Nível 4)

**Teste G — Limitar extrato:**
```
GET /api/financeiro/relatorio?mes=4&ano=2026&pagina=1&limite=5
```
✅ `items` deve ter no máximo 5 registros.
✅ `total_paginas` deve refletir o total real dividido por 5.
✅ `tem_proxima: true` se houver mais páginas.

---

## 7. Futuras Adições

### 7.1 Pagamentos — Registro de Transações

**Problema atual:** O campo `pago` no `Agendamento` é apenas um booleano. Não registra como o cliente pagou (dinheiro, cartão, Pix), nem a data exata do pagamento.

**Solução planejada:** Criar uma nova tabela `TransacaoFinanceira`.

```python
# Modelo futuro: app/models/transacao.py
class TransacaoFinanceira(db.Model):
    __tablename__ = "transacoes_financeiras"

    id              = db.Column(db.Integer, primary_key=True)
    agendamento_id  = db.Column(db.Integer, db.ForeignKey("agendamentos.id"), nullable=False)
    barbeiro_id     = db.Column(db.Integer, db.ForeignKey("barbeiros.id"), nullable=False)
    valor_bruto     = db.Column(db.Numeric(10, 2), nullable=False)
    forma_pagamento = db.Column(db.String(20))  # "dinheiro", "pix", "credito", "debito"
    data_pagamento  = db.Column(db.DateTime, default=datetime.utcnow)
    comissao_pct    = db.Column(db.Numeric(5, 2), default=50.00)  # % do barbeiro
    valor_comissao  = db.Column(db.Numeric(10, 2))  # calculado ao criar
```

**Fluxo:** Quando `agendamento.status` muda para `concluido`, o `AgendamentoService` chama `FinanceiroService.processar_pagamento(agendamento)` que cria a `TransacaoFinanceira` automaticamente.

### 7.2 Preços Congelados (Histórico Imutável)

**Problema atual:** As notas fiscais exibem o preço **atual** do serviço (`Servico.preco`). Se o salão reajustar o preço do "Corte Degradê" de R$ 55 para R$ 70, todos os relatórios passados serão recalculados com o preço novo — histórico financeiro corrompido.

**Solução planejada:** Salvar o preço no momento exato da transação.

Na tabela `TransacaoFinanceira`, o campo `valor_bruto` já resolve isso — ele armazena o valor pago naquele dia, independente de qualquer alteração futura no `Servico.preco`.

Enquanto essa tabela não existe, uma solução intermediária seria adicionar o campo `preco_cobrado` diretamente no `Agendamento`:

```python
# Adição ao modelo Agendamento (solução interina)
preco_cobrado = db.Column(db.Numeric(10, 2), nullable=True)
# Populado no momento da criação do agendamento com Servico.preco
```

> [!WARNING]
> Sem o preço congelado, qualquer mudança de preço de serviço corrompe retroativamente os relatórios financeiros históricos. Este é um **bug de alto impacto** em qualquer sistema de faturamento.

---

## 8. Arquivos Relacionados

| Arquivo | Responsabilidade |
|---|---|
| `app/services/financeiro_service.py` | Lógica das 3 queries SQL |
| `app/routes/financeiro_routes.py` | Validação de params + montagem do response |
| `app/utils/pagination.py` | Helper de paginação usado na rota |
| `scripts/fix_db_financeiro.py` | Script de seed/manutenção do banco financeiro |
| `docs/testes_financeiro.md` | Roteiro de testes QA detalhado (legado) |
