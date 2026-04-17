from datetime import datetime, timedelta, timezone
import secrets
from app import db


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(db.Integer, primary_key=True)

    # Chave estrangeira ligando ao usuário
    user_id = db.Column(db.Integer, db.ForeignKey("clientes.id"), nullable=False)

    # O token precisa ser único e indexado para a query de busca ser imediata
    token = db.Column(db.String(100), unique=True, index=True, nullable=False)

    # Trabalhar com UTC é mandatório em backends para evitar bugs de fuso horário
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)

    is_used = db.Column(db.Boolean, default=False)

    def __init__(self, user_id, expires_in_minutes=30):
        self.user_id = user_id
        # Gera uma string aleatória segura para URLs com alta entropia
        self.token = secrets.token_urlsafe(48)
        self.expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=expires_in_minutes
        )

    @property
    def is_valid(self):
        """
        Propriedade utilitária que encapsula a regra de negócio:
        Um token só é válido se não foi usado E se a data atual for menor que a expiração.
        """
        return not self.is_used and datetime.now(timezone.utc) < self.expires_at

    def mark_as_used(self):
        """Invalida o token após o uso bem-sucedido."""
        self.is_used = True
