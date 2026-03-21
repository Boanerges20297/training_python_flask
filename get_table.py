import requests

req = requests.get('http://localhost:5000/api/clientes/listar_clientes')
print("Dados recebidos:", req.json())