"""
DESAFIO 1: Criar API GET para listar serviços

O que você precisa fazer neste arquivo:
1. Importar Blueprint e jsonify do Flask
2. Importar o modelo Servico
3. Criar um blueprint com url_prefix='/api/servicos'
4. Criar rota GET que lista todos os serviços
5. Retornar em JSON

Não comece a codar ainda! Primeiro leia os comentários abaixo.
"""



# ========== PASSO 1: IMPORTAÇÕES ==========
# Você precisa importar:
# - Blueprint: para organizar rotas
# - jsonify: para retornar JSON automaticamente
# - db: para mexer com banco (se precisar)
# - Servico: o modelo que você criou em models/servico.py

# Escreva aqui as 4 importações necessárias:
# TODO: from flask import ...
# TODO: from app import ...
# TODO: from app.models import ...

# ========== PASSO 2: CRIAR BLUEPRINT ==========
# Um blueprint precisa de um nome e um prefixo de URL
# Nome: 'servicos' (pode ser qualquer coisa)
# URL Prefix: '/api/servicos' (todas as rotas deste blueprint começam com isso)

# TODO: servico_bp = Blueprint(...)

# ========== PASSO 3: CRIAR ROTA GET ==========
# Rota: /api/servicos  (GET)
# Método: GET
# O que faz: Retorna lista de todos os serviços

# DICA: Use este decorador
# @servico_bp.route('', methods=['GET'])
# (vazio '' porque já tem '/api/servicos' no url_prefix)

@servico_bp.route('', methods=['GET'])
def listar_servicos():
    """
    Endpoint para listar todos os serviços
    
    Passos para implementar:
    1. Buscar todos os serviços do banco com Servico.query.all()
    2. Converter cada serviço em dicionário (para JSON)
    3. Retornar com jsonify()
    
    Resposta esperada:
    {
        "servicos": [
            {"id": 1, "nome": "Corte", "preco": 50, ...},
            {"id": 2, "nome": "Barba", "preco": 30, ...}
        ]
    }
    """
    
    try:
        # TODO: Buscar todos os serviços
        # servicos = ???
        
        # TODO: Converter para lista de dicionários
        # servicos_dict = [
        #     {
        #         'id': s.id,
        #         'nome': s.nome,
        #         'preco': s.preco,
        #         'duracao_minutos': s.duracao_minutos
        #     }
        #     for s in servicos
        # ]
        
        # TODO: Retornar em JSON
        # return jsonify({...})
        
        pass
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


# ========== PRÓXIMOS PASSOS ==========
# 1. Implemente a função acima
# 2. Salve este arquivo
# 3. Vá para run.py e registre este blueprint
# 4. Teste com GET http://localhost:5000/api/servicos
