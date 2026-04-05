#josue inicio
from abc import ABC, abstractmethod
from app import db
#aqui fazemos os commit's dos clientes e barbeiros
#essa metodologia nos ajuda no aproveitamento de codigo
class BaseSeeder(ABC):
    '''essa é a classe base para todos os seeders'''
  #metodo pricipal
    @abstractmethod
    def obter_dados(self):
        pass

    def run(self):
        dados  = self.obter_dados()
        try:
            db.session.add_all(dados)
            db.session.commit()
            print(f'Dados inseridos com sucesso')
        except Exception as e:
            db.session.rollback()
            print(f'Erro ao inserir dados: {e}')
#josue fim