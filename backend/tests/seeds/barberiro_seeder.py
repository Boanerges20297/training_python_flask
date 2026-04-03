from app import db
from app.models import Barbeiro
from tests.seeds.base import BaseSeeder

class BarbeiroSeeder(BaseSeeder):
    def obter_dados(self):
        print('Obtendo dados dos barbeiros')
        return [
            Barbeiro(
                nome='Marcos Navalha',
                especialidade='Pigmentação', 
                telefone='1197777', 
                email='marcos@barbabyte.com', 
                senha='123'),
            Barbeiro(
                nome='Carlos Tesoura', 
                especialidade='Corte Clássico', 
                telefone='1196666', 
                email='carlos@barbabyte.com', 
                senha='123'
            )
        ]
