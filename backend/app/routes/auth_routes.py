from flask import Blueprint, request, jsonify
from app.models.admin import Admin
from app import db
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    dados = request.get_json()
    email = dados.get('email')
    senha = dados.get('senha')

    if not email or not senha:
        return jsonify({'erro': 'Email e senha são obrigatórios'}), 400

    admin = Admin.query.filter_by(email=email).first()

    # Referencia qual função em Admin? função não encontrada verificar_senha
    if admin and admin.verificar_senha(senha):
        if not admin.ativo:
            return jsonify({'erro': 'Conta desativada'}), 403
            
        # Atualizar último login
        admin.ultimo_login = datetime.utcnow()
        db.session.commit()

        # No futuro poderiamos usar JWT aqui, mas por agora retornamos um token simples
        return jsonify({
            'msg': 'Login bem-sucedido',
            'usuario': {
                'id': admin.id,
                'nome': admin.nome,
                'email': admin.email,
                'role': admin.role
            },
            'token': 'mock-session-token-abc-123'
        }), 200

    return jsonify({'erro': 'Email ou senha inválidos'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'msg': 'Logout realizado com sucesso'}), 200
