import requests

BASE_URL = "http://localhost:5000"
DASHBOARD_BASE = f"{BASE_URL}/api/dashboard"
AUTH_LOGIN = f"{BASE_URL}/api/auth/login"
BARBEIROS_LIST = f"{BASE_URL}/api/barbeiros/"

ADMIN_EMAIL = "admin@barba.com"
ADMIN_SENHA = "123@123"
BARBEIRO_EMAIL = "marcos@barbabyte.com"
BARBEIRO_SENHA = "123@123"

relatorio = {
    "admin_geral_200": False,
    "admin_geral_dias_invalido_400": False,
    "admin_receita_periodo_200": False,
    "admin_horarios_populares_200": False,
    "barbeiro_proprio_dashboard_200": False,
    "barbeiro_outro_dashboard_403": False,
    "admin_barbeiro_inexistente_404": False,
    "sem_token_401_ou_422": False,
}


def login(email, senha):
    session = requests.Session()
    response = session.post(AUTH_LOGIN, json={"email": email, "senha": senha})
    if response.status_code != 200:
        raise RuntimeError(f"Falha no login ({email}): {response.status_code} - {response.text}")

    data = response.json()
    user_id = data.get("user", {}).get("id")
    if user_id is None:
        raise RuntimeError(f"Login sem user.id no payload ({email})")

    return session, int(user_id)


def get_outro_barbeiro_id(session, meu_id):
    response = session.get(BARBEIROS_LIST)
    if response.status_code != 200:
        return None

    barbeiros = response.json().get("barbeiros", [])
    for barbeiro in barbeiros:
        barbeiro_id = barbeiro.get("id")
        if barbeiro_id and int(barbeiro_id) != int(meu_id):
            return int(barbeiro_id)

    return None


def testar_dashboard_admin(admin_session):
    r = admin_session.get(f"{DASHBOARD_BASE}/geral", params={"dias": 30})
    if r.status_code == 200 and "data" in r.json():
        relatorio["admin_geral_200"] = True

    r = admin_session.get(f"{DASHBOARD_BASE}/geral", params={"dias": 0})
    if r.status_code == 400:
        relatorio["admin_geral_dias_invalido_400"] = True

    r = admin_session.get(f"{DASHBOARD_BASE}/receita-periodo", params={"dias": 30})
    if r.status_code == 200 and isinstance(r.json().get("data"), list):
        relatorio["admin_receita_periodo_200"] = True

    r = admin_session.get(f"{DASHBOARD_BASE}/horarios-populares", params={"dias": 30})
    if r.status_code == 200 and isinstance(r.json().get("data"), list):
        relatorio["admin_horarios_populares_200"] = True

    r = admin_session.get(f"{DASHBOARD_BASE}/barbeiro/999999", params={"dias": 30})
    if r.status_code == 404:
        relatorio["admin_barbeiro_inexistente_404"] = True


def testar_dashboard_barbeiro(barbeiro_session, barbeiro_id):
    r = barbeiro_session.get(f"{DASHBOARD_BASE}/barbeiro/{barbeiro_id}", params={"dias": 30})
    if r.status_code == 200 and "data" in r.json():
        relatorio["barbeiro_proprio_dashboard_200"] = True

    outro_id = get_outro_barbeiro_id(barbeiro_session, barbeiro_id)
    if outro_id is None:
        return

    r = barbeiro_session.get(f"{DASHBOARD_BASE}/barbeiro/{outro_id}", params={"dias": 30})
    if r.status_code == 403:
        relatorio["barbeiro_outro_dashboard_403"] = True


def testar_sem_token():
    r = requests.get(f"{DASHBOARD_BASE}/barbeiro/1", params={"dias": 30})
    if r.status_code in (401, 422):
        relatorio["sem_token_401_ou_422"] = True


def imprimir_relatorio_final():
    print("\n================ RELATORIO DASHBOARD (ROTAS) ================")
    for nome, resultado in relatorio.items():
        status = "PASSOU" if resultado else "FALHOU"
        print(f"- {nome}: {status}")


if __name__ == "__main__":
    admin_session, _ = login(ADMIN_EMAIL, ADMIN_SENHA)
    barbeiro_session, barbeiro_id = login(BARBEIRO_EMAIL, BARBEIRO_SENHA)

    testar_dashboard_admin(admin_session)
    testar_dashboard_barbeiro(barbeiro_session, barbeiro_id)
    testar_sem_token()

    imprimir_relatorio_final()
