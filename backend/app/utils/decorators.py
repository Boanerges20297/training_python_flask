from functools import wraps
from flask import request, jsonify # type: ignore


def role_required(cargos_permitidos):
      # Essa função "mais externa" guarda a lista ['admin', 'manager']
    
    def decorator(funcao_principal):    
        # @wraps serve para manter o nome da função original
        @wraps(funcao_principal)
        def funcao_empacotada(*args, **kwargs):
            # 1. Pegamos o valor do cabeçalho chamado 'X-Role'
            role_usuario = request.headers.get('X-Role')

            # 2. Verificamos se o valor é igual a 'admin'
            if role_usuario not in cargos_permitidos:
                # 3. Se não for, retornamos uma mensagem de erro
                return jsonify({'message': 'Acesso negado, permissão insuficiente   '}), 403

            # 4. Se for, executamos a função original
            return funcao_principal(*args, **kwargs)
        
        return funcao_empacotada

    return decorator


# Atalho para o cargo 'admin'
admin_required = role_required(['admin'])

