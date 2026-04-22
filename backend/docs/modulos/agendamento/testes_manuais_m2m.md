# Testes Manuais — Agendamento M2M com Serviços

**Servidor:** `http://localhost:5000`
**Ferramenta sugerida:** Postman, Insomnia ou Thunder Client

> [!IMPORTANT]
> Antes de qualquer teste, garanta que o banco tem ao menos: 1 admin, 2 barbeiros, 1 cliente, 2 serviços, e que os barbeiros têm serviços vinculados na tabela `barbeiro_servico`. Se ainda não rodou: `py tests/seeds/seed_financeiro.py`

---

## Passo 0 — Login (obter o token)

### T00 — Login como Admin

**POST** `/api/auth/login`
```json
{
  "email": "admin@barba.com",
  "senha": "123@123"
}
```
✅ **Esperado:** `200 OK` com cookies `access_token_cookie` e `refresh_token_cookie` setados.

> Use o cookie retornado em **todos os testes seguintes**. No Postman, ative "Send cookies" ou copie o valor do cookie para o header `Cookie`.

---

## Grupo 1 — Criação (POST /api/agendamento)

> [!NOTE]
> Antes de rodar, veja quais IDs existem no banco:
> - Barbeiro: `GET /api/barbeiros` (ou veja pelo SQLite)
> - Serviço: `GET /api/servicos`
> - Cliente: faça login como cliente e use `get_jwt_identity()`

---

### T01 — ✅ Happy Path: criar com 1 serviço

**POST** `/api/agendamento`
```json
{
  "barbeiro_id": 1,
  "cliente_id": 1,
  "servico_ids": [1],
  "data_agendamento": "2026-06-10T10:00:00"
}
```
✅ **Esperado:** `201 Created`
```json
{
  "sucesso": true,
  "dados": {
    "agendamento": {
      "id": "<qualquer>",
      "status": "pendente",
      "servicos": [
        { "id": 1, "nome": "...", "preco": 55.0, "duracao_minutos": 45 }
      ]
    }
  }
}
```
🔍 **O que valida:** campo `servicos` é uma lista com o objeto completo do serviço (não mais um simples `servico_id`).

---

### T02 — ✅ Happy Path: criar com múltiplos serviços

**POST** `/api/agendamento`
```json
{
  "barbeiro_id": 1,
  "cliente_id": 1,
  "servico_ids": [1, 2],
  "data_agendamento": "2026-06-10T14:00:00"
}
```
✅ **Esperado:** `201 Created` com `servicos` sendo uma lista de 2 objetos.

🔍 **O que valida:** criação M2M com múltiplos serviços. Duração total = soma das duas durações.

---

### T03 — ❌ Serviço que o barbeiro não oferece

**POST** `/api/agendamento`
```json
{
  "barbeiro_id": 1,
  "cliente_id": 1,
  "servico_ids": [99],
  "data_agendamento": "2026-06-11T10:00:00"
}
```
✅ **Esperado:** `400 Bad Request`
```json
{ "erro": "Erro ao criar agendamento: Serviço(s) não encontrado(s): [99]" }
```

---

### T04 — ❌ Barbeiro não oferece um dos serviços da lista

Use um ID de serviço que **não está vinculado** ao barbeiro 1 (mas que existe no banco — um serviço do barbeiro 2, por exemplo).

**POST** `/api/agendamento`
```json
{
  "barbeiro_id": 1,
  "cliente_id": 1,
  "servico_ids": [1, 2],
  "data_agendamento": "2026-06-12T10:00:00"
}
```
> Se o barbeiro 1 só tiver o serviço 1 vinculado na `barbeiro_servico`, o serviço 2 deve causar rejeição.

✅ **Esperado:** `400 Bad Request`
```json
{ "erro": "Erro ao criar agendamento: O barbeiro não oferece os seguintes serviços: ..." }
```

🔍 **O que valida:** a regra de que **todos** os serviços da lista devem ser do barbeiro.

---

### T05 — ❌ Lista de serviços vazia

**POST** `/api/agendamento`
```json
{
  "barbeiro_id": 1,
  "cliente_id": 1,
  "servico_ids": [],
  "data_agendamento": "2026-06-13T10:00:00"
}
```
✅ **Esperado:** `400 Bad Request` — validação Pydantic (`min_length=1`).

---

### T06 — ❌ IDs duplicados na lista

