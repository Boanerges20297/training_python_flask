from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def role_required(allowed_roles):
    """
    Decorador para proteger rotas baseado em roles (cargos).
    Aceita uma lista de strings. Ex: @role_required(["admin", "barbeiro"])
    """

    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            # 1. Verifica se o token existe e é válido na requisição (Autenticação)
            # Se não for válido, o Flask-JWT já vai barrar e mandar erro 401 aqui mesmo.
            verify_jwt_in_request()

            # 2. Abre o payload do token (onde guardamos o cargo)
            claims = get_jwt()
            user_role = claims.get("role")

            # 3. Verifica se a role do usuário está na lista de permitidos (Autorização)
            if user_role not in allowed_roles:
                return (
                    jsonify(
                        {
                            "msg": "Acesso negado. Você não tem permissão para realizar esta ação."
                        }
                    ),
                    403,
                )

            # 4. Se passou em tudo, executa a rota normal
            return fn(*args, **kwargs)

        return decorator

    return wrapper
