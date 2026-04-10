# Criado por Vinicius 31/03/2026

import sys
import io
from pathlib import Path
import requests
from datetime import datetime

# Set standard output and error to utf-8 to safely print emojis on Windows Console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# Adiciona a pasta raiz ao path do Python
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


url_base = "http://localhost:5000/api/agendamento"
# Horario para ser usado nos testes
horario = "2028-12-31T12:00:00"
# Variavel para verificar apos o fechamento do estabelecimento
fora_do_horario_funcionamento = "2028-12-31T20:00:01"
# Variavel para verificar antes da abertura do estabelecimento
fora_do_horario_funcionamento2 = "2028-12-31T07:59:59"

# Configurar dados no banco que as chaves estrangeiras precisam
requests.post(
    "http://localhost:5000/api/servicos/criar-servico",
    json={
        "nome": "Servico Teste Agendamento",
        "preco": 10.0,
        "duracao_minutos": 30,
        "barbeiro_id": 1,
    },
)
# Nós assumimos que cliente_id=1, barbeiro_id=1 e servico_id=1 já existem ou foram criados pelo código acima e run_seeds.py

relatorio = {
    "criacao_agendamento": False,
    "conflitos_horario_agendamentos": False,
    "horario_funcionamento": {"apos_fechamento": False, "antes_abertura": False},
}


# Função para deletar agendamento criado para o teste
def deletar_agendamento_teste(id):
    """Deletar agendamento criado para o teste"""
    try:
        print("Deletando agendamento criado para o teste")
        response = requests.delete(f"{url_base}/deletar-agendamento/{id}")
        if response.status_code == 200:
            print("✅ Agendamento deletado com sucesso!")
            print(f"Resposta da API: {response.json()}")
        else:
            print(f"❌ Erro ao deletar agendamento: {response.status_code}")
            print(response.json()["erro"])
    except Exception as e:
        print(f"❌ Erro ao deletar agendamento teste: {e}")


# Teste para criação de agendamento
def criacao_agendamento_teste():
    """Testes para testar a criação de agendamentos"""
    try:
        print("- Iniciando teste de criação de agendamento")
        print("- Criando agendamento para o teste")
        print(f"Horario utiliziado: {horario}")
        response = requests.post(
            f"{url_base}/criar-agendamento",
            json={
                "cliente_id": 1,
                "barbeiro_id": 1,
                "servico_id": 1,
                "data_agendamento": horario,
                "observacoes": "teste",
            },
        )

        if response.status_code == 201:
            print("- Agendamento criado com sucesso!")
            print(f"Resposta da API: {response.json()}")
            id = response.json()["agendamento"]["id"]
            print("✅ Passou no teste - Criação de agendamento")
            relatorio["criacao_agendamento"] = True
        else:
            print(f"- Agendamento não criado")
            print(f"❌ Não passou no teste")
            print(f"Resposta da API: {response.json()}")
            print(f"Status code da API: {response.status_code}")
            relatorio["criacao_agendamento"] = False

        deletar_agendamento_teste(id)
        print("----------------------------------")

    except Exception as e:
        print(f"❌ Erro ao testar criação de agendamento: {e}")
        relatorio["criacao_agendamento"] = False
        print("----------------------------------")


def criacao_agendamento_com_payload_invalido_teste():
    """Testes para testar a criação de agendamentos com payload inválido"""
    try:
        print("- Iniciando teste de criação de agendamento com payload inválido")
        print("- Criando agendamento com payload inválido para o teste")
        print(f"Horario utiliziado: {horario}")
        response = requests.post(
            f"{url_base}/criar-agendamento",
            json={
                "cliente_id": 1,
                "barbeiro_id": 1,
                "servico_id": 1,
                "data_agendamento": horario,
                "observacoes": "teste",
            },
        )

        if response.status_code == 400:
            print("- Agendamento criado com sucesso!")
            print(f"Resposta da API: {response.json()}")
            relatorio["criacao_agendamento"] = True
            print("✅ Passou no teste")
        else:
            raise

        print("----------------------------------")
    except Exception as e:
        print(f"❌ Erro ao testar criação de agendamento com payload inválido: {e}")
        relatorio["criacao_agendamento"] = False
        print("----------------------------------")


def conflitos_horario_agendamentos_teste():
    """Testes para testar as verificações de conflitos de agendamentos"""
    # Teste para conflitos de agendamentos

    id_agendamento1 = 0

    try:
        print("- Iniciando teste de conflitos de agendamentos")
        print("- Tentando criar primeiro agendamento")
        print(f"Horario utiliziado: {horario}")
        response = requests.post(
            f"{url_base}/criar-agendamento",
            json={
                "cliente_id": 1,
                "barbeiro_id": 1,
                "servico_id": 1,
                "data_agendamento": horario,
                "observacoes": "teste",
            },
        )
        if response.status_code == 201:
            print("- Primeiro agendamento criado")
            print(f"Resposta da API: {response.json()}")
            id_agendamento1 = response.json()["agendamento"]["id"]
            print(f"id_agendamento1: {id_agendamento1}")
        else:
            print(f"❌ Erro ao criar agendamento: {response.status_code}")
            print(response.json()["erro"])

        print("- Tentando criar segundo agendamento no mesmo horario")
        print(f"Horario utiliziado: {horario}")
        response = requests.post(
            f"{url_base}/criar-agendamento",
            json={
                "cliente_id": 1,
                "barbeiro_id": 1,
                "servico_id": 1,
                "data_agendamento": horario,
                "observacoes": "teste",
            },
        )
        if response.status_code == 409:
            print("- Segundo agendamento não criado")
            print(f"Resposta da API: {response.json()['erro']}")
            print("✅ Passou no teste - Conflitos de agendamentos")
            relatorio["conflitos_horario_agendamentos"] = True
        else:
            print("- Segundo agendamento criado")
            print(f"❌ Não passou no teste")
            print(f"Resposta da API: {response.json()}")
            print(f"Status code api: {response.status_code}")
            relatorio["conflitos_horario_agendamentos"] = False

        deletar_agendamento_teste(id_agendamento1)
        print("----------------------------------")

    except Exception as e:
        print(f"❌ Erro ao testar conflitos: {e}")


def horario_funcionamento_teste():
    """Testes para testar as verificações de horario de funcionamento"""
    # Teste para horario de funcionamento apos o fechamento do estabelecimento
    try:
        print("- Iniciando teste de horario de funcionamento")
        print("- Tentando criar agendamento apos o fechamento do estabelecimento")
        print(f"Horario utiliziado: {fora_do_horario_funcionamento}")
        response = requests.post(
            f"{url_base}/criar-agendamento",
            json={
                "cliente_id": 1,
                "barbeiro_id": 1,
                "servico_id": 1,
                "data_agendamento": fora_do_horario_funcionamento,
                "observacoes": "teste",
            },
        )
        if response.status_code == 400:
            print("- Agendamento não criado")
            print(f"Resposta da API: {response.json()}")
            print("✅ Passou no teste - Horario de funcionamento após fechamento")
            relatorio["horario_funcionamento"]["apos_fechamento"] = True
        else:
            print(f"- Agendamento criado")
            print(f"❌ Não passou no teste")
            print(f"Status code api: {response.status_code}")
            print(f"Resposta da API: {response.json()}")
            relatorio["horario_funcionamento"]["apos_fechamento"] = False
            deletar_agendamento_teste(response.json()["agendamento"]["id"])

    except Exception as e:
        print(
            f"❌ Erro ao testar horario de funcionamento apos o fechamento do estabelecimento: {e}"
        )
        relatorio["horario_funcionamento"]["apos_fechamento"] = False

    try:
        print("----------------------------------")
        print("- Tentando criar agendamento antes da abertura do estabelecimento")
        print(f"Horario utiliziado: {fora_do_horario_funcionamento2}")
        response = requests.post(
            f"{url_base}/criar-agendamento",
            json={
                "cliente_id": 1,
                "barbeiro_id": 1,
                "servico_id": 1,
                "data_agendamento": fora_do_horario_funcionamento2,
                "observacoes": "teste",
            },
        )
        if response.status_code == 400:
            print("- Agendamento não criado")
            print(f"Resposta da API: {response.json()}")
            print("✅ Passou no teste - Horario de funcionamento antes da abertura")
            relatorio["horario_funcionamento"]["antes_abertura"] = True
        else:
            print(f"- Agendamento criado")
            print(f"❌ Não passou no teste")
            print(f"Status code api: {response.status_code}")
            print(f"Resposta da API: {response.json()}")
            relatorio["horario_funcionamento"]["antes_abertura"] = False
            deletar_agendamento_teste(response.json()["agendamento"]["id"])

    except Exception as e:
        print(
            f"❌ Erro ao testar horario de funcionamento antes da abertura do estabelecimento: {e}"
        )
        relatorio["horario_funcionamento"]["antes_abertura"] = False
        print("----------------------------------")


if __name__ == "__main__":
    criacao_agendamento_teste()
    conflitos_horario_agendamentos_teste()
    horario_funcionamento_teste()

    print(
        "----------------------------------RELATORIO----------------------------------"
    )
    print(
        f"""
    Relatorio de testes de agendamentos
    Criação de agendamento: {'✅ Passou no teste' if relatorio['criacao_agendamento'] == True else '❌ Não passou no teste'}
    Conflitos de agendamentos: {'✅ Passou no teste' if relatorio['conflitos_horario_agendamentos'] == True else '❌ Não passou no teste'}
    Horario de funcionamento apos fechamento: {'✅ Passou no teste' if relatorio['horario_funcionamento']['apos_fechamento'] == True else '❌ Não passou no teste'}
    Horario de funcionamento antes da abertura: {'✅ Passou no teste' if relatorio['horario_funcionamento']['antes_abertura'] == True else '❌ Não passou no teste'}
    """
    )