**POST** `/api/agendamento`
```json
{
  "barbeiro_id": 1,
  "cliente_id": 1,
  "servico_ids": [1, 1],
  "data_agendamento": "2026-06-14T10:00:00"
}
```
✅ **Esperado:** `400 Bad Request`
```json
{ "erro": "A lista de serviços não pode conter IDs duplicados." }
```

---

### T07 — ❌ Conflito de horário com duração somada

Primeiro crie um agendamento com 2 serviços (duração total: 75 min):
```json
{
  "barbeiro_id": 1,
  "cliente_id": 1,
  "servico_ids": [1, 2],
  "data_agendamento": "2026-06-15T09:00:00"
}
```
Depois tente criar outro dentro da janela de 75 min (ex.: 09:30, que conflita com o bloco 09:00–10:15):
```json
{
  "barbeiro_id": 1,
  "cliente_id": 1,
  "servico_ids": [1],
  "data_agendamento": "2026-06-15T09:30:00"
}
```
✅ **Esperado:** `409 Conflict`
```json
{ "erro": "Erro ao criar agendamento: Conflito: O barbeiro já possui um serviço que se sobrepõe..." }
```

🔍 **O que valida:** detecção de conflito usa a duração **somada** dos múltiplos serviços, não só de um.

---

## Grupo 2 — Leitura

### T08 — ✅ Buscar agendamento por ID

**GET** `/api/agendamento/buscar/<id_do_agendamento_criado_no_T02>`

✅ **Esperado:** `200 OK` com campo `servicos` contendo **lista de 2 objetos**, e sem o campo `servico_id`.

---

### T09 — ✅ Listar agendamentos (paginado)

**GET** `/api/agendamento`

✅ **Esperado:** `200 OK`. Dentro de `dados.items`, cada agendamento tem `servicos: [...]` (lista), não `servico_id`.

---

## Grupo 3 — Edição (PATCH /api/agendamento/<id>)

### T10 — ✅ Substituir serviços no PATCH

Use o ID do agendamento criado no **T01** (que tinha só 1 serviço).

**PATCH** `/api/agendamento/<id>`
```json
{
  "servico_ids": [1, 2]
}
```
✅ **Esperado:** `200 OK` com `servicos` contendo agora 2 objetos (substituição total).

🔍 **O que valida:** o PATCH apaga os serviços antigos e insere os novos (não acumula).

---

### T11 — ✅ Editar data sem alterar serviços

**PATCH** `/api/agendamento/<id>`
```json
{
  "data_agendamento": "2026-06-20T11:00:00"
}
```
✅ **Esperado:** `200 OK` com a nova data e `servicos` **inalterado** (mantém a lista anterior).

---

### T12 — ❌ PATCH com lista vazia de serviços

**PATCH** `/api/agendamento/<id>`
```json
{
  "servico_ids": []
}
```
✅ **Esperado:** `400 Bad Request`
```json
{ "erro": "A lista de serviços não pode ser vazia ao atualizar." }
```

---

## Grupo 4 — Deleção (DELETE /api/agendamento/<id>)

### T13 — ✅ Deletar agendamento (CASCADE)

**DELETE** `/api/agendamento/<id>`

✅ **Esperado:** `200 OK`

**Verificação extra:** confira no SQLite/DBeaver que as linhas correspondentes em `agendamento_servico` foram removidas automaticamente pelo CASCADE:
```sql
SELECT * FROM agendamento_servico WHERE agendamento_id = <id_deletado>;
-- deve retornar 0 linhas
```

---

## Checklist de Regressão Rápida

| # | Teste | Resultado | Observação |
|---|---|---|---|
| T00 | Login admin | ⬜ | |
| T01 | Criar com 1 serviço | ⬜ | Campo `servicos` é lista? |
| T02 | Criar com 2 serviços | ⬜ | `servicos` tem 2 itens? |
| T03 | Serviço inexistente | ⬜ | 400? |
| T04 | Barbeiro sem o serviço | ⬜ | 400? |
| T05 | Lista vazia | ⬜ | 400? |
| T06 | IDs duplicados | ⬜ | 400? |
| T07 | Conflito com duração somada | ⬜ | 409? |
| T08 | Buscar por ID | ⬜ | Sem `servico_id`? |
| T09 | Listagem paginada | ⬜ | Cada item tem `servicos`? |
| T10 | PATCH substitui serviços | ⬜ | Lista foi trocada? |
| T11 | PATCH sem alterar serviços | ⬜ | Lista intacta? |
| T12 | PATCH lista vazia | ⬜ | 400? |
| T13 | DELETE + CASCADE | ⬜ | `agendamento_servico` limpa? |
