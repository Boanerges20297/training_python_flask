from app import db
from app.models.agendamento import Agendamento
from app.models.servico import Servico
from app.models.cliente import Cliente
from app.models.barbeiro import Barbeiro
from app.schemas.agendamento_schema import (
    AgendamentoCreate,
    AgendamentoUpdateStatusSchema,
    AgendamentoUpdateSchema,
)
from datetime import datetime, timedelta
from config import Config


class ConflitoHorarioError(Exception):
    pass


class AcessoNegadoError(Exception):
    pass


class AgendamentoNaoEncontradoError(Exception):
    pass


class AgendamentoService:
    """
    Este módulo centraliza a lógica de negócios para agendamentos.
    Garante que as regras de disponibilidade e integridade sejam respeitadas
    antes de qualquer alteração no banco de dados.
    """

    @staticmethod
    def _verificar_conflitos(
        barbeiro_id: int,
        inicio_proposto: datetime,
        termino_proposto: datetime,
        ignorar_agendamento_id: int = None,
    ):
        query = Agendamento.query.filter(
            Agendamento.barbeiro_id == barbeiro_id,
            Agendamento.status != Agendamento.STATUS_CANCELADO,
            Agendamento.data_agendamento < termino_proposto,
        )

        if ignorar_agendamento_id is not None:
            query = query.filter(Agendamento.id != ignorar_agendamento_id)

        conflitos_potenciais = query.all()

        for agendamento_conflito in conflitos_potenciais:
            servico_existente = Servico.query.get(agendamento_conflito.servico_id)
            termino_existente = agendamento_conflito.data_agendamento + timedelta(
                minutes=servico_existente.duracao_minutos
            )

            if inicio_proposto < termino_existente:
                raise ConflitoHorarioError(
                    "Conflito: O barbeiro já possui um serviço que se sobrepõe a este horário."
                )

    @staticmethod
    def criar_agendamento(
        dados: AgendamentoCreate, role: str, current_user_id: int
    ) -> Agendamento:
        """
        Entrada: Objeto AgendamentoCreate validado pelo Pydantic.
        Processamento:
            1. Verifica se a data é retroativa.
            2. Valida se o barbeiro já possui cliente no mesmo horário.
            3. Registra o agendamento no banco via SQLAlchemy.
        Saída: Instância do modelo Agendamento.
        """
        if role != "admin":
            if role == "barbeiro" and dados.barbeiro_id != current_user_id:
                raise AcessoNegadoError(
                    "Acesso negado. O barbeiro só pode agendar para si."
                )
            if (
                role not in ["admin", "barbeiro"]
                and dados.cliente_id != current_user_id
            ):
                raise AcessoNegadoError(
                    "Acesso negado. Cliente só pode agendar para si."
                )

        # 0. Validação de Regra de Negócio: Serviço
        servico = Servico.query.get(dados.servico_id)
        if not servico:
            raise ValueError("Serviço não encontrado.")

        if Cliente.query.get(dados.cliente_id) is None:
            raise ValueError("Cliente não encontrado.")

        if Barbeiro.query.get(dados.barbeiro_id) is None:
            raise ValueError("Barbeiro não encontrado.")

        inicio_proposto = dados.data_agendamento
        termino_proposto = inicio_proposto + timedelta(minutes=servico.duracao_minutos)

        # 0.1 Validação de Regra de Negócio: Horário Comercial
        hora_inicio_decimal = inicio_proposto.hour + (inicio_proposto.minute / 60)
        hora_fim_decimal = termino_proposto.hour + (termino_proposto.minute / 60)

        if (
            hora_inicio_decimal < Config.HORARIO_ABERTURA
            or hora_fim_decimal > Config.HORARIO_FECHAMENTO
        ):
            raise ValueError(
                f"Horário inválido. Funcionamos das {Config.HORARIO_ABERTURA:02d}:00 às {Config.HORARIO_FECHAMENTO:02d}:00."
            )

        # 1. Validação de Regra de Negócio: Data Passada
        if inicio_proposto < datetime.utcnow():
            raise ValueError(
                "Não é possível realizar agendamentos para datas passadas."
            )

        # 2. Validação de Regra de Negócio: Conflito de Horário
        AgendamentoService._verificar_conflitos(
            barbeiro_id=dados.barbeiro_id,
            inicio_proposto=inicio_proposto,
            termino_proposto=termino_proposto,
        )

        # 3. Persistência
        # ModelDump é um método do Pydantic que converte o objeto para um dicionário
        # O ** antes do model_dump desempacota o dicionário em argumentos nomeados
        # Isso é equivalente a fazer:
        # Agendamento(
        #    cliente_id=dados.cliente_id,
        #    barbeiro_id=dados.barbeiro_id,
        #    servico_id=dados.servico_id,
        #    data_agendamento=dados.data_agendamento,
        #    observacoes=dados.observacoes
        # )
        novo_agendamento = Agendamento(**dados.model_dump())

        db.session.add(novo_agendamento)
        db.session.commit()

        return novo_agendamento

    @staticmethod
    def listar_agendamentos(
        page: int, per_page: int, role: str, current_user_id: int
    ) -> list[Agendamento]:
        """
        Listagem com paginação simples para o front-end.
        Retorna o objeto de paginação do Flask-SQLAlchemy.
        """
        # O .paginate do Flask-SQLAlchemy já cuida do has_next e has_prev
        # Vinicius - 11/04/2026
        # Caso o usuário seja admin, ele pode ver todos os agendamentos
        # Caso o usuário seja barbeiro, ele pode ver apenas seus agendamentos
        # Caso o usuário seja cliente, ele pode ver apenas seus agendamentos
        if role == "admin":
            paginacao = Agendamento.query.order_by(
                Agendamento.data_agendamento.desc()
            ).paginate(page=page, per_page=per_page, error_out=False)
        elif role == "barbeiro":
            paginacao = (
                Agendamento.query.filter_by(barbeiro_id=current_user_id)
                .order_by(Agendamento.data_agendamento.desc())
                .paginate(page=page, per_page=per_page, error_out=False)
            )
        elif role == "cliente":
            paginacao = (
                Agendamento.query.filter_by(cliente_id=current_user_id)
                .order_by(Agendamento.data_agendamento.desc())
                .paginate(page=page, per_page=per_page, error_out=False)
            )
        return paginacao

    @staticmethod
    def buscar_agendamento(
        agendamento_id: int, role: str, current_user_id: int
    ) -> Agendamento:
        """
        Busca um agendamento pelo ID.
        """
        # Vinicius - 11/04/2026
        # Adicionado verificações de acesso negado para barbeiro e cliente
        if role != "admin":
            if role == "barbeiro":
                # Verifica se o agendamento está vinculado ao id do barbeiro, se não, não pode alterar agendamento dos outros barbeiros
                if (
                    Agendamento.query.filter_by(
                        barbeiro_id=current_user_id, id=agendamento_id
                    ).first()
                    is None
                ):
                    raise AcessoNegadoError(
                        "Acesso negado. O barbeiro só pode buscar agendamentos de seus clientes."
                    )
            if role == "cliente":
                # Verifica se o agendamento está vinculado ao id do cliente, se não, não pode alterar agendamento dos outros clientes
                if (
                    Agendamento.query.filter_by(
                        cliente_id=current_user_id, id=agendamento_id
                    ).first()
                    is None
                ):
                    raise AcessoNegadoError(
                        "Acesso negado. O cliente só pode buscar agendamentos seus."
                    )

        agendamento = Agendamento.query.get(agendamento_id)
        if not agendamento:
            raise ValueError("Agendamento não encontrado")
        return agendamento

    @staticmethod
    def editar_agendamento(
        agendamento_id: int,
        dados: AgendamentoUpdateSchema,
        role: str,
        current_user_id: int,
    ) -> Agendamento:

        # Vinicius - 11/04/2026
        # Refatoração completa da função editar_agendamento
        # 1. Busca do Agendamento Atual
        agendamento_atual = Agendamento.query.get(agendamento_id)
        if not agendamento_atual:
            raise AgendamentoNaoEncontradoError("Agendamento não encontrado.")

        # 2. Verificação de Acesso (Autorização)
        if role == "barbeiro" and agendamento_atual.barbeiro_id != current_user_id:
            raise AcessoNegadoError(
                "Acesso negado. O barbeiro só pode editar agendamentos de seus clientes."
            )
        if role == "cliente" and agendamento_atual.cliente_id != current_user_id:
            raise AcessoNegadoError(
                "Acesso negado. Cliente só pode editar agendamentos para si."
            )

        # 3. Verificação de Status Final (Imutabilidade Parcial)
        if agendamento_atual.status in [
            Agendamento.STATUS_CONCLUIDO,
            Agendamento.STATUS_CANCELADO,
        ]:
            raise ValueError(
                f"Não é possível editar um agendamento com status '{agendamento_atual.status}'."
            )

        # 4. Extração dos Dados a Atualizar
        dados_para_atualizar = dados.model_dump(exclude_unset=True)
        if not dados_para_atualizar:
            raise ValueError("Nenhum dado para atualizar.")

        # 5. Validação de Alteração de Cliente (Apenas admin permitidos)
        if "cliente_id" in dados_para_atualizar:
            if role != "admin":
                raise ValueError(
                    "Apenas admins podem editar os clientes de agendamentos já criados."
                )
            if Cliente.query.get(dados_para_atualizar["cliente_id"]) is None:
                raise ValueError("Cliente proposto não encontrado.")

        # 6. Validação de Alteração Crítica (Data, Barbeiro, Serviço)
        # Qualquer mudança nestes campos altera as restrições de tempo
        campos_criticos = {"data_agendamento", "barbeiro_id", "servico_id"}
        if any(campo in dados_para_atualizar for campo in campos_criticos):
            barbeiro_proposto_id = dados_para_atualizar.get(
                "barbeiro_id", agendamento_atual.barbeiro_id
            )
            if (
                "barbeiro_id" in dados_para_atualizar
                and Barbeiro.query.get(barbeiro_proposto_id) is None
            ):
                raise ValueError("Barbeiro proposto não encontrado.")

            servico_proposto_id = dados_para_atualizar.get(
                "servico_id", agendamento_atual.servico_id
            )
            servico_proposto = Servico.query.get(servico_proposto_id)
            if servico_proposto is None:
                raise ValueError("Serviço proposto não encontrado.")

            inicio_proposto = dados_para_atualizar.get(
                "data_agendamento", agendamento_atual.data_agendamento
            )
            termino_proposto = inicio_proposto + timedelta(
                minutes=servico_proposto.duracao_minutos
            )

            # Regra de Negócio: Data Passada
            if inicio_proposto < datetime.utcnow():
                raise ValueError(
                    "Não é possível realizar agendamentos para datas passadas."
                )

            # Regra de Negócio: Horário Comercial
            hora_inicio_decimal = inicio_proposto.hour + (inicio_proposto.minute / 60)
            hora_fim_decimal = termino_proposto.hour + (termino_proposto.minute / 60)

            if (
                hora_inicio_decimal < Config.HORARIO_ABERTURA
                or hora_fim_decimal > Config.HORARIO_FECHAMENTO
            ):
                raise ValueError(
                    f"Horário inválido. Funcionamos das {Config.HORARIO_ABERTURA:02d}:00 às {Config.HORARIO_FECHAMENTO:02d}:00."
                )

            # Busca de Conflitos e Validação de Sobreposição de Horários
            try:
                AgendamentoService._verificar_conflitos(
                    barbeiro_id=barbeiro_proposto_id,
                    inicio_proposto=inicio_proposto,
                    termino_proposto=termino_proposto,
                    ignorar_agendamento_id=agendamento_id,
                )
            except ConflitoHorarioError as e:
                raise ValueError(str(e))

        # 7. Atualização do Objeto e Persistência
        for campo, valor in dados_para_atualizar.items():
            setattr(agendamento_atual, campo, valor)

        db.session.commit()
        return agendamento_atual

    @staticmethod
    def atualizar_status(
        agendamento_id: int,
        dados: AgendamentoUpdateStatusSchema,
        role: str,
        current_user_id: int,
    ) -> Agendamento:
        """
        Descrição Metodológica de Transição de Estado.
        - Entrada: ID do agendamento e a string do novo status desejado.
        - Processo:
            1. Valida se o status enviado é permitido pelo sistema.
            2. Bloqueia alterações em agendamentos já finalizados ou cancelados.
            3. Aplica a mudança de estado no banco de dados.
        - Saída: Objeto Agendamento com o status atualizado.
        """
        # Vinicius - 11/04/2026
        # Adicionado verificações de acesso negado para barbeiro e cliente
        if role != "admin":
            if role == "barbeiro":
                # Verifica se o agendamento está vinculado ao id do barbeiro, se não, não pode alterar agendamento dos outros barbeiros
                if (
                    Agendamento.query.filter_by(
                        barbeiro_id=current_user_id, id=agendamento_id
                    ).first()
                    is None
                ):
                    raise AcessoNegadoError(
                        "Acesso negado. O barbeiro só pode alterar status de agendamentos para seus clientes."
                    )
            if role == "cliente":
                # Verifica se o agendamento está vinculado ao id do cliente, se não, não pode alterar agendamento dos outros clientes
                if (
                    Agendamento.query.filter_by(
                        cliente_id=current_user_id, id=agendamento_id
                    ).first()
                    is None
                ):
                    raise AcessoNegadoError(
                        "Acesso negado. O cliente só pode alterar status de seus próprios agendamentos."
                    )

        agendamento = Agendamento.query.get(agendamento_id)
        if not agendamento:
            raise ValueError("Agendamento não encontrado.")

        # 1. Lista de status permitidos (Segurança)
        STATUS_PERMITIDOS = [
            Agendamento.STATUS_PENDENTE,
            Agendamento.STATUS_CONFIRMADO,
            Agendamento.STATUS_CANCELADO,
            Agendamento.STATUS_CONCLUIDO,
        ]

        if dados.status not in STATUS_PERMITIDOS:
            raise ValueError(f"Status '{dados.status}' é inválido.")

        # 2. Regra de Negócio: Imutabilidade de estados finais
        # Se já está concluído ou cancelado, não deve voltar atrás (evita fraudes/erros)
        if agendamento.status in [
            Agendamento.STATUS_CONCLUIDO,
            Agendamento.STATUS_CANCELADO,
        ]:
            raise ValueError(
                f"Não é permitido alterar o status de um agendamento já {agendamento.status}."
            )

        # 3. Atualização
        agendamento.status = dados.status
        db.session.commit()

        return agendamento

    @staticmethod
    def deletar_registro_fisico(agendamento_id: int) -> bool:
        """
        Atenção: Use apenas para erros administrativos graves.
        Remove permanentemente o dado do banco.
        """
        # Vinicius - 11/04/2026
        # Adicionado verificações de acesso negado para barbeiro e cliente

        agendamento = Agendamento.query.get(agendamento_id)
        if not agendamento:
            raise ValueError("Agendamento não encontrado.")
        db.session.delete(agendamento)
        db.session.commit()
        return True
