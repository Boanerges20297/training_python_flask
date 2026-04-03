#Criado por Vinicius - 02/04/2026

from flask import request 
from flask_limiter.util import get_remote_address

LIMITS = {
    "POST": {"admin": "30 per minute", "barbeiro": "15 per minute", "cliente": "5 per minute"},
    "PUT": {"admin": "30 per minute", "barbeiro": "15 per minute", "cliente": "5 per minute"},
    "GET": {"admin": "120 per minute", "barbeiro": "60 per minute", "cliente": "20 per minute"},
    "DELETE": {"admin": "120 per minute", "barbeiro": "60 per minute", "cliente": "20 per minute"}
}

#Vinicius - 02/04/2026  
def get_usuario_ou_ip():
    """
    Função que retorna o ID do usuário se ele estiver logado, 
    ou o IP do cliente se ele não estiver logado.
    """
    #Futuramente será utilizado o token JWT para identificar o usuário
    try:
        # Tenta pegar X-Role
        role = request.headers.get('X-Role', None)
        if role:
            return role
    except Exception:
        # Se der erro, usa o IP
        pass
    # Retorna o IP do cliente
    return get_remote_address()

#Vinicius - 02/04/2026 
def limit_for_method():
    """
    Função que retorna o limite de requisições por minuto baseado no método e roles baseado no dicionario LIMITS.
    """
    #Futuramente será utilizado o token JWT para identificar o usuário
    #Pea o X-Role do header, caso não tenha nenhum, utilize o valor padrão configurado na instancia do limiter
    role = request.headers.get('X-Role', None)
    method = request.method

    if role:
        return LIMITS[method][role]
    else:
        return "3 per minute"


