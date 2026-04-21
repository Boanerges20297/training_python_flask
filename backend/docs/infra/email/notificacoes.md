# Notificações de E-mail (Barber & Byte)

Este documento descreve o funcionamento do sistema de notificações por e-mail implementado no backend do Barber & Byte.

## Visão Geral
Sempre que um administrador exclui um agendamento permanentemente do banco de dados (exclusão física), o sistema dispara automaticamente dois e-mails de aviso:
1. Um para o **Cliente** associado ao agendamento.
2. Um para o **Barbeiro** responsável pelo serviço.

## Tecnologias Utilizadas
- **Flask-Mail**: Extensão para integração com servidores SMTP.
- **Python Threading**: O envio é realizado de forma assíncrona para não impactar o tempo de resposta da API.

## Configuração de Ambiente
As seguintes variáveis de ambiente devem ser configuradas para que o envio funcione (Exemplo usando Mailtrap para desenvolvimento):

```env
MAIL_SERVER=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USE_TLS=True
MAIL_USERNAME=seu_usuario_mailtrap
MAIL_PASSWORD=sua_senha_mailtrap
MAIL_DEFAULT_SENDER=noreply@barbabyte.com
```

> [!IMPORTANT]
> Se estas variáveis não forem configuradas corretamente no arquivo `.env` ou nas variáveis de sistema, o backend registrará um erro no log, mas não impedirá a exclusão do registro no banco.

## Fluxo de Implementação
1. **Modelos**: Utiliza as relações `agendamento.cliente` e `agendamento.barbeiro` para obter os nomes e endereços de destino.
2. **Serviços**: O `EmailService` centraliza os templates de texto simples e a lógica de disparo asíncrono.
3. **Trigger**: Integrado diretamente no método `deletar_registro_fisico` do `AgendamentoService`.

## Exemplo de E-mail (Texto Simples)
**Assunto**: Aviso: Seu agendamento foi cancelado
**Conteúdo**: 
```text
Olá [Nome do Cliente],

Informamos que o seu agendamento para o dia [Data/Hora] foi cancelado por um administrador do sistema Barber & Byte.

Para mais informações ou para reagendar, entre em contato conosco.

Atenciosamente,
Equipe Barber & Byte
```
