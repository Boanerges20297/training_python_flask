import sys, os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

import random
from datetime import datetime
from app import create_app, db
from app.modules.barbeiro.model import Barbeiro
from app.modules.cliente.model import Cliente
from app.modules.servico.model import Servico
from app.modules.agendamento.model import Agendamento
from app.modules.agendamento.association import AgendamentoServico


def popular_banco():
    app = create_app()
    with app.app_context():
        # 1. Garante pelo menos 2 Barbeiros vivos no banco
        b1 = Barbeiro.query.first()
        if not b1:
            b1 = Barbeiro(
                nome="Barbeiro João",
                email="joao.fake@barbabyte.com",
                telefone="11999999991",
            )
            b1.senha = "123456"  # setter do HashSenhaMixin faz o hash automaticamente
            db.session.add(b1)
            db.session.commit()

        b2 = Barbeiro.query.filter(Barbeiro.id != b1.id).first()
        if not b2:
            b2 = Barbeiro(
                nome="Barbeiro Pedro",
                email="pedro.fake@barbabyte.com",
                telefone="11999999992",
            )
            b2.senha = "123456"
            db.session.add(b2)
            db.session.commit()

        # 2. Garante pelo menos 1 Cliente para simularmos
        c1 = Cliente.query.first()
        if not c1:
            c1 = Cliente(
                nome="Cliente Falso Frequente",
                email="cliente.fake@teste.com",
                telefone="11888888888",
            )
            c1.senha = "123456"
            db.session.add(c1)
            db.session.commit()

        # 3. Garante pelo menos 2 Serviços clássicos c/ precificação
        s1 = Servico.query.first()
        if not s1:
            s1 = Servico(
                nome="Corte Degradê na Navalha", preco=55.0, duracao_minutos=45
            )
            db.session.add(s1)
            db.session.commit()

        s2 = Servico.query.filter(Servico.id != s1.id).first()
        if not s2:
            s2 = Servico(nome="Barba Terapia Completa", preco=35.0, duracao_minutos=30)
            db.session.add(s2)
            db.session.commit()

        # 3.1 Garante que os barbeiros têm os serviços vinculados (M2M barbeiro_servico)
        # Sem isso, a lógica de negócio de produção rejeitaria os agendamentos.
        if s1 not in b1.servicos:
            b1.servicos.append(s1)
        if s2 not in b2.servicos:
            b2.servicos.append(s2)
        db.session.commit()

        # 4. Fabricação de Notas Fiscais Pagas num loop
        mes = 4
        ano = 2026

        # O Barbeiro 1 será artificialmente focado para ganhar mais no ranking (Pra testarmos a ordenação)
        print("Injetando notas fiscais retroativas...")
        agendamentos_b1 = []
        agendamentos_b2 = []

        for _ in range(15):  # 15 do B1
            dia = random.randint(1, 28)
            data_fake = datetime(
                year=ano, month=mes, day=dia, hour=random.randint(9, 18)
            )

            agd = Agendamento(
                cliente_id=c1.id,
                barbeiro_id=b1.id,
                data_agendamento=data_fake,
                status=Agendamento.STATUS_CONCLUIDO,
                pago=True,  # IMPORTANTE: Nosso filtro exige que esteja pago!
                observacoes="Fake Data - B1 - Serviço Caro",
            )
            agendamentos_b1.append(agd)

        for _ in range(8):  # 8 do B2 (b2 lucrará menos propositalmente)
            dia = random.randint(1, 28)
            data_fake = datetime(
                year=ano, month=mes, day=dia, hour=random.randint(9, 18)
            )

            agd = Agendamento(
                cliente_id=c1.id,
                barbeiro_id=b2.id,
                data_agendamento=data_fake,
                status=Agendamento.STATUS_CONCLUIDO,
                pago=True,
                observacoes="Fake Data - B2 - Serviço Barato",
            )
            agendamentos_b2.append(agd)

        # Persiste os agendamentos para obter os IDs (necessário para o M2M)
        db.session.add_all(agendamentos_b1 + agendamentos_b2)
        db.session.flush()  # Gera IDs sem commitar ainda

        # 5. Vincula os serviços via tabela de associação M2M (agendamento_servico)
        for agd in agendamentos_b1:
            db.session.add(AgendamentoServico(agendamento_id=agd.id, servico_id=s1.id))

        for agd in agendamentos_b2:
            db.session.add(AgendamentoServico(agendamento_id=agd.id, servico_id=s2.id))

        db.session.commit()
        print(
            f"SUCESSO! 23 Transacoes Genuinas Pagas injetadas no banco em {mes}/{ano}!"
        )


if __name__ == "__main__":
    popular_banco()
