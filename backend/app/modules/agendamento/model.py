from app import db
from datetime import datetime


class Agendamento(db.Model):
    """Modelo de Agendamento - marca um horário para um serviço"""

    __tablename__ = "agendamentos"

    # Estados possíveis de um agendamento
    STATUS_PENDENTE = "pendente"
    STATUS_CONFIRMADO = "confirmado"
    STATUS_CANCELADO = "cancelado"
    STATUS_CONCLUIDO = "concluido"

    # Colunas
    id = db.Column(db.Integer, primary_key=True)

    # Chaves estrangeiras
    cliente_id = db.Column(db.Integer, db.ForeignKey("clientes.id"), nullable=False)
    barbeiro_id = db.Column(db.Integer, db.ForeignKey("barbeiros.id"), nullable=False)
    servico_id = db.Column(db.Integer, db.ForeignKey("servicos.id"), nullable=False)

    # Data e hora do agendamento
    data_agendamento = db.Column(db.DateTime, nullable=False)  # Quando será feito
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)  # Quando foi marcado

    # Status do agendamento
    status = db.Column(
        db.String(20), default=STATUS_PENDENTE
    )  # pendente, confirmado, cancelado, concluido

    # Observações (por exemplo: "Alergia a certos produtos")
    observacoes = db.Column(db.Text(500))
    
    # Ian - 19/04/2026
    # Indica se o agendamento já foi pago
    pago = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<Agendamento {self.id} - {self.status}>"
