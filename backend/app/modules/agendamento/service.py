from app import db
from app.modules.agendamento.model import Agendamento
from app.modules.agendamento.association import AgendamentoServico
from app.modules.servico.model import Servico
from app.modules.cliente.model import Cliente
from app.modules.barbeiro.model import Barbeiro
from app.modules.agendamento.schema import (
    AgendamentoCreate,
    AgendamentoUpdateStatusSchema,
    AgendamentoUpdateSchema,
)
from datetime import datetime, timedelta
from config import Config
from app.extensions import app_logger

# felipe
from app.modules.auth.email_service import EmailService

# felipe
from app.utils.logging.audit import log_evento_auditoria


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

    Vinicius - 21/04/2026
    Refatorado para suportar múltiplos serviços por agendamento (M2M).
    A duração total usada para verificação de conflitos é agora a SOMA
    das durações de todos os serviços vinculados ao agendamento.
    """

    @staticmethod
    def _buscar_e_validar_servicos(servico_ids: list[int]) -> list[Servico]:
        """
        Busca todos os serviços da lista e garante que todos existem no banco.
        Retorna a lista de objetos Servico na mesma ordem dos IDs.
        """
        servicos = Servico.query.filter(Servico.id.in_(servico_ids)).all()
        if len(servicos) != len(servico_ids):
            ids_encontrados = {s.id for s in servicos}
            ids_faltando = set(servico_ids) - ids_encontrados
            raise ValueError(f"Serviço(s) não encontrado(s): {sorted(ids_faltando)}")
        return servicos

    @staticmethod
    def _validar_servicos_do_barbeiro(barbeiro: Barbeiro, servicos: list[Servico]):
        """
        Garante que TODOS os serviços da lista são oferecidos pelo barbeiro.
        Lança ValueError com a lista dos serviços não oferecidos.
        """
        servicos_do_barbeiro = set(barbeiro.servicos)
        nao_oferecidos = [s for s in servicos if s not in servicos_do_barbeiro]
        if nao_oferecidos:
            nomes = ", ".join(s.nome for s in nao_oferecidos)
            raise ValueError(f"O barbeiro não oferece os seguintes serviços: {nomes}")

    @staticmethod
    def _calcular_duracao_total(servicos: list[Servico]) -> int:
        """Soma as durações de todos os serviços para calcular o bloco de tempo."""
        return sum(s.duracao_minutos for s in servicos)

    @staticmethod
    def _calcular_duracao_agendamento_existente(agendamento: Agendamento) -> int:
        """
        Calcula a duração total de um agendamento já persistido,
        somando as durações dos serviços M2M vinculados.
        """
        return sum(s.duracao_minutos for s in agendamento.servicos if s)

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
            # Calcula a duração total somando todos os serviços do agendamento conflitante
            duracao_existente = (
                AgendamentoService._calcular_duracao_agendamento_existente(
                    agendamento_conflito
                )
            )
            termino_existente = agendamento_conflito.data_agendamento + timedelta(
                minutes=duracao_existente
            )

            if inicio_proposto < termino_existente:
                app_logger.warning(
                    "Conflito de horário detectado",
                    extra={
                        "barbeiro_id": barbeiro_id,
                        "conflito_com": agendamento_conflito.id,
                    },
                )
                raise ConflitoHorarioError(
                    "Conflito: O barbeiro já possui um serviço que se sobrepõe a este horário."
                )

    @staticmethod
    def _vincular_servicos(agendamento: Agendamento, servicos: list[Servico]):
        """
        Substitui completamente os serviços vinculados ao agendamento.
        Remove todas as associações existentes e insere as novas.
        """
        AgendamentoServico.query.filter_by(agendamento_id=agendamento.id).delete()
        for servico in servicos:
            nova_associacao = AgendamentoServico(
                agendamento_id=agendamento.id, servico_id=servico.id
            )
            db.session.add(nova_associacao)

    @staticmethod
    def criar_agendamento(
        dados: AgendamentoCreate, role: str, current_user_id: int
    ) -> Agendamento:
        """
        Entrada: Objeto AgendamentoCreate validado pelo Pydantic.
        Processamento:
            1. Verifica permissões de acesso.
            2. Valida existência de cliente, barbeiro e todos os serviços.
            3. Valida que o barbeiro oferece todos os serviços.
            4. Verifica data retroativa e horário comercial (usando duração SOMADA).
            5. Verifica conflitos de horário.
            6. Persiste o agendamento e vincula os serviços via M2M.
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

        # 1. Valida Cliente e Barbeiro
        if Cliente.query.get(dados.cliente_id) is None:
            raise ValueError("Cliente não encontrado.")

        barbeiro = Barbeiro.query.get(dados.barbeiro_id)
        if barbeiro is None:
            raise ValueError("Barbeiro não encontrado.")

        # 2. Busca e valida todos os serviços da lista
        servicos = AgendamentoService._buscar_e_validar_servicos(dados.servico_ids)

        # 3. Valida que o barbeiro oferece TODOS os serviços
        AgendamentoService._validar_servicos_do_barbeiro(barbeiro, servicos)

        # 4. Calcula a duração total (soma de todos os serviços)
        duracao_total = AgendamentoService._calcular_duracao_total(servicos)

        inicio_proposto = dados.data_agendamento
        termino_proposto = inicio_proposto + timedelta(minutes=duracao_total)

        # 4.1 Validação de Horário Comercial
        hora_inicio_decimal = inicio_proposto.hour + (inicio_proposto.minute / 60)
        hora_fim_decimal = termino_proposto.hour + (termino_proposto.minute / 60)

        if (
            hora_inicio_decimal < Config.HORARIO_ABERTURA
            or hora_fim_decimal > Config.HORARIO_FECHAMENTO
        ):
            raise ValueError(
                f"Horário inválido. Funcionamos das {Config.HORARIO_ABERTURA:02d}:00 às {Config.HORARIO_FECHAMENTO:02d}:00."
            )

        # 4.2 Validação de Data Passada
        if inicio_proposto < datetime.utcnow():
            raise ValueError(
                "Não é possível realizar agendamentos para datas passadas."
            )

        # 5. Verificação de Conflito de Horário
        AgendamentoService._verificar_conflitos(
            barbeiro_id=dados.barbeiro_id,
            inicio_proposto=inicio_proposto,
            termino_proposto=termino_proposto,
        )

        # 6. Persistência — cria o agendamento SEM servico_id
        novo_agendamento = Agendamento(
            cliente_id=dados.cliente_id,
            barbeiro_id=dados.barbeiro_id,
            data_agendamento=dados.data_agendamento,
            observacoes=dados.observacoes,
        )
        db.session.add(novo_agendamento)
        # Vinicius - 21/04/2026
        # O "flush" é necessário para que o novo_agendamento tenha um ID disponível antes de vincular os serviços.
        db.session.flush()
        AgendamentoService._vincular_servicos(novo_agendamento, servicos)

        app_logger.info(
            "Novo agendamento criado",
            extra={
                "agendamento_id": novo_agendamento.id,
                "barbeiro_id": novo_agendamento.barbeiro_id,
                "cliente_id": novo_agendamento.cliente_id,
                "servicos": [s.id for s in servicos],
                "duracao_total_minutos": duracao_total,
            },
        )
        return novo_agendamento

    @staticmethod
    def listar_agendamentos(
        page: int, per_page: int, role: str, current_user_id: int
    ) -> list[Agendamento]:
        """
        Listagem com paginação simples para o front-end.
        Retorna o objeto de paginação do Flask-SQLAlchemy.
        """
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

        # 6. Extrai servico_ids da atualização (se enviado)
        novos_servico_ids = dados_para_atualizar.pop("servico_ids", None)

        # 7. Validação de Alteração Crítica (Data, Barbeiro, Serviços)
        campos_criticos = {"data_agendamento", "barbeiro_id"}
        ha_mudanca_critica = (
            any(campo in dados_para_atualizar for campo in campos_criticos)
            or novos_servico_ids is not None
        )

        if ha_mudanca_critica:
            barbeiro_proposto_id = dados_para_atualizar.get(
                "barbeiro_id", agendamento_atual.barbeiro_id
            )
            barbeiro_proposto = Barbeiro.query.get(barbeiro_proposto_id)
            if barbeiro_proposto is None:
                raise ValueError("Barbeiro proposto não encontrado.")

            # Resolve os serviços finais: usa novos se enviados, senão mantém os atuais
            if novos_servico_ids is not None:
                servicos_finais = AgendamentoService._buscar_e_validar_servicos(
                    novos_servico_ids
                )
            else:
                servicos_finais = agendamento_atual.servicos

            # Valida que o barbeiro oferece TODOS os serviços
            AgendamentoService._validar_servicos_do_barbeiro(
                barbeiro_proposto, servicos_finais
            )

            duracao_total = AgendamentoService._calcular_duracao_total(servicos_finais)

            inicio_proposto = dados_para_atualizar.get(
                "data_agendamento", agendamento_atual.data_agendamento
            )
            termino_proposto = inicio_proposto + timedelta(minutes=duracao_total)

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

            # Verificação de Conflitos
            try:
                AgendamentoService._verificar_conflitos(
                    barbeiro_id=barbeiro_proposto_id,
                    inicio_proposto=inicio_proposto,
                    termino_proposto=termino_proposto,
                    ignorar_agendamento_id=agendamento_id,
                )
            except ConflitoHorarioError as e:
                raise ValueError(str(e))

            # Se há novos serviços, substitui a lista
            if novos_servico_ids is not None:
                AgendamentoService._vincular_servicos(
                    agendamento_atual, servicos_finais
                )

        elif novos_servico_ids is not None:
            # Mudança apenas de serviços (sem alterar data ou barbeiro)
            servicos_finais = AgendamentoService._buscar_e_validar_servicos(
                novos_servico_ids
            )
            barbeiro_atual = Barbeiro.query.get(agendamento_atual.barbeiro_id)
            AgendamentoService._validar_servicos_do_barbeiro(
                barbeiro_atual, servicos_finais
            )
            AgendamentoService._vincular_servicos(agendamento_atual, servicos_finais)

        # 8. Atualização dos campos escalares
        for campo, valor in dados_para_atualizar.items():
            setattr(agendamento_atual, campo, valor)

        app_logger.info(
            "Agendamento editado com sucesso",
            extra={
                "agendamento_id": agendamento_id,
                "dados_alterados": list(dados_para_atualizar.keys()),
                "servicos_atualizados": novos_servico_ids is not None,
            },
        )
        return agendamento_atual

    @staticmethod
    def atualizar_status(
        agendamento_id: int,
        dados: AgendamentoUpdateStatusSchema,
        role: str,
        current_user_id: int,
    ) -> Agendamento:
        """
        Transição de Estado.
        """
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
        # Josue - a troca de status fica centralizada no service para garantir a mesma regra para qualquer rota futura.
        agendamento.status = dados.status

        app_logger.info(
            "Status do agendamento atualizado",
            extra={"agendamento_id": agendamento_id, "novo_status": dados.status},
        )
        return agendamento

    @staticmethod
    def deletar_registro_fisico(agendamento_id: int) -> bool:
        """
        Atenção: Use apenas para erros administrativos graves.
        Remove permanentemente o dado do banco.
        O CASCADE na tabela agendamento_servico garante que as associações
        de serviços também são removidas automaticamente.
        """
        # Vinicius - 11/04/2026
        # Adicionado verificações de acesso negado para barbeiro e cliente

        agendamento = Agendamento.query.get(agendamento_id)
        if not agendamento:
            raise ValueError("Agendamento não encontrado.")

        # felipe
        # Notifica cliente e barbeiro via e-mail antes da exclusão física
        # Vinicius - 22/04/2026
        # Commentado para evitar erros (depois será implementado)
        # EmailService.notificar_cancelamento_admin(agendamento)

        db.session.delete(agendamento)
        db.session.commit()

        app_logger.info(
            "Agendamento deletado fisicamente do banco",
            extra={"agendamento_id": agendamento_id},
        )
        return True
