# josue inicio
from sqlalchemy.exc import IntegrityError
from flask import Blueprint, jsonify, request
from app.models.cliente import Cliente
from app import db
from app.utils.decorators import admin_required
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.schemas.client_schema import ClienteSchema, ClienteUpdateSchema
from app.utils.error_formatter import formatar_erros_pydantic
from app.services.email_service import EmailService
from datetime import datetime
from app.extensions import app_logger

clientes_bp = Blueprint("clientes", __name__, url_prefix="/api/clientes")


@clientes_bp.route("", methods=["GET"])
# Vinicius - 16/04/2026
# Adicionado jwt_required e admin_required para proteger o endpoint
@jwt_required()
@admin_required
# josue inicio
# esse trecho fiquei um pouco confuso no comesso mas fui conseguindo captar a logica
def listar_clientes():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        # Capturar parâmetros de busca
        nome = request.args.get("nome", type=str)
        email = request.args.get("email", type=str)
        telefone = request.args.get("telefone", type=str)

        query = Cliente.query
        # interessante ---- o ilike faz a busca case insensitive
        # Vinicius - 04/04/2026
        """Modificando o uso de argumentos de nome, email e telefone
        1- O uso de ilike com wildcards em campos UNIQUES anula os beneficios de ter um campo unico e um indice no banco
        2- Agora há dois tipos de respostas possiveis dependendo do argumento passado, se for passado email ou telefone, 
        retorna um objeto, se for passado nome ou nenhum argumento, retorna uma lista
        Isso evita que caso seja passado o email ou telefone, caia na função de paginate e o banco tente paginar algo que
        já iria retornar um unico cliente
        """
        # Caso seja passado telefone e email, retorna um objeto, pois são campos unicos
        if telefone or email:
            if telefone:
                query = query.filter_by(telefone=telefone)
            if email:
                query = query.filter_by(email=email)

            cliente = query.first()
            if not cliente:
                return jsonify({"erro": "Cliente não encontrado"}), 404

            return (
                jsonify(
                    {
                        "cliente": {
                            "id": cliente.id,
                            "nome": cliente.nome,
                            "telefone": cliente.telefone,
                            "email": cliente.email,
                            # Ian - 19/04/2026
                            # Adiciona status e dívida do cliente
                            "status": cliente.status,
                            "divida_total": cliente.divida_total,
                            "ultima_visita": cliente.ultima_visita.isoformat() if cliente.ultima_visita else None,
                        }
                    }
                ),
                200,
            )

        # Caso seja passado nome, retorna uma lista com outros dados de paginação, pois nome não é unico
        if nome:
            query = query.filter(Cliente.nome.ilike(f"%{nome}%"))

        # Vinicius - 04/04/2026
        clientes = query.paginate(page=page, per_page=per_page, error_out=False)

        clientes_dict = [
            {
                "id": c.id,
                "nome": c.nome,
                "telefone": c.telefone,
                "email": c.email,
                # Ian - 19/04/2026
                # Adiciona status e dívida do cliente na listagem
                "status": c.status,
                "divida_total": c.divida_total,
                "ultima_visita": c.ultima_visita.isoformat() if c.ultima_visita else None,
            }
            # Vinicius - 04/04/2026
            # Adicionado o .items para que o list comprehension receba os itens da paginação
            for c in clientes.items
        ]
        # Retornar em JSON com chave 'clientes'
        return jsonify(
            {
                "sucesso": True,
                "dados": {
                    "items": clientes_dict,
                    "total": clientes.total,
                    "items_nessa_pagina": len(clientes_dict),
                    "pagina": clientes.page,
                    "per_page": clientes.per_page,
                    "total_paginas": clientes.pages,
                    "tem_proxima": clientes.has_next,
                    "tem_pagina_anterior": clientes.has_prev,
                }
            }
        )
    except Exception as e:
        return jsonify({"erro": "Não foi possível listar os clientes: " + str(e)}), 500


# josue fim
# Vinicius - 15/04/2026
# Removido o /criar-cliente do endpoint, para ficar mais semantico com a ação de criar e padrão REST
@clientes_bp.route("", methods=["POST"])
def criar_cliente():
    try:
        # Vinicius - 08/04/2026
        # Adicionado validação de payload para garantir que os dados enviados estejam corretos
        try:
            data = ClienteSchema(**request.get_json())
        except Exception as e:
            # Vinicius - 15/04/2026
            # Formatando os erros de validação para um formato mais amigável
            erros = formatar_erros_pydantic(e)
            return jsonify({"erros_validacao": erros}), 400
        # Vinicius - 08/04/2026
        # Removido validações feitas pelo Josue, que agora serão validadas pelo schema

        # Criar cliente e salvar no banco
        cliente = Cliente(**data.model_dump())
        # Vinicius - 04/04/2026
        # Utilizando o metodo do mixin para hashear a senha em texto simples antes de efetuar o commit no banco
        cliente.senha = data.senha
        db.session.add(cliente)
        # Vinicius - 16/04/2026
        # Enviado email de boas vindas para o cliente
        EmailService.enviar_email_boas_vindas(
            destinatario=cliente.email, nome_usuario=cliente.nome
        )
        db.session.commit()

        return (
            jsonify(
                {
                    "sucesso": True,
                    "mensagem": "Cliente criado com sucesso",
                    "dados": {
                        "cliente": {
                            "id": cliente.id,
                            "nome": cliente.nome,
                            "telefone": cliente.telefone,
                            "email": cliente.email,
                        }
                    }
                }
            ),
            201,
        )
    # josue inicio
    # o front consegue informar ao usuário “cliente já existe” e tratar o fluxo corretamente.
    except IntegrityError:
        db.session.rollback()
        return (
            jsonify({"erro": "Cliente já cadastrado (email ou telefone já em uso)."}),
            409,
        )
    except Exception as e:
        db.session.rollback()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar erros na criação de clientes
        app_logger.error(
            "Erro estrutural 500 ao criar cliente",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao incluir cliente: " + str(e)}), 500
    # josue fim


# Vinicius - 08/04/2026
# Modificado o metodo de PUT para PATCH, pois PATCH é usado para atualizar apenas os campos enviados
# Vinicius - 15/04/2026
# Removido o /editar-cliente do endpoint, para ficar mais semantico com a ação de editar e padrão REST
@clientes_bp.route("/<int:id>", methods=["PATCH"])
@jwt_required()
def editar_cliente(id):
    current_user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    if role != "admin" and current_user_id != id:
        return (
            jsonify(
                {"erro": "Acesso negado. Você só pode editar o seu próprio perfil."}
            ),
            403,
        )

    try:
        # 1. Captura o JSON da requisição
        body = request.get_json()

        # 2. Validação inicial: O Pydantic verifica tipos e campos extras
        try:
            # Pydantic valida o dicionário
            schema = ClienteUpdateSchema(**body)
        except Exception as e:
            return {"error": "Dados inválidos", "detalhes": str(e)}, 400

        # 3. Transforma em dicionário pegando APENAS o que foi enviado
        update_data = schema.model_dump(exclude_unset=True)

        # 4. Condição: Se o dicionário estiver vazio, não há o que atualizar
        if not update_data:
            return {"message": "Nenhuma alteração enviada."}, 400

        # 5. Busca o usuário no banco
        cliente = Cliente.query.get(id)
        if not cliente:
            return {"error": "Cliente não encontrado"}, 404

        # 6. Algoritmo de Atualização Dinâmica
        # Em vez de fazer: user.nome = update_data['nome'] manual para cada campo...
        for key, value in update_data.items():
            # Vinicius - 08/04/2026
            # Adicionado tratamento para senha, pois ela precisa ser hasheada
            if key == "senha":
                cliente.senha = value
            else:
                setattr(cliente, key, value)  # Atualiza o atributo dinamicamente

        # 7. Persiste no banco
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a edição de clientes
        app_logger.info(
            "Cliente atualizado com sucesso",
            extra={
                "cliente_id": cliente.id,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )
        return {
            "sucesso": True,
            "mensagem": "Cliente atualizado com sucesso!",
            "dados": {"campos_alterados": list(update_data.keys())},
        }, 200

    except Exception as e:
        # Vinicius - 16/04/2026
        # Adicionado roolback caso ocorra algum erro e logging
        db.session.rollback()
        app_logger.error(
            "Erro estrutural 500 ao editar cliente",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao editar cliente: " + str(e)}), 500


# Vinicius - 15/04/2026
# Removido o /deletar-cliente do endpoint, para ficar mais semantico com a ação de deletar e padrão REST
@clientes_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def deletar_cliente(id):
    current_user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    try:
        cliente = Cliente.query.get(id)
        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404

        db.session.delete(cliente)
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a deleção de clientes
        app_logger.info(
            "Cliente deletado com sucesso",
            extra={
                "cliente_id": cliente.id,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )
        return jsonify({"sucesso": True, "mensagem": "Cliente deletado com sucesso"}), 200
    except Exception as e:
        # Vinicius - 16/04/2026
        # Adicionado roolback caso ocorra algum erro e logging
        db.session.rollback()
        app_logger.error(
            "Erro estrutural 500 ao deletar cliente",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao deletar cliente: " + str(e)}), 500


@clientes_bp.route("/buscar-cliente/<int:id>", methods=["GET"])
# Vinicius - 16/04/2026
# Adicionado jwt_required e admin_required para proteger o endpoint
@jwt_required()
@admin_required
def buscar_cliente(id):
    try:
        cliente = Cliente.query.get(id)
        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404

        cliente_dict = {
            "id": cliente.id,
            "nome": cliente.nome,
            "telefone": cliente.telefone,
            "email": cliente.email,
            # Ian - 19/04/2026
            # Adiciona status e dívida do cliente na resposta
            "status": cliente.status,
            "divida_total": cliente.divida_total,
            "ultima_visita": cliente.ultima_visita.isoformat() if cliente.ultima_visita else None,
        }
        return jsonify({"sucesso": True, "dados": {"cliente": cliente_dict}}), 200
    except Exception as e:
        return jsonify({"erro": "Erro ao buscar cliente: " + str(e)}), 500


# Ian - 19/04/2026
# Endpoint para retornar histórico de cortes do cliente
@clientes_bp.route("/<int:cliente_id>/historico", methods=["GET"])
@jwt_required()
def historico_cliente(cliente_id):
    """
    Retorna o histórico de cortes do cliente, incluindo:
    - Agendamentos concluídos
    - Débitos pendentes
    - Frequência e últimas visitas
    - Total gasto
    """
    try:
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")
        
        # Validação de acesso: cliente pode ver apenas seu próprio histórico, admin vê todos
        if role != "admin" and current_user_id != cliente_id:
            return jsonify({"erro": "Acesso negado"}), 403
        
        # Verificar se cliente existe
        cliente = Cliente.query.get(cliente_id)
        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404
        
        # Filtros opcionais
        dias_sem_visita = request.args.get("dias_sem_visita", type=int)  # Filtrar clientes inativos
        devedores = request.args.get("devedores", type=bool)  # Apenas devedores
        
        from app.models.agendamento import Agendamento
        from app.models.barbeiro import Barbeiro
        from sqlalchemy import and_
        
        # Query de agendamentos concluídos do cliente
        query = Agendamento.query.filter(
            Agendamento.cliente_id == cliente_id,
            Agendamento.status == Agendamento.STATUS_CONCLUIDO
        ).order_by(Agendamento.data_agendamento.desc())
        
        # Filtro: apenas devedores
        if devedores:
            query = query.filter(Agendamento.pago == False)
        
        agendamentos = query.all()
        
        # Calcular métricas
        total_gasto = sum(a.servico.preco for a in agendamentos if a.servico)
        total_devendo = sum(a.servico.preco for a in agendamentos if a.servico and not a.pago)
        total_concluidos = len(agendamentos)
        total_devedores = len([a for a in agendamentos if not a.pago])
        
        # Formattar resposta de agendamentos
        historico_agendamentos = []
        for ag in agendamentos:
            historico_agendamentos.append({
                "id": ag.id,
                "data_agendamento": ag.data_agendamento.isoformat(),
                "barbeiro": {
                    "id": ag.barbeiro.id,
                    "nome": ag.barbeiro.nome,
                } if ag.barbeiro else None,
                "servico": {
                    "id": ag.servico.id,
                    "nome": ag.servico.nome,
                    "preco": float(ag.servico.preco),
                } if ag.servico else None,
                "pago": ag.pago,
                "status": ag.status,
            })
        
        # Calcular dias sem visita
        dias_sem_visit = None
        if cliente.ultima_visita:
            dias_sem_visit = (datetime.utcnow() - cliente.ultima_visita).days
        
        # Filtro: se foi passado dias_sem_visita, retornar apenas se atender critério
        if dias_sem_visita and dias_sem_visit is not None and dias_sem_visit < dias_sem_visita:
            return jsonify({
                "sucesso": True,
                "dados": {
                    "cliente_id": cliente_id,
                    "cliente_nome": cliente.nome,
                    "status": "cliente_frequente",  # Não atende critério de inativo
                    "dias_sem_visita": dias_sem_visit,
                }
            }), 200
        
        return jsonify({
            "sucesso": True,
            "dados": {
                "cliente_id": cliente_id,
                "cliente_nome": cliente.nome,
                "status_cliente": cliente.status,
                "divida_total": cliente.divida_total,
                "ultima_visita": cliente.ultima_visita.isoformat() if cliente.ultima_visita else None,
                "dias_sem_visita": dias_sem_visit,
                "metricas": {
                    "total_agendamentos_concluidos": total_concluidos,
                    "total_gasto": float(total_gasto),
                    "total_devendo": float(total_devendo),
                    "total_devedores": total_devedores,
                },
                "historico": historico_agendamentos
            }
        }), 200
        
    except Exception as e:
        app_logger.error(
            "Erro ao buscar histórico do cliente",
            extra={"cliente_id": cliente_id, "erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao buscar histórico: " + str(e)}), 500
