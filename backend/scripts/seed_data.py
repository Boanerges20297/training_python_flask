import sys
import os
import random
from datetime import datetime, timedelta, timezone
from faker import Faker

# Setup paths
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app, db
from app.models import Admin, Cliente, Barbeiro, Servico, Agendamento, TokenBlocklist

fake = Faker('pt_BR')
app = create_app()

def clear_data():
    print("Limpando dados antigos...")
    Agendamento.query.delete()
    Cliente.query.delete()
    Barbeiro.query.delete()
    Servico.query.delete()
    Admin.query.delete()
    TokenBlocklist.query.delete()
    db.session.commit()

def seed():
    with app.app_context():
        clear_data()

        print("Criando Admin...")
        admin = Admin(nome="Admin BarbaByte", email="admin@barba.com", role="admin")
        admin.senha = "admin123"
        db.session.add(admin)

        print("Criando Serviços realistas...")
        servicos_data = [
            {"nome": "Corte Social", "preco": 50.0, "duracao": 30},
            {"nome": "Degradê Moderno", "preco": 65.0, "duracao": 45},
            {"nome": "Barba Express", "preco": 35.0, "duracao": 20},
            {"nome": "Combo Barba & Cabelo", "preco": 100.0, "duracao": 60},
            {"nome": "Limpeza de Pele", "preco": 45.0, "duracao": 30},
            {"nome": "Corte Kids", "preco": 40.0, "duracao": 30},
            {"nome": "Penteado & Finalização", "preco": 30.0, "duracao": 15},
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

        print("Criando Barbeiros...")
        barbeiros = []
        for _ in range(5):
            barbeiro = Barbeiro(
                nome=fake.name(),
                email=fake.email(),
                role="barbeiro"
            )
            barbeiro.senha = "barba123"
            db.session.add(barbeiro)
            barbeiros.append(barbeiro)
        db.session.commit()

        print("Criando Clientes (200)...")
        clientes = []
        for _ in range(200):
            cliente = Cliente(
                nome=fake.name(),
                email=fake.email(),
                telefone=fake.cellphone_number()
            )
            cliente.senha = "cliente123"
            db.session.add(cliente)
            clientes.append(cliente)
        db.session.commit()

        print("Gerando Histórico de Agendamentos (90 dias)...")
        # Gerar cerca de 1200 agendamentos
        start_date = datetime.now() - timedelta(days=90)
        
        for _ in range(1200):
            # Escolher um dia aleatório nos últimos 90 dias
            days_ago = random.randint(0, 90)
            date = start_date + timedelta(days=days_ago)
            
            # Viés para horários comerciais e picos (10h-12h e 16h-19h)
            hour_pool = [8, 9, 10, 10, 11, 11, 12, 13, 14, 15, 16, 16, 17, 17, 18, 18, 19]
            # Peso extra para sexta e sábado
            if date.weekday() in [4, 5]: # Friday, Saturday
                hour_pool.extend([10, 11, 14, 15, 16, 17, 18, 19])
            
            hour = random.choice(hour_pool)
            minute = random.choice([0, 15, 30, 45])
            
            scheduled_time = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # Status distribution: 85% Concluido, 10% Cancelado, 5% Pendente
            rand_status = random.random()
            if scheduled_time > datetime.now():
                status = "pendente"
                pago = False
            elif rand_status < 0.85:
                status = "concluido"
                pago = True
            elif rand_status < 0.95:
                status = "cancelado"
                pago = False
            else:
                status = "pendente"
                pago = False

            servico = random.choice(servicos)
            agendamento = Agendamento(
                cliente_id=random.choice(clientes).id,
                barbeiro_id=random.choice(barbeiros).id,
                servico_id=servico.id,
                data_agendamento=scheduled_time,
                status=status,
                pago=pago,
                preco=servico.preco,
                observacoes=fake.sentence() if random.random() > 0.8 else None
            )
            db.session.add(agendamento)
            
        db.session.commit()
        print(f"Sucesso! {Agendamento.query.count()} agendamentos criados.")

if __name__ == "__main__":
    seed()
