#Criado por Vinicius 01/04/2026

import sys
from pathlib import Path
import requests

# Adiciona a pasta raiz ao path do Python
sys.path.insert(0, str(Path(__file__).parent.parent))

url_base = 'http://localhost:5000/api/servicos'

relatorio = {
    'criacao_servico': False,
    'servico_ja_cadastrado': False,
    'criacao_servico_com_payload_invalido': {
        'campos_com_type_errado': False,
        'campos_faltando': False,
        'campo_desconhecido': False
    }
}

def deletar_servico_teste(id):
    """Deletar serviço criado para o teste"""
    try:
        print("Deletando serviço criado para o teste")
        response = requests.delete(f'{url_base}/deletar-servico/{id}')
        if response.status_code == 200:
            print('✅ Serviço deletado com sucesso!')
            print(f"Resposta da API: {response.json()}")
        else:
            print(f'❌ Erro ao deletar serviço: {response.status_code}')
            print(response.json()['erro'])
    except Exception as e:
        print(f'❌ Erro ao deletar serviço teste: {e}')

def criar_servico_teste():
    """Criar serviço para o teste"""
    try:
        print("- Iniciando teste de criação de serviço")
        print("- Criando serviço para o teste")
        response = requests.post(f'{url_base}/criar-servico', json={
            'nome': 'Teste',
            'preco': 10.0,
            'duracao_minutos': 10,
            'barbeiro_id': 1
        })

        if response.status_code == 201:
            print('- Serviço criado com sucesso!')
            print(f"Resposta da API: {response.json()}")
            relatorio['criacao_servico'] = True
            print("✅ Passou no teste")
            deletar_servico_teste(response.json()['servico']['id'])
        else:
            raise

        print("-----------------------")
    except Exception as e:
        print(f'- Erro ao criar serviço teste: {e}')
        print(response.json().get('erro'))
        print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio['criacao_servico'] = False

def servico_com_type_errado_no_payload_teste():
    """Criar serviço com payload inválido para o teste"""
    try:
        print("- Iniciando teste de criação de serviço com payload inválido")
        print("- Criando serviço com payload usando tipo de dado errado para o campo preco")
        response = requests.post(f'{url_base}/criar-servico', json={
            'nome': 'Teste',
            'preco': 'dez',
            'duracao_minutos': 10,
            'barbeiro_id': 1
        })

        if response.status_code == 400:
            print('- Serviço não foi criado')
            print(f"Resposta da API: {response.json()}")
            relatorio['criacao_servico_com_payload_invalido']['campos_com_type_errado'] = True
            print("✅ Passou no teste")
        else:
            raise

        print("-----------------------")

    except Exception as e:
        print(f'- Erro ao criar serviço teste: {e}')
        print(response.json().get('erro'))
        print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio['criacao_servico_com_payload_invalido']['campos_com_type_errado'] = False
    
def campos_faltando_no_payload_teste():
    #Teste para campos obrigatorios faltando
    try:
        print("- Iniciando teste de criação de serviço com payload inválido")
        print("- Criando serviço com payload inválido sem o campo barbeiro_id para o teste")
        response = requests.post(f'{url_base}/criar-servico', json={
        'nome': 'Teste',
        'preco': 10.0,
        'duracao_minutos': 'dez'
        #barbeiro_id faltando
    })

        if response.status_code == 400:
            print("- Serviço não foi criado")
            print(f"Resposta da API: {response.json()}")
            relatorio['criacao_servico_com_payload_invalido']['campos_faltando'] = True
            print("✅ Passou no teste")
        else:
            raise

        print("-----------------------")

    except Exception as e:
        print(f'- Erro ao criar serviço teste: {e}')
        print(response.json().get('erro'))
        print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio['criacao_servico_com_payload_invalido']['campos_com_type_errado'] = False
    
