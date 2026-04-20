# Documentação Técnica: Status de Clientes e Histórico de Cortes

## 📌 Visão Geral
Esta documentação detalha as alterações implementadas para suportar o gerenciamento de status de clientes (ativo, ausente, devedor) e o histórico completo de cortes, incluindo débitos e frequência de visitas. As mudanças permitem uma melhor gestão de clientes problemáticos e análise de comportamento.

---

## 🛠️ Mudanças no Banco de Dados (Models)

### 1. Modelo Cliente (`cliente.py`)
Foram adicionados novos campos para rastrear o status e histórico financeiro do cliente:
* **status** (String, padrão: "ativo"): Valores possíveis: "ativo", "ausente", "devedor"
* **divida_total** (Float, padrão: 0.0): Total em débito do cliente
* **ultima_visita** (DateTime, nullable): Data do último agendamento concluído

### 2. Modelo Agendamento (`agendamento.py`)
Adicionado campo para rastrear pagamentos:
* **pago** (Boolean, padrão: False): Indica se o agendamento foi pago

---

## 🔌 Impacto nos Contratos de API (Routes)

### 1. Rotas de Clientes (`/api/clientes`)
Todas as rotas de listagem, criação e busca foram atualizadas para incluir os novos campos:
* **GET `/api/clientes`**: Lista inclui `status`, `divida_total` e `ultima_visita`
* **POST `/api/clientes`**: Criação retorna os novos campos (com valores padrão)
* **GET `/api/clientes/<id>`**: Busca individual inclui os novos campos
* **PATCH `/api/clientes/<id>`**: Permite atualização de `status` e `divida_total`

### 2. Nova Rota de Histórico
* **GET `/api/clientes/<id>/historico`**:
  * Retorna histórico completo do cliente
  * Inclui métricas: total gasto, total devendo, dias sem visita
  * Lista todos os agendamentos concluídos com status de pagamento
  * Filtros opcionais: `?devedores=true` e `?dias_sem_visita=30`
  * Controle de acesso: cliente vê apenas seu histórico, admin vê todos

---

## ⚖️ Implicações na Regra de Negócios

### 1. Status do Cliente
* **Ativo**: Cliente frequente (padrão para novos cadastros)
* **Ausente**: Cliente que não visita há muito tempo (pode ser calculado automaticamente)
* **Devedor**: Cliente com dívidas pendentes

### 2. Histórico e Débitos
* O campo `pago` permite rastrear pagamentos por agendamento individual
* O `divida_total` deve ser atualizado manualmente ou via lógica automática
* A `ultima_visita` deve ser atualizada quando um agendamento é marcado como concluído

### 3. Recomendações de Implementação
* **Atualização automática**: Implementar lógica em `agendamento_service.py` para atualizar `ultima_visita` e `divida_total` quando agendamentos são concluídos
* **Cálculo de status**: Adicionar job ou trigger para marcar clientes como "ausentes" se `ultima_visita` > 90 dias
* **Pagamentos**: Integrar com sistema de pagamentos para marcar `pago=True` automaticamente

---

## 💻 Guia para a Equipe de Frontend

### 1. Campos Adicionais em Clientes
* Nas telas de listagem e detalhe de clientes, exibir:
  - Status com badges coloridos (verde=ativo, amarelo=ausente, vermelho=devedor)
  - Dívida total (se > 0, destacar)
  - Última visita (calcular "dias sem visita")

### 2. Nova Tela de Histórico
* Criar tela dedicada para histórico do cliente
* Mostrar métricas no topo: total gasto, débitos pendentes, frequência
* Listar cortes com status de pagamento
* Filtros: apenas débitos, período específico

### 3. Gestão de Status
* Permitir edição de status apenas para admins
* Alertas para clientes devedores ou ausentes
* Notificações automáticas para clientes ausentes

---

## 🔧 Próximos Passos
1. Executar migrations para adicionar os novos campos
2. Implementar lógica de atualização automática nos serviços
3. Testar endpoints com dados reais
4. Atualizar documentação de API (Swagger/OpenAPI)