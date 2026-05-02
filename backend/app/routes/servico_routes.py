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
from flask import Blueprint, jsonify, request
from app.models.servico import Servico
from app.models.cliente import Cliente
from app import db
from app.schemas.servico_schema import ServicoSchema, ServicoUpdateSchema
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.utils.decorators import admin_required
from app.utils.error_formatter import formatar_erros_pydantic
from app.extensions import app_logger
from datetime import datetime

# ========== PASSO 2: CRIAR BLUEPRINT ==========
# Um blueprint precisa de um nome e um prefixo de URL
# Nome: 'servicos' (pode ser qualquer coisa)
# URL Prefix: '/api/servicos' (todas as rotas deste blueprint começam com isso)

# TODO: servico_bp = Blueprint(...)
servico_bp = Blueprint("servicos", __name__, url_prefix="/api/servicos")
from app.utils.pagination import formatar_retorno_paginacao

# ========== PASSO 3: CRIAR ROTA GET ==========
# Rota: /api/servicos  (GET)
# Método: GET
# O que faz: Retorna lista de todos os serviços

# DICA: Use este decorador
# @servico_bp.route('', methods=['GET'])
# (vazio '' porque já tem '/api/servicos' no url_prefix)


@servico_bp.route("", methods=["GET"])
def listar_servicos():
    """
    Endpoint para listar todos os serviços

    Passos para implementar:
    1. Buscar todos os serviços do banco com Servico.query.all()
    2. Converter cada serviço em dicionário (para JSON)
    3. Retornar com jsonify()
    """
    # Vinicius - Paginação de serviços 31/03/2026
    # Paginação de serviços para evitar sobrecarga do sistema com buscas execivas no banco de dados
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=10, type=int)

    try:
        # TODO: Buscar todos os serviços
        # Vinicius - Paginação de serviços 31/03/2026
        servicos = Servico.query.paginate(page=page, per_page=per_page, error_out=False)

        # TODO: Converter para lista de dicionários
        # Utilizando 'dict comphreension'
        servicos_dict = [
            {
                "id": s.id,
                "nome": s.nome,
                "preco": s.preco,
                "duracao_minutos": s.duracao_minutos,
                "imagem_url": s.imagem_url,
                "data_criacao": s.data_criacao.isoformat() if s.data_criacao else None,
                "data_atualizacao": s.data_atualizacao.isoformat() if s.data_atualizacao else None,
                # Vinicius - 19/04/2026
                # Removido o campo barbeiro_id, agora essa informação é enviada por outra rota
            }
            # Vinicius - 04/04/2026
            # Adicionado o .items para que o list comprehension receba os itens da paginação
            for s in servicos.items
        ]

        # TODO: Retornar em JSON
        return jsonify(
            {
                "sucesso": True,
                "dados": formatar_retorno_paginacao(
                    servicos_dict, servicos.total, servicos.page, servicos.per_page
                ),
            }
        )

        pass

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# josue alteraçao minima
# proteger criar serviços
# Vinicius - 15/04/2026
# Removido o /criar-servico do endpoint, para ficar mais semantico com a ação de criar e padrão REST
@servico_bp.route("", methods=["POST"])
@jwt_required()
@admin_required
def criar_servico():
    # Vinicius - 01/04/2026
    # Adicinado barbeiro_id como campo obrigatório, para acompanhar o model Servico
    try:
        # Vinicius - 05/04/2026
        # Adicionado validação de payload para garantir que os dados enviados estejam corretos
        # Vinicius - 16/04/2026
        # 0. Captura o usuário atual e sua role
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        try:
            data = ServicoSchema(**request.get_json())
        except ValidationError as e:
            erros = formatar_erros_pydantic(e)
            return jsonify({"erros_validacao": erros}), 400
        # Vinicius - 31/03/2026
        # Verificar se o serviço já existe
        if Servico.query.filter_by(nome=data.nome).first():

            return jsonify({"erro": "Serviço já cadastrado"}), 409

        # Criar serviço e salvar no banco
        servico = Servico(**data.model_dump())
        db.session.add(servico)
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a criação de serviços
        app_logger.info(
            "Serviço criado com sucesso",
            extra={
                "servico_id": servico.id,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )
        return (
            jsonify(
                {
                    "sucesso": True,
                    "mensagem": "Serviço criado com sucesso",
                    "dados": {
                        "servico": {
                            "id": servico.id,
                            "nome": servico.nome,
                            "preco": servico.preco,
                            "duracao_minutos": servico.duracao_minutos,
                        }
                    },
                }
            ),
            201,
        )
    except ValidationError as e:
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar erros na criação de serviços
        app_logger.error(
            "Erro estrutural 500 ao criar cliente",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao criar serviço: " + str(e)}), 400
    except Exception as e:
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar erros na criação de serviços
        app_logger.error(
            "Erro estrutural 500 ao criar cliente",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao criar serviço: " + str(e)}), 500


# Vinicius - 08/04/2026
# Mudança de metodo para PATCH, para ser mais semantico com a ação de editar
# Refatoração da rota editar_servico, para utilizar o schema ServicoUpdateSchema e atualizar dinamicamente os campos do serviço
# josue alteraçao minima
# adicionar proteçao para editar servicos
# Vinicius - 15/04/2026
# Removido o /editar-servico do endpoint, para ficar mais semantico com a ação de editar e padrão REST
@servico_bp.route("/<int:id>", methods=["PATCH"])
@jwt_required()
@admin_required
def editar_servico(id):
    try:
        # Vinicius - 16/04/2026
        # 0. Captura o usuário atual e sua role
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        # 1. Captura o JSON da requisição
        body = request.get_json()

        # 2. Validação inicial: O Pydantic verifica tipos e campos extras
        try:
            # Pydantic valida o dicionário
            schema = ServicoUpdateSchema(**body)
        except Exception as e:
            return {"error": "Dados inválidos", "detalhes": str(e)}, 400

        # 3. Transforma em dicionário pegando APENAS o que foi enviado
        update_data = schema.model_dump(exclude_unset=True)

        # 4. Condição: Se o dicionário estiver vazio, não há o que atualizar
        if not update_data:
            return {"message": "Nenhuma alteração enviada."}, 400

        # 5. Busca o usuário no banco
        servico = Servico.query.get(id)
        if not servico:
            return {"error": "Serviço não encontrado"}, 404

        # 6. Algoritmo de Atualização Dinâmica
        # Em vez de fazer: user.nome = update_data['nome'] manual para cada campo...
        for key, value in update_data.items():
            setattr(servico, key, value)  # Atualiza o atributo dinamicamente

        # 7. Persiste no banco
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a edição de serviços
        app_logger.info(
            "Serviço atualizado com sucesso",
            extra={
                "servico_id": servico.id,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )

        return {
            "sucesso": True,
            "mensagem": "Serviço atualizado com sucesso!",
            "dados": {"campos_alterados": list(update_data.keys())},
        }, 200

    except Exception as e:
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar erros na edição de serviços
        app_logger.error(
            "Erro estrutural 500 ao editar cliente",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao editar serviço: " + str(e)}), 500


# josue alteraçao minima
# proteger deletar serviços
# Vinicius - 15/04/2026
# Removido o /deletar-servico do endpoint, para ficar mais semantico com a ação de deletar e padrão REST
@servico_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def deletar_servico(id):
    try:
        # Vinicius - 16/04/2026
        # 0. Captura o usuário atual e sua role
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        servico = Servico.query.get(id)
        if not servico:
            return jsonify({"erro": "Serviço não encontrado"}), 404

        db.session.delete(servico)
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a deleção de serviços
        app_logger.info(
            "Serviço deletado com sucesso",
            extra={
                "servico_id": servico.id,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )
        return jsonify({"msg": "Serviço deletado com sucesso"}), 200
    # josue inicio
    # cria o Integrity exessao dinamica evitando erro 500 Faz db.session.rollback() para limpar a transação quebrada.
    except IntegrityError:
        # felipe - Tratamento inteligente para evitar erro 500 em deleção com FK
        db.session.rollback()
        return (
            jsonify(
                {
                    "erro": "Não é possível deletar este serviço porque existem agendamentos vinculados."
                }
            ),
            409,
        )
    except Exception as e:
        db.session.rollback()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar erros na deleção de serviços
        app_logger.error(
            "Erro estrutural 500 ao deletar cliente",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao deletar serviço: " + str(e)}), 500

    # josue fim


# Vinicius - 15/04/2026
# Removido o /buscar-servico do endpoint, para ficar mais semantico com a ação de buscar e padrão REST
@servico_bp.route("/<int:id>", methods=["GET"])
def buscar_servico(id):
    try:
        servico = Servico.query.get(id)
        if not servico:
            return jsonify({"erro": "Serviço não encontrado"}), 404

        servico_dict = {
            "id": servico.id,
            "nome": servico.nome,
            "preco": servico.preco,
            "duracao_minutos": servico.duracao_minutos,
            "imagem_url": servico.imagem_url,
            "data_criacao": servico.data_criacao.isoformat() if servico.data_criacao else None,
            "data_atualizacao": servico.data_atualizacao.isoformat() if servico.data_atualizacao else None,
        }
        return jsonify({"sucesso": True, "dados": {"servico": servico_dict}}), 200
    except Exception as e:
        return jsonify({"erro": "Erro ao buscar serviço: " + str(e)}), 500
