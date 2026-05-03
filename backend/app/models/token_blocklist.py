from datetime import datetime, timezone
from app.extensions import db

class TokenBlocklist(db.Model):
    """
    Modelo para persistir tokens JWT revogados (Blocklist).
    Utilizado para Logout e detecção de reuso de Refresh Tokens (Rotation).
    """
    __tablename__ = 'token_blocklist'

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True, unique=True)
    type = db.Column(db.String(16), nullable=False) # 'access' ou 'refresh'
    user_id = db.Column(db.String(64), nullable=False)
    created_at = db.Column(
        db.DateTime, 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self):
        return f"<TokenBlocklist {self.jti}>"
