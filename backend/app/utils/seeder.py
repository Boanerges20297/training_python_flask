import random
from datetime import datetime, timedelta
from faker import Faker
from app.extensions import db
from app.models import Admin, Cliente, Barbeiro, Servico, Agendamento, TokenBlocklist

def seed_database():
    fake = Faker('pt_BR')
    
    # 1. Limpar dados
    Agendamento.query.delete()
    Cliente.query.delete()
    Barbeiro.query.delete()
    Servico.query.delete()
    Admin.query.delete()
    TokenBlocklist.query.delete()
    db.session.commit()

    # 2. Admin
    admin = Admin(nome="Admin BarbaByte", email="admin@barba.com", role="admin")
    admin.senha = "admin123"
    db.session.add(admin)

    # 3. Serviços
    servicos_data = [
        {"nome": "Corte Social", "preco": 50.0, "duracao": 30},
        {"nome": "Degradê Moderno", "preco": 65.0, "duracao": 45},
        {"nome": "Barba Express", "preco": 35.0, "duracao": 20},
        {"nome": "Combo Barba & Cabelo", "preco": 100.0, "duracao": 60},
        {"nome": "Limpeza de Pele", "preco": 45.0, "duracao": 30},
        {"nome": "Corte Kids", "preco": 40.0, "duracao": 30},
    ]
    servicos = []
    for s in servicos_data:
        servico = Servico(
            nome=s["nome"], 
            preco=s["preco"], 
            duracao_minutos=s["duracao"],
            descricao=fake.sentence()
        )
        db.session.add(servico)
        servicos.append(servico)
    db.session.commit()

    # 4. Barbeiros
    barbeiros = []
    for _ in range(5):
        barbeiro = Barbeiro(
            nome=fake.name(), 
            email=fake.email(),
            telefone=fake.cellphone_number(),
            ativo=True
        )
        barbeiro.senha = "barba123"
        db.session.add(barbeiro)
        barbeiros.append(barbeiro)
    db.session.commit()

    # 5. Clientes
    clientes = []
    for _ in range(150):
        # Usamos try/except ou garantimos telefones únicos para o seeder
        try:
            cliente = Cliente(
                nome=fake.name(), 
                email=fake.email(), 
                telefone=fake.cellphone_number(),
                status="ativo"
            )
            cliente.senha = "cliente123"
            db.session.add(cliente)
            db.session.flush() # Para pegar o ID
            clientes.append(cliente)
        except:
            db.session.rollback()
            continue
    db.session.commit()

    # 6. Agendamentos
    start_date = datetime.now() - timedelta(days=90)
    for _ in range(800):
        days_ago = random.randint(0, 90)
        date = start_date + timedelta(days=days_ago)
        hour = random.choice([8, 9, 10, 11, 14, 15, 16, 17, 18, 19])
        minute = random.choice([0, 30])
        scheduled_time = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        if scheduled_time > datetime.now():
            status = "pendente"
            pago = False
        else:
            status = random.choice(["concluido", "concluido", "concluido", "cancelado"])
            pago = (status == "concluido")

        servico = random.choice(servicos)
        agendamento = Agendamento(
            cliente_id=random.choice(clientes).id,
            barbeiro_id=random.choice(barbeiros).id,
            servico_id=servico.id,
            data_agendamento=scheduled_time,
            status=status,
            pago=pago,
            preco=servico.preco
        )
        db.session.add(agendamento)
    
    db.session.commit()
    return {"total_agendamentos": Agendamento.query.count(), "total_clientes": len(clientes)}
