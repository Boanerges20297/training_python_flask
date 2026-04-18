import sys
import os

# Adiciona o diretório atual ao path para importar a app
sys.path.append(os.getcwd())

from app import create_app, db
from app.models.admin import Admin

app = create_app()

with app.app_context():
    # 1. Reset admin@barba.com
    admin_barba = Admin.query.filter_by(email='admin@barba.com').first()
    if admin_barba:
        admin_barba.senha = 'admin123'
        print(f"SENHA ATUALIZADA: {admin_barba.email} -> admin123")
    else:
        # Se não existir, criamos (Fase 1 do relatório pedia este admin)
        admin_barba = Admin(nome='Admin Master', email='admin@barba.com', role='admin')
        admin_barba.senha = 'admin123'
        db.session.add(admin_barba)
        print(f"USUÁRIO CRIADO: {admin_barba.email} -> admin123")

    # 2. Reset admin@gmail.com (opcional, para conveniência do usuário)
    admin_gmail = Admin.query.filter_by(email='admin@gmail.com').first()
    if admin_gmail:
        admin_gmail.senha = 'admin123'
        print(f"SENHA ATUALIZADA: {admin_gmail.email} -> admin123")
    
    db.session.commit()
    print("MUDANÇAS SALVAS NO BANCO DE DADOS COM SUCESSO.")
