# Vinicius - 21/04/2026
# Tabela de associação many-to-many entre Agendamento e Serviço.
# Um agendamento pode ter N serviços vinculados.
# O CASCADE garante que ao deletar um agendamento, as linhas
# da tabela de associação são removidas automaticamente.

from app import db


class AgendamentoServico(db.Model):
    """Modelo associativo entre Agendamentos e Serviços"""

    __tablename__ = "agendamento_servico"

    id = db.Column(db.Integer, primary_key=True)
    agendamento_id = db.Column(
        db.Integer,
        db.ForeignKey("agendamentos.id", ondelete="CASCADE"),
        nullable=False,
    )
    servico_id = db.Column(
        db.Integer,
        db.ForeignKey("servicos.id", ondelete="CASCADE"),
        nullable=False,
    )

    def __repr__(self):
        return f"<AgendamentoServico agendamento={self.agendamento_id} servico={self.servico_id}>"
