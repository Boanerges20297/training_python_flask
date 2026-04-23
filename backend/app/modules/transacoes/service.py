# Ian - 22/04/2026
from decimal import Decimal
from app import db
from app.extensions import app_logger
from app.modules.transacoes.model import TransacaoFinanceira
from app.modules.agendamento.model import Agendamento

class TransacaoFinanceiraService:
    """
    Serviço responsável por gerenciar transações financeiras.
    Registra pagamentos de agendamentos com rastreamento de forma de pagamento e comissões.
    """

    @staticmethod
    def registrar_pagamento(
        agendamento_id: int,
        forma_pagamento: str = "dinheiro",
        comissao_pct: float = 50.0,
        observacoes: str = None
    ) -> dict:
        """
        Registra um pagamento para um agendamento concluído.

        Args:
            agendamento_id: ID do agendamento
            forma_pagamento: Forma de pagamento (dinheiro, pix, credito, debito)
            comissao_pct: Percentual de comissão do barbeiro (padrão 50%)
            observacoes: Observações opcionais

        Returns:
            dict com dados da transação criada ou erro
        """
        try:
            # Buscar agendamento
            agendamento = Agendamento.query.get(agendamento_id)
            if not agendamento:
                return {"sucesso": False, "erro": "Agendamento não encontrado"}

            # Validar que o agendamento foi concluído
            if agendamento.status != Agendamento.STATUS_CONCLUIDO:
                return {
                    "sucesso": False,
                    "erro": "Apenas agendamentos concluídos podem ter pagamento registrado",
                }

            # Determinar valor a cobrar (preco_cobrado ou soma dos serviços do agendamento)
            # Josue - preco_cobrado tem precedencia para preservar historico financeiro mesmo se o catalogo mudar depois.
            if agendamento.preco_cobrado is not None:
                valor_bruto = Decimal(str(agendamento.preco_cobrado))
            else:
                if not agendamento.servicos:
                    return {
                        "sucesso": False,
                        "erro": "Agendamento sem serviços vinculados para calcular pagamento",
                    }
                valor_bruto = sum(
                    Decimal(str(servico.preco)) for servico in agendamento.servicos
                )

            # Calcular comissão
            valor_comissao = valor_bruto * Decimal(comissao_pct) / Decimal(100)

            # Criar transação
            transacao = TransacaoFinanceira(
                agendamento_id=agendamento_id,
                barbeiro_id=agendamento.barbeiro_id,
                cliente_id=agendamento.cliente_id,
                valor_bruto=valor_bruto,
                forma_pagamento=forma_pagamento,
                comissao_pct=Decimal(comissao_pct),
                valor_comissao=valor_comissao,
                observacoes=observacoes,
                status="confirmada",
            )

            db.session.add(transacao)

            # Atualizar agendamento sem alterar data_criacao (histórico de criação)
            agendamento.pago = True

            db.session.commit()

            app_logger.info(
                f"Pagamento registrado para agendamento {agendamento_id}",
                extra={
                    "transacao_id": transacao.id,
                    "valor": float(valor_bruto),
                    "forma_pagamento": forma_pagamento,
                },
            )

            return {
                "sucesso": True,
                "mensagem": "Pagamento registrado com sucesso",
                "dados": {
                    "transacao_id": transacao.id,
                    "agendamento_id": agendamento_id,
                    "valor_bruto": float(valor_bruto),
                    "valor_comissao": float(valor_comissao),
                    "forma_pagamento": forma_pagamento,
                    "data_pagamento": transacao.data_pagamento.isoformat(),
                },
            }

        except Exception as e:
            db.session.rollback()
            app_logger.error(
                f"Erro ao registrar pagamento para agendamento {agendamento_id}",
                extra={"erro_detalhe": str(e)},
                exc_info=True,
            )
            return {"sucesso": False, "erro": f"Erro ao registrar pagamento: {str(e)}"}

    @staticmethod
    def obter_transacoes_por_periodo(data_inicio, data_fim, barbeiro_id=None):
        """
        Retorna transações dentro de um período.

        Args:
            data_inicio: Data inicial
            data_fim: Data final
            barbeiro_id: ID do barbeiro (opcional, para filtrar)

        Returns:
            Lista de transações
        """
        query = TransacaoFinanceira.query.filter(
            TransacaoFinanceira.data_pagamento >= data_inicio,
            TransacaoFinanceira.data_pagamento <= data_fim,
            TransacaoFinanceira.status == "confirmada",
        )

        if barbeiro_id:
            query = query.filter(TransacaoFinanceira.barbeiro_id == barbeiro_id)

        return query.all()

    @staticmethod
    def calcular_comissoes_barbeiro(barbeiro_id: int, data_inicio, data_fim) -> dict:
        """
        Calcula total de comissões para um barbeiro em um período.

        Args:
            barbeiro_id: ID do barbeiro
            data_inicio: Data inicial
            data_fim: Data final

        Returns:
            dict com resumo de comissões
        """
        transacoes = TransacaoFinanceiraService.obter_transacoes_por_periodo(
            data_inicio, data_fim, barbeiro_id=barbeiro_id
        )

        total_comissao = sum(
            float(t.valor_comissao) if t.valor_comissao else 0 for t in transacoes
        )
        total_vendas = sum(float(t.valor_bruto) for t in transacoes)

        return {
            "barbeiro_id": barbeiro_id,
            "total_vendas": round(total_vendas, 2),
            "total_comissao": round(total_comissao, 2),
            "quantidade_transacoes": len(transacoes),
        }

    @staticmethod
    def reverter_pagamento(transacao_id: int, motivo: str = None) -> dict:
        """
        Reverte uma transação de pagamento.

        Args:
            transacao_id: ID da transação
            motivo: Motivo da reversão

        Returns:
            dict com resultado da reversão
        """
        try:
            transacao = TransacaoFinanceira.query.get(transacao_id)
            if not transacao:
                return {"sucesso": False, "erro": "Transação não encontrada"}

            # Atualizar status
            transacao.status = "revertida"
            if motivo:
                transacao.observacoes = f"[REVERTIDA] {motivo}"

            # Atualizar agendamento
            agendamento = Agendamento.query.get(transacao.agendamento_id)
            if agendamento:
                agendamento.pago = False

            db.session.commit()

            app_logger.info(
                f"Transação {transacao_id} revertida",
                extra={"motivo": motivo},
            )

            return {"sucesso": True, "mensagem": "Transação revertida com sucesso"}

        except Exception as e:
            db.session.rollback()
            app_logger.error(
                f"Erro ao reverter transação {transacao_id}",
                extra={"erro_detalhe": str(e)},
                exc_info=True,
            )
            return {"sucesso": False, "erro": f"Erro ao reverter transação: {str(e)}"}
