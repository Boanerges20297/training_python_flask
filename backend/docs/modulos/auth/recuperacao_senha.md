# 📖 Documentação: Funcionalidade "Esqueci a Senha"

Este documento descreve detalhadamente a arquitetura, o fluxo de comunicação e as especificações de uso do módulo de Recuperação e Redefinição de Senhas desenvolvido no backend (Flask).

---

## 🏗️ 1. Visão Geral da Arquitetura

A funcionalidade foi concebida seguindo o padrão de **Tokens Efêmeros** atrelados a banco de dados relacional. Para garantir segurança total, a funcionalidade é blindada contra ataques de *Força Bruta* e *E-mail Enumeration*, utilizando as proteções de formulário do Pydantic nas bordas (rotas).

### Fluxo Resumido:
1. O usuário submete o e-mail pela rota `/esqueci-senha`.
2. A aplicação gera um token aleatório ultra-seguro (via biblioteca nativa `secrets.token_urlsafe(48)`), que possui duração cronometrada (ex: 30 minutos).
3. O e-mail é gerado com formatação HTML (`EmailService`) transportando o frontend linkado com o respectivo token.
4. O usuário visita a página do frontend que emite junto da nova senha a carga final para `/redefinir-senha`.
5. O sistema queima o token (torna ele sem uso) e atualiza a credencial do usuário.

---

## 🚦 2. Endpoints e Contratos (Rotas)

### 2.1 Solicitar Token (Enviar E-mail)
Gera uma hash única e encaminha para o endereço eletrônico, caso exista.

- **URL:** `/api/auth/esqueci-senha`
- **Método:** `POST`
- **Payload (`EsqueciSenhaRequest` - Pydantic):**
  ```json
  {
      "email": "usuario.cadastrado@email.com"
  }
  ```
  *As regras de validação Pydantic obrigam que o e-mail seja válido através do `EmailStr`.*

- **Resposta de Sucesso (Status 200 - OK):**
  A rota deliberadamente **sempre** retornará esse aviso de sucesso, independentemente de o e-mail existir no banco de dados ou não. Isso impede invasores descobrirem quem é cadastrado no sistema (previne *Email Enumeration*).
  ```json
  {
      "status": "sucesso",
      "mensagem": "Se o e-mail estiver em nossa base de dados, um link de recuperação será enviado em instantes."
  }
  ```

- **Respostas de Erro:**
  - `400 Bad Request`: Se os campos excederem as regras rígidas do Pydantic (ex: não conter um `@` no e-mail).
  - `500 Server Error`: Se o serviço do provedor SMTP explodir no processamento (o logger do Flask relatará e exibirá ao backoffice a falha detalhada).

### 2.2 Redefinir a Credencial
Intercepta a nova credencial, cruza a entidade e efetua a mudança do bloco criptografado original.

- **URL:** `/api/auth/redefinir-senha`
- **Método:** `POST`
- **Payload (`RedefinirSenhaRequest` - Pydantic):**
  ```json
  {
      "token": "xxxxxxxxxxxxxxxxxxxxxxx_yyyyy_zzzz",
      "nova_senha": "MinhaNovaSenha123"
  }
  ```
  *A segurança valida o token exigindo no mínimo 10 caracteres, e a senha requere força base de 6 até 256 caracteres (`min_length=6`). Tráfego blindado.*

- **Resposta de Sucesso (Status 200 - OK):**
  Ocorre a inversão da entidade no SQLAlchemy e a queima do passe.
  ```json
  {
      "status": "sucesso",
      "mensagem": "Senha alterada com sucesso!"
  }
  ```

- **Respostas de Erro (Status 400 - Bad Request):**
  Será disparado esse trecho dinâmico se a variável da janela temporal estourar, ou se o usuário enviar um Hash inexistente ou já convertido no sistema.
  ```json
  {
      "status": "erro",
      "mensagem": "Link inválido ou expirado. Solicite novamente."
  }
  ```

---

## ⚙️ 3. A Lógica Criptográfica e Segurança (Services e Models)

### `AuthService.gerar_token_recuperacao_senha(email)`
Quando este método é instanciado:
1. Ele busca o cliente associado ao e-mail.
2. Ele encontra os velhos vestígios (Tokens Abandonados) que porventura estivessem mofando inutilizados como falsos-positivos na base (`is_used=False`).
3. Força a imutabilidade definindo essas falhas de segurança para `True` no DB, cortando links antigos pela raiz.
4. Gera e aninha o token novo devolvendo a URL completa provinda do `DevelopmentConfig`.

### `AuthService.redefinir_senha(token, nova_senha)`
Ao processar o patch do dado:
1. Puxa a tabela `PasswordResetToken` em busca da Key remanescente.
2. Interpela pela propredade calculada **`is_valid`**.
3. Assina a classe `Cliente` do dono do token, injetando sua String Pura para que o Mixin de criptografia processe (`cliente.senha = nova_senha`).
4. Grava na memória usando o `mark_as_used()`.

### A Tabela Temporizada (`PasswordResetToken`)
Possui uma inteligência defensiva vital no cálculo comparativo UTC no método `.is_valid`:
Embora os bancos (sobretudo SQLite local) emitam instâncias decapitadas de Metadados Temporais (`Naive Datetime`), o Model conserta o tempo perdido recuperando o estado primário UTC perante a zona do computador (`expires_aware`), garantindo não travar falsos negativos numa base baseada em Fusos (ex: Fuso -03:00 Horário de Brasília).

---

## 🧪 4. Passo a Passo Orientado de Uso (Para Desenvolvedores/Testadores)

Seja por Front-end (React/Vue/etc) ou testando em Thunder Client/Postman, a esteira ocorre assim:

**Passo 1:** Faça um MOCK de usuário esquecido.
Crie a aba POST consumindo `/api/auth/esqueci-senha`. Ao anexar o e-mail válido no JSON, a interface ficará travada (Aguardando Retorno Síncrono da montagem do E-mail) até a aba terminal do VSCode cuspir:
>`INFO: app.routes.auth_routes E-mail de recuperação de senha enviado com sucesso {"email": "..."}`.

**Passo 2:** Resgate da Chave Confidencial.
Veja sua interface de simulação de Caixa Postal (se estiver operante), onde o layout base gerado por `app/utils/email_layouts.py` providenciou o parágrafo de boas vindas com o botão *REDEFINIR*. Se olhar nas rotas ou capturar nos metadados, haverá um sufixo `?token=...`. Copie a hash provida ali.

**Passo 3:** Consolidação da Criptografia Nova.
Navegue até a aba POST de consumo restrito em `/api/auth/redefinir-senha`. No campo do JSON mande a nova senha elaborada, atestando o campo do Token com a chave copiada acima. 
Ao apertar _Send_, as engrenagens de banco atuarão confirmando com o carimbo temporal!
