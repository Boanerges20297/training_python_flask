from flask_jwt_extended import get_jwt_identity, get_jwt
from app.extensions import app_logger

# felipe
def log_evento_auditoria(acao, recurso_id=None, extra_data=None):
    """
    Helper para registrar eventos de auditoria com a identidade do autor.
    Tenta capturar o ID e a Role do usuário autenticado no contexto do Flask.
    """
    try:
        # felipe - Extração automática da identidade do contexto JWT
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get("role", "desconhecido")
    except Exception:
        # Fallback para ações fora de contexto JWT (ex: scripts ou falha de contexto)
        current_user_id = "sistema"
        role = "n/a"

    # Prepara os dados do log
    data = {
        "autor_id": current_user_id,
        "autor_role": role,
        "acao": acao,
        "recurso_id": recurso_id
    }
    
    if extra_data:
        data.update(extra_data)

    # Formatação da mensagem para o log de texto
    mensagem_formatada = f"[AUDITORIA] Ação: {acao} | Autor: {current_user_id} ({role})"
    if recurso_id:
        mensagem_formatada += f" | ID do Recurso: {recurso_id}"

    # felipe - Registro estruturado no logger da aplicação
    app_logger.info(mensagem_formatada, extra=data)
