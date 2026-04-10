# Criado pelo Assistente 09/04/2026

import sys
from pathlib import Path
import requests

# Adiciona a pasta raiz ao path do Python
sys.path.insert(0, str(Path(__file__).parent.parent))

url_base = "http://localhost:5000/api/barbeiros"

relatorio = {
    "criacao_barbeiro": False,
    "criacao_barbeiro_com_payload_invalido": {
        "campos_com_type_errado": False,
        "campos_faltando": False,
        "campo_desconhecido": False,
    },
    "listar_barbeiros": False,
    "buscar_barbeiro": False,
    "editar_barbeiro": False,
    "buscar_agendamentos_barbeiro": False,
    "deletar_barbeiro": False,
}

barbeiro_id_teste = None


def deletar_barbeiro_teste(id=None):
    """Deletar barbeiro criado para o teste"""
    global barbeiro_id_teste

    id_para_deletar = id if id is not None else barbeiro_id_teste
    if not id_para_deletar:
        print("Nenhum barbeiro para deletar.")
        return

    try:
        print("- Iniciando teste de deleção de barbeiro")
        print(f"Deletando barbeiro criado para o teste (ID: {id_para_deletar})")
        response = requests.delete(f"{url_base}/deletar-barbeiro/{id_para_deletar}")
        if response.status_code == 200:
            print("✅ Barbeiro deletado com sucesso!")
            print(f"Resposta da API: {response.json()}")
            relatorio["deletar_barbeiro"] = True
        else:
            print(f"❌ Erro ao deletar barbeiro: {response.status_code}")
            print(response.json().get("erro"))
            relatorio["deletar_barbeiro"] = False
        print("-----------------------")
    except Exception as e:
        print(f"❌ Erro ao deletar barbeiro teste: {e}")
        relatorio["deletar_barbeiro"] = False


def criar_barbeiro_teste():
    """Criar barbeiro para o teste"""
    global barbeiro_id_teste
    try:
        print("- Iniciando teste de criação de barbeiro")
        print("- Criando barbeiro para o teste")
        response = requests.post(
            f"{url_base}/criar-barbeiro",
            json={
                "nome": "João Barbeiro Teste",
                "especialidade": "Degrade",
                "email": "joao.barbeiro.teste.12345@gmail.com",
                "telefone": "(11)99555-1234",
                "senha": "senha_segura_123",
            },
        )

        if response.status_code == 201:
            print("- Barbeiro criado com sucesso!")
            print(f"Resposta da API: {response.json()}")
            relatorio["criacao_barbeiro"] = True
            print("✅ Passou no teste")
            barbeiro_id_teste = response.json()["barbeiro"]["id"]
        else:
            raise Exception("Falha na criação")

        print("-----------------------")
    except Exception as e:
        print(f"- Erro ao criar barbeiro teste: {e}")
        if "response" in locals():
            print(response.json().get("erro", response.text))
            print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio["criacao_barbeiro"] = False


def barbeiro_com_type_errado_no_payload_teste():
    """Criar barbeiro com payload inválido para o teste"""
    try:
        print("- Iniciando teste de criação de barbeiro com payload inválido")
        print(
            "- Criando barbeiro com payload usando tipo de dado errado para o campo telefone"
        )
        response = requests.post(
            f"{url_base}/criar-barbeiro",
            json={
                "nome": "João Teste",
                "especialidade": "Degrade",
                "email": "joao@invalid.com",
                "telefone": 11999999999,  # Deveria ser string
                "senha": "senha_segura_123",
            },
        )

        if response.status_code == 400:
            print("- Barbeiro não foi criado")
            print(f"Resposta da API: {response.json()}")
            relatorio["criacao_barbeiro_com_payload_invalido"][
                "campos_com_type_errado"
            ] = True
            print("✅ Passou no teste")
        else:
            raise Exception("O barbeiro foi criado indevidamente ou houve outro erro.")

        print("-----------------------")

    except Exception as e:
        print(f"- Erro ao rodar teste: {e}")
        if "response" in locals():
            print(response.json().get("erro", response.text))
            print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio["criacao_barbeiro_com_payload_invalido"][
            "campos_com_type_errado"
        ] = False


def campos_faltando_no_payload_teste():
    """Teste para campos obrigatorios faltando"""
    try:
        print("- Iniciando teste de criação de barbeiro com payload inválido")
        print("- Criando barbeiro com payload inválido sem o campo senha para o teste")
        response = requests.post(
            f"{url_base}/criar-barbeiro",
            json={
                "nome": "João Teste",
                "especialidade": "Degrade",
                "email": "joao.faltando@test.com",
                "telefone": "11999999999",
                # senha faltando
            },
        )

        if response.status_code == 400:
            print("- Barbeiro não foi criado")
            print(f"Resposta da API: {response.json()}")
            relatorio["criacao_barbeiro_com_payload_invalido"]["campos_faltando"] = True
            print("✅ Passou no teste")
        else:
            raise Exception("O barbeiro foi criado indevidamente ou houve outro erro.")

        print("-----------------------")

    except Exception as e:
        print(f"- Erro ao rodar teste: {e}")
        if "response" in locals():
            print(response.json().get("erro", response.text))
            print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio["criacao_barbeiro_com_payload_invalido"]["campos_faltando"] = False


def barbeiro_com_campo_desconhecido_no_payload_teste():
    """Criar barbeiro com payload inválido contendo campo desconhecido."""
    try:
        print("- Iniciando teste de criação de barbeiro com payload inválido")
        print(
            "- Criando barbeiro com payload recebendo campo desconhecido para o teste"
        )
        response = requests.post(
            f"{url_base}/criar-barbeiro",
            json={
                "nome": "João Teste",
                "especialidade": "Degrade",
                "email": "joao.desc@test.com",
                "telefone": "11999999999",
                "senha": "senha_segura_123",
                "campo_novo": "valor_invalido",
            },
        )

        if response.status_code == 400:
            print("- Barbeiro não foi criado")
            print(f"Resposta da API: {response.json()}")
            relatorio["criacao_barbeiro_com_payload_invalido"][
                "campo_desconhecido"
            ] = True
            print("✅ Passou no teste")
        else:
            raise Exception("O barbeiro foi criado indevidamente ou houve outro erro.")

        print("-----------------------")

    except Exception as e:
        print(f"- Erro ao rodar teste: {e}")
        if "response" in locals():
            print(response.json().get("erro", response.text))
            print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio["criacao_barbeiro_com_payload_invalido"]["campo_desconhecido"] = False


def listar_barbeiros_teste():
    """Listar barbeiros"""
    try:
        print("- Iniciando teste de listagem de barbeiros")
        response = requests.get(f"{url_base}/")

        if response.status_code == 200:
            print("- Barbeiros listados com sucesso!")
            # Print truncado para focar apenas nas keys
            res_json = response.json()
            print(f"Total na resposta: {res_json.get('total')}")
            relatorio["listar_barbeiros"] = True
            print("✅ Passou no teste")
        else:
            raise Exception("Falha na listagem")

        print("-----------------------")
    except Exception as e:
        print(f"- Erro ao rodar teste: {e}")
        if "response" in locals():
            print(response.json().get("erro", response.text))
            print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio["listar_barbeiros"] = False


def buscar_barbeiro_teste():
    """Buscar barbeiro pelo ID"""
    global barbeiro_id_teste
    if not barbeiro_id_teste:
        print("Teste pulado pois o barbeiro de teste não foi criado.")
        return

    try:
        print("- Iniciando teste de busca de barbeiro")
        response = requests.get(f"{url_base}/buscar-barbeiro/{barbeiro_id_teste}")

        if response.status_code == 200:
            print("- Barbeiro encontrado com sucesso!")
            print(f"Resposta: {response.json()}")
            relatorio["buscar_barbeiro"] = True
            print("✅ Passou no teste")
        else:
            raise Exception("Falha na busca")

        print("-----------------------")
    except Exception as e:
        print(f"- Erro ao rodar teste: {e}")
        if "response" in locals():
            print(response.json().get("erro", response.text))
            print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio["buscar_barbeiro"] = False


