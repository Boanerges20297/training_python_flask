from flask_mailman import EmailMessage
from flask import current_app
from app.extensions import app_logger
from config import Config
from app.utils.email_layouts import obter_layout_boas_vindas


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
            msg.content_subtype = "html"
            msg.send()
            return True, "E-mail enviado com sucesso"
        except Exception as e:
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
        corpo_html = obter_layout_boas_vindas(nome_usuario.title())

        try:
            # Note que o corpo principal pode ser vazio se formos usar attach_alternative
            msg = EmailMessage(subject=assunto, body=corpo_html, to=[destinatario])
            # Anexa a versão HTML
            msg.content_subtype = "html"
            msg.send()
            return True, "E-mail de boas-vindas enviado!"
        except Exception as e:
            app_logger.error(
                "E-mail de boas-vindas não enviado",
                extra={"erro_detalhe": str(e), "destinatario": destinatario},
            )
            return False, str(e)