def servico_com_campo_desconhecido_no_payload_teste():
    """Criar serviço com payload inválido para o teste"""
    try:
        print("- Iniciando teste de criação de serviço com payload inválido")
        print("- Criando serviço com payload recebendo campo desconhecido para o teste")
        response = requests.post(f'{url_base}/criar-servico', json={
            'nome': 'Teste',
            'preco': 10.0,
            'duracao_minutos': 10,
            'campo_novo': 'valor_invalido'
        })

        if response.status_code == 400:
            print('- Serviço não foi criado')
            print(f"Resposta da API: {response.json()}")
            relatorio['criacao_servico_com_payload_invalido']['campo_desconhecido'] = True
            print("✅ Passou no teste")
        else:
            raise

        print("-----------------------")

    except Exception as e:
        print(f'- Erro ao criar serviço teste: {e}')
        print(response.json().get('erro'))
        print(response.status_code)
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio['criacao_servico_com_payload_invalido']['campo_desconhecido'] = False

def servico_ja_cadastrado_teste():
    """Testar se o serviço já está cadastrado"""
    id_servico = 0
    nome_servico = 'Teste'

    try:
        print("- Iniciando teste de serviço já cadastrado")
        print("- Criando serviço para o teste")
        response = requests.post(f'{url_base}/criar-servico', json={
            'nome': nome_servico,
            'preco': 10.0,
            'duracao_minutos': 10,
            'barbeiro_id': 1
        })
        if response.status_code == 201:
            print('- Serviço criado com sucesso!')
            print(f"Resposta da API: {response.json()}")
            print("Status code: ", response.status_code)
            relatorio['servico_ja_cadastrado'] = True
            id_servico = response.json()['servico']['id']
        else:
            raise Exception(f'Primeiro serviço não foi criado')
        
        #Tentando criar novo serviço com o mesmo nome para testar verificação
        print("- Tentando criar serviço com o mesmo nome")
        response = requests.post(f'{url_base}/criar-servico', json={
            'nome': nome_servico,
            'preco': 10.0,
            'duracao_minutos': 10,
            'barbeiro_id': 1
        })

        if response.status_code == 409:
            print('- Serviço já cadastrado!')
            print(f"Resposta da API: {response.json()}")
            relatorio['servico_ja_cadastrado'] = True
            deletar_servico_teste(id_servico)
        else:
            raise Exception(f'Segundo serviço foi criado')
        
        print("-----------------------")
    except Exception as e:
        print(f'- Erro ao verificar se o serviço está cadastrado teste: {e}')
        print(response.json())
        print("❌ Não passou no teste")
        print("-----------------------")
        relatorio['servico_ja_cadastrado'] = False

if __name__ == '__main__':
    criar_servico_teste()
    servico_ja_cadastrado_teste()
    servico_com_type_errado_no_payload_teste()
    campos_faltando_no_payload_teste()
    servico_com_campo_desconhecido_no_payload_teste()
    
    print("----------------------------------RELATORIO----------------------------------")
    print(f"""
    Relatorio de testes de serviços
    Criação de serviço: {'✅ Passou no teste' if relatorio['criacao_servico'] == True else '❌ Não passou no teste'}
    Serviço já cadastrado: {'✅ Passou no teste' if relatorio['servico_ja_cadastrado'] == True else '❌ Não passou no teste'}
    Criação de serviço com payload inválido (campos com type errado): {'✅ Passou no teste' if relatorio['criacao_servico_com_payload_invalido']['campos_com_type_errado'] == True else '❌ Não passou no teste'}
    Criação de serviço com payload inválido (campos faltando): {'✅ Passou no teste' if relatorio['criacao_servico_com_payload_invalido']['campos_faltando'] == True else '❌ Não passou no teste'}
    Criação de serviço com payload inválido (campo desconhecido): {'✅ Passou no teste' if relatorio['criacao_servico_com_payload_invalido']['campo_desconhecido'] == True else '❌ Não passou no teste'}
    """)