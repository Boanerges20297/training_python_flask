from app import create_app, db
from app.models.admin import Admin

def seed_admin():
    app = create_app()
    with app.app_context():
        # Verifica se já existe um admin com esse email
        admin_existente = Admin.query.filter_by(email='admin@barba.com').first()
        
        if admin_existente:
            print("Admin padrão já existe: admin@barba.com")
            return

        # Criar novo admin
        novo_admin = Admin(
            nome='Administrador Master',
            email='admin@barba.com',
            role=Admin.ROLE_ADMIN,
            ativo=True
        )
        novo_admin.set_senha('admin123')
        
        db.session.add(novo_admin)
        db.session.commit()
        
        print("Sucesso! Admin criado!")
        print("Email: admin@barba.com")
        print("Senha: admin123")

if __name__ == '__main__':
    seed_admin()
