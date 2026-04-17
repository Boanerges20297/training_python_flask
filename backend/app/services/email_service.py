from flask_mail import Message
from app.extensions import mail, app_logger
from flask import current_app
import threading

# felipe
class EmailService:
    @staticmethod
    def _send_async_email(app, msg):
        with app.app_context():
            try:
                mail.send(msg)
                app_logger.info("E-mail enviado com sucesso", extra={"assunto": msg.subject, "destinatario": msg.recipients})
            except Exception as e:
                app_logger.error("Falha ao enviar e-mail", extra={"erro": str(e), "destinatario": msg.recipients})

    @staticmethod
    def notificar_cancelamento_admin(agendamento):
        """
        Envia e-mails de aviso para o cliente e para o barbeiro
        quando um agendamento é excluído por um administrador.
        """
        app = current_app._get_current_object()
        
        data_formatada = agendamento.data_agendamento.strftime('%d/%m/%Y às %H:%M')
        
        # 1. Notificar o Cliente
        msg_cliente = Message(
            subject="Aviso: Seu agendamento foi cancelado",
            recipients=[agendamento.cliente.email],
            body=(
                f"Olá {agendamento.cliente.nome},\n\n"
                f"Informamos que o seu agendamento para o dia {data_formatada} "
                f"foi cancelado por um administrador do sistema Barber & Byte.\n\n"
                f"Para mais informações ou para reagendar, entre em contato conosco.\n\n"
                f"Atenciosamente,\nEquipe Barber & Byte"
            )
        )
        
        # 2. Notificar o Barbeiro
        msg_barbeiro = Message(
            subject="Aviso: Um agendamento em sua agenda foi cancelado",
            recipients=[agendamento.barbeiro.email],
            body=(
                f"Olá {agendamento.barbeiro.nome},\n\n"
                f"Informamos que o agendamento do cliente {agendamento.cliente.nome} "
                f"marcado para o dia {data_formatada} foi removido da sua agenda "
                f"por um administrador.\n\n"
                f"Atenciosamente,\nSistema Barber & Byte"
            )
        )

        # Dispara os envios em background
        threading.Thread(target=EmailService._send_async_email, args=(app, msg_cliente)).start()
        threading.Thread(target=EmailService._send_async_email, args=(app, msg_barbeiro)).start()
