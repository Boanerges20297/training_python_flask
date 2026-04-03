from tests.seeds.base import BaseSeeder
from app import create_app, db
from app.models.admin import Admin
class AdminSeeder(BaseSeeder):
    def obter_dados(self):
        return [
            Admin(
                nome='Administrador Master',
                email='admin@barba.com',
                role=Admin.ROLE_ADMIN,
                ativo=True,
                senha='123@123'
            ),
            Admin(
                nome='Administrador Teste',
                email='admin@teste.com',
                role=Admin.ROLE_ADMIN,
                ativo=True,
                senha='123123'
            )
        ]

