# Documentação da API - Barba Byte

Esta documentação detalha as rotas disponíveis na nossa API, suas funcionalidades, o sistema de autenticação e os middlewares (decorators) implementados.

---

## 🔐 Autenticação e Autorização

A autenticação é feita na rota `/api/auth/login`. Quando as credenciais (email e senha) estão corretas, a API retorna um `token` de acesso (atualmente um token simulado: `mock-session-token-abc-123`) e as informações do usuário.

### Middlewares (Decorators)
O sistema conta com um verificador de permissões baseado em headers, localizado em `app/utils/decorators.py`.

*   **`@admin_required`**: Este decorator verifica o cabeçalho `X-Role` da requisição HTTP. Se o valor fornecido não for `admin`, a API recusa a requisição com status `403 Forbidden`. No momento atual, este middleware encontra-se aplicado na deleção de clientes e está comentado (para facilitar os testes) em algumas rotas de barbeiros. 

---

## 🚦 Rotas da API

### 1. Autenticação (`/api/auth`)

*   **`POST /login`**
    *   **Funcionalidade:** Realiza o login operado através do `LoginSchema`. Verifica as credenciais no banco por meio da função Hash do Mixin.
    *   **Payload Esperado:** `email`, `senha`
    *   **Retorno:** Mensagem de sucesso, dados do usuário logado e o token.
*   **`POST /logout`**
    *   **Funcionalidade:** Rota simples para encerramento de sessão, retornando mensagem de sucesso.

---

### 2. Clientes (`/api/clientes`)

*   **`GET /`**
    *   **Funcionalidade:** Lista clientes dinamicamente paginados.
    *   **Query Params (Opcionais):** `pagina`, `per_page`, `nome`, `email`, `telefone`. (Busca por telefone/email retorna um único objeto; busca por nome retorna lista paginada).
*   **`POST /criar-cliente`**
    *   **Funcionalidade:** Cria um novo cliente utilizando validação via `ClienteSchema`. Hashea a senha automaticamente sendo processada em backend.
*   **`PATCH /editar-cliente/<int:id>`**
    *   **Funcionalidade:** Atualiza campos específicos do cliente sem sobrescrever demais campos via `ClienteUpdateSchema`. Se enviada nova senha, ela é hasheada usando funções do Mixin do objeto.
*   **`DELETE /deletar-cliente/<int:id>`**
    *   **Autorização:** Requer header `X-Role: admin` devido uso explícito de (`@admin_required`).
    *   **Funcionalidade:** Remove um cliente permanentemente do banco de dados.
*   **`GET /buscar-cliente/<int:id>`**
    *   **Funcionalidade:** Retorna resumidamente as informações principais de um cliente específico pelo ID.

---

### 3. Barbeiros (`/api/barbeiros`)

*   **`GET /`**
    *   **Funcionalidade:** Lista os barbeiros de forma paginada e interativa com filtros flexíveis.
    *   **Query Params (Opcionais):** `pagina`, `per_page`, `nome`, `email`, `telefone`, `servicoId`, `ativo`.
*   **`POST /criar-barbeiro`**
    *   **Funcionalidade:** Cria um novo barbeiro e faz o tratamento de verificação usando `BarbeiroSchema`. Tem conversão e encriptografia inteligente de senha em conjunto usando os models apropriados.
*   **`PATCH /editar-barbeiro/<int:id>`**
    *   **Funcionalidade:** Dinamicamente recebe, checa (com `BarbeiroUpdateSchema`) e atualiza campos designados nos atributos que o cliente deseja e necessita.
*   **`DELETE /deletar-barbeiro/<int:id>`**
    *   **Funcionalidade:** Deleta um barbeiro pelo ID. (A ideia principal de negócio no futuro indicaria o "soft delete" da desativação do perfil).
*   **`GET /buscar-barbeiro/<int:id>`**
    *   **Funcionalidade:** Obtém seletivamente as variadas premissas de um trabalhador individual pela ID solicitada.
*   **`GET /<int:id>/agendamentos`**
    *   **Funcionalidade:** Lista de forma indexada e paginada (`page`, `per_page`) os agendamentos já processados que pertencem a sua conta especificada.

---

### 4. Serviços (`/api/servicos`)

*   **`GET /`**
    *   **Funcionalidade:** Exibe todos os serviços de corte catalogados de forma paginada exibindo as informações importantes à sua visão.
    *   **Query Params:** `page`, `per_page`.
*   **`POST /criar-servico`**
    *   **Funcionalidade:** Registra um estético trabalho garantido à empresa através do construtor validacional `ServicoSchema`. Verifica existência previa impedindo a duplicação dos nomes criados.
*   **`PATCH /editar-servico/<int:id>`**
    *   **Funcionalidade:** Aplica a transição interligada de forma livre usando premissas do sistema construídas e validadas por `ServicoUpdateSchema`.
*   **`DELETE /deletar-servico/<int:id>`**
    *   **Funcionalidade:** Remove todo traço relacional associado do recurso serviço na base pelo próprio id passado.
*   **`GET /buscar-servico/<int:id>`**
    *   **Funcionalidade:** Rota dedicada singular direcionada visando buscar isoladamente um tipo e forma de serviço.

---

### 5. Agendamentos (`/api/agendamento`)

*   **`POST /criar-agendamento`**
    *   **Funcionalidade:** Rota estratégica que elabora verificações combinadas de restrição. Baseando pelo `AgendamentoSchema`, ela varre se o usuário requisitado está cadastrado como cliente ou barbeiro simultaneamente checando se a disponibilidade confere de acordo o horário estimado para execução perante o relógio calculando durabilidade em cada serviço. Retorna Status de conflito temporal `409` quando cruzam dados incorretos e conflitantes em cronograma.
*   **`GET /listar-agendamento`**
    *   **Funcionalidade:** Exibe ativamente agrupamentos visuais listantes que compõem agenda via formato da Paginação em grade.
*   **`PATCH /editar-agendamento/<int:id>`**
    *   **Funcionalidade:** Refaz dinamicamente seções únicas selecionadas pela request validada contido através do modulo de flexibilidade estrutural (`AgendamentoUpdateSchema`). Na submissão à Data, invoca reavaliações profundas certificando viabilidade de inserção limpa em horários disponiveis.
*   **`DELETE /deletar-agendamento/<int:id>`**
    *   **Funcionalidade:** Elimina interações efetuadas da base.
*   **`GET /buscar-agendamento/<int:id>`**
    *   **Funcionalidade:** Demonstra chaves externas atreladas e detalhes informativos essenciais.
