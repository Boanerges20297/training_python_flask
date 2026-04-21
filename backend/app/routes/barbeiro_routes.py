# Vinicius - 09/04/2026
# Criação do arquivo de rotas do barbeiro para CRUD
from flask import Blueprint, jsonify, request
import json
from app.models.barbeiro import Barbeiro
from app.models.agendamento import Agendamento
from app.models.servico import Servico
from app import db
from app.utils.decorators import admin_required, barbeiro_required
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.schemas.barbeiro_schema import BarbeiroSchema, BarbeiroUpdateSchema
from app.utils.error_formatter import formatar_erros_pydantic
from app.extensions import app_logger
from datetime import datetime
from app.utils.pagination import formatar_retorno_paginacao

barbeiros_bp = Blueprint("barbeiros", __name__, url_prefix="/api/barbeiros")


# Vinicius - 09/04/2026
# Foi reutilizado o codigo de rotas de cliente e adaptado para barbeiro
@barbeiros_bp.route("", methods=["GET"])
# Vinicius - 16/04/2026
# Adicionado jwt_required para proteger o endpoint
@jwt_required()
def listar_barbeiros():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        # Capturar parâmetros de busca
        nome = request.args.get("nome", type=str)
        email = request.args.get("email", type=str)
        telefone = request.args.get("telefone", type=str)
        servicoId = request.args.get("servicoId", type=int)
        ativo = request.args.get("ativo", type=bool)

        query = Barbeiro.query
        # Vinicius - 04/04/2026
        # Caso seja passado telefone e email, retorna um objeto, pois são campos unicos
        if telefone or email:
            if telefone:
                query = query.filter_by(telefone=telefone)
            if email:
                query = query.filter_by(email=email)

            barbeiro = query.first()
            if not barbeiro:
                return jsonify({"erro": "Barbeiro não encontrado"}), 404

            return (
                jsonify(
                    {
                        "barbeiro": {
                            "id": barbeiro.id,
                            "nome": barbeiro.nome,
                            "telefone": barbeiro.telefone,
                            "email": barbeiro.email,
                        }
                    }
                ),
                200,
            )

        # Caso seja passado nome, retorna uma lista com outros dados de paginação, pois nome não é unico
        if nome:
            query = query.filter(Barbeiro.nome.ilike(f"%{nome}%"))

        # Vinicius - 09/04/2026
        # Caso seja passado servicoId, retorna uma lista, pois pode ter varios barbeiros com o mesmo servico
        if servicoId:
            query = query.filter(Barbeiro.servicos.any(id=servicoId))

        # Vinicius - 04/04/2026
        # Troca do nome da variavel para 'clientes' para melhor identificação
        barbeiros = query.paginate(page=page, per_page=per_page, error_out=False)

        # josue minima alteraço
        # josue 21/04/2026 01:30 adcionado motivo_ausencia
        barbeiros_dict = [
            {
                "id": b.id,
                "nome": b.nome,
                "telefone": b.telefone,
                "email": b.email,
                "especialidade": b.especialidade,
                "ativo": b.ativo,
                "motivo_ausencia": b.motivo_ausencia,
            }
            # Vinicius - 04/04/2026
            # Adicionado o .items para que o list comprehension receba os itens da paginação
            for b in barbeiros.items
        ]
        # Retornar em JSON com chave 'clientes'
        return jsonify(
            {
                "sucesso": True,
                "dados": formatar_retorno_paginacao(
                    barbeiros_dict, barbeiros.total, barbeiros.page, barbeiros.per_page
                ),
            }
        )
    except Exception as e:
        return jsonify({"erro": "Não foi possível listar os barbeiros: " + str(e)}), 500


