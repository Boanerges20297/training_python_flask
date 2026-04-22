# Documentação Técnica: Módulo Financeiro

**Data:** 21 de Abril de 2026
**Módulo:** `app/modules/financeiro/service.py` + `app/modules/financeiro/routes.py`

---

## 1. Visão Geral

O módulo financeiro é um sistema de **relatórios somente leitura** (read-only). Ele não cria nem altera dados — apenas agrega, consolida e apresenta informações financeiras já existentes na base de agendamentos.

> **Regra de ouro:** O financeiro escuta o que aconteceu no módulo de Agendamentos. Quando um agendamento é `concluído` e marcado como `pago`, ele se torna parte da fonte da verdade financeira.

---

## 2. Arquitetura

```
app/modules/financeiro/routes.py   →  recebe request, valida params, monta response
       ↓
app/modules/financeiro/service.py  →  executa as 3 queries SQL, retorna dados crus
       ↓
Banco de Dados                     →  func.sum, func.count, group_by (sem trazer tudo pro Python)
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

## 7. Implementações Recentes (21/04/2026)

### 7.1 Pagamentos — Registro de Transações

**Status:** Implementado (Arquitetura Module-First)

Foi criada a tabela `TransacaoFinanceira` para registrar os detalhes exatos de cada pagamento.

```python
# Modelo: app/modules/transacoes/model.py
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

**Fluxo de Uso:** 
1. Quando um agendamento é concluído e marcado como pago (`status=concluido, pago=True`)
2. Criar uma transação via `POST /api/financeiro/transacoes` com os dados do pagamento
3. O serviço `TransacaoFinanceiraService.registrar_pagamento()` processa e registra a transação
4. Comissões são calculadas automaticamente (padrão 50% do barbeiro)

### 7.2 Preços Congelados (Histórico Imutável)

**Status:** Implementado

Para garantir que o histórico de notas fiscais não seja corrompido quando o valor base de um serviço aumentar no futuro, foi inserido o pilar da imutabilidade no `Agendamento`:

```python
# Adição ao modelo app/modules/agendamento/model.py
preco_cobrado = db.Column(db.Numeric(10, 2), nullable=True)
```

No momento em que o agendamento é criado, o sistema salva o `preco_cobrado = servico.preco`. A partir de então, a `TransacaoFinanceira` consumirá este valor congelado para registrar a venda e a comissão, invulnerabilizando seu histórico contábil contra inflações de serviços.

---

## 9. Endpoints de Transações

### `POST /api/financeiro/transacoes`
**Segurança:** JWT obrigatório + Role `admin`.

**Payload esperado:**
```json
{
  "agendamento_id": 12,
  "forma_pagamento": "dinheiro",  // ou "pix", "credito", "debito"
  "comissao_pct": 50.0,           // opcional, padrão 50%
  "observacoes": "Pagamento à vista" // opcional
}
```

**Resposta de Sucesso (201 Created):**
```json
{
  "sucesso": true,
  "mensagem": "Pagamento registrado com sucesso",
  "dados": {
    "transacao_id": 5,
    "agendamento_id": 12,
    "valor_bruto": 55.00,
    "valor_comissao": 27.50,
    "forma_pagamento": "dinheiro",
    "data_pagamento": "2026-04-22T10:30:45.123456+00:00"
  }
}
```

### `DELETE /api/financeiro/transacoes/<transacao_id>`
**Segurança:** JWT obrigatório + Role `admin`.

**Payload (opcional):**
```json
{
  "motivo": "Cliente pagou em dobro"
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "sucesso": true,
  "mensagem": "Transação revertida com sucesso"
}
```

### `GET /api/financeiro/transacoes/barbeiro/<barbeiro_id>/comissoes`
**Segurança:** JWT obrigatório + Role `admin`.

**Query Parameters (opcionais):**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `dias` | int | Últimos X dias retroativos (padrão: 30) |
| `mes` | int | Mês específico (1-12) |
| `ano` | int | Ano específico (deve usar com `mes`) |

**Resposta de Sucesso (200 OK):**
```json
{
  "sucesso": true,
  "mensagem": "Comissões obtidas com sucesso",
  "dados": {
    "barbeiro_id": 3,
    "total_vendas": 1500.00,
    "total_comissao": 750.00,
    "quantidade_transacoes": 27
  }
}
```

---

## 10. Arquivos Relacionados

| Arquivo | Responsabilidade |
|---|---|
| `app/modules/financeiro/service.py` | Lógica de agregação e relatórios financeiros |
| `app/modules/financeiro/routes.py` | Roteamento do endpoint `/api/financeiro/relatorio` |
| `app/modules/financeiro/model.py` | Modelo `TransacaoFinanceira` (entidade do banco) |
| `app/modules/transacoes/service.py` | Serviço `TransacaoFinanceiraService` para gerenciar transações |
| `app/modules/transacoes/routes.py` | Roteamento dos endpoints de transações (`/api/financeiro/transacoes/*`) |
| `app/modules/transacoes/model.py` | Importação do modelo `TransacaoFinanceira` |
| `app/modules/agendamento/model.py` | Agendamento, agora com campo `preco_cobrado` |
| `scripts/fix_db_financeiro.py` | Script de seed/manutenção (legado) |
| `docs/testes_financeiro.md` | Roteiro de testes QA detalhado |