def editar_barbeiro_teste():
    """Editar dados do barbeiro"""
    global barbeiro_id_teste
    if not barbeiro_id_teste:
        print("Teste pulado pois o barbeiro de teste não foi criado.")
        return

    try:
        print("- Iniciando teste de edição de barbeiro")
        response = requests.patch(
            f"{url_base}/editar-barbeiro/{barbeiro_id_teste}",
            json={"nome": "João Barbeiro Editado", "especialidade": "Corte Social"},
        )

        if response.status_code == 200:
            print("- Barbeiro editado com sucesso!")
            print(f"Resposta: {response.json()}")
            relatorio["editar_barbeiro"] = True
            print("✅ Passou no teste")
        else:
            raise Exception("Falha na edição")

        print("-----------------------")
    except Exception as e:
        print(f"- Erro ao rodar teste: {e}")
        if "response" in locals():
            print(response.json().get("erro", response.text))
            print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio["editar_barbeiro"] = False


def buscar_agendamentos_barbeiro_teste():
    """Buscar agendamentos do barbeiro (pode vir vazio mas deve retornar 404 de não encontrado ou 200 com lista vazia)"""
    global barbeiro_id_teste
    if not barbeiro_id_teste:
        print("Teste pulado pois o barbeiro de teste não foi criado.")
        return

    try:
        print("- Iniciando teste de busca de agendamentos do barbeiro")
        response = requests.get(f"{url_base}/{barbeiro_id_teste}/agendamentos")

        # Pode retornar 404 se não houver agendamentos na lógica, ou 200 dependendo de como está escrito.
        # Olhando o route: if not agendamentos: return 404  (Paginacao geralmente é truthy, mas items é vazio)
        # Vamos aceitar 200 ou 404 (para não encontrado).
        if response.status_code in [200, 404]:
            print(f"- Chamada feita com sucesso! Status: {response.status_code}")
            print(f"Resposta: {response.json()}")
            relatorio["buscar_agendamentos_barbeiro"] = True
            print("✅ Passou no teste")
        else:
            raise Exception("Falha na busca de agendamentos")

        print("-----------------------")
    except Exception as e:
        print(f"- Erro ao rodar teste: {e}")
        if "response" in locals():
            print(response.json().get("erro", response.text))
            print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio["buscar_agendamentos_barbeiro"] = False


if __name__ == "__main__":
    print("Iniciando bateria de testes para rotas de Barbeiro...\n")

    # Executa os testes de criação inválida que não dependem do ID e não persistem
    barbeiro_com_type_errado_no_payload_teste()
    campos_faltando_no_payload_teste()
    barbeiro_com_campo_desconhecido_no_payload_teste()

    # Cria barbeiro para testes que dependem que exista um no banco
    criar_barbeiro_teste()

    # Se criação falhar, os próximos irão pular/falhar apropriadamente
    listar_barbeiros_teste()
    buscar_barbeiro_teste()
    editar_barbeiro_teste()
    buscar_agendamentos_barbeiro_teste()

    # No final, limpa o barbeiro criado
    deletar_barbeiro_teste()

    print(
        "\n----------------------------------RELATORIO----------------------------------"
    )
    print(
        f"""
    Relatorio de testes de barbeiros
    Criação de barbeiro: {'✅ Passou no teste' if relatorio['criacao_barbeiro'] else '❌ Não passou no teste'}
    Listagem de barbeiros: {'✅ Passou no teste' if relatorio['listar_barbeiros'] else '❌ Não passou no teste'}
    Buscar barbeiro por ID: {'✅ Passou no teste' if relatorio['buscar_barbeiro'] else '❌ Não passou no teste'}
    Editar barbeiro: {'✅ Passou no teste' if relatorio['editar_barbeiro'] else '❌ Não passou no teste'}
    Buscar agendamentos do barbeiro: {'✅ Passou no teste' if relatorio['buscar_agendamentos_barbeiro'] else '❌ Não passou no teste'}
    Deletar barbeiro: {'✅ Passou no teste' if relatorio['deletar_barbeiro'] else '❌ Não passou no teste'}
    
    Testes de payload inválido:
    (Campos com tipo errado): {'✅ Passou no teste' if relatorio['criacao_barbeiro_com_payload_invalido']['campos_com_type_errado'] else '❌ Não passou no teste'}
    (Campos faltando): {'✅ Passou no teste' if relatorio['criacao_barbeiro_com_payload_invalido']['campos_faltando'] else '❌ Não passou no teste'}
    (Campo desconhecido): {'✅ Passou no teste' if relatorio['criacao_barbeiro_com_payload_invalido']['campo_desconhecido'] else '❌ Não passou no teste'}
    """
    )
