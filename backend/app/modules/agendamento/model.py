from app import db
from datetime import datetime
from app.modules.agendamento.association import AgendamentoServico


class Agendamento(db.Model):
    """Modelo de Agendamento - marca um horário para um ou mais serviços"""

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
    # servico_id removido — substituído pelo relacionamento M2M via agendamento_servico

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
    
    # Ian - 21/04/2026
    # Preço congelado do serviço no momento do agendamento
    # Isso garante que o histórico financeiro não seja corrompido por mudanças futuras de preço
    preco_cobrado = db.Column(db.Numeric(10, 2), nullable=True)

    # Vinicius - 21/04/2026
    # Relacionamento M2M: um agendamento pode ter vários serviços
    servicos = db.relationship(
        "Servico",
        secondary=AgendamentoServico.__table__,
        lazy="select",
        overlaps="agendamentos",  # Informa ao SQLAlchemy que Servico.agendamentos cobre o lado oposto
    )

    def __repr__(self):
        return f"<Agendamento {self.id} - {self.status}>"
