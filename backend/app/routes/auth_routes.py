from flask import Blueprint, request, jsonify
from app.models.admin import Admin
from app import db
from datetime import datetime

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    # Vinicius - 08/04/2026
    # Adicionado try except para evitar que o sistema caia caso o payload seja inválido
    try:
        # Vinicius - 08/04/2026
        # Adicionado validação de payload para garantir que os dados enviados estejam corretos
        data = AuthSchema(**request.get_json())

        admin = Admin.query.filter_by(email=data.email).first()

        # Referencia qual função em Admin? função não encontrada verificar_senha
        # Vinicius - 04/04/2026
        # Referência à função herdada do mixin (HashSenhaMixin) no modelo Admin
        if admin and admin.verificar_senha(data.senha):
            if not admin.ativo:
                return jsonify({"erro": "Conta desativada"}), 403

            # Atualizar último login
            admin.ultimo_login = datetime.utcnow()
            db.session.commit()

            # No futuro poderiamos usar JWT aqui, mas por agora retornamos um token simples
            return (
                jsonify(
                    {
                        "msg": "Login bem-sucedido",
                        "usuario": {
                            "id": admin.id,
                            "nome": admin.nome,
                            "email": admin.email,
                            "role": admin.role,
                        },
                        "token": "mock-session-token-abc-123",
                    }
                ),
                200,
            )

        return jsonify({"erro": "Email ou senha inválidos"}), 401

    # Vinicius - 08/04/2026
    # Adicionado tratamento de erro para ValidationError
    except ValidationError as e:
        return jsonify({"erro": "Erro ao incluir cliente: " + str(e)}), 400
    # Vinicius - 08/04/2026
    # Adicionado tratamento de erro para Exception
    except Exception as e:
        return jsonify({"erro": "Erro ao incluir cliente: " + str(e)}), 500


@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"msg": "Logout realizado com sucesso"}), 200
