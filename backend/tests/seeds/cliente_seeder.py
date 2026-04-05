#josue inicio
from app import db
from app.models import Cliente
from tests.seeds.base import BaseSeeder

class ClientSeeder(BaseSeeder):
    def obter_dados(self):
        print('Obtendo dados dos clientes')
        return [
            Cliente(
                nome='João Silva',
                telefone='11999999999',
                email='joao@barbabyte.com',
                senha='123'
            ),
            Cliente(
                nome='Maria Oliveira',
                telefone='11988888888',
                email='maria@barbabyte.com',
                senha='123'
            )   

        ]
#josue fim