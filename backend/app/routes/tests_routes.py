#Criado por Vinicius - 02/04/2026
#Rotas criadas para testar o ratelimiter
from flask import Blueprint, request, jsonify
from app.utils.ratelimiter import limit_for_method
from app import limiter

tests_bp = Blueprint('tests', __name__, url_prefix='/api/tests')

@tests_bp.route('/', methods=['GET'])
@limiter.limit(limit_for_method)
def test():
    return jsonify({'msg': 'Testado com sucesso'}), 200

@tests_bp.route('/', methods=['POST'])
@limiter.limit(limit_for_method)
def test_post():
    return jsonify({'msg': 'Testado com sucesso'}), 200

@tests_bp.route('/', methods=['PUT'])
@limiter.limit(limit_for_method)
def test_put():
    return jsonify({'msg': 'Testado com sucesso'}), 200

@tests_bp.route('/', methods=['DELETE'])
@limiter.limit(limit_for_method)
def test_delete():
    return jsonify({'msg': 'Testado com sucesso'}), 200

@tests_bp.route('/seed', methods=['GET'])
def seed():
    from app.utils.seeder import seed_database
    try:
        result = seed_database()
        return jsonify({'msg': 'Banco de dados populado com sucesso!', 'detalhes': result}), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500