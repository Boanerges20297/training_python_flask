import os
import sys
from datetime import datetime, timedelta, timezone

from flask_jwt_extended import create_access_token

# Adiciona a pasta raiz do backend ao path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app import create_app  # noqa: E402
from app.models.barbeiro import Barbeiro  # noqa: E402


app = create_app()


def _auth_client_as_admin(client):
    """Injects an admin JWT cookie into the Flask test client."""
    token = create_access_token(identity="1", additional_claims={"role": "admin"})
    client.set_cookie("access_token_cookie", token)


def _run_endpoint(client, path, expected_statuses):
    response = client.get(path)
    ok = response.status_code in expected_statuses
    return {
        "path": path,
        "status": response.status_code,
        "ok": ok,
        "body": response.get_json(silent=True),
    }


def run_dashboard_route_tests():
    results = []

    with app.app_context():
        client = app.test_client()
        _auth_client_as_admin(client)

        # Resolve a barber id if available so we can exercise barber-specific routes.
        barbeiro = Barbeiro.query.first()
        barbeiro_id = barbeiro.id if barbeiro else 1

        hoje = datetime.now(timezone.utc).date()
        inicio = (hoje - timedelta(days=30)).isoformat()
        fim = hoje.isoformat()

        tests = [
            ("/api/dashboard/geral?dias=30", {200}),
            ("/api/dashboard/receita-periodo?dias=30", {200}),
            ("/api/dashboard/horarios-populares?dias=30", {200}),
            ("/api/dashboard/ganhos-totais?periodo=mes", {200}),
            ("/api/dashboard/ganhos-barbeiros?periodo=mes", {200}),
            (f"/api/dashboard/atendimentos-gerais?data_inicio={inicio}&data_fim={fim}", {200}),
            (f"/api/dashboard/atendimentos-barbeiros?data_inicio={inicio}&data_fim={fim}", {200}),
            ("/api/dashboard/servico-mais-procurado", {200}),
            ("/api/dashboard/cliente-mais-atendimentos", {200}),
            (f"/api/dashboard/barbeiro/{barbeiro_id}?dias=30", {200, 404}),
            (f"/api/dashboard/servicos-barbeiro/{barbeiro_id}?dias=30", {200, 404}),
        ]

        for path, expected in tests:
            results.append(_run_endpoint(client, path, expected))

    print("\n=== RESULTADO TESTES DASHBOARD ROUTES ===")
    failed = [r for r in results if not r["ok"]]

    for r in results:
        status = "PASS" if r["ok"] else "FAIL"
        print(f"[{status}] {r['path']} -> HTTP {r['status']}")

    if failed:
        print("\nFalhas encontradas:")
        for r in failed:
            print(f"- {r['path']} retornou {r['status']}")
            print(f"  body: {r['body']}")
        return 1

    print("\nTodos os endpoints de dashboard responderam dentro do esperado.")
    return 0


if __name__ == "__main__":
    raise SystemExit(run_dashboard_route_tests())
