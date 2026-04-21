# Documentação de Autenticação JWT (Frontend)
**Módulo:** Barba Byte - Autenticação & Segurança
**Tipo:** JWT com Cookies HttpOnly + Proteção CSRF Dupla

---

## 1. Visão Geral
A API do Barba Byte não utiliza a abordagem tradicional de enviar o *Bearer Token* solto na resposta JSON para o frontend guardar no `localStorage`. 

Por razões de alta segurança contra ataques XSS, os Tokens viajam exclusivamente **dentro dos Cookies do Navegador**. O seu cliente HTTP (Axios, Fetch) lida com 90% disso automaticamente.

Para requisições **POST, PUT, PATCH e DELETE**, a API exige uma dupla validação chamada **CSRF (Cross-Site Request Forgery)**.

---

## 2. Rota de Login

### `POST /api/auth/login`
Responsável por validar as credenciais e injetar os cookies de sessão no navegador.

**Payload de Envio (JSON):**
```json
{
    "email": "emaildousuario@teste.com",
    "senha": "senha_do_usuario" 
}
```
*(Nota: O e-mail e senha passam por validação estrita. Ex: Senhas < 6 caracteres retornarão erro 400 antes de bater no banco).*

**Resposta de Sucesso (200 OK):**
```json
{
    "msg": "Login realizado com sucesso",
    "user": {
        "id": "123e4567-e89b-12d3...",
        "role": "cliente" // Pode ser 'admin', 'barbeiro' ou 'cliente'
    }
}
```

**⚠️ Ação do Navegador:**
Junto com o `200 OK`, o backend insere **4 Cookies** no seu navegador:
1. `access_token_cookie`: Token principal (Vida curta: ~15 mins).
2. `refresh_token_cookie`: Token de renovação (Vida longa: ~7 dias).
3. `csrf_access_token`: Chave antifraude das rotas seguras normais.
4. `csrf_refresh_token`: Chave antifraude da rota de renovação.

> Se você usar o Axios, certifique-se de iniciar a instância com `withCredentials: true` para que ele aceite gravar e enviar esses cookies para domínios diferentes.

---

## 3. Acessando Rotas Seguras (Ex: POST, PUT, DELETE)

Para proteger aplicações contra requisições fabricadas por terceiros, a API exige o pasaporte CSRF para qualquer rota que modifique dados.

### A Regra do `X-CSRF-TOKEN`
Sempre que fizer uma requisição de escrita para uma rota protegida (como Criar Agendamento ou Fazer Logout), você deve:
1. Ler o cookie chamado `csrf_access_token` usando Javascript na sua aplicação.
2. Injetar esse valor exato no cabeçalho `X-CSRF-TOKEN` da sua requisição.

**Exemplo no Axios:**
```javascript
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true 
});

// Interceptor para injetar o CSRF Access Token automaticamente
api.interceptors.request.use(config => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const csrfToken = Cookies.get('csrf_access_token');
    if (csrfToken) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
  }
  return config;
});
```
*(Para requisições `GET` como listar barbeiros, o CSRF Header não é necessário, apenas os Cookies na requisição).*

---

## 4. Rota de Logout

### `POST /api/auth/logout`
Destrói a sessão atual, limpando os cookies da máquina e invalidando o token no backend (Blocklist).

**Requisição Exigida:**
- **Header:** `X-CSRF-TOKEN` com o valor do cookie `csrf_access_token`.
- **Cookies:** Evitados automaticamente pelo navegador.

**Resposta Esperada (200 OK):**
```json
{
    "msg": "Logout efetuado. Cookies limpos."
}
```

---

## 5. Rota de Renovação de Sessão (Refresh)

Quando o `access_token` primário vence (geralmente após 15 minutos), a API retornará o status **401** mesmo que o usuário esteja "logado". O frontend deve capturar esse 401 e bater silenciosamente na rota de Refresh para pegar uma pulseira nova sem incomodar o usuário.

### `POST /api/auth/refresh`
**Requisição Exigida:**
- **Header:** `X-CSRF-TOKEN` mas desta vez carregando o cookie **`csrf_refresh_token`**.
- *Nota: Esta é a única rota do sistema que aceita e lê a chave de refresh em vez da chave de access.*

**Exemplo de Lógica de Renovação Transparente (Axios Hook):**
```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se deu 401 (exceção rota de login) e a req não foi retentada
    if (error.response.status === 401 && !originalRequest._retry && error.config.url !== '/auth/login') {
      originalRequest._retry = true;
      try {
        // Pega especificamente o CSRF de Refresh
        const csrfRefreshToken = Cookies.get('csrf_refresh_token');
        
        await axios.post('/api/auth/refresh', {}, {
          baseURL: 'http://localhost:5000',
          withCredentials: true,
          headers: { 'X-CSRF-TOKEN': csrfRefreshToken }
        });
        
        // Refaz a requisição original que tinha falhado, com o novo cookie ativo!
        return api(originalRequest);
      } catch (err) {
        // Se o refresh também falhou, manda pra tela de Login!
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 6. Padronizações de Resposta de Erro

Para facilitar a sua programação de telas e Toasts de notificação, a API foi estrurturada para devolver formatos 100% previsíveis.

### Erro 400 (Pydantic / Falhas de Formulário)
Sempre que o usuário omitir um campo, mandar e-mail errado, etc.
```json
{
  "msg": "Encontramos alguns problemas nos dados enviados.",
  "detalhes": {
    "email": "Formato inválido.",
    "senha": "Muito curto. Requer no mínimo 6 caracteres."
  }
}
```
*Tática de UI: Varra a chave `detalhes` e pinte as bordas dos inputs de vermelho embaixo do campo correspondente.*

### Erro 401 (Falta de Autenticação / Tokens)
```json
{
  "Erro": "Faça login para acessar esta rota."
}
```
Ou, em caso de erro na senha no momento do login:
```json
{
  "Erro": "Credenciais inválidas"
}
```
