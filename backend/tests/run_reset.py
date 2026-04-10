#josue inicio
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from tests.seeds.reset_tabela import GerenciadorDeTabelas
from app.models import Cliente, Barbeiro, Servico, Agendamento, Admin


app = create_app()

with app.app_context():
   # aki deletamos a tabela pelo id
   GerenciadorDeTabelas.deletar_por_id(Barbeiro,1)
  
#josue fim