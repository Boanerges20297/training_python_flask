# 🧪 Guia de Testes Oficiais: Módulo Financeiro

Este guia possui o roteiro formal QA (Quality Assurance) para atestar a estabilidade e segurança da arquitetura de faturamento e pagamentos do Barba Byte.

Você pode executar todas essas baterias usando o **Postman** ou o **Insomnia**.

## 🛡️ Nível 1: Testes de Blindagem (Segurança)

### 1. Proteção de Rotas Fechadas
*   **Ação:** Faça uma requisição `GET` para `http://127.0.0.1:5000/api/financeiro/relatorio?mes=4&ano=2026` sem estar logado (sem enviar o Token JWT).
*   **Esperado:** O servidor deve retornar `401 Unauthorized`. O fluxo sequer deve alcançar a camada de processamento de finanças.

### 2. Proteção de Cargo (Restrito a Administradores)
*   **Ação:** Crie/utilize um usuário com o cargo genérico de `cliente` ou `barbeiro`, colete o Token JWT retornado no Login e tente fazer o mesmo `GET` na rota financeira.
*   **Esperado:** O decorador de segurança vai intervir antes do SQL rodar e retornar `403 Forbidden` avisando sobre acesso ilegal.

---

## 🛑 Nível 2: Validação de Parâmetros (Anti-Error)

### 3. Ausência Total de Data
*   **Ação:** Faça a requisição omitindo as datas: `GET /api/financeiro/relatorio`
*   **Esperado:** O aplicativo não pode cair (`500`). Ele deve ser interceptado manualmente logo na rota e retornar `400 Bad Request` com a mensagem: *"Para acessar as notas, os parâmetros 'mes' e 'ano' são obrigatórios na URL."*

### 4. Mês Impossível (Boundary Limit)
*   **Ação:** Omitir as leis do Calendário enviando `?mes=14&ano=2026`.
*   **Esperado:** Retorno Inteligente `400` dizendo *"Mês logicamente inválido"*, blindando totalmente o motor contra exceptions do formatador.

---

## 💰 Nível 3: O Caminho Feliz (Exigência de Consistência Matemática)

### 5. O Cálculo Principal (Mês Alimentado pelo Seed - Abril)
*   **Ação:** Usando um Administrador autenticado, requisite `GET /api/financeiro/relatorio?mes=4&ano=2026`
*   **Esperado 1:** O valor exato em `"receita_total"` deve fechar a conta milimetricamente com as 23 tabelas das Notas Fiscais (Cálculo que uniu rigorosamente Apenas `concluido` e `pago=True`).
*   **Esperado 2:** No Array `"lucro_por_barbeiro"`, o barbeiro **João** deve dominar todo o topo do gráfico no índex 0. O João fez menos cortes, porém os seus tickets foram de "Corte Degradê" na faixa (R$ 55 reais), testando assim que a agregação SQL rankeou via Valor Real, não Quantidade.

### 6. Mês Fantasma (Resiliência de Banco de Dados)
*   **Ação:** Requisite `GET /api/financeiro/relatorio?mes=5&ano=2026` (Mês Maio nunca existiu preenchido pelo script).
*   **Esperado:** Em vez de estragar a formatação inteira do Front-End disparando nulls assustadores, a mágica do `func.coalesce()` aplicada prevê o cenário fantasma e devolve os blocos esteticamente zerados: `"receita_total": 0.0` e `"notas_fiscais": []`!

---

## 📚 Nível 4: A Prova Enterprise de Escala (Data Paging)

### 7. Estrangulamento Voluntário da Memória RAM
*   **Ação:** Requisite ativamente com limitadores de carga: `GET /api/financeiro/relatorio?mes=4&ano=2026&pagina=1&limite=5`
*   **Esperado:** Embora a barbearia do banco possua dezenas de extratos mensais, você cortou a fonte da represa para uma abertura menor. O Array `"notas_fiscais"` deverá vir bloqueado em exatos **5 objetos**.
*   **Metadado Paginador:** Na finalização, a recusa matemática atesta seu total absoluto de origem. O Front-end agora sabe exatamente quantas páginas desenhar pra chegar lá em cima!
```json
"paginacao": {
   "total_agendamentos": 23,
   "itens_por_pagina": 5,
   "pagina_atual": 1
}
```
