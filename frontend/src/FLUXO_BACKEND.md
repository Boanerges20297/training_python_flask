# FLUXO DO BACKEND — Barbearia API

> Gerado em: 2026-04-13  
> Stable ref: BACKEND-FRONT-STABLE-2026-04-13-A1

---

## 1. VISÃO GERAL DA ARQUITETURA

```
Frontend (React/TS)
        │
        │  HTTP + JWT (cookies)
        ▼
┌──────────────────────────────────┐
│         Flask Application        │
│                                  │
│  ┌──────────┐  ┌──────────────┐  │
│  │  Routes  │→ │   Services   │  │
│  │(Blueprints)  │  (Regras de  │  │
│  └──────────┘  │  negócio)    │  │
│                └──────┬───────┘  │
│                       │          │
│  ┌────────────────────▼───────┐  │
│  │         Models (SQLAlchemy)│  │
│  └────────────────────────────┘  │
│                       │          │
│                  SQLite DB        │
└──────────────────────────────────┘
```

---

## 2. AUTENTICAÇÃO — `/api/auth`

```
POST /api/auth/login
├── Valida payload (Pydantic: LoginRequest)
├── AuthService.authenticate_user()
│   ├── Busca: Admin → Barbeiro → Cliente (por email)
│   ├── Verifica senha (HashSenhaMixin.verificar_senha)
│   └── Gera access_token + refresh_token (JWT)
├── Injeta cookies: access_token_cookie + refresh_token_cookie
└── Retorna: { msg, user: { id, nome, email, role } }  → 200
    └── Falha credenciais → 401
    └── Erro estrutural   → 500

POST /api/auth/refresh        [JWT refresh cookie obrigatório]
├── Extrai user_id + role do token atual
├── AuthService.renew_access_token()
└── Injeta novo access_token_cookie → 200

POST /api/auth/logout         [JWT obrigatório]
└── Limpa cookies JWT → 200
```

**Roles possíveis no JWT:** `admin` | `barbeiro` | `cliente`

---

## 3. BANCO DE DADOS — Modelos e Relacionamentos

```
┌──────────┐      ┌──────────────┐      ┌──────────┐
│  admins  │      │  barbeiros   │◄─────│ servicos │
│──────────│      │──────────────│      │──────────│
│ id (PK)  │      │ id (PK)      │      │ id (PK)  │
│ nome     │      │ nome         │      │ nome     │
│ email*   │      │ email*       │      │ descricao│
│ senha    │      │ telefone*    │      │ preco    │
│ role     │      │ especialidade│      │ duracao_ │
│ ativo    │      │ ativo        │      │ minutos  │
│ ultimo_  │      │ senha        │      │barbeiro_ │
│ login    │      └──────┬───────┘      │id (FK)   │
└──────────┘             │              └──────────┘
                         │
                         │ 1:N
                         ▼
┌──────────┐      ┌──────────────────────────┐
│ clientes │      │       agendamentos        │
│──────────│      │──────────────────────────│
│ id (PK)  │─────►│ id (PK)                  │
│ nome     │      │ cliente_id (FK)           │
│ email*   │      │ barbeiro_id (FK)          │
│ telefone*│      │ servico_id (FK)           │
│ senha    │      │ data_agendamento          │
│ data_    │      │ data_criacao              │
│ cadastro │      │ status: pendente/         │
└──────────┘      │   confirmado/cancelado/   │
                  │   concluido               │
                  │ observacoes               │
                  └──────────────────────────┘

* = campo UNIQUE
```

---

## 4. ROTAS POR BLUEPRINT

### 4.1 CLIENTES — `/api/clientes`

| Método | URL                         | Auth        | Permissão | Ação                         |
|--------|-----------------------------|-------------|-----------|------------------------------|
| GET    | `/api/clientes/`            | Livre        | —         | Lista clientes (paginado)    |
| POST   | `/api/clientes/criar-cliente` | JWT        | admin     | Cria novo cliente            |
| PATCH  | `/api/clientes/editar-cliente/<id>` | JWT  | admin     | Atualiza dados do cliente    |
| DELETE | `/api/clientes/deletar-cliente/<id>` | JWT | admin    | Remove cliente               |
| GET    | `/api/clientes/buscar-cliente/<id>` | Livre | —        | Busca cliente por ID         |

**Filtros GET `/`:** `?nome=` (lista) | `?email=` ou `?telefone=` (objeto único) | `?pagina=` `&per_page=`

---

### 4.2 BARBEIROS — `/api/barbeiros`

| Método | URL                                | Auth  | Permissão        | Ação                              |
|--------|------------------------------------|-------|------------------|-----------------------------------|
| GET    | `/api/barbeiros/`                  | Livre | —                | Lista barbeiros (paginado)        |
| POST   | `/api/barbeiros/criar-barbeiro`    | JWT   | admin            | Cria novo barbeiro                |
| PATCH  | `/api/barbeiros/editar-barbeiro/<id>` | JWT | admin ou próprio | Atualiza dados do barbeiro       |
| DELETE | `/api/barbeiros/deletar-barbeiro/<id>` | JWT | admin          | Remove barbeiro                   |
| GET    | `/api/barbeiros/buscar-barbeiro/<id>` | Livre | —             | Busca barbeiro por ID             |
| GET    | `/api/barbeiros/<id>/agendamentos` | JWT   | admin ou próprio | Lista agendamentos do barbeiro    |

**Filtros GET `/`:** `?nome=` | `?email=` | `?telefone=` | `?servicoId=` | `?pagina=` `&per_page=`

---

### 4.3 SERVIÇOS — `/api/servicos`

| Método | URL                              | Auth  | Permissão | Ação                       |
|--------|----------------------------------|-------|-----------|----------------------------|
| GET    | `/api/servicos/`                 | Livre | —         | Lista serviços (paginado)  |
| POST   | `/api/servicos/criar-servico`    | JWT   | admin     | Cria novo serviço          |
| PATCH  | `/api/servicos/editar-servico/<id>` | JWT | admin    | Atualiza serviço           |
| DELETE | `/api/servicos/deletar-servico/<id>` | JWT | admin   | Remove serviço             |
| GET    | `/api/servicos/buscar-servico/<id>` | Livre | —       | Busca serviço por ID       |

**Filtros GET `/`:** `?page=` `&per_page=`

---

### 4.4 AGENDAMENTOS — `/api/agendamento`

| Método | URL                               | Auth | Permissão                   | Ação                            |
|--------|-----------------------------------|------|-----------------------------|---------------------------------|
| POST   | `/api/agendamento`                | JWT  | admin/barbeiro(próprio)/cliente(próprio) | Cria agendamento |
| GET    | `/api/agendamento`                | JWT  | admin(todos)/barbeiro(próprios)/cliente(próprios) | Lista agendamentos |
| PATCH  | `/api/agendamento/<id>`           | JWT  | admin ou dono               | Edita agendamento               |
| PATCH  | `/api/agendamento/status/<id>`    | JWT  | admin ou dono               | Atualiza status                 |
| DELETE | `/api/agendamento/<id>`           | JWT  | admin                       | Remove agendamento              |
| GET    | `/api/agendamento/buscar/<id>`    | JWT  | admin ou dono               | Busca agendamento por ID        |

**Filtros GET `/`:** `?page=` `&per_page=`

---

### 4.5 ADMINS — `/api/admins`

| Método | URL                           | Auth | Permissão | Ação                       |
|--------|-------------------------------|------|-----------|----------------------------|
| POST   | `/api/admins`                 | JWT  | admin     | Cria admin/gerente         |
| GET    | `/api/admins`                 | JWT  | admin     | Lista admins (paginado)    |
| PATCH  | `/api/admins/<admin_id>`      | JWT  | admin     | Edita admin                |
| PATCH  | `/api/admins/<admin_id>/status` | JWT | admin    | Ativa/desativa admin       |

---

## 5. FLUXO COMPLETO DE UMA REQUISIÇÃO

