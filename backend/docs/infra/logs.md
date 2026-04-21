# Documentação: Sistema de Logs Estruturados - Barba & Byte

O sistema de logs da aplicação backend foi projetado para gerar relatórios detalhados, centralizados e estruturados em formato **JSON**. Isso facilita a leitura por humanos durante o debug e a futura integração com ferramentas de monitoramento modernas (como Elasticsearch, Kibana, Datadog ou AWS CloudWatch).

---

## 1. Tecnologias e Configurações

* **`logging` (Nativo Python)**: Módulo robusto usado como núcleo para classificar mensagens e gerenciar handlers.
* **`python-json-logger`**: Extensão para subsituir o output em texto plano tradicional do Python por dicionários `JSON` rígidos.
* **`RotatingFileHandler`**: Classe auxiliar no módulo de log que garante que a pasta de logs não absorva todo o disco do servidor caso a aplicação rode por meses a fio. Ele fatia o arquivo em **5 MB** e mantém uma lixeira rotatória de apenas **5 backups**.

## 2. Arquitetura do Logger

O Logger foi inicializado seguindo a filosofia *Factory Application* do Flask:

1. **`app/extensions.py`**:
   Nele, declaramos globalmente `app_logger = logging.getLogger("barbabyte")`. Qualquer módulo e arquivo que precisar logar erros ou comportamentos usará esta mesma instância importada para evitar configurações dispersas.

2. **`app/utils/logger_setup.py` (`setup_logger`)**:
   Esta função é chamada uma única vez no arquivo `__init__.py`. É dentro dela que as engrenagens se ajustam:
   - Configura o arquivo físico em `/logs/app.log`.
   - Lê a variável `DEBUG` da configuração para definir se os logs mostrarão absolutamente todos os traços (para o Dev) ou somente níveis de `INFO`/`ERROR` (para Prod).
   - Injeta o *Formatter* garantindo que cada linha de log escrita possua: `[Data] [Nível] [Módulo] [Mensagem]`.
   - Propaga o output de forma simultânea entre o `app.log` (arquivos de texto) e o *Stream do Console* (útil durante o desenvolvimento).

---

## 3. Fluxo Automático e Middlewares (Requests)

Não é necessário adicionar explicitamente um log para toda requisição HTTP, o logger engloba a entrada através de *Hooks* (Middlewares do Flask):

* **`@app.before_request`**: Salva o milissegundo exato da solicitação dentro do contexto global do Flask.
* **`@app.after_request`**: Captura a resposta construída pelo controller e:
  - Ignora a raiz estática `"/"` para evitar ruído de rotinas de ping/health-check.
  - Calcula a duração real (em MS) que a API levou para responder.
  - Monta os `extra_dados`: *IP, Duração, Método e Caminho*.
  - Classifica inteligentemente a severidade da chamada através do Status HTTP:
    - **Status >= 500**: Salvo via `logger.error("Erro Interno...")`.
    - **Status >= 400**: Salvo via `logger.warning("Rejeição...")`.
    - **Demais status**: Salvo via `logger.info("Requisição...")`.

## 4. Como Usar nos Serviços/Rotas (Melhores Práticas)

Os desenvolvedores devem utilizar o `app_logger.info()`, `.warning()`, ou `.error()` nas Regras de Negócio de forma semântica e **passar variáveis sensíveis ou analíticas no argumento `extra={}`**. 

**Exemplo Simples de Uso:**
```python
from app.extensions import app_logger

try:
    # Lógica que processa regras...
    app_logger.info(
        "Sucesso na Operação ABC",
        extra={
            "id_usuario": current_user_id,
            "tempo_estimado": 12 
        }
    )
except Exception as e:
    # Em exceções, o parâmetro exc_info=True puxa a "Stack Trace" real apontando a linha do erro
    app_logger.error(
        "Falha ao realizar cálculo", 
        extra={"erro_detalhe": str(e)}, 
        exc_info=True
    )
```

> [!TIP]
> **Logs Não São Armazenamento Relacional!**
> Evite logar Objetos pesados inteiros (Dumps) no console. Foque sempre em buscar o `ID` dos recursos criados, falhados ou o e-mail responsável pela falha. Isso reduz o consumo de disco e leitura de I/O de escrita.
