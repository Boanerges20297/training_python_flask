from app import db
from app.models.agendamento_model import Agendamento
from app.models.servico_model import Servico
from app.models.cliente_model import Cliente
from app.models.barbeiro_model import Barbeiro
from app.schemas.agendamento_schema import AgendamentoCreate
from datetime import datetime, timedelta
from config import Config


class ConflitoHorarioError(Exception):
    pass


class AcessoNegadoError(Exception):
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
    def listar_agendamentos(page: int, per_page: int) -> AgendamentoListResponse:
        """
        Listagem com paginação simples para o front-end.
        Retorna o objeto de paginação do Flask-SQLAlchemy.
        """
        # O .paginate do Flask-SQLAlchemy já cuida do has_next e has_prev
        paginacao = Agendamento.query.order_by(
            Agendamento.data_agendamento.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        return paginacao

    @staticmethod
    def editar_agendamento(
        agendamento_id: int, dados: AgendamentoUpdate, role: str, current_user_id: int
    ) -> Agendamento:

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
                        "Acesso negado. O barbeiro só pode editar agendamentos para seus clientes."
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
                        "Acesso negado. Cliente só pode editar agendamentos para si."
                    )

        # Renomeei para agendamento_atual para evitar confusão no loop lá embaixo
        # Vinicius - 11/04/2026
        # Verificação para saber se um agendamento está cancelado ou concluído
        agendamento_atual = Agendamento.query.get_or_404(dados.id)

        if agendamento_atual.status in [
            Agendamento.STATUS_CONCLUIDO,
            Agendamento.STATUS_CANCELADO,
        ]:
            raise ValueError(
                f"Não é possível editar um agendamento {agendamento_atual.status}."
            )

        # Vinicius - 11/04/2026
        # Recebe os dados do agendamento que serão atualizados
        dados_para_atualizar = dados.model_dump(exclude_unset=True)

        # Vinicius - 11/04/2026
        # Verificação para caso algum barbeiro ou cliente tente alterar o cliente do agendamento, seja barrado
        if "cliente_id" in dados_para_atualizar:
            if role == "admin":
                cliente_proposto_id = dados_para_atualizar.get("cliente_id")
                if Cliente.query.get(cliente_proposto_id) is None:
                    raise ValueError("Cliente não encontrado.")
            else:
                raise ValueError(
                    "Apenas admins podem editar os clientes de agendamentos."
                )

        # Se mudou data, barbeiro OU serviço (pois o serviço muda a duração e aciona verificação de conflitos)
        if any(
            dado in dados_para_atualizar
            for dado in ["data_agendamento", "barbeiro_id", "servico_id"]
        ):
            # 1. Montamos os dados propostos (Usamos o dado novo, se não tiver, usamos o que já tá no banco)
            barbeiro_proposto_id = dados_para_atualizar.get(
                "barbeiro_id", agendamento_atual.barbeiro_id
            )
            if Barbeiro.query.get(barbeiro_proposto_id) is None:
                raise ValueError("Barbeiro não encontrado.")

            servico_proposto_id = dados_para_atualizar.get(
                "servico_id", agendamento_atual.servico_id
            )
            servico_proposto = Servico.query.get(servico_proposto_id)
            if servico_proposto is None:
                raise ValueError("Serviço não encontrado.")

            if ["servico_id", "data_agendamento"] in dados_para_atualizar:
                # 0.1 Validação de Regra de Negócio
                inicio_proposto = dados_para_atualizar.get(
                    "data_agendamento", agendamento_atual.data_agendamento
                )
                termino_proposto = inicio_proposto + timedelta(
                    minutes=servico_proposto.duracao_minutos
                )

                # 1. Validação de Regra de Negócio: Data Passada
                if inicio_proposto < datetime.utcnow():
                    raise ValueError(
                        "Não é possível realizar agendamentos para datas passadas."
                    )

                # Vinicius - 11/04/2026
                # Validação de Regra de Negócio: Horário Comercial
                hora_inicio_decimal = inicio_proposto.hour + (
                    inicio_proposto.minute / 60
                )
                hora_fim_decimal = termino_proposto.hour + (
                    termino_proposto.minute / 60
                )

                if (
                    hora_inicio_decimal < Config.HORARIO_ABERTURA
                    or hora_fim_decimal > Config.HORARIO_FECHAMENTO
                ):
                    raise ValueError(
                        f"Horário inválido. Funcionamos das {Config.HORARIO_ABERTURA:02d}:00 às {Config.HORARIO_FECHAMENTO:02d}:00."
                    )

                # 2. Busca de Conflitos e Validação Matemática
                try:
                    AgendamentoService._verificar_conflitos(
                        barbeiro_id=barbeiro_proposto_id,
                        inicio_proposto=inicio_proposto,
                        termino_proposto=termino_proposto,
                        ignorar_agendamento_id=agendamento_id,
                    )
                except ConflitoHorarioError as e:
                    raise ValueError(str(e))

        # Atualiza os dados de fato
        for campo, valor in dados_para_atualizar.items():
            setattr(agendamento_atual, campo, valor)

        db.session.commit()
        return agendamento_atual

    @staticmethod
    def atualizar_status(agendamento_id: int, novo_status: str) -> Agendamento:
        """
        Descrição Metodológica de Transição de Estado.
        - Entrada: ID do agendamento e a string do novo status desejado.
        - Processo:
            1. Valida se o status enviado é permitido pelo sistema.
            2. Bloqueia alterações em agendamentos já finalizados ou cancelados.
            3. Aplica a mudança de estado no banco de dados.
        - Saída: Objeto Agendamento com o status atualizado.
        """
        agendamento = Agendamento.query.get_or_404(agendamento_id)

        # 1. Lista de status permitidos (Segurança)
        STATUS_PERMITIDOS = [
            Agendamento.STATUS_PENDENTE,
            Agendamento.STATUS_CONFIRMADO,
            Agendamento.STATUS_CANCELADO,
            Agendamento.STATUS_CONCLUIDO,
        ]

        if novo_status not in STATUS_PERMITIDOS:
            raise ValueError(f"Status '{novo_status}' é inválido.")

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
        agendamento.status = novo_status
        db.session.commit()

        return agendamento

    @staticmethod
    def deletar_registro_fisico(agendamento_id: int) -> bool:
        """
        Atenção: Use apenas para erros administrativos graves.
        Remove permanentemente o dado do banco.
        """
        agendamento = Agendamento.query.get_or_404(agendamento_id)
        db.session.delete(agendamento)
        db.session.commit()
        return True
