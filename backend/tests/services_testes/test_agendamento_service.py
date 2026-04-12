import sys
import os
from pathlib import Path

# Adiciona a pasta raiz ao path do Python
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models.barbeiro import Barbeiro
from app.models.cliente import Cliente
from app.models.servico import Servico
from app.models.agendamento import Agendamento
from app.schemas.agendamento_schema import AgendamentoCreate, AgendamentoUpdateSchema
from app.services.agendamento_service import AgendamentoService
from datetime import datetime, timedelta
import uuid

app = create_app()

def prepare_data():
    cliente = Cliente.query.first()
    if not cliente:
        cliente = Cliente(nome="Cliente Teste", email=f"cli_{uuid.uuid4()}@teste.com", telefone="1199")
        cliente.senha = "123"
        db.session.add(cliente)
    
    barbeiro = Barbeiro.query.first()
    if not barbeiro:
        barbeiro = Barbeiro(nome="Barbeiro Teste", especialidade="Corte", telefone="1188", email=f"barb_{uuid.uuid4()}@teste.com")
        barbeiro.senha = "123"
        db.session.add(barbeiro)
    
    db.session.commit()
    
    servico = Servico.query.first()
    if not servico:
        servico = Servico(nome="Corte Teste", preco=50.0, duracao_minutos=30, barbeiro_id=barbeiro.id)
        db.session.add(servico)
        db.session.commit()
        
    return cliente, barbeiro, servico

def run_tests():
    with app.app_context():
        cliente, barbeiro, servico = prepare_data()
        
        print("\n--- TESTANDO SCHEMA PYDANTIC ---")
        try:
            # Dado falho intencional (faltando cliente_id)
            falho = AgendamentoCreate(
                data_agendamento=datetime.utcnow() + timedelta(days=1),
                barbeiro_id=barbeiro.id,
                servico_id=servico.id
            )
            print("[ERRO] Falha: Pydantic deixou passar os dados faltando.")
        except Exception as e:
            print("[OK] Sucesso: Pydantic bloqueou payload faltando o cliente_id!")
        
        # Payload válido
        data_boa = datetime.utcnow().replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        print("\n--- TESTANDO CRIAÇÃO (AgendamentoService) ---")
        schema_valido = AgendamentoCreate(
            data_agendamento=data_boa,
            barbeiro_id=barbeiro.id,
            servico_id=servico.id,
            cliente_id=cliente.id,
            observacoes="Teste isolado"
        )
        agendamento = AgendamentoService.criar_agendamento(schema_valido)
        print(f"[OK] Agendamento criado! ID: {agendamento.id} | Status: {agendamento.status}")
        
        print("\n--- TESTANDO CONFLITO DE HORÁRIO ---")
        try:
            schema_conflito = AgendamentoCreate(
                data_agendamento=data_boa + timedelta(minutes=15),
                barbeiro_id=barbeiro.id,
                servico_id=servico.id,
                cliente_id=cliente.id
            )
            AgendamentoService.criar_agendamento(schema_conflito)
            print("[ERRO] Falha: O serviço permitiu sobreposição de horários.")
        except ValueError as e:
            print(f"[OK] Sucesso: Restrição aplicada. Mensagem do BD/Serviço: {e}")

        print("\n--- TESTANDO EDIÇÃO ---")
        dados_edit = AgendamentoUpdateSchema(observacoes="Editado sem rota!")
        editado = AgendamentoService.editar_agendamento(agendamento.id, dados_edit)
        print(f"[OK] Editado! Nova Obs: {editado.observacoes}")

        print("\n--- TESTANDO ATUALIZAÇÃO DE STATUS ---")
        atualizado = AgendamentoService.atualizar_status(agendamento.id, Agendamento.STATUS_CONCLUIDO)
        print(f"[OK] Status atualizado! Novo Status: {atualizado.status}")

        print("\n--- TESTANDO EXCLUSÃO FÍSICA ---")
        AgendamentoService.deletar_registro_fisico(agendamento.id)
        print("[OK] Excluído do Banco. Tudo limpo!")

if __name__ == "__main__":
    run_tests()
