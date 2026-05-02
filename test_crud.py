import requests

BASE_URL = "http://localhost:5000/api"
session = requests.Session()

def test_login():
    print("--- Testando Login ---")
    res = session.post(f"{BASE_URL}/auth/login", json={"email": "admin@barba.com", "senha": "admin123"})
    print(res.status_code, res.json())
    return res.status_code == 200

def test_client_crud():
    print("\n--- Testando Cliente CRUD ---")
    # CREATE
    data = {
        "nome": "Cliente Teste",
        "email": "cliente123@teste.com",
        "telefone": "11988887777",
        "senha": "password123",
        "imagem_url": "http://img.com/x.jpg",
        "observacoes": "Observação teste"
    }
    res = session.post(f"{BASE_URL}/clientes", json=data)
    print("CREATE:", res.status_code, res.json())
    if res.status_code != 201: return
    
    client_id = res.json().get("dados", {}).get("cliente", {}).get("id")
    
    # READ
    res = session.get(f"{BASE_URL}/clientes")
    print("READ ALL:", res.status_code)
    
    # UPDATE
    res = session.patch(f"{BASE_URL}/clientes/{client_id}", json={"nome": "Cliente Atualizado"})
    print("UPDATE:", res.status_code, res.json())
    
    # DELETE
    res = session.delete(f"{BASE_URL}/clientes/{client_id}")
    print("DELETE:", res.status_code, res.json())

def test_barbeiro_crud():
    print("\n--- Testando Barbeiro CRUD ---")
    data = {
        "nome": "Barbeiro Teste",
        "email": "barbeiro123@teste.com",
        "telefone": "11888887777",
        "senha": "password123",
        "especialidades": ["Corte", "Barba"],
        "comissao_percentual": 50.0
    }
    res = session.post(f"{BASE_URL}/barbeiros", json=data)
    print("CREATE:", res.status_code, res.json())
    if res.status_code != 201: return
    barbeiro_id = res.json().get("dados", {}).get("barbeiro", {}).get("id")
    
    res = session.patch(f"{BASE_URL}/barbeiros/{barbeiro_id}", json={"nome": "Barbeiro Atualizado"})
    print("UPDATE:", res.status_code, res.json())
    
    res = session.delete(f"{BASE_URL}/barbeiros/{barbeiro_id}")
    print("DELETE:", res.status_code, res.json())

def test_servico_crud():
    print("\n--- Testando Serviço CRUD ---")
    data = {
        "nome": "Corte Simples",
        "descricao": "Corte de cabelo",
        "preco": 30.0,
        "duracao_minutos": 30
    }
    res = session.post(f"{BASE_URL}/servicos/", json=data)
    print("CREATE:", res.status_code, res.json())
    if res.status_code != 201: return
    servico_id = res.json().get("dados", {}).get("servico", {}).get("id")
    
    res = session.patch(f"{BASE_URL}/servicos/{servico_id}", json={"preco": 35.0})
    print("UPDATE:", res.status_code, res.json())
    
    res = session.delete(f"{BASE_URL}/servicos/{servico_id}")
    print("DELETE:", res.status_code, res.json())


if test_login():
    # Grab CSRF Token from cookies
    csrf = session.cookies.get('csrf_access_token')
    if csrf:
        session.headers.update({'X-CSRF-TOKEN': csrf})
    test_client_crud()
    test_barbeiro_crud()
    test_servico_crud()
