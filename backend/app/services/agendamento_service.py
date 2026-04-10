from app import db
from app.models.agendamento_model import Agendamento
from app.schemas.agendamento_schema import AgendamentoCreate
from datetime import datetime


class AgendamentoService:
    """
    Este módulo centraliza a lógica de negócios para agendamentos.
    Garante que as regras de disponibilidade e integridade sejam respeitadas
    antes de qualquer alteração no banco de dados.
    """

    @staticmethod
    def criar_agendamento(dados: AgendamentoCreate) -> Agendamento:
        """
        Entrada: Objeto AgendamentoCreate validado pelo Pydantic.
        Processamento:
            1. Verifica se a data é retroativa.
            2. Valida se o barbeiro já possui cliente no mesmo horário.
            3. Registra o agendamento no banco via SQLAlchemy.
        Saída: Instância do modelo Agendamento.
        """

        HORARIO_ABERTURA = 8
        HORARIO_FECHAMENTO = 20

        # 0. Validação de Regra de Negócio: Serviço
        servico = Servico.query.get(dados.servico_id)
        if not servico:
            raise ValueError("Serviço não encontrado.")

        # 0.1 Validação de Regra de Negócio: Horário Comercial
        # Usamos variáveis exclusivas para checar a hora (int/float)
        hora_inicio = dados.data_agendamento.hour
        hora_fim = hora_inicio + (servico.duracao_minutos / 60)

        if hora_inicio < HORARIO_ABERTURA or hora_fim > HORARIO_FECHAMENTO:
            raise ValueError(
                f"Horário inválido. Funcionamos das {HORARIO_ABERTURA:02d}:00 às {HORARIO_FECHAMENTO:02d}:00."
            )

        # 1. Validação de Regra de Negócio: Data Passada
        if dados.data_agendamento < datetime.utcnow():
            raise ValueError(
                "Não é possível realizar agendamentos para datas passadas."
            )

        # --- PREPARAÇÃO PARA A REGRA DE CONFLITO ---
        # Garantimos que inicio_proposto e termino_proposto sejam DATETIMES completos
        inicio_proposto = dados.data_agendamento
        termino_proposto = inicio_proposto + timedelta(minutes=servico.duracao_minutos)

        # 2. Validação de Regra de Negócio: Conflito de Horário
        conflito = Agendamento.query.filter(
            Agendamento.barbeiro_id == dados.barbeiro_id,
            Agendamento.status != Agendamento.STATUS_CANCELADO,
            # Lógica de sobreposição:
            # (InicioA < TerminoB) E (TerminoA > InicioB)
            Agendamento.data_agendamento < termino_proposto,
        ).all()

        for agendamento in conflito:
            # Calculamos o término do agendamento que já está no banco
            servico_existente = Servico.query.get(agendamento.servico_id)
            termino_existente = agendamento.data_agendamento + timedelta(
                minutes=servico_existente.duracao_minutos
            )

            # Se o início do novo for antes do fim do existente E o fim do novo for após o início do existente
            if inicio_proposto < termino_existente:
                raise ValueError(
                    "Conflito: O barbeiro já possui um serviço que se sobrepõe a este horário."
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
        agendamento_id: int, dados: AgendamentoUpdate
    ) -> Agendamento:
        # Renomeei para agendamento_atual para evitar confusão no loop lá embaixo
        agendamento_atual = Agendamento.query.get_or_404(agendamento_id)

        if agendamento_atual.status in [
            Agendamento.STATUS_CONCLUIDO,
            Agendamento.STATUS_CANCELADO,
        ]:
            raise ValueError(
                f"Não é possível editar um agendamento {agendamento_atual.status}."
            )

        dados_para_atualizar = dados.model_dump(exclude_unset=True)

        # Se mudou data, barbeiro OU serviço (pois o serviço muda a duração)
        if any(
            dado in dados_para_atualizar
            for dado in ["data_agendamento", "barbeiro_id", "servico_id"]
        ):

            # 1. Montamos os dados propostos (Usamos o dado novo, se não tiver, usamos o que já tá no banco)
            barbeiro_proposto = dados_para_atualizar.get(
                "barbeiro_id", agendamento_atual.barbeiro_id
            )
            servico_proposto_id = dados_para_atualizar.get(
                "servico_id", agendamento_atual.servico_id
            )
            inicio_proposto = dados_para_atualizar.get(
                "data_agendamento", agendamento_atual.data_agendamento
            )

            # Calculamos o término proposto
            servico = Servico.query.get(servico_proposto_id)
            termino_proposto = inicio_proposto + timedelta(
                minutes=servico.duracao_minutos
            )

            # 2. Busca de Conflitos (Com a trava para ignorar a si mesmo)
            conflitos_potenciais = Agendamento.query.filter(
                Agendamento.barbeiro_id == barbeiro_proposto,
                Agendamento.status != Agendamento.STATUS_CANCELADO,
                Agendamento.id
                != agendamento_id,  # CRÍTICO: Ignora o próprio agendamento
                Agendamento.data_agendamento < termino_proposto,
            ).all()

            # 3. Validação matemática de sobreposição
            for agendamento_conflito in conflitos_potenciais:  # Variável renomeada!
                servico_existente = Servico.query.get(agendamento_conflito.servico_id)
                termino_existente = agendamento_conflito.data_agendamento + timedelta(
                    minutes=servico_existente.duracao_minutos
                )

                if inicio_proposto < termino_existente:
                    raise ValueError(
                        "Conflito: O barbeiro já possui um serviço que se sobrepõe a este horário."
                    )

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
