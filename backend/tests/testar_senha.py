import sys
import os
# Isso faz o Python enxergar a pasta 'backend' que está um nível atrás
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.models.mixins import HashSenhaMixin
from app.models.cliente import Cliente

cliente = Cliente(nome="Josue", telefone="11999999999", email="teste@teste.com")
cliente.senha = "123456"

print(cliente.senha_hash)
print(len(cliente.senha_hash))