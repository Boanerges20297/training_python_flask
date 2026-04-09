# josue inicio
from flask import Blueprint, jsonify, request
from app.models.cliente import Cliente
from app import db
from app.utils.decorators import admin_required
from app.schemas.client_schema import ClienteSchema, ClienteUpdateSchema

clientes_bp = Blueprint("clientes", __name__, url_prefix="/api/clientes")


@clientes_bp.route("/", methods=["GET"])
# josue inicio
# esse trecho fiquei um pouco confuso no comesso mas fui conseguindo captar a logica
def listar_clientes():
    try:
        # Capturar parâmetros de paginação (com valores padrão)
        pagina = request.args.get("pagina", 1, type=int)
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
                        }
                    }
                ),
                200,
            )

        # Caso seja passado nome, retorna uma lista com outros dados de paginação, pois nome não é unico
        if nome:
            query = query.filter(Cliente.nome.ilike(f"%{nome}%"))

        # Vinicius - 04/04/2026
        # Troca do nome da variavel para 'clientes' para melhor identificação
        clientes = query.paginate(page=pagina, per_page=per_page, error_out=False)

        clientes_dict = [
            {"id": c.id, "nome": c.nome, "telefone": c.telefone, "email": c.email}
            # Vinicius - 04/04/2026
            # Adicionado o .items para que o list comprehension receba os itens da paginação
            for c in clientes.items
        ]
        # Retornar em JSON com chave 'clientes'
        return jsonify(
            {
                "clientes": clientes_dict,
                # Vinicius - 04/04/2026
                # Adicionado formatação para melhor visualização dos dados de paginação e variaveis total e items_nessa_pagina para deixar a resposta mais completa
                "total": clientes.total,
                "items_nessa_pagina": len(clientes_dict),
                "pagina": clientes.page,
                "per_page": clientes.per_page,
                "tem_proxima": clientes.has_next,
                "tem_pagina_anterior": clientes.has_prev,
            }
        )
    except Exception as e:
        return jsonify({"erro": "Não foi possível listar os clientes: " + str(e)}), 500


# josue fim
@clientes_bp.route("/criar-cliente", methods=["POST"])
def criar_cliente():
    try:
        # Vinicius - 08/04/2026
        # Adicionado validação de payload para garantir que os dados enviados estejam corretos
        data = ClienteSchema(**request.get_json())
        # Vinicius - 08/04/2026
        # Removido validações feitas pelo Josue, que agora serão validadas pelo schema

        # Criar cliente e salvar no banco
        cliente = Cliente(**data.model_dump())
        # Vinicius - 04/04/2026
        # Utilizando o metodo do mixin para hashear a senha em texto simples antes de efetuar o commit no banco
        cliente.senha = data.senha
        db.session.add(cliente)
        db.session.commit()
        return (
            jsonify(
                {
                    "cliente": {
                        "id": cliente.id,
                        "nome": cliente.nome,
                        "telefone": cliente.telefone,
                        "email": cliente.email,
                        "msg": "Cliente criado com sucesso",
                    }
                }
            ),
            201,
        )
    # Vinicius - 08/04/2026
    # Adicionado tratamento de erro para ValidationError
    except ValidationError as e:
        return jsonify({"erro": "Erro ao incluir cliente: " + str(e)}), 400
    except Exception as e:
        return jsonify({"erro": "Erro ao incluir cliente: " + str(e)}), 500


# Vinicius - 08/04/2026
# Modificado o metodo de PUT para PATCH, pois PATCH é usado para atualizar apenas os campos enviados
@clientes_bp.route("/editar-cliente/<int:id>", methods=["PATCH"])
def editar_cliente(id):
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

        return {
            "message": "Cliente atualizado com sucesso!",
            "campos_alterados": list(update_data.keys()),
        }, 200

    except Exception as e:
        return jsonify({"erro": "Erro ao editar cliente: " + str(e)}), 500


@clientes_bp.route("/deletar-cliente/<int:id>", methods=["DELETE"])
@admin_required
def deletar_cliente(id):
    try:
        cliente = Cliente.query.get(id)
        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404

        db.session.delete(cliente)
        db.session.commit()
        return jsonify({"msg": "Cliente deletado com sucesso"}), 200
    except Exception as e:
        return jsonify({"erro": "Erro ao deletar cliente: " + str(e)}), 500


@clientes_bp.route("/buscar-cliente/<int:id>", methods=["GET"])
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
        }
        return jsonify({"cliente": cliente_dict}), 200
    except Exception as e:
        return jsonify({"erro": "Erro ao buscar cliente: " + str(e)}), 500
