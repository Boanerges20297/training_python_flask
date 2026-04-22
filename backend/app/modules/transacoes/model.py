# Ian - 21/04/2026
# Modelo de Transação Financeira para rastrear pagamentos de agendamentos

from app import db
from datetime import datetime


class TransacaoFinanceira(db.Model):
    """
    Modelo para registro de transações financeiras.
    Cada transação representa um pagamento realizado por um cliente para um agendamento concluído.
    """

    __tablename__ = "transacoes_financeiras"

    # Formas de pagamento possíveis
    FORMA_DINHEIRO = "dinheiro"
    FORMA_PIX = "pix"
    FORMA_CREDITO = "credito"
    FORMA_DEBITO = "debito"

    # Colunas
    id = db.Column(db.Integer, primary_key=True)

    # Chaves estrangeiras
    agendamento_id = db.Column(
        db.Integer, db.ForeignKey("agendamentos.id", ondelete="CASCADE"), nullable=False
    )
    barbeiro_id = db.Column(
        db.Integer, db.ForeignKey("barbeiros.id"), nullable=False
    )
    cliente_id = db.Column(
        db.Integer, db.ForeignKey("clientes.id"), nullable=False
    )

    # Valores financeiros
    valor_bruto = db.Column(db.Numeric(10, 2), nullable=False)  # Valor total pago
    forma_pagamento = db.Column(
        db.String(20), default=FORMA_DINHEIRO
    )  # dinheiro, pix, credito, debito
    
    # Comissão do barbeiro (percentual)
    comissao_pct = db.Column(db.Numeric(5, 2), default=50.00)  # Percentual padrão 50%
    
    # Valor da comissão calculado (valor_bruto * comissao_pct / 100)
    valor_comissao = db.Column(db.Numeric(10, 2), nullable=True)

    # Datas
    data_pagamento = db.Column(db.DateTime, default=datetime.utcnow)  # Quando foi pago
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)  # Quando foi registrado

    # Status da transação
    status = db.Column(db.String(20), default="pendente")  # pendente, confirmada, revertida

    # Observações opcionais
    observacoes = db.Column(db.Text(500), nullable=True)

    # Relacionamentos
    agendamento = db.relationship("Agendamento", backref="transacoes")
    barbeiro = db.relationship("Barbeiro", backref="transacoes")
    cliente = db.relationship("Cliente", backref="transacoes")

    def __repr__(self):
        return f"<TransacaoFinanceira {self.id} - {self.forma_pagamento} - R${self.valor_bruto}>"
