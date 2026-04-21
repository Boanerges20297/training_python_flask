# Padronização de Respostas de Paginação

**Data:** 20 de Abril de 2026
**Objetivo:** Garantir que todos os endpoints de listagem do sistema retornem sempre o mesmo formato de paginação, eliminando inconsistências entre rotas.

---

## 1. Motivação

Antes dessa mudança, cada rota montava seu próprio objeto de paginação manualmente. Isso gerava divergências como:

| Rota | Campo usado |
|---|---|
| `barbeiros` | `tem_proxima`, `tem_pagina_anterior` |
| `financeiro` | `pagina_atual`, `itens_por_pagina` |
| `admins` | `has_next`, `has_prev` |

O Frontend precisava tratar cada endpoint diferente — um problema claro de inconsistência de contrato de API.

---

## 2. A Solução: Helper Central

Foi criado o arquivo `app/utils/pagination.py` com a função `formatar_retorno_paginacao()`.

```python
def formatar_retorno_paginacao(items, total, page, per_page, label_items="items") -> dict:
```

**Responsabilidade única:** recebe os dados e os metadados numéricos e devolve sempre o mesmo envelope JSON.

---

## 3. Formato Padronizado

Todos os endpoints de listagem agora retornam exatamente este contrato:

```json
{
    "sucesso": true,
    "dados": {
        "items": [...],
        "total": 145,
        "items_nessa_pagina": 10,
        "pagina": 1,
        "per_page": 10,
        "total_paginas": 15,
        "tem_proxima": true,
        "tem_pagina_anterior": false
    }
}
```

---

## 4. Regra Arquitetural Aplicada

> **Service = dados crus. Rota = formatação da resposta HTTP.**

O `formatar_retorno_paginacao()` é sempre chamado **na rota**, nunca dentro do service. O service devolve os dados puros e a rota é responsável por empacotar o envelope de paginação antes de enviar ao cliente.

**Exemplo correto (financeiro_routes.py):**
```python
# 1. Service retorna dados puros
dados = FinanceiroService.obter_relatorio(mes, ano, pagina, limite)

# 2. Rota monta o envelope padronizado
paginacao = formatar_retorno_paginacao(
    dados["notas_fiscais"], dados["total"], dados["pagina"], dados["per_page"],
    label_items="notas_fiscais"
)
paginacao["resumo"] = dados["resumo"]

return jsonify({"sucesso": True, "dados": paginacao}), 200
```

---

## 5. Endpoints Afetados

| Método | Rota | Arquivo |
|---|---|---|
| GET | `/api/barbeiros` | `barbeiro_routes.py` |
| GET | `/api/barbeiros/<id>/agendamentos` | `barbeiro_routes.py` |
| GET | `/api/clientes` | `client_routes.py` |
| GET | `/api/servicos` | `servico_routes.py` |
| GET | `/api/admins` | `admin_routes.py` |
| GET | `/api/agendamento` | `agendamento_routes.py` |
| GET | `/api/financeiro/relatorio` | `financeiro_routes.py` |

---

## 6. Como Adicionar Paginação em Novos Endpoints

Ao criar uma nova rota de listagem, basta:

```python
from app.utils.pagination import formatar_retorno_paginacao

# 1. Fazer a query paginada
resultados = MinhaModel.query.paginate(page=page, per_page=per_page, error_out=False)

# 2. Construir a lista de dicionários
items_dict = [{"id": r.id, "nome": r.nome} for r in resultados.items]

# 3. Retornar usando o helper
return jsonify({
    "sucesso": True,
    "dados": formatar_retorno_paginacao(items_dict, resultados.total, resultados.page, resultados.per_page)
}), 200
```
