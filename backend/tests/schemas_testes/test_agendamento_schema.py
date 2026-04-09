import sys
import io
from pathlib import Path
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

URL_BASE = "http://localhost:5000/api/agendamento"

def testar():
    print("\n--- Testando AgendamentoSchema ---")
    relatorio = []

    horario = "2028-12-31T12:00:00"

    # POST Status
    r1 = requests.post(
        f"{URL_BASE}/criar-agendamento",
        json={
            "cliente_id": 1,
            "barbeiro_id": 1,
            "servico_id": 1,
            "data_agendamento": horario,
            "status": "invalido",
            "observacoes": "",
        },
    )
    if r1.status_code == 400:
        relatorio.append("✅ (POST) Status inválido barrado")
    else:
        relatorio.append(f"❌ (POST) Status inválido permitido (Status {r1.status_code})")

    # PATCH Status
    r3 = requests.patch(
        f"{URL_BASE}/editar-agendamento/999", json={"status": "invalido"}
    )
    if r3.status_code == 400:
        relatorio.append("✅ (PATCH) Status inválido barrado")
    else:
        relatorio.append(f"❌ (PATCH) Status inválido permitido (Status {r3.status_code})")

    # --- 200 OK TESTS --- #
    print("\n- Tentando criar e editar agendamento com DADOS VÁLIDOS")
    criado_id = None
    r_post = requests.post(f"{URL_BASE}/criar-agendamento", json={
        "cliente_id": 1,
        "barbeiro_id": 1,
        "servico_id": 1,
        "data_agendamento": "2028-12-30T10:00:00",
        "observacoes": "Agendamento novo bom."
    })
    
    if r_post.status_code in [200, 201]:
        criado_id = r_post.json()["agendamento"]["id"]
        relatorio.append("✅ (POST) Criação com dados válidos passou")
    else:
        relatorio.append(f"❌ (POST) Falha ao criar dados válidos (Status {r_post.status_code} | {r_post.text})")

    if criado_id:
        r_patch = requests.patch(f"{URL_BASE}/editar-agendamento/{criado_id}", json={"status": "confirmado"})
        if r_patch.status_code == 200:
            relatorio.append("✅ (PATCH) Edição com dados válidos passou")
        else:
            relatorio.append(f"❌ (PATCH) Falha ao editar dados válidos (Status {r_patch.status_code} | {r_patch.text})")
        
        r_del = requests.delete(f"{URL_BASE}/deletar-agendamento/{criado_id}")
        if r_del.status_code == 200:
            relatorio.append("✅ (DELETE) Registro de teste deletado com sucesso")
        else:
            relatorio.append(f"❌ (DELETE) Falha ao deletar registro de teste (Status {r_del.status_code})")

    for r in relatorio:
        print(r)

if __name__ == "__main__":
    testar()
