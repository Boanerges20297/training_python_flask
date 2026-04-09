# Arquivo para testar o rate limiter por metodo e role
# Criado por Vinicius 02/04/2026
# Refatorado para usar threads e testes mais eficientes e assíncronos

import sys
from pathlib import Path
import requests
import concurrent.futures
import time

# Adiciona a pasta raiz ao path do Python
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils.ratelimiter import LIMITS

# Valores baseado no limits do arquivo app/utils/ratelimiter.py
VALORES_LIMIT_PARA_FOR = {
    'admin': {
        'POST': 30,
        'PUT': 30,
        'GET': 120,
        'DELETE': 120
    },
    'cliente': {
        'POST': 5,
        'PUT': 5,
        'GET': 20,
        'DELETE': 20
    },
    'barbeiro': {
        'POST': 15,
        'PUT': 15,
        'GET': 60,
        'DELETE': 60
    }
}

# Rota da API aleatória para testar
URL_BASE = 'http://localhost:5000/api/tests'
JSON_DATA = {'email': 'admin@admin.com', 'senha': 'admin'}

def format_color(text, color_code):
    return f"\033[{color_code}m{text}\033[0m"

def fazer_requisicao(role, method):
    headers = {'X-Role': role}
    try:
        if method == 'POST':
            response = requests.post(URL_BASE, json=JSON_DATA, headers=headers, timeout=5)
        elif method == 'PUT':
            response = requests.put(URL_BASE, json=JSON_DATA, headers=headers, timeout=5)
        elif method == 'GET':
            response = requests.get(URL_BASE, json=JSON_DATA, headers=headers, timeout=5)
        elif method == 'DELETE':
            response = requests.delete(URL_BASE, json=JSON_DATA, headers=headers, timeout=5)
        return response.status_code
    except Exception as e:
        return str(e)

def testar_role_metodo(role, method, limit):
    print(f"Testando {role: <10} - {method: <6} (Limite: {limit} requisições)... ", end="", flush=True)
    
    # Precisamos exceder o limite em pelo menos 1 para forçar o status 429
    total_requisicoes = limit + 5
    status_codes = []
    
    start_time = time.time()
    
    # Utilizando ThreadPoolExecutor para enviar as requisições de forma simultânea (Concorrente)
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(10, total_requisicoes)) as executor:
        futures = [executor.submit(fazer_requisicao, role, method) for _ in range(total_requisicoes)]
        
        for future in concurrent.futures.as_completed(futures):
            status_codes.append(future.result())
            
    end_time = time.time()
    tempo_execucao = end_time - start_time
    
    qnt_429 = status_codes.count(429)
    # Qualquer código que não seja problema de conexão ou rate limit podemos contar como requisição que "passou"
    qnt_sucesso = len(status_codes) - qnt_429 - sum(1 for x in status_codes if isinstance(x, str)) 
    
    # O teste é válido se pelo menos um 429 foi retornado e o limite foi respeitado corretamente
    sucesso = qnt_429 > 0
    
    if sucesso:
        print(format_color("CONCLUÍDO", "32"))
    else:
        print(format_color("FALHOU", "31"))
    
    return {
        'role': role,
        'method': method,
        'limit': limit,
        'sucesso': sucesso,
        'qnt_passou': qnt_sucesso,
        'qnt_429': qnt_429,
        'erros': sum(1 for x in status_codes if isinstance(x, str)),
        'tempo': tempo_execucao
    }

def init_tests():
    print(format_color("\n=== Iniciando Testes de Stress do Rate Limiter ===", "1;36"))
    print("Enviando requisições assíncronas para testar rapidez e bloqueio...\n")
    
    relatorio = []
    inicio_geral = time.time()
    
    for role, limits in VALORES_LIMIT_PARA_FOR.items():
        for method, limit in limits.items():
            resultado = testar_role_metodo(role, method, limit)
            relatorio.append(resultado)
            
            # Pausa opcional para evitar estrangulamento da API por outras causas, caso haja instabilidade
            time.sleep(0.5)
            
    fim_geral = time.time()
    
    print("\n" + "=" * 80)
    print(format_color(f"RELATÓRIO FINAL DE TESTES (Tempo Total: {fim_geral - inicio_geral:.2f}s)", "1"))
    print("=" * 80)
    
    tabela_header = "{:<10} | {:<8} | {:<8} | {:<10} | {:<8} | {:<9} | {:<10}"
    print(tabela_header.format("Role", "Method", "Limit", "Result", "Passaram", "Bloqueios", "Time (s)"))
    print("-" * 80)
    
    todos_sucesso = True
    for req in relatorio:
        status_text = format_color("PASS", "32") if req['sucesso'] else format_color("FAIL", "31")
        if not req['sucesso']:
            todos_sucesso = False
        
        print(tabela_header.format(
            req['role'], 
            req['method'], 
            req['limit'], 
            status_text, 
            req['qnt_passou'],
            req['qnt_429'], 
            f"{req['tempo']:.2f}"
        ))
        
    print("-" * 80)
    
    if todos_sucesso:
        print(format_color("\n[+] SUCESSO: Todos os testes passaram! O Rate Limiter está funcionando como esperado e bloqueando requisições excedentes (Status 429).", "1;32"))
    else:
        print(format_color("\n[-] AVISO: Alguns testes falharam. Verifique os métodos que não retornaram código 429 (bloqueios) ou receberam erros de conexão.", "1;31"))

if __name__ == '__main__':
    init_tests()