# Vinicius - 15/04/2026
# Removido o /criar-barbeiro do path para seguir o padrão REST
@barbeiros_bp.route("", methods=["POST"])
@jwt_required()
@admin_required
def criar_barbeiro():
    try:
        # Vinicius - 16/04/2026
        # 0. Captura o usuário atual e sua role
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        # Vinicius - 08/04/2026
        # Adicionado validação de payload para garantir que os dados enviados estejam corretos
        try:
            data = BarbeiroSchema(**request.get_json())
        except Exception as e:
            erros = formatar_erros_pydantic(e)
            return jsonify({"erros_validacao": erros}), 400
        # Vinicius - 08/04/2026
        # Removido validações feitas pelo Josue, que agora serão validadas pelo schema

        # Criar barbeiro e salvar no banco
        barbeiro = Barbeiro(**data.model_dump())
        # Vinicius - 04/04/2026
        # Utilizando o metodo do mixin para hashear a senha em texto simples antes de efetuar o commit no banco
        barbeiro.senha = data.senha
        db.session.add(barbeiro)
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a criação de barbeiros
        app_logger.info(
            "Barbeiro criado com sucesso",
            extra={
                "barbeiro_id": barbeiro.id,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )
        return (
            jsonify(
                {
                    "sucesso": True,
                    "mensagem": "Barbeiro criado com sucesso",
                    "dados": {
                        "barbeiro": {
                            "id": barbeiro.id,
                            "nome": barbeiro.nome,
                            "telefone": barbeiro.telefone,
                            "email": barbeiro.email,
                            "especialidade": barbeiro.especialidade,
                            "ativo": barbeiro.ativo,
                            "motivo_ausencia": barbeiro.motivo_ausencia,
                        }
                    },
                }
            ),
            201,
        )
    except Exception as e:
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar erros na criação de barbeiros
        db.session.rollback()
        error_msg = str(e)

        # Tratar erro de e-mail duplicado (Felipe)
        if "UNIQUE constraint failed" in error_msg or "Duplicate entry" in error_msg:
            return (
                jsonify(
                    {
                        "sucesso": False,
                        "erro": "Este e-mail já está sendo usado por outro profissional.",
                    }
                ),
                409,
            )

        app_logger.error(
            "Erro estrutural 500 ao criar barbeiro",
            extra={"erro_detalhe": error_msg},
            exc_info=True,
        )
        return (
            jsonify(
                {"sucesso": False, "erro": "Erro ao incluir barbeiro: " + error_msg}
            ),
            500,
        )


# Vinicius - 08/04/2026
# Modificado o metodo de PUT para PATCH, pois PATCH é usado para atualizar apenas os campos enviados
# Vinicius - 15/04/2026
# Removido o /editar-barbeiro do path para seguir o padrão REST
@barbeiros_bp.route("/<int:id>", methods=["PATCH"])
@jwt_required()
def editar_barbeiro(id):
    current_user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    # O barbeiro só pode editar a si próprio, admin edita qualquer um
    if role != "admin" and current_user_id != id:
        return (
            jsonify({"erro": "Acesso negado. Você só pode editar o próprio perfil."}),
            403,
        )

    try:
        # 1. Captura o JSON da requisição
        body = request.get_json()

        # 2. Validação inicial: O Pydantic verifica tipos e campos extras
        try:
            # Pydantic valida o dicionário
            schema = BarbeiroUpdateSchema(**body)
        except Exception as e:
            return {"error": "Dados inválidos", "detalhes": str(e)}, 400

        # 3. Transforma em dicionário pegando APENAS o que foi enviado
        update_data = schema.model_dump(exclude_unset=True)

        # 4. Condição: Se o dicionário estiver vazio, não há o que atualizar
        if not update_data:
            return {"message": "Nenhuma alteração enviada."}, 400

        # 5. Busca o usuário no banco
        barbeiro = Barbeiro.query.get(id)
        if not barbeiro:
            return {"error": "Barbeiro não encontrado"}, 404

        # Validacao de negocio para motivo_ausencia
        # josue 21/04/2026 01:30 verifica se o barbeiro esta inativo e se o motivo da ausencia foi informado
        is_ativo = update_data.get("ativo", barbeiro.ativo)
        mot_ausenc = update_data.get("motivo_ausencia", barbeiro.motivo_ausencia)
        if is_ativo is False and not mot_ausenc:
            return {"error": "Dados inválidos", "detalhes": "1 validation error for BarbeiroUpdateSchema\nmotivo_ausencia\n  O motivo da ausência é obrigatório ao inativar o barbeiro."}, 400
        
        if is_ativo is True:
            # Garanto que seja limpo no db
            update_data["motivo_ausencia"] = None

        # 6. Algoritmo de Atualização Dinâmica
        # Em vez de fazer: user.nome = update_data['nome'] manual para cada campo...
        for key, value in update_data.items():
            # Vinicius - 08/04/2026
            # Adicionado tratamento para senha, pois ela precisa ser hasheada
            if key == "senha":
                barbeiro.senha = value
            else:
                setattr(barbeiro, key, value)  # Atualiza o atributo dinamicamente

        # 7. Persiste no banco
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a edição de barbeiros
        app_logger.info(
            "Barbeiro atualizado com sucesso",
            extra={
                "barbeiro_id": barbeiro.id,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )

        return {
            "sucesso": True,
            "mensagem": "Barbeiro atualizado com sucesso!",
            "dados": {"campos_alterados": list(update_data.keys())},
        }, 200

    except Exception as e:
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar erros na edição de barbeiros
        db.session.rollback()
        app_logger.error(
            "Erro estrutural 500 ao editar barbeiro",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao editar barbeiro: " + str(e)}), 500


# Vinicius - 09/04/2026
# Rota simples para deletar um barbeiro
# Futuramente será usado desativar em vez de deletar por completo
# Vinicius - 15/04/2026
# Removido o /deletar-barbeiro do path para seguir o padrão REST
@barbeiros_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def deletar_barbeiro(id):
    current_user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    try:
        barbeiro = Barbeiro.query.get(id)
        if not barbeiro:
            return jsonify({"erro": "Barbeiro não encontrado"}), 404

        db.session.delete(barbeiro)
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a deleção de barbeiros
        app_logger.info(
            "Barbeiro deletado com sucesso",
            extra={
                "barbeiro_id": barbeiro.id,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )
        return (
            jsonify({"sucesso": True, "mensagem": "Barbeiro deletado com sucesso"}),
            200,
        )
    except Exception as e:
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar erros na deleção de barbeiros
        db.session.rollback()
        app_logger.error(
            "Erro estrutural 500 ao deletar barbeiro",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao deletar barbeiro: " + str(e)}), 500


# Vinicius - 09/04/2026
# Rota simples para buscar um barbeiro pelo seu ID
# Vinicius - 15/04/2026
# Removido o /buscar-barbeiro do path para seguir o padrão REST
@barbeiros_bp.route("/<int:id>", methods=["GET"])
# Vinicius - 16/04/2026
# Adicionado jwt_required para proteger o endpoint
@jwt_required()
def buscar_barbeiro(id):
    try:
        barbeiro = Barbeiro.query.get(id)
        if not barbeiro:
            return jsonify({"erro": "Barbeiro não encontrado"}), 404

        barbeiro_dict = {
            "id": barbeiro.id,
            "nome": barbeiro.nome,
            "telefone": barbeiro.telefone,
            "email": barbeiro.email,
            "especialidade": barbeiro.especialidade,
            "ativo": barbeiro.ativo,
            "motivo_ausencia": barbeiro.motivo_ausencia,
        }
        return jsonify({"dados": {"barbeiro": barbeiro_dict}, "sucesso": True}), 200
    except Exception as e:
        return jsonify({"erro": "Erro ao buscar barbeiro: " + str(e)}), 500


# Vinicius - 09/04/2026
# Rota para buscar os agendamentos de um barbeiro
@barbeiros_bp.route("/<int:id>/agendamentos", methods=["GET"])
@jwt_required()
def buscar_agendamentos_barbeiro(id):
    current_user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    # O barbeiro só pode ver os seus próprios registros, o admin pode ver de todos
    if role != "admin" and current_user_id != id:
        return (
            jsonify(
                {"erro": "Acesso negado. Você só pode ver os próprios agendamentos."}
            ),
            403,
        )

    try:
        # Vinicius - 09/04/2026
        # Busca o barbeiro pelo seu ID
        barbeiro = Barbeiro.query.get(id)
        if not barbeiro:
            return jsonify({"erro": "Barbeiro não encontrado"}), 404

        # Vinicius - 09/04/2026
        # Captura os parâmetros de paginação
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)

        # Vinicius - 09/04/2026
        # Busca os agendamentos do barbeiro
        agendamentos = Agendamento.query.filter_by(barbeiro_id=id).paginate(
            page=page, per_page=per_page, error_out=False
        )

        # Vinicius - 09/04/2026
        # Verifica se foi encontrado algum agendamento
        # josue minima alteraçao
        if agendamentos.total == 0:
            return (
                jsonify({"erro": "Nenhum agendamento encontrado para o barbeiro"}),
                404,
            )

        # Vinicius - 09/04/2026
        # Transforma os agendamentos em dicionários
        agendamentos_dict = [
            {
                "id": a.id,
                "cliente_id": a.cliente_id,
                "barbeiro_id": a.barbeiro_id,
                # josue minima alteraçao
                "data_agendamento": a.data_agendamento.isoformat(),
                "servico": (
                    {"id": a.servico.id, "nome": a.servico.nome} if a.servico else None
                ),
            }
            for a in agendamentos.items
        ]
        # Vinicius - 09/04/2026
        # Retorna os agendamentos em JSON
        return (
            jsonify(
                {
                    "sucesso": True,
                    "dados": formatar_retorno_paginacao(
                        agendamentos_dict,
                        agendamentos.total,
                        agendamentos.page,
                        agendamentos.per_page,
                    ),
                }
            ),
            200,
        )
    except Exception as e:
        return (
            jsonify({"erro": "Erro ao buscar agendamentos do barbeiro: " + str(e)}),
            500,
        )


# Vinicius - 19/04/2026
# Rota para listar os serviços de um barbeiro
@barbeiros_bp.route("/<int:id>/servicos", methods=["GET"])
@jwt_required()
def listar_servicos_barbeiro(id):
    try:
        barbeiro = Barbeiro.query.get(id)
        if not barbeiro:
            return jsonify({"erro": "Barbeiro não encontrado"}), 404

        servicos_dict = [
            {
                "id": s.id,
                "nome": s.nome,
                "preco": s.preco,
                "duracao_minutos": s.duracao_minutos,
            }
            for s in barbeiro.servicos
        ]
        return jsonify({"servicos": servicos_dict, "total": len(servicos_dict)}), 200
    except Exception as e:
        return jsonify({"erro": "Erro ao listar serviços do barbeiro: " + str(e)}), 500


# Vinicius - 19/04/2026
# Rota para associar serviços a um barbeiro
@barbeiros_bp.route("/<int:id>/servicos", methods=["POST"])
@jwt_required()
@admin_required
def associar_servicos_barbeiro(id):
    try:
        body = request.get_json() or {}
        servicos_ids = body.get("servicos_ids", [])

        if not isinstance(servicos_ids, list):
            return jsonify({"erro": "'servicos_ids' deve ser uma lista de IDs"}), 400

        barbeiro = Barbeiro.query.get(id)
        if not barbeiro:
            return jsonify({"erro": "Barbeiro não encontrado"}), 404

        if not servicos_ids:
            return jsonify({"erro": "Nenhum ID de serviço fornecido"}), 400

        servicos = Servico.query.filter(Servico.id.in_(servicos_ids)).all()
        # Verificar se algum não foi encontrado (opcional, aqui ignoramos os inexistentes)

        adicionados = 0
        for servico in servicos:
            if servico not in barbeiro.servicos:
                barbeiro.servicos.append(servico)
                adicionados += 1

        db.session.commit()

        return (
            jsonify(
                {
                    "msg": f"{adicionados} serviço(s) associado(s) ao barbeiro com sucesso"
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao associar serviços: " + str(e)}), 500


# Vinicius - 19/04/2026
# Rota para desassociar serviços de um barbeiro
@barbeiros_bp.route("/<int:id>/servicos", methods=["DELETE"])
@jwt_required()
@admin_required
def desassociar_servicos_barbeiro(id):
    try:
        body = request.get_json() or {}
        servicos_ids = body.get("servicos_ids", [])

        if not isinstance(servicos_ids, list):
            return jsonify({"erro": "'servicos_ids' deve ser uma lista de IDs"}), 400

        barbeiro = Barbeiro.query.get(id)
        if not barbeiro:
            return jsonify({"erro": "Barbeiro não encontrado"}), 404

        if not servicos_ids:
            return jsonify({"erro": "Nenhum ID de serviço fornecido"}), 400

        servicos = Servico.query.filter(Servico.id.in_(servicos_ids)).all()

        removidos = 0
        for servico in servicos:
            if servico in barbeiro.servicos:
                barbeiro.servicos.remove(servico)
                removidos += 1

        db.session.commit()

        return (
            jsonify(
                {
                    "msg": f"{removidos} serviço(s) desassociado(s) do barbeiro com sucesso"
                }
            ),
            200,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao desassociar serviços: " + str(e)}), 500


# Vinicius - 20/04/2026
# Rota para retornar o ranking de desempenho dos barbeiros (removido do dashboard geral)
@barbeiros_bp.route("/ranking", methods=["GET"])
@jwt_required()
@admin_required
def obter_ranking_barbeiros():
    try:
        dias = request.args.get("dias", 30, type=int)

        if dias < 1 or dias > 365:
            return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

        from app.services.barbeiro_service import BarbeiroService
        from app.schemas.barbeiro_schema import BarbeiroDesempenhoSchema

        ranking_data = BarbeiroService.obter_ranking_desempenho(dias=dias)

        dados_validados = []
        for item in ranking_data:
            if hasattr(BarbeiroDesempenhoSchema, "model_validate"):
                dados_validados.append(
                    BarbeiroDesempenhoSchema.model_validate(item).model_dump(
                        mode="json"
                    )
                )
            else:
                dados_validados.append(
                    json.loads(BarbeiroDesempenhoSchema.parse_obj(item).json())
                )

        return (
            jsonify(
                {
                    "message": "Ranking de barbeiros obtido com sucesso",
                    "data": dados_validados,
                }
            ),
            200,
        )

    except Exception as e:
        app_logger.error("Erro ao obter ranking de barbeiros", exc_info=True)
        return jsonify({"erro": f"Erro interno ao listar ranking: {str(e)}"}), 500
