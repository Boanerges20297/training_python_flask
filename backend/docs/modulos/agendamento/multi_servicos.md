# Documentação: Agendamento com Múltiplos Serviços

Esta documentação detalha o funcionamento do sistema de agendamento multi-serviços, implementado para permitir que um único agendamento englobe diversos serviços simultâneos, otimizando o tempo do barbeiro e a experiência do cliente.

---

## 1. Fluxo de Funcionamento

O fluxo segue uma lógica rigorosa de validação antes da persistência no banco de dados:

1.  **Recebimento da Requisição**: O usuário (Admin, Barbeiro ou Cliente) envia uma lista de IDs de serviços (`servico_ids`) junto com a data e os IDs de cliente/barbeiro.
2.  **Validação de Identidade**: O sistema verifica se o usuário autenticado tem permissão para realizar o agendamento para os envolvidos.
3.  **Validação de Serviços**:
    *   Verifica se todos os IDs de serviços existem.
    *   Verifica se o barbeiro selecionado oferece **todos** os serviços solicitados.
4.  **Cálculo de Duração Total**: O sistema soma a duração (em minutos) de cada serviço individual para obter a duração total do bloco de tempo necessário.
5.  **Verificação de Disponibilidade**:
    *   **Horário Comercial**: Verifica se o início e o fim (início + duração total) estão dentro do horário de funcionamento da barbearia.
    *   **Conflitos de Horário**: Busca agendamentos existentes para o mesmo barbeiro no mesmo período. A verificação de conflito agora considera a duração total somada de ambos os agendamentos (o novo e os já existentes).
6.  **Persistência**:
    *   O registro principal do `Agendamento` é criado.
    *   As associações entre o agendamento e os serviços são criadas na tabela de ligação `agendamento_servico` (Many-to-Many).
7.  **Notificação**: Um e-mail é enviado ao cliente listando todos os serviços confirmados.

---

## 2. Rotas da API

### `POST /api/agendamento`
Cria um novo agendamento.
*   **O que aceita**: JSON contendo `cliente_id`, `barbeiro_id`, `data_agendamento` (ISO 8601), `servico_ids` (lista de inteiros) e `observacoes` (opcional).
*   **O que recusa**:
    *   Lista de serviços vazia.
    *   IDs de serviços duplicados na mesma requisição.
    *   Serviços que o barbeiro não realiza.
    *   Conflitos de horário com outros agendamentos.
    *   Datas passadas ou fora do horário comercial.

### `PATCH /api/agendamento/<id>`
Atualiza parcialmente um agendamento existente.
*   **O que aceita**: Qualquer campo do agendamento (parcial). Se `servico_ids` for enviado, ele **substitui completamente** a lista anterior de serviços.
*   **O que recusa**:
    *   Alteração de cliente por usuários que não sejam Admins.
    *   Edição de agendamentos com status "concluido" ou "cancelado".
    *   Qualquer violação das regras de validação (conflitos, serviços inválidos, etc).

### `GET /api/agendamento/buscar/<id>`
Retorna os detalhes completos de um agendamento.
*   **O que retorna**: Inclui o objeto `servicos`, que é uma lista de todos os serviços vinculados, com seus nomes, preços e durações individuais.

### `GET /api/agendamento`
Lista os agendamentos com paginação.
*   **Filtros automáticos**: Clientes veem apenas os seus; Barbeiros veem os seus; Admins veem todos.

### `PATCH /api/agendamento/status/<id>`
Altera o status do agendamento (pendente, confirmado, concluído, cancelado).
*   **Limitação**: Não permite "voltar" o status de agendamentos já concluídos ou cancelados.

### `DELETE /api/agendamento/<id>`
Exclusão física do registro (Apenas Admin).
*   **Nota**: Remove automaticamente as associações de serviços via CASCADE.

---

## 3. Limitações Atuais

1.  **Soma Linear de Tempo**: O sistema assume que os serviços são realizados sequencialmente. A duração total é a soma simples das durações de cada serviço.
2.  **Substituição Total**: Ao editar serviços em um agendamento existente, não é possível "adicionar um serviço" individualmente via API; é necessário enviar a nova lista completa desejada.
3.  **Barbeiro Único**: Um agendamento multi-serviço ainda é vinculado a apenas um barbeiro. Não é possível dividir os serviços de um único agendamento entre barbeiros diferentes.

---

## 4. Regras de Aceitação e Recusa (Resumo)

| Situação | Ação | Motivo |
| :--- | :--- | :--- |
| **ID de serviço inexistente** | **Recusa (400)** | Integridade referencial. |
| **Serviço não oferecido pelo barbeiro** | **Recusa (400)** | Regra de negócio: Barbeiro não especializado. |
| **Data/Hora no passado** | **Recusa (400)** | Impossibilidade temporal. |
| **Término após horário de fechamento** | **Recusa (400)** | Respeito ao horário comercial. |
| **Sobreposição com outro agendamento** | **Recusa (409)** | Evitar "overbooking". |
| **Lista de serviços duplicada** | **Recusa (400)** | Evitar erro de entrada de dados. |
| **Edição de agendamento cancelado** | **Recusa (400)** | Preservação de histórico. |

---

> [!TIP]
> Para calcular o valor total do agendamento no Front-end, deve-se somar o campo `preco` de todos os itens dentro da lista `servicos` retornada pela API.
