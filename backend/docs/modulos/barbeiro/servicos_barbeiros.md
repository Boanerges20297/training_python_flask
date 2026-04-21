# Documentação Técnica: Reformulação da Arquitetura de Serviços e Barbeiros

## 📌 Visão Geral
Esta documentação detalha a refatoração arquitetural realizada na relação entre **Serviços** e **Barbeiros**. O sistema passou de um modelo estrito de _Um-para-Muitos_ (onde cada serviço pertencia irredutivelmente a apenas um barbeiro configurado) para um modelo flexível de _Muitos-para-Muitos_ (**Many-to-Many**). 

Com isso, o catálogo de Serviços agora é global à barbearia, e múltiplos barbeiros podem ser associados a um ou múltiplos serviços que eles oferecem em suas agendas.

---

## 🛠️ Mudanças no Banco de Dados (Models)

### 1. Novo Modelo Associativo (`barbeiro_servico`)
Foi criada uma tabela relacional intermediária em `app/models/barbeiro_servico.py` chamada `BarbeiroServico`.
* **Colunas:**
  * `id` (Integer, Primary Key)
  * `barbeiro_id` (ForeignKey ligada a `barbeiros.id`)
  * `servico_id` (ForeignKey ligada a `servicos.id`)
* **Comportamento CASCADE:** Ambos os relacionamentos usam `ondelete='CASCADE'`. Se um serviço ou um barbeiro for removido do painel da barbearia, todas as suas menções nessa tabela associativa são excluídas automaticamente, mitigando lixo de banco de dados e erros 500 por dependência cruzada.

### 2. Edição no Modelo de Serviços
* O campo `barbeiro_id` que servia como foreign key foi **definitivamente removido** do modelo `Servico` (`app/models/servico.py`). 

### 3. Ajuste no Modelo de Barbeiros
* O relacionamento `servicos` em `app/models/barbeiro.py` agora aponta para a tabela secundária (`secondary='barbeiro_servico'`), habilitando operações automatizadas de in/out no SQLAlchemy.

---

## 🔌 Impacto nos Contratos de API (Routes)

### 1. Rotas de Serviços Otimizadas (`/api/servicos`)
As rotas mantêm o formato CRUD inalterado, exceto que não demandam e não transmitem mais informações referentes ao vínculo com um barbeiro.
* **POST `/api/servicos`**: O parâmetro obrigatório `barbeiro_id` foi desativado via Pydantic (`servico_schema.py`). Apenas nome, descrição, valor e tempo em minutos importam agora.

### 2. Novas Rotas em Barbeiros (`/api/barbeiros/<id>/servicos`)
Um cluster dedicado de rotas lida exclusivamente com o catálogo pessoal de cada barbeiro.
* **GET `/api/barbeiros/<id>/servicos`**:
  * Lista todos os serviços (id, nome, preco, duração) oferecidos unicamente por aquele `<id>` de Barbeiro.
* **POST `/api/barbeiros/<id>/servicos`** (Requer Autenticação e Nível Admin):
  * **Payload esperado:** JSON contendo os serviços que você deseja dar ao barbeiro:
    ```json
    {
      "servicos_ids": [1, 2, 4]
    }
    ```
  * Adiciona os serviços não redundantes do payload diretamente à lista associada do profissional no banco.
* **DELETE `/api/barbeiros/<id>/servicos`** (Requer Autenticação e Nível Admin):
  * **Payload esperado:** Idêntico ao POST.
  * Omitirá do portfólio dele os serviços citados caso eles existam na tabela, excluindo instantaneamente o nó relacional.

⚠️ **Dica Importante de Performance (GET Barbeiros geral):**
Caso precisar saber apenas os barbeiros capazes de fazer um tipo específico de Corte (ex: Serviço `ID=1`), utilize as querystrings na url pública base:
`GET /api/barbeiros?servicoId=1`. 
Ela processa internamente a função `.any()` na tabela cross reference filtrando sob medida a array de barbeiros no retorno.

---

## ⚖️ Implicações na Regra de Negócios (Agendamento)
Para proteger a Agenda do profissional contra imprevistos, as funções centrais dos agendamentos no `agendamento_service.py` foram fortificadas.

* **Criação de Agendamentos (`criar_agendamento`)**:
O backend extrai o Barbeiro selecionado e varre a lista dele. Se o sistema notar que o serviço solicitado **não se encontra** assinado naquele barbeiro, a rotina interrompe com a flag técnica de erro `"O barbeiro selecionado não oferece este serviço."` bloqueando dados disconexos que vem do Frontend.
* **Proteção na Edição (`editar_agendamento`)**:
Se um funcionário e/ou usuário tentar manobrar via **PATCH**, alterando o pacote de serviço de um Agendamento legal existente, uma proteção replicada agirá e barrará edições dinâmicas posteriores para serviços incapacitados.

---

## 💻 Guia para a Equipe de Frontend
* Ao montar a aba "Novo Agendamento" da UI Mobile ou Website, altere a cascata de exibição para: **1. Escolha o Serviço do catálogo geral -> 2. Solicite o Endpoint (`?servicoId=X`) e desenhe na tela apenas os profissionais que a API devolveu.** 
* Na interface Administrativa do Dashboard do Web App, providencie um bloco de caixas de seleção (`check-boxes` ou `multiple select tags`) no modal do Barbeiro, onde após a curadoria, vocês mandam um Request POST silencioso para injetar todo o array `[1, 5, 12]` de uma única vez, simplificando completamente a experiência do Administrador Barba Byte.
