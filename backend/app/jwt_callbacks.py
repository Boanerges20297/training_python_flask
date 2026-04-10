from flask import jsonify
from app.services.auth_service import (
    MOCK_BLOCKLIST,
)  # Importando a blocklist do nosso teste


def register_jwt_handlers(jwt):
    """
    Registra todas as funções de callback do JWT para tratamento de erros
    e verificação de blocklist.
    """

    @jwt.token_in_blocklist_loader
    def check_if_token_is_revoked(jwt_header, jwt_payload):
        """
        Verifica se o token já foi revogado (Ex: Usuário fez Logout).
        Acionado em toda requisição que exige token. Checa se o 'jti' está na blocklist.
        """
        jti = jwt_payload["jti"]
        return jti in MOCK_BLOCKLIST

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        """
        Disparado quando o token de acesso passa do tempo limite de validade.
        Informa ao front-end que é necessário renovar a sessão ou logar novamente.
        """
        return jsonify({"Erro": "Token expirado", "code": "token_expired"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        """
        Disparado quando o usuário tenta acessar uma rota protegida sem enviar
        nenhum token de acesso (nenhum cookie jwt ou header de autenticação).
        """
        return jsonify({"Erro": "Faça login para acessar esta rota."}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        """
        Disparado quando o token enviado está malformado, corrompido, adulterado
        ou com uma assinatura inválida, caracterizando potencial fraude.
        """
        return jsonify({"Erro": "Token inválido."}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """
        Disparado imediatamente após a função 'check_if_token_is_revoked' retornar True.
        Devolve a mensagem semântica bloqueando o acesso de um token já revogado (logout).
        """
        return jsonify({"Erro": "Token revogado (Logout efetuado)."}), 401
