#Criado por Vinicius - 02/04/2026
#Rotas criadas para testar o ratelimiter
from flask import Blueprint, request, jsonify
from app.utils.security.ratelimiter import limit_for_method
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