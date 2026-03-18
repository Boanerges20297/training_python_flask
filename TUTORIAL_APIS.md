# 📚 Tutorial Interativo - Backend Barba&Byte

## Objetivo
Você vai aprender criando APIs (rotas) para o backend enquanto eu guio os conceitos.

---

## 🎯 Desafio 1: Criar Primeira API (GET Serviços)

### O que você vai aprender
- O que é um **Blueprint** (organizador de rotas)
- O que é **GET** (buscar dados)
- Como retornar dados em **JSON**

### Conceito (Leia primeiro!)

Uma **API GET** é quando o frontend diz:
```
"Ei backend, me dá a lista de serviços"
```

O backend responde com JSON:
```json
{
  "servicos": [
    {"id": 1, "nome": "Corte", "preco": 50},
    {"id": 2, "nome": "Barba", "preco": 30}
  ]
}
```

### O que é um Blueprint?
Um **Blueprint** é um agrupador de rotas. Em vez de colocar todas as rotas em `run.py`, você organiza por tema:

```
app/routes/servico_routes.py ← Todas as rotas de serviço
app/routes/cliente_routes.py ← Todas as rotas de cliente
```

Depois registra tudo em `run.py`.

### 🏁 Seu Desafio

**Arquivo: `app/routes/servico_routes.py`**

Você precisa:
1. Importar Flask Blueprint
2. Importar modelo Servico
3. Criar um blueprint chamado `servico_bp`
4. Criar rota `/api/servicos` (GET)
   - Busca todos os serviços no banco
   - Retorna em JSON

**Dicas:**
- Use `from flask import Blueprint, jsonify`
- Use `Servico.query.all()` para buscar todos
- Use `jsonify()` para retornar JSON

**Estrutura esperada:**
```python
from flask import Blueprint, jsonify
from app.models import Servico

servico_bp = Blueprint('servicos', __name__, url_prefix='/api/servicos')

@servico_bp.route('', methods=['GET'])
def listar_servicos():
    # TODO: Buscar todos os serviços
    # TODO: Converter para dicionário
    # TODO: Retornar em JSON
    pass
```

---

## 🏁 Desafio 2: Criar POST (Novo Cliente)

### Conceito

**POST** é quando você envia dados novos:

Frontend envia:
```json
{
  "nome": "João",
  "telefone": "11999999999",
  "email": "joao@email.com"
}
```

Backend:
1. Recebe os dados
2. **Valida** (é email válido?)
3. **Salva** no banco
4. Retorna erro ou sucesso

### 🏁 Seu Desafio

Criar rota `POST /api/clientes` que:
1. Recebe JSON com nome, telefone, email
2. Cria novo Cliente
3. Salva no banco
4. Retorna sucesso com dados criado

---

## 🧪 Como Testar Suas APIs

### Opção 1: Usar Thunder Client (VS Code extension)
```
GET http://localhost:5000/api/servicos
```

### Opção 2: Usar Python requests
```python
import requests
resp = requests.get('http://localhost:5000/api/servicos')
print(resp.json())
```

### Opção 3: curl no terminal
```bash
curl http://localhost:5000/api/servicos
```

---

## 📋 Ordem de Implementação

1. **Desafio 1** ← Comece aqui (GET simples)
2. Desafio 2 (POST com validação)
3. Desafio 3 (PUT - atualizar)
4. Desafio 4 (DELETE - deletar)
5. Desafio 5 (Agendamentos - o mais complexo!)

---

## ✅ Como Saber que Acertou

Quando terminar o Desafio 1:
1. Crie um serviço manualmente no banco
2. Teste GET `/api/servicos`
3. Deve retornar o serviço criado em JSON

Se der erro:
- Mande a mensagem de erro
- Vamos debugar juntos!
