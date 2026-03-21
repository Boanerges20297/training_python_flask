# 🚀 COMECE AQUI - Guia de Aprendizado Ativo

Você vai aprender **fazendo**, não copiando. Siga esta ordem:

---

## 📖 Passo 0: Entenda o Conceito (5 min)

Leia este arquivo:
**→ [TUTORIAL_APIS.md](./TUTORIAL_APIS.md)** 

Seção: "O que é um Blueprint" e "O que é GET"

---

## 💻 Passo 1: Implemente Sua Primeira API (15 min)

**Arquivo para editar:** `app/routes/servico_routes.py`

**O que fazer:**
1. Abra [app/routes/servico_routes.py](./app/routes/servico_routes.py)
2. Leia TODOS os comentários (há 4 TODOs)
3. Implemente cada TODO (não copie código pronto!)
4. Teste digitando no seu editor

**Dica:** Se travar, consulte [REFERENCIA_CODIGO.py](./REFERENCIA_CODIGO.py)

**Solução esperada:** Função que busca todos os serviços e retorna em JSON

---

## 🔌 Passo 2: Registre o Blueprint em run.py (5 min)

**Arquivo para editar:** `run.py`

**O que fazer:**
1. Leia [PASSO3_REGISTRAR_BLUEPRINT.md](./PASSO3_REGISTRAR_BLUEPRINT.md)
2. Adicione 2 linhas em `run.py`:
   - 1 importação
   - 1 register_blueprint
3. Salve

---

## ✅ Passo 3: Teste Sua API (5 min)

### Opção 1: Teste Manual (Recomendado)

```bash
# Terminal 1: Inicie o servidor
.\.venv\Scripts\python.exe run.py

# Terminal 2: Teste a API
curl http://localhost:5000/api/servicos
```

Deve retornar:
```json
{"servicos": []}
```

(Vazio porque não criou serviços ainda)

### Opção 2: Teste via Python

```python
import requests
resp = requests.get('http://localhost:5000/api/servicos')
print(resp.json())
```

### Opção 3: Teste no VS Code extensão Thunder Client

1. Instale extensão: "Thunder Client"
2. Crie nova request
3. GET http://localhost:5000/api/servicos

---

## 🎯 Passo 4: Crie um Serviço Manualmente (10 min)

Você precisa de dados para testar!

Crie este arquivo: `criar_dados_teste.py`

```python
from app import create_app, db
from app.models import Barbeiro, Servico

app = create_app()

with app.app_context():
    # Criar barbeiro (serviço precisa de barbeiro)
    barbeiro = Barbeiro(
        nome='João Silva',
        especialidade='Corte clássico',
        email='joao@barba.com',
        telefone='11999999999'
    )
    db.session.add(barbeiro)
    db.session.commit()
    
    # Criar 2 serviços
    servico1 = Servico(
        nome='Corte Clássico',
        descricao='Corte tradicional',
        preco=50.00,
        duracao_minutos=30,
        barbeiro_id=barbeiro.id
    )
    
    servico2 = Servico(
        nome='Barba Completa',
        descricao='Navalhado + hidratação',
        preco=40.00,
        duracao_minutos=25,
        barbeiro_id=barbeiro.id
    )
    
    db.session.add(servico1)
    db.session.add(servico2)
    db.session.commit()
    
    print('✓ Dados criados com sucesso!')
```

Execute:
```bash
.\.venv\Scripts\python.exe criar_dados_teste.py
```

---

## 🧪 Passo 5: Teste de Novo (5 min)

```bash
curl http://localhost:5000/api/servicos
```

Agora deve retornar:
```json
{
  "servicos": [
    {
      "id": 1,
      "nome": "Corte Clássico",
      "preco": 50.0,
      "duracao_minutos": 30
    },
    {
      "id": 2,
      "nome": "Barba Completa",
      "preco": 40.0,
      "duracao_minutos": 25
    }
  ]
}
```

---

## 📋 Checklist

- [ ] Li [TUTORIAL_APIS.md](./TUTORIAL_APIS.md)
- [ x ] Implementei [app/routes/servico_routes.py](./app/routes/servico_routes.py)
- [ x ] Registrei blueprint em [run.py](./run.py)
- [ x ] Testei GET /api/servicos
- [ x ] Criei dados de teste
- [ x ] Testei de novo e retornou dados

---

## 🆘 Se Deu Erro?

### Erro: "ModuleNotFoundError: No module named 'app'"
- Certifique-se que você está rodando a partir da pasta raiz do projeto

### Erro: "ImportError: cannot import name 'servico_bp'"
- Verifique se criou `app/routes/servico_routes.py` corretamente
- Verifique se criou o `blueprint` dentro do arquivo

### Erro: "AttributeError: 'NoneType' object has no attribute 'add'"
- Significa que não criou dados de teste ainda
- Execute `criar_dados_teste.py`

---

## 🎓 O Que Aprendeu Até Aqui?

✓ O que é um Blueprint  
✓ O que é uma rota GET  
✓ Como retornar JSON  
✓ Como buscar dados do banco  
✓ Como testar uma API  

---

## 🚀 Próximos Desafios

Quando terminar este:

1. **Desafio 2** → POST para criar novo cliente
2. **Desafio 3** → GET de um serviço específico por ID
3. **Desafio 4** → PUT para atualizar serviço
4. **Desafio 5** → DELETE para remover

Cada um mais complexo. Quer continuarAfter você terminar este?

---

**Tempo estimado total: 40 minutos**

Bora começar! 💪
