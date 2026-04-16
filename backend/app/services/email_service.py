from flask_mailman import EmailMessage
from flask import current_app
from app.extensions import app_logger


class EmailService:
    @staticmethod
    def enviar_notificacao_simples(
        destinatario: str, assunto: str, mensagem_texto: str
    ) -> tuple[bool, str]:
        """
        Envia um e-mail de texto simples.
        """
        try:
            msg = EmailMessage(subject=assunto, body=mensagem_texto, to=[destinatario])
            msg.send()
            return True, "E-mail enviado com sucesso"
        except Exception as e:
            # Em produção, use logging em vez de print
            app_logger.error(
                "E-mail de notificação não enviado",
                extra={"erro_detalhe": str(e), "destinatario": destinatario},
            )
            return False, str(e)

    @staticmethod
    def enviar_email_boas_vindas(
        destinatario: str, nome_usuario: str
    ) -> tuple[bool, str]:
        """
        Envia um e-mail em HTML (ideal para boas-vindas).
        """
        assunto = "Bem-vindo ao nosso Sistema!"
        # Em projetos reais, você renderizaria isso com render_template()
        corpo_html = f"""
        <html>
            <body>
                <h2>Olá, {nome_usuario}!</h2>
                <p>Estamos muito felizes em ter você conosco.</p>
                <p>Acesse seu painel para começar.</p>
            </body>
        </html>
        """

        try:
            # Note que o corpo principal pode ser vazio se formos usar attach_alternative
            msg = EmailMessage(
                subject=assunto,
                body=f"Olá, {nome_usuario}! Bem-vindo ao sistema.",  # Fallback para clientes que não leem HTML
                to=[destinatario],
            )
            # Anexa a versão HTML
            msg.attach_alternative(corpo_html, "text/html")
            msg.send()
            return True, "E-mail de boas-vindas enviado!"
        except Exception as e:
            return False, str(e)
