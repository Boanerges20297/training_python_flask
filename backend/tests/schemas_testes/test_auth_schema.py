import sys
import io
from pathlib import Path
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

URL_BASE = "http://localhost:5000/api/auth"


def testar():
    print("\n--- Testando LoginSchema ---")
    relatorio = []

    # POST Email
    r1 = requests.post(
        f"{URL_BASE}/login", json={"email": "qualquercoisa", "senha": "123"}
    )
    if r1.status_code == 400:
        relatorio.append("✅ (POST Login) E-mail com formato inválido barrado")
    else:
        relatorio.append(
            f"❌ (POST Login) E-mail com formato inválido permitdo (Status {r1.status_code})"
        )

    r2 = requests.post(
        f"{URL_BASE}/login", json={"email": "admin@barba.com", "senha": "123@123"}
    )
    if r2.status_code == 200:
        relatorio.append("✅ (POST Login) Login com dados válidos passou")
    else:
        relatorio.append(
            f"❌ (POST Login) Falha ao fazer login com dados válidos (Status {r2.status_code})"
        )

    for r in relatorio:
        print(r)


if __name__ == "__main__":
    testar()
