import sys
import io
from pathlib import Path
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

URL_BASE = "http://localhost:5000/api/servicos"

def testar():
    print("\n--- Testando ServicoSchema ---")
    relatorio = []

    # POST Preco
    r1 = requests.post(f"{URL_BASE}/criar-servico", json={"nome": "Teste", "descricao": "T", "preco": -10.0, "duracao_minutos": 30, "barbeiro_id": 1})
    if r1.status_code == 400:
        relatorio.append("✅ (POST) Preço negativo barrado")
    else:
        relatorio.append(f"❌ (POST) Preço negativo permitido (Status {r1.status_code})")

    # POST Duracao
    r2 = requests.post(f"{URL_BASE}/criar-servico", json={"nome": "Teste", "descricao": "T", "preco": 10.0, "duracao_minutos": 0, "barbeiro_id": 1})
    if r2.status_code == 400:
        relatorio.append("✅ (POST) Duração 0 ou menos barrado")
    else:
        relatorio.append(f"❌ (POST) Duração zerada/negativa permitida (Status {r2.status_code})")

    # PATCH Preco
    r3 = requests.patch(f"{URL_BASE}/editar-servico/999", json={"preco": -20.0})
    if r3.status_code == 400:
        relatorio.append("✅ (PATCH) Preço negativo barrado")
    else:
        relatorio.append(f"❌ (PATCH) Preço negativo permitido (Status {r3.status_code})")

    # PATCH Duracao
    r4 = requests.patch(f"{URL_BASE}/editar-servico/999", json={"duracao_minutos": -5})
    if r4.status_code == 400:
        relatorio.append("✅ (PATCH) Duração negativa barrado")
    else:
        relatorio.append(f"❌ (PATCH) Duração negativa permitida (Status {r4.status_code})")

    # --- 200 OK TESTS --- #
    print("\n- Tentando criar e editar serviço com DADOS VÁLIDOS")
    criado_id = None
    r_post = requests.post(f"{URL_BASE}/criar-servico", json={
        "nome": "Corte Unico Teste",
        "descricao": "Bem legal",
        "preco": 30.0,
        "duracao_minutos": 40,
        "barbeiro_id": 1
    })
    if r_post.status_code in [200, 201]:
        criado_id = r_post.json()["servico"]["id"]
        relatorio.append("✅ (POST) Criação com dados válidos passou")
    else:
        relatorio.append(f"❌ (POST) Falha ao criar dados válidos (Status {r_post.status_code})")

    if criado_id:
        r_patch = requests.patch(f"{URL_BASE}/editar-servico/{criado_id}", json={"preco": 35.0})
        if r_patch.status_code == 200:
            relatorio.append("✅ (PATCH) Edição com dados válidos passou")
        else:
            relatorio.append(f"❌ (PATCH) Falha ao editar dados válidos (Status {r_patch.status_code})")
        
        r_del = requests.delete(f"{URL_BASE}/deletar-servico/{criado_id}")
        if r_del.status_code == 200:
            relatorio.append("✅ (DELETE) Registro de teste deletado com sucesso")
        else:
            relatorio.append(f"❌ (DELETE) Falha ao deletar registro de teste (Status {r_del.status_code})")

    for r in relatorio:
        print(r)

if __name__ == "__main__":
    testar()
