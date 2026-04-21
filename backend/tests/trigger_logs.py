import os
import json
import logging
from flask import Flask
from app import create_app
from app.extensions import db
from app.modules.admin.model import Admin
from datetime import datetime, timedelta

def run_log_triggers():
    app = create_app()
    app.config["TESTING"] = True
    
    # Suprimir output do flask test client no stdout pra deixar mais limpo
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)

    client = app.test_client()

    print("Iniciando bateria de testes para disparar Logs...")

    with app.app_context():
        # Vamos garantir que temos um admin para testar logins
        admin_test = Admin.query.filter_by(email="admin_log_test@test.com").first()
        if not admin_test:
            admin_test = Admin(nome="Admin Log Tester", email="admin_log_test@test.com")
            admin_test.senha = "senha123"
            db.session.add(admin_test)
            db.session.commit()

        print("\n--- TESTES DE AUTH ---")
        # 1. Login Email Invalido (Dispara app_logger.warning no Auth Service)
        print("1. Disparando Warning de Email Inválido...")
        client.post('/api/auth/login', json={"email": "naoexiste@email.com", "senha": "123"})
        
        # 2. Login Senha Invalida (Dispara app_logger.warning no Auth Service)
        print("2. Disparando Warning de Senha Inválida...")
        client.post('/api/auth/login', json={"email": "admin_log_test@test.com", "senha": "errada_aqui"})
        
        # 3. Payload Login Mutilado (Dispara app_logger.warning de Validacao Pydantic)
        print("3. Disparando Warning de Validação Pydantic (Auth)...")
        client.post('/api/auth/login', json={"email": "faltasenha"})

        # 4. Login com Sucesso (Dispara app_logger.info)
        print("4. Disparando Info de Login com Sucesso...")
        resp = client.post('/api/auth/login', json={"email": "admin_log_test@test.com", "senha": "senha123"})
        
        # Extrair cookies e tokens
        cookies = resp.headers.getlist('Set-Cookie')
        csrf_access = ""
        for c in cookies:
            if "csrf_access_token=" in c:
                csrf_access = c.split("csrf_access_token=")[1].split(";")[0]

        # Configurar headers para requisicoes autenticadas
        headers = {"X-CSRF-TOKEN": csrf_access}

        # 5. Refresh (Dispara app_logger.info de sessao renovada)
        print("5. Disparando Info de Refresh Sessão...")
        # (Depende dos cookies do test client atuando ativamente)
        client.post('/api/auth/refresh', headers=headers)

        
        print("\n--- TESTES DE AGENDAMENTO ---")
        # 6. Criar Agendamento Validação Pydantic (Dispara app_logger.warning)
        print("6. Disparando Warning de Validação Pydantic (Agendamento)...")
        client.post('/api/agendamento', json={"cliente_id": "texto_ao_inves_de_int"}, headers=headers)

        # 7. Disparar Buscar ID Errado (Cai na ValueError de 404, log automatico no before_request/after_request)
        print("7. Disparando Acesso ao endpoint com erro 404...")
        client.get('/api/agendamento/buscar/9999999', headers=headers)

        # 8. Erros genericos de agendamento edit sem token e com ID errado (Isso logara Warnings de autorizacao)
        print("8. Tentativa de edição mal sucedida...")
        client.patch('/api/agendamento/9999', json={"observacoes": "testando log"}, headers=headers)
        
        # 9. Logout (Dispara app_logger.info de Logout e revogação)
        print("9. Disparando Info de Logout...")
        client.post('/api/auth/logout', headers=headers)
        
        print("\nTestes enviados! Verifique o log em ../logs/app.log para confirmar os rastros JSON gerados!")

if __name__ == "__main__":
    run_log_triggers()
