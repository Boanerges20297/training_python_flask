from app import db


class Servico(db.Model):
    """Modelo de Serviço - serviços oferecidos pela barbearia"""

    __tablename__ = "servicos"

    # Colunas
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)  # Descrição detalhada
    preco = db.Column(db.Float, nullable=False)  # Em reais
    duracao_minutos = db.Column(db.Integer, nullable=False)  # Quanto tempo leva
    # Vinicius - 19/04/2026
    # A chave estrangeira 'barbeiro_id' foi removida para tornar o serviço global.
    # Relacionamentos
    agendamentos = db.relationship("Agendamento", backref="servico", lazy=True)

    def __repr__(self):
        return f"<Servico {self.nome}>"
