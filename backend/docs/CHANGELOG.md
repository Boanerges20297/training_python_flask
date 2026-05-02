# Changelog BarberByte

Todas as alterações notáveis no projeto serão documentadas neste arquivo.

## [Não Lançado] - 2026-04-29
### Adicionado
- Criação do arquivo `.env` para configuração do backend baseado no `.env.example`.
- Criação deste documento (`CHANGELOG.md`) para registrar futuras alterações.

### Modificado
- `frontend/src/main.tsx`: Remoção da chamada `enableMocking()` para desabilitar os dados mockados (MSW) e conectar o frontend diretamente ao backend real da aplicação.

### Configurado
- Instalação de dependências no backend (`requirements.txt`).
- Instalação de dependências no frontend (`package.json`).
- Criação de ambiente virtual para execução segura e isolada do backend.

### Modelos de Banco de Dados (Adicionados novos campos)
- `Cliente`: Adicionados `imagem_url`, `observacoes`, `data_atualizacao`.
- `Barbeiro`: Substituída `especialidade` (String) por `especialidades` (JSON/Array). Adicionados `imagem_url`, `comissao_percentual`, `justificativa`, `data_atualizacao`.
- `Servico`: Adicionados `imagem_url`, `data_criacao`, `data_atualizacao`. Modificada a importação de datetime para evitar erro 500.
- `Agendamento`: Adicionados `pago` (Boolean), `preco` (Float).

### Schemas Pydantic e Validação
- `ClienteSchema` e `ClienteUpdateSchema`: Adicionados os novos campos para aceitar entrada do frontend.
- `BarbeiroSchema` e `BarbeiroUpdateSchema`: Adaptados para lista de `especialidades` e adicionados os novos campos.
- `ServicoSchema` e `ServicoUpdateSchema`: Adicionado `imagem_url`.
- `AgendamentoCreate` e `AgendamentoUpdateSchema`: Adicionados campos `pago` e `preco`.

### Rotas e Serialização
- Atualizada a serialização nas respostas JSON (`GET /api/clientes`, `GET /api/barbeiros`, `GET /api/servicos`, etc) para incluir os novos campos, evitando retornos nulos no frontend e consertando crashes no carregamento do painel.

### Correções e Estabilização
- **Aba Financeiro:** Corrigido o crash (tela azul/layout perdido) ao abrir a aba Financeiro. 
  - **Causa:** O backend não estava enviando campos essenciais (`receita_liquidada`, `barbeiros_desempenho`, etc.) exigidos pelo frontend, causando erro de renderização ao tentar formatar valores indefinidos.
  - **Solução (Backend):** Atualizado o `DashboardResumoSchema` e `DashboardService` para calcular e retornar todos os indicadores financeiros e o ranking de desempenho.
  - **Solução (Frontend):** Implementada proteção com *optional chaining* e valores padrão na `FinanceiroView` para evitar quebras de renderização mesmo em caso de dados parciais.
  - **Padronização:** Alterada a chave de resposta das rotas de dashboard de `data` para `dados` para manter consistência com o restante da API REST.
- **Cadastro de Barbeiros:** Corrigido erro 400 (Bad Request) ao criar/editar barbeiros.
  - **Causa:** O frontend estava enviando o campo `servicos_ids` que não existia no schema do backend e, como o Pydantic estava configurado para proibir campos extras (`extra: forbid`), a validação falhava.
  - **Solução:** Adicionado o campo `servicos_ids` aos schemas `BarbeiroSchema` e `BarbeiroUpdateSchema` e atualizada a lógica das rotas para associar corretamente os serviços ao barbeiro no banco de dados.
  - **Sincronização:** Agora as respostas das rotas de barbeiro também incluem a lista de IDs de serviços associados para correta visualização no frontend.
- **Agendamentos:** Corrigido erro 400 (Bad Request) ao criar agendamentos.
  - **Causa:** O frontend estava enviando `servicos_ids` (lista) enquanto o backend esperava `servico_id` (único). Além disso, a validação do Pydantic proibia campos extras.
  - **Solução:** Atualizado o `AgendamentoSchema` para aceitar `servicos_ids` e tornado o `servico_id` opcional. No `AgendamentoService`, o `servico_id` é automaticamente derivado do primeiro item da lista caso não seja enviado explicitamente, garantindo que o agendamento seja salvo corretamente com o preço total calculado pelo frontend.
- **FinanceiroView (Bugfix):** Corrigido erro de acesso a propriedade `servicos` em objeto `Cliente` e corrigido erro de sintaxe CSS (`pt-0.5rem`) no modal de liquidação de dívida.
- **FinanceiroView (Charts):** Corrigido o `formatter` do gráfico de cascata (Waterfall) para ocultar corretamente a barra base do tooltip e exibir os nomes das categorias corretamente.

### Testes e Integração
- Criado e executado o script `test_crud.py` validando operações de CREATE, READ, UPDATE e DELETE de Clientes, Barbeiros e Serviços após a reinicialização limpa do banco de dados (Status 200/201 para todas as operações).
