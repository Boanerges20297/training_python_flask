import sys
import io
from pathlib import Path
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

URL_BASE = "http://localhost:5000/api/clientes"


def testar():
    print("\n--- Testando ClienteSchema ---")
    relatorio = []

    # POST Email Invalido
    r1 = requests.post(
        f"{URL_BASE}/criar-cliente",
        json={
            "nome": "Teste",
            "telefone": "11999999999",
            "email": "invalido",
            "senha": "senha",
        },
    )
    if r1.status_code == 400:
        relatorio.append("✅ (POST) Email Inválido barrado")
    else:
        relatorio.append(
            f"❌ (POST) Email Inválido permitido (Status {r1.status_code})"
        )

    # POST Telefone Invalido
    r2 = requests.post(
        f"{URL_BASE}/criar-cliente",
        json={
            "nome": "Teste",
            "telefone": "nome-texto",
            "email": "teste@email.com",
            "senha": "senha",
        },
    )
    if r2.status_code == 400:
        relatorio.append("✅ (POST) Telefone Inválido barrado")
    else:
        relatorio.append(
            f"❌ (POST) Telefone Inválido permitido (Status {r2.status_code})"
        )

    # PATCH Email Invalido
    r3 = requests.patch(f"{URL_BASE}/editar-cliente/999", json={"email": "invalido"})
    if r3.status_code == 400:
        relatorio.append("✅ (PATCH) Email Inválido barrado")
    else:
        relatorio.append(
            f"❌ (PATCH) Email Inválido permitido (Status {r3.status_code})"
        )

    # PATCH Telefone Invalido
    r4 = requests.patch(
        f"{URL_BASE}/editar-cliente/999", json={"telefone": "telefone-texto"}
    )
    if r4.status_code == 400:
        relatorio.append("✅ (PATCH) Telefone Inválido barrado")
    else:
        relatorio.append(
            f"❌ (PATCH) Telefone Inválido permitido (Status {r4.status_code})"
        )

    # --- 200 OK TESTS --- #
    print("\n- Tentando criar e editar cliente com DADOS VÁLIDOS")
    criado_id = None
    r_post = requests.post(
        f"{URL_BASE}/criar-cliente",
        json={
            "nome": "João Valido",
            "telefone": "11988887777",
            "email": "valido@email.com",
            "senha": "password_forte",
        },
    )
    if r_post.status_code in [200, 201]:
        criado_id = r_post.json()["cliente"]["id"]
        relatorio.append("✅ (POST) Criação com dados válidos passou")
    else:
        relatorio.append(
            f"❌ (POST) Falha ao criar dados válidos (Status {r_post.status_code})"
        )

    if criado_id:
        r_patch = requests.patch(
            f"{URL_BASE}/editar-cliente/{criado_id}", json={"telefone": "11988886666"}
        )
        if r_patch.status_code == 200:
            relatorio.append("✅ (PATCH) Edição com dados válidos passou")
        else:
            print(r_patch.json())
            relatorio.append(
                f"❌ (PATCH) Falha ao editar dados válidos (Status {r_patch.status_code})"
            )

        # Deleta a coluna recem criada. Cliente possui @admin_required, então mandamos o mock token que a sua API gera por enquanto.
        headers = {"Authorization": "Bearer mock-session-token-abc-123"}
        r_del = requests.delete(
            f"{URL_BASE}/deletar-cliente/{criado_id}", headers=headers
        )
        if r_del.status_code == 200:
            relatorio.append("✅ (DELETE) Registro de teste deletado com sucesso")
        else:
            relatorio.append(
                f"❌ (DELETE) Falha ao deletar registro de teste (Status {r_del.status_code})"
            )

    for r in relatorio:
        print(r)


if __name__ == "__main__":
    testar()
