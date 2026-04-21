# 📖 Guia de Integração Frontend - API Barba Byte

Este documento serve como referência rápida para que os desenvolvedores de Frontend entendam como consumir as rotas do Backend usando o JavaScript.

---

## 🚀 1. Configurações Básicas
Todas as nossas requisições que enviam ou recebem dados estruturados devem obrigatoriamente informar ao servidor que estamos conversando no formato JSON.

Sempre adicione o seguinte Header (Cabeçalho) em rotas de POST ou PUT:
`'Content-Type': 'application/json'`

---

## 🔐 2. Autenticação por Cargos (O Cabeçalho X-Role)

Nosso sistema de barbearia tem rotas protegidas (como as de Deleção). Para acessar recursos protegidos, o Frontend precisa provar qual é o nível de autorização do usuário atual enviando o cabeçalho **X-Role** na requisição.

Se o usuário atual for um Administrador, envie:
`'X-Role': 'admin'`

*💡 Nota: Em aplicações reais, em vez do X-Role "cru", você enviaria um `'Authorization': 'Bearer <Token_JWT>'`, mas a mecânica no `fetch` é exatamente a mesma abordada abaixo!*

---

## 🛠️ 3. Exemplos Práticos usando Fetch API (JavaScript)

Copie e adapte os exmeplos abaixo para o código dos seus botões ou telas.

### 🟢 Exemplo 1: Buscar Dados (GET Simples)
Buscar a lista de clientes. Por padrão, o Fetch já faz requisições GET.

```javascript
fetch('/api/clientes/')
  .then(resposta => resposta.json())
  .then(dados => {
      console.log("Lista de Clientes recebida: ", dados);
      // Aqui você monta a tabela na tela usando os dados...
  })
  .catch(erro => console.error("Erro na busca: ", erro));
```

### 🟡 Exemplo 2: Enviar Dados (POST)
Criar um novo Agendamento ou Cliente. Como estamos mandando um corpo vazio precisamos dizer que é JSON.

```javascript
const novoCliente = {
    nome: "Carlos",
    telefone: "99999-9999",
    email: "carlos@teste.com"
};

fetch('/api/clientes/criar-cliente', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(novoCliente) // Transforma o objeto em String JSON
})
.then(resposta => {
    if (resposta.status === 201) {
        alert("Cliente cadastrado com sucesso!");
    } else {
        alert("Erro no cadastro verifique os dados!");
    }
});
```

### 🔴 Exemplo 3: Rota Protegida (DELETE com X-Role)
Exemplo de exclusão de Serviço batendo no nosso Decorator Customizado `@role_required(['admin'])`. O Frontend acopla a carteirinha de permissão `X-Role: admin` junto ao ID.

```javascript
const idServico = 5;

fetch(`/api/servicos/deletar-servico/${idServico}`, {
    method: 'DELETE',
    headers: {
        'X-Role': 'admin'   // O NOSSO "CRACHÁ VIP" DE ENTRADA
    }
})
.then(resposta => {
    if (resposta.status === 403) {
        alert("Ops! Acesso Negado. Você não é admin.");
    } else if (resposta.status === 200) {
        alert("Serviço deletado com sucesso!");
    }
})
.catch(erro => console.error("Falha ao comunicar com API: ", erro));
```
