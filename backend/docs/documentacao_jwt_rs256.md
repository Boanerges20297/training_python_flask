# Documentação: Autenticação JWT com Criptografia Assimétrica (RS256)

Esta documentação detalha a arquitetura de segurança atualizada do **Barba Byte** em relação à emissão e validação de tokens JWT (JSON Web Tokens).

---

## 1. Visão Geral (O que mudou?)

Na configuração histórica, o backend utilizava a criptografia **Simétrica (`HS256`)**. Nela, uma única senha mestre (`JWT_SECRET_KEY`) atuava tanto na **criação** quanto na **validação** dos tokens.

Visando o padrão de segurança da indústria, migramos a aplicação para o modelo **Assimétrico (`RS256`)**, o qual utiliza um par de chaves complementares:
- **Chave Privada (`private_key.pem`):** Utilizada única e exclusivamente pelo motor de Autenticação (`auth_routes.py`) para **Assinar (Criar)** os tokens validados. Altamente secreta.
- **Chave Pública (`public_key.pem`):** Distribuída e utilizada pelo restante do ecossistema do Flask apenas para **Verificar** se os usuários requisitantes possuem um token válido. Ela é bloqueada matematicamente de forjar/criar tokens novos.

---

## 2. Configurações (`config.py`)

O arquivo global `config.py` foi reforçado com base no pattern **Fail-Fast**. O servidor exige rigorosamente as novas chaves.

Em Produção (e agora também em Desenvolvimento), o código lê puramente das Variáveis de Ambiente e substitui os caracteres literais `\n` por quebras estruturais, permitindo que provedores em Nuvem como o Render ou AWS processem os tokens sem formatação quebrada.

```python
# O Trecho de Validação (Fail-Fast) no config.py
JWT_PRIVATE_KEY = os.environ.get("JWT_PRIVATE_KEY")
if JWT_PRIVATE_KEY:
    JWT_PRIVATE_KEY = JWT_PRIVATE_KEY.replace("\\n", "\n")

JWT_PUBLIC_KEY = os.environ.get("JWT_PUBLIC_KEY")
if JWT_PUBLIC_KEY:
    JWT_PUBLIC_KEY = JWT_PUBLIC_KEY.replace("\\n", "\n")

JWT_ALGORITHM = "RS256"
```

---

## 3. Script Gerador Interno

Foi implementado um script nativo caso a equipe de desenvolvimento perca (ou precise rotacionar) o par de chaves por suspeita de vazamento da infraestrutura.

- **Local:** `scripts/generate_jwt_keys.py`
- **Uso:** Basta rodar `python scripts/generate_jwt_keys.py`.
- **Ação:** O script invocará a biblioteca subjacente `cryptography`, executará a matriz `RSA-2048` e cuspirá dois arquivos (`private_key.pem` e `public_key.pem`) no mesmo diretório.

> **Importante:** Os arquivos gerados `.pem` estão explicitamente barrados no `.gitignore` para prevenir acidentes de commit públicos. O sistema foi desenvolvido para absorver essas senhas via *Arquivo .env*.

---

## 4. Salvando no Arquivo `.env`

A sua cópia local (bem como a Nuvem, quando for implantado) requer que você extraia o conteúdo gerado em bloco longo e o amasse em uma única linha, usando "aspas" para delimitar.

**Formato exigido no `.env`**:
Abaixo está o modelo limpo, onde cada nova quebra de linha real é substituída voluntariamente por `\n`:

```env
# Exemplo correto onde tudo está contido em apenas 1 linha por variável:
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIB...<resto_da_hash>...\n-----END PRIVATE KEY-----"

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjAN...<resto_da_hash>...\n-----END PUBLIC KEY-----"
```

---

## 5. Benefícios Imediatos

1. **Escalabilidade Total**: Se futuramente adotar a lógica de microsserviços (ex: desacoplar Relatórios de Agendamentos), apenas o serviço de Autenticação retém o `JWT_PRIVATE_KEY`, enquanto os demais consomem puramente o Public.
2. **Prevenção de Ataques (RCE / Path Traversal)**: Redução drástica da "Superfície de Ataque". Invadir um serviço adjacente do Backend revelaria apenas a Chave Pública, anulando a escalada de privilégios.
