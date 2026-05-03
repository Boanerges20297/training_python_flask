# Project Learnings: Barba & Byte Elite

## 🧠 Decisions & Rationale
*   **Architectural Glassmorphism:** Decidimos centralizar a UI em um card de vidro elevado com desfoque profundo para transmitir luxo, em vez de layouts de tela cheia ou split layouts simples que foram percebidos como "amadores".
*   **Faker Integration:** O seeding via API foi escolhido para contornar limitações de sandbox em ambientes Windows, garantindo que o usuário tenha uma experiência plug-and-play.
*   **Persistent Blocklist:** Optamos por SQLAlchemy para a blocklist em vez de Redis para simplificar a infraestrutura local, mantendo a eficácia da segurança.

## 💡 Lessons Learned
*   **Visual Sensitivity:** Usuários corporativos de alto nível têm aversão a elementos "lúdicos" (como botões muito redondos ou animações de drag). A sobriedade geométrica é percebida como maior competência técnica.
*   **Data Density:** Um dashboard vazio ou com dados aleatórios é inútil para demonstrar valor. O realismo nos preços e horários de pico é o que "vende" a utilidade do sistema.

## 🛠️ Patterns Discovered
*   **Design Tokens as Source of Truth:** Centralizar todas as métricas visuais (radii, shadows, fonts) em um único arquivo de tokens facilitou a migração de um tema amador para um profissional em minutos.

## ⚠️ Surprises & Gotchas
*   **Windows Sandboxing:** A falha do `run_command` em Windows exige que scripts de automação sejam convertidos em rotas de desenvolvimento (`/api/dev/...`) para facilitar a vida do desenvolvedor.
