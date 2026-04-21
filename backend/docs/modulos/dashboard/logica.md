# DASHBOARD - LOGICA DE FUNCIONAMENTO

Gerado em: 2026-04-15
 Atualizado por: Josue Ferreira - 2026-04-16
Referencia de retomada: DASHBOARD-JOSUE-2026-04-15-A1

## 1. Objetivo do modulo

O modulo de dashboard concentra metricas analiticas para apoiar a visao de negocio da barbearia.
Ele responde perguntas como:

- Qual foi a receita no periodo
- Quantos agendamentos foram concluidos, cancelados e pendentes
- Quais barbeiros performaram melhor
- Quais horarios tiveram maior demanda
- Qual o ticket medio

Arquivos principais:

- app/services/deshboard_service.py
- app/schemas/dashboard_chema.py
- app/routes/dashboard_routes.py

## 2. Fluxo geral de processamento

Quando uma rota de dashboard e chamada, o fluxo segue estes passos:

1. A rota recebe o parametro dias (padrao 30).
2. A rota valida limite de dias (1 a 365).
3. A rota chama o service DashboardService.
4. O service consulta agendamentos no banco para o periodo.
5. O service agrega os dados em memoria (listas e dicionarios).
6. O service devolve um dict com os indicadores.
7. A rota retorna JSON com message e data.

## 3. Logica do service (regra de negocio)

### 3.1 Metodo get_dashboard_geral(dias)
 
Responsabilidade: montar o dashboard agregado de todos os barbeiros.

Calculos executados:

- Define janela temporal:
  - data_inicio = agora - dias
  - data_fim = agora
- Busca agendamentos no intervalo
- Separa por status:
  - concluidos
  - cancelados
  - pendentes
- Receita total:
  - soma do preco do servico apenas para agendamentos concluidos
- Desempenho por barbeiro:
  - percorre todos os barbeiros
  - chama _calcular_desempenho_barbeiro para cada um
- Horarios populares:
  - chama _get_horarios_populares(top=5)
- Receita diaria:
  - chama _get_receita_diaria
- Ticket medio:
  - receita_total / quantidade de concluidos

Retorno principal:

- periodo_inicio
- periodo_fim
- receita_total
- agendamentos_total
- agendamentos_concluidos
- agendamentos_cancelados
- agendamentos_pendentes
- barbeiros_desempenho
- top_5_horarios
- receita_diaria
- ticket_medio

### 3.2 Metodo get_dashboard_barbeiro(barbeiro_id, dias)

Responsabilidade: montar dashboard individual de um barbeiro.

Calculos executados:

- Valida se o barbeiro existe
- Busca agendamentos do barbeiro no periodo
- Separa concluidos e cancelados
- Soma receita dos concluidos
- Agrupa servicos realizados por nome:
  - quantidade
  - receita
- Calcula taxa de conclusao:
  - concluidos / total de agendamentos * 100

Retorno principal:

- barbeiro_id
- barbeiro_nome
- periodo_inicio
- periodo_fim
- receita_total
- agendamentos_concluidos
- agendamentos_cancelados
- servicos_realizados
- taxa_conclusao

### 3.3 Metodos auxiliares

- _calcular_desempenho_barbeiro:
  calcula indicadores detalhados para um barbeiro e alimenta a lista agregada do dashboard geral.

- _get_horarios_populares:
  conta quantos agendamentos concluidos ocorreram por hora e retorna o top ordenado.

- _get_receita_diaria:
  agrupa receita por data e adiciona contagem de agendamentos concluidos e pendentes.

## 4. Contrato de dados (schemas)

O arquivo dashboard_chema.py define modelos pydantic para documentar o formato esperado.

Modelos principais:

- HorarioPopularSchema
- ReceitaPeriodicaSchema
- BarbeiroDesempenhoSchema
- DashboardResumoSchema
- DashboardBarbeiroSchema

Observacao:
Atualmente as rotas retornam dict diretamente. Os schemas estao prontos para validacao/serializacao explicita caso o time deseje reforcar o contrato de resposta.

## 5. Rotas do dashboard (secao separada)

Base URL: /api/dashboard

### 5.1 GET /geral

Permissao:

- Somente admin (decorator admin_required)

Fluxo:

1. Le dias por query string (default 30)
2. Valida dias entre 1 e 365
3. Chama DashboardService.get_dashboard_geral
4. Retorna data completa do dashboard agregado

Resposta esperada:

- message
- data com metricas gerais

### 5.2 GET /receita-periodo

Permissao:

- Somente admin

Fluxo:

1. Le e valida dias
2. Reutiliza DashboardService.get_dashboard_geral
3. Extrai apenas data.receita_diaria
4. Retorna serie temporal de receita

### 5.3 GET /barbeiro/<barbeiro_id>

Permissao:

- Requer JWT
- Regra de acesso:
  - admin pode ver qualquer barbeiro
  - barbeiro so pode ver o proprio dashboard

Fluxo:

1. Le claims do token (role e sub)
2. Aplica regra de autorizacao
3. Le e valida dias
4. Chama DashboardService.get_dashboard_barbeiro
5. Se barbeiro nao existir, retorna 404
6. Retorna dashboard individual

### 5.4 GET /servicos-barbeiro/<barbeiro_id>

Permissao:

- Requer JWT
- Mesma regra de acesso da rota de barbeiro

Fluxo:

1. Le token e valida permissao
2. Le e valida dias
3. Chama DashboardService.get_dashboard_barbeiro
4. Extrai apenas servicos_realizados
5. Retorna lista de servicos agregados

### 5.5 GET /horarios-populares

Permissao:

- Somente admin

Fluxo:

1. Le e valida dias
2. Chama DashboardService.get_dashboard_geral
3. Extrai apenas top_5_horarios
4. Retorna ranking de horarios

## 6. Codigos de resposta mais comuns

- 200: consulta realizada com sucesso
- 400: parametro dias invalido
- 403: acesso negado por regra de perfil
- 404: barbeiro nao encontrado

## 7. Observacoes tecnicas importantes

- O modulo esta dividido por responsabilidade:
  - Routes: controle HTTP, autorizacao e retorno
  - Service: regra de negocio e agregacoes
  - Schema: contrato de dados

- Para manter rastreabilidade, o ideal e manter nomes de modulo e import alinhados entre rotas e services.
