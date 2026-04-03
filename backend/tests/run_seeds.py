import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app,db
from tests.seeds.cliente_seeder import ClientSeeder
from tests.seeds.barberiro_seeder import BarbeiroSeeder

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()
    '''aqui todos os seeders sao criados'''
    rodar_seeders = [

        ClientSeeder(),
        BarbeiroSeeder()
    ]
    for seeder in rodar_seeders:
        seeder.run()

    print('Dados inseridos com sucesso')