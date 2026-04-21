# Dashboard Tecnico

## 1. Objetivo

O modulo de dashboard consolida indicadores operacionais e financeiros da barbearia para consumo do frontend.

Ele oferece:
- Visao geral do negocio (receita, ticket medio, atendimentos, horarios populares).
- Visao por barbeiro (desempenho individual, servicos realizados, taxa de conclusao).
- Endpoints especializados para ganho, atendimentos e rankings.

## 2. Arquitetura Atual

### 2.1 Camadas

- Rotas HTTP: `app/routes/dashboard_routes.py`
- Regra de negocio e agregacoes: `app/services/dashboard_service.py`
- Contrato de payload (Pydantic): `app/schemas/dashboard_chema.py`

### 2.2 Fluxo Basico

1. Rota recebe query params (`dias`, `periodo`, `data_inicio`, `data_fim`).
2. Rota valida parametros basicos (range de dias, formato de data, periodo permitido).
3. Rota chama `DashboardService`.
4. Service executa consultas SQLAlchemy e agrega resultados.
5. Rota retorna `jsonify({"message": ..., "data": ...})`.

## 3. Seguranca e Controle de Acesso

### 3.1 Endpoints Admin

Protegidos por `@admin_required`:
- `/api/dashboard/geral`
- `/api/dashboard/receita-periodo`
- `/api/dashboard/horarios-populares`
- `/api/dashboard/ganhos-totais`
- `/api/dashboard/ganhos-barbeiros`
- `/api/dashboard/atendimentos-gerais`
- `/api/dashboard/atendimentos-barbeiros`
- `/api/dashboard/servico-mais-procurado`
- `/api/dashboard/cliente-mais-atendimentos`

### 3.2 Endpoints por Barbeiro

Protegidos por `@jwt_required()`:
- `/api/dashboard/barbeiro/<barbeiro_id>`
- `/api/dashboard/servicos-barbeiro/<barbeiro_id>`

Regra adicional:
- Se role do token for `barbeiro`, so pode acessar o proprio `barbeiro_id`.
- Em caso de tentativa de acesso cruzado, retorna `403`.

## 4. Contrato de Dados

Definido em `dashboard_chema.py`:

- `ServicoRealizadoSchema`
- `HorarioPopularSchema`
- `ReceitaPeriodicaSchema`
- `BarbeiroDesempenhoSchema`
- `DashboardResumoSchema`
- `DashboardBarbeiroSchema`

Regra de governanca:
- Alterar campos/tipos desses schemas equivale a alterar contrato de API.
- Mudancas devem ser sincronizadas com frontend e testes de rota.

## 5. Logica Tecnica do Service

## 5.1 Janela Temporal e UTC

Padrao adotado:
- `datetime.now(timezone.utc)` para datas correntes.
- `DashboardService._period_start_from_days(dias)` para calcular inicio do periodo.
- `DashboardService._parse_date_range(inicio, fim)` transforma intervalo textual em faixa UTC inclusiva.

Detalhe importante:
- `data_fim` e expandida para fim do dia (`23:59:59.999999`) para evitar perda de registros no ultimo dia.

## 5.2 Query Object Interno

Metodo:
- `_base_query(data_inicio=None, data_fim=None, status=None, barbeiro_id=None)`

Funcao:
- Centralizar filtros recorrentes sobre `Agendamento`.
- Reduzir repeticao em metodos como:
  - `get_dashboard_geral`
  - `get_dashboard_barbeiro`
  - `get_atendimentos_gerais`
  - `_get_barbeiros_desempenho`

## 5.3 Mapper Interno

Metodo:
- `_to_desempenho_barbeiro(barbeiro, agendamentos)`

Funcao:
- Consolidar calculos de KPI por barbeiro:
  - total de agendamentos
  - concluidos e cancelados
  - receita
  - tempo total de servicos
  - taxa de conclusao

Beneficio:
- Evita divergencia de calculo quando o mesmo KPI e usado em mais de um endpoint.

## 5.4 Agregacoes SQL relevantes

### Receita total
- Soma `Servico.preco` para agendamentos concluidos no periodo.

### Ganhos por barbeiro
- `GROUP BY barbeiro` + `SUM(preco)` com ordenacao descendente.

### Horarios populares
- Agrupamento por hora (`strftime("%H:00", data_agendamento)`) apenas para concluidos.

### Receita diaria
- Duas consultas:
  - receita e concluidos por data
  - pendentes por data
- Resultado final e mesclado por chave de data em memoria.

## 6. Endpoints e Regras de Validacao

### 6.1 Parametro `dias`

Aplicavel em varios endpoints de dashboard.

Regra:
- `1 <= dias <= 365`
- Fora do range: `400`

### 6.2 Parametro `periodo`

Aplicavel em ganhos.

Valores aceitos:
- `dia`, `semana`, `mes`
- Valor invalido: `400`

### 6.3 Datas de atendimento

Endpoints:
- `atendimentos-gerais`
- `atendimentos-barbeiros`

Regras:
- `data_inicio` e `data_fim` sao obrigatorias.
- Formato obrigatorio `YYYY-MM-DD`.
- Invalido ou ausente: `400`.

## 7. Testes e Consolidacao

Script de smoke test de rotas:
- `backend/tests/routes_testes/dashboard_testes.py`

Cobertura atual do script:
- Exercita os endpoints principais de dashboard com client Flask e token admin.
- Valida status esperado por endpoint (`200`, e em alguns casos `200|404`).

Uso:

```bash
c:/Projetos/training_python_flask/venv/Scripts/python.exe training_python_flask/backend/tests/routes_testes/dashboard_testes.py
```

## 8. Pontos de Atencao (Manutencao)

1. O service ainda concentra consultas SQLAlchemy e transformacao de payload na mesma classe.
2. Parte das agregacoes usa filtros repetidos em `db.session.query(...)` (candidato a helper adicional).
3. O nome do arquivo de schema esta como `dashboard_chema.py` (sem "s"), manter consistencia ao importar.
4. Mudancas de timezone ou formato de data impactam diretamente graficos e filtros do frontend.

## 9. Roadmap Tecnico Recomendado

1. Extrair helper generico para filtros de queries agregadas (`db.session.query`) e reduzir repeticao adicional.
2. Introduzir testes em formato pytest para CI (alem do script de smoke test).
3. Opcional: separar camada de repositorio para desacoplamento completo do ORM no service.
4. Opcional: validar saidas do service explicitamente contra os schemas Pydantic antes de retornar.

## 10. Resumo Executivo

Estado atual consolidado:
- Integracao funcional de dashboard ativa.
- Contrato de payload definido e documentado.
- Regras de acesso e validacao de entrada implementadas.
- Teste de rotas existente e executavel.

Resultado:
- Base estavel para evolucao incremental sem quebrar o frontend.
