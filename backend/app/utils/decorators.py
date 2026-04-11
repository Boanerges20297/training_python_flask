from functools import wraps
from flask import jsonify # type: ignore
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity # type: ignore
import logging

# Configuração do Logger
logger = logging.getLogger(__name__)

def role_required(cargos_permitidos):
    """
    Decorator para proteção de rotas baseada em 'role'.

    Metodologia:
    1. Entrada: Requisição HTTP contendo JWT no header Authorization.
    2. Processamento: Validação do token (`verify_jwt_in_request`), extração das permissões (`get_jwt().get('role')`) e do UUID do usuário (`get_jwt_identity`).
    3. Verificação: Se a role no token não pertencer à lista definida, barraremos com 403.
    4. Saída: Executa a rota na aprovação ou rejeita.
    
    Args:
        cargos_permitidos (list): Uma lista de strings com os cargos permitidos.
    """
    def decorator(funcao_principal):    
        @wraps(funcao_principal)
        def funcao_empacotada(*args, **kwargs):
            # 1. Garante a validação de presença do JWT no request (assim dispensa o uso de @jwt_required em conjunto nos casos mais abertos, mas é boa prática mantê-lo)
            verify_jwt_in_request()

            # 2. Extrai dados críticos sem vazar detalhes sensíveis nas funções
            current_user = get_jwt_identity()
            token_data = get_jwt()
            role_usuario = token_data.get('role')

            logger.debug(f"[AUTHORIZATION] Validando acesso. ID={current_user} tentou autorização com Role='{role_usuario}'.")

            # 3. Verificamos as roles
            if role_usuario not in cargos_permitidos:
                logger.warning(f"[AUTHORIZATION FALHA] Acesso negado para ID={current_user}. Role '{role_usuario}' insuficiente para a lista exigida: {cargos_permitidos}")
                return jsonify({'message': 'Acesso negado, permissão insuficiente'}), 403

            logger.info(f"[AUTHORIZATION SUCESSO] Acesso concedido. Usuário ID={current_user} autenticado via Role '{role_usuario}'.")
            
            # 4. Se passar pela autorização, executamos a função original
            return funcao_principal(*args, **kwargs)
        
        return funcao_empacotada

    return decorator

# Atalhos padronizados para cargos específicos
admin_required = role_required(['admin'])
barbeiro_required = role_required(['barbeiro'])
cliente_required = role_required(['cliente'])
barbeiro_required = role_required(['barbeiro'])
