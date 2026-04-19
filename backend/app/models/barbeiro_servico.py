# Vinicius - 19/04/2026
# Criação do modelo associativo entre Barbeiros e Serviços

from app import db


class BarbeiroServico(db.Model):
    """Modelo associativo entre Barbeiros e Serviços"""

    __tablename__ = "barbeiro_servico"

    id = db.Column(db.Integer, primary_key=True)
    barbeiro_id = db.Column(
        db.Integer, db.ForeignKey("barbeiros.id", ondelete="CASCADE"), nullable=False
    )
    servico_id = db.Column(
        db.Integer, db.ForeignKey("servicos.id", ondelete="CASCADE"), nullable=False
    )

    def __repr__(self):
        return (
            f"<BarbeiroServico barbeiro={self.barbeiro_id} servico={self.servico_id}>"
        )