```
Frontend envia request
         │
         ▼
    [JWT Middleware]
    ├── Sem token → 401 Unauthorized
    ├── Token expirado → 401 (frontend deve chamar /refresh)
    └── Token válido → continua
         │
         ▼
    [Decorator role_required / admin_required]
    ├── Role não permitida → 403 Forbidden
    └── Role ok → continua
         │
         ▼
    [Route Handler]
    ├── Valida payload com Pydantic Schema
    │   └── Inválido → 400 Bad Request + detalhes dos erros
    └── Válido → chama Service
         │
         ▼
    [Service Layer] (regras de negócio)
    ├── AgendamentoService:
    │   ├── Verifica horário comercial (08:00-20:00)
    │   ├── Detecta conflito de horário → ConflitoHorarioError → 409
    │   ├── Verifica permissão por role → AcessoNegadoError → 403
    │   └── Valida existência do recurso → AgendamentoNaoEncontradoError → 404
    ├── AuthService:
    │   ├── Busca usuário por email (Admin → Barbeiro → Cliente)
    │   ├── Verifica senha (bcrypt) → AuthServiceException → 401
    │   └── Gera tokens JWT com role nos claims
    └── AdminService:
        ├── Valida email único → ValueError → 400
        └── Salva no banco
         │
         ▼
    [Serialização]
    ├── Objeto SQLAlchemy → Pydantic Response Schema
    └── .model_dump() → JSON
         │
         ▼
    Retorna response ao Frontend
```

---

## 6. CONTROLE DE ACESSO POR ROLE

```
                 │  admin  │ barbeiro │ cliente │  livre  │
─────────────────┼─────────┼──────────┼─────────┼─────────┤
Criar cliente    │    ✓    │          │         │         │
Criar barbeiro   │    ✓    │          │         │         │
Criar serviço    │    ✓    │          │         │         │
Criar admin      │    ✓    │          │         │         │
Listar clientes  │    ✓    │          │         │   (GET) │
Listar barbeiros │    ✓    │    ✓     │    ✓    │   (GET) │
Listar serviços  │    ✓    │    ✓     │    ✓    │   (GET) │
Criar agendamento│    ✓    │  próprio │ próprio  │         │
Listar agendamentos│  todos│  próprios│ próprios │         │
Editar agendamento│   ✓   │  próprio │ próprio  │         │
Atualizar status  │   ✓   │  próprio │ próprio  │         │
Deletar agendamento│  ✓   │          │          │         │
Agend. do barbeiro│  ✓    │  próprio │          │         │
```

---

## 7. RESPOSTAS HTTP PADRÃO

| Código | Situação                                          |
|--------|---------------------------------------------------|
| 200    | Operação realizada com sucesso (leitura/update)   |
| 201    | Recurso criado com sucesso                        |
| 400    | Dados inválidos (validação Pydantic / regra negócio) |
| 401    | Sem autenticação / credenciais inválidas          |
| 403    | Autenticado, mas sem permissão (role)             |
| 404    | Recurso não encontrado                            |
| 409    | Conflito de horário em agendamento                |
| 429    | Rate limit excedido (Flask-Limiter)               |
| 500    | Erro interno inesperado                           |

---

## 8. UTILITÁRIOS E INFRAESTRUTURA

```
app/
├── extensions.py       → Instâncias: db, jwt, limiter, cors, app_logger
├── jwt_callbacks.py    → Handlers JWT: expired, invalid, missing, blocklist
├── utils/
│   ├── decorators.py       → role_required, admin_required, barbeiro_required, cliente_required
│   ├── error_formatter.py  → formatar_erros_pydantic() → erros legíveis para o frontend
│   ├── formatters.py       → Utilitários de formatação
│   ├── logger_setup.py     → Configuração de logging
│   └── ratelimiter.py      → Configuração de rate limiting
config.py               → Config centralizada (JWT secret, DB URI, limites, etc.)
```

---

## 9. FLUXO DE LOGIN DETALHADO

```

---

## 10. REQUISITOS PARA O FRONTEND CONSUMIR AS ROTAS

Esta seção descreve o contrato mínimo para integração estável entre frontend e backend.

### 10.1 URL base da API

- Backend expõe rotas com prefixo `/api`.
- URL local esperada: `http://127.0.0.1:5000/api`.

Exemplo de configuração no frontend:

```ts
export const API_URL = 'http://127.0.0.1:5000/api';
```

### 10.2 Autenticação via cookies JWT

