from app import db

class Servico(db.Model):
    """Modelo de Serviço - serviços oferecidos pela barbearia"""
    
    __tablename__ = 'servicos'
    
    # Colunas
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)  # Descrição detalhada
    preco = db.Column(db.Float, nullable=False)  # Em reais
    duracao_minutos = db.Column(db.Integer, nullable=False)  # Quanto tempo leva
    
    # Chave estrangeira - qual barbeiro oferece este serviço
    barbeiro_id = db.Column(db.Integer, db.ForeignKey('barbeiros.id'), nullable=False)
    
    # Relacionamentos
    agendamentos = db.relationship('Agendamento', backref='servico', lazy=True)
    
    def __repr__(self):
        return f'<Servico {self.nome}>'