O backend usa `JWT_TOKEN_LOCATION = ["cookies"]`, então o frontend precisa enviar cookies em todas as requisições autenticadas.

Checklist:

- Axios com `withCredentials: true`.
- CORS no backend com `supports_credentials=True`.
- Origem do frontend definida explicitamente (evitar `*` quando usar cookies).

Exemplo recomendado no frontend:

```ts
const api = axios.create({
     baseURL: 'http://127.0.0.1:5000/api',
     withCredentials: true,
});
```

Exemplo recomendado no backend:

```py
cors.init_app(
          app,
          resources={r"/api/*": {"origins": app.config["FRONTEND_URL"]}},
          supports_credentials=True,
)
```

### 10.3 Fluxo de sessão que o frontend deve implementar

1. Login em `POST /api/auth/login`.
2. Guardar estado do usuário com os dados retornados (`id`, `nome`, `role`).
3. Em `401` por expiração, chamar `POST /api/auth/refresh`.
4. Repetir a requisição original após refresh bem-sucedido.
5. Logout com `POST /api/auth/logout` para limpar cookies.

### 10.4 Alinhamento de endpoints (contrato atual)

#### Agendamentos (padrão atual do backend)

- `GET /api/agendamento`
- `POST /api/agendamento`
- `PATCH /api/agendamento/<id>`
- `PATCH /api/agendamento/status/<id>`
- `DELETE /api/agendamento/<id>`
- `GET /api/agendamento/buscar/<id>`

Observação: evitar endpoints legados como `listar-agendamento`, `criar-agendamento`, `editar-agendamento`, `deletar-agendamento`.

### 10.5 Métodos HTTP esperados

- Atualizações parciais usam `PATCH` (não `PUT`) nas rotas padronizadas.
- Criação usa `POST` e remoção usa `DELETE`.

### 10.6 Formato de respostas e erros

Para consistência no frontend:

- Tratar respostas de sucesso no formato retornado pelos schemas (`model_dump`).
- Tratar erros por código HTTP (`400`, `401`, `403`, `404`, `409`, `429`, `500`).
- Padronizar leitura de mensagem de erro por chave (`erro` ou `Erro`) durante a transição.

Exemplo de leitura resiliente no frontend:

```ts
const apiError = error?.response?.data;
const msg = apiError?.erro || apiError?.Erro || 'Erro inesperado';
```

### 10.7 Permissões por role no frontend

O frontend deve usar `role` retornada no login para exibir/ocultar ações de UI:

- `admin`: CRUD completo em clientes, barbeiros, serviços e admins.
- `barbeiro`: ações próprias (perfil e agendamentos permitidos).
- `cliente`: ações próprias (agendamentos permitidos).

Isso não substitui segurança do backend, apenas melhora UX.

### 10.8 Checklist rápido de integração

- [ ] API URL aponta para `http://127.0.0.1:5000/api`.
- [ ] Axios com `withCredentials: true`.
- [ ] Backend CORS com `supports_credentials=True` e origem do frontend definida.
- [ ] Endpoints do frontend alinhados ao contrato atual do backend.
- [ ] Métodos HTTP corretos (`PATCH` nas edições).
- [ ] Tratamento de `401` com refresh automático.
- [ ] Tratamento de erros por código e mensagem.
Frontend                          Backend
   │                                 │
   │  POST /api/auth/login           │
   │  { email, senha }               │
   │ ──────────────────────────────► │
   │                                 │ 1. Pydantic valida LoginRequest
   │                                 │ 2. Busca em: admins → barbeiros → clientes
   │                                 │ 3. bcrypt.check_password_hash(senha)
   │                                 │ 4. create_access_token(identity=id, role=role)
   │                                 │ 5. create_refresh_token(identity=id, role=role)
   │  200 + Set-Cookie               │
   │  { msg, user: {id,nome,role} }  │
   │ ◄────────────────────────────── │
   │                                 │
   │  (próximas requisições)         │
   │  Header: Cookie: access_token   │
   │                                 │
   │  (token expirou)                │
   │  POST /api/auth/refresh         │
   │  Cookie: refresh_token_cookie   │
   │ ──────────────────────────────► │
   │  200 + novo access_token_cookie │
   │ ◄────────────────────────────── │
```
