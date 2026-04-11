from app import create_app, db
from app.models.agendamento import Agendamento
from app.schemas.agendamento_schema import AgendamentoUpdateSchema
from app.services.agendamento_service import AgendamentoService
from datetime import datetime, timedelta

app = create_app()

with app.app_context():
    ag1 = Agendamento.query.get(1)
    ag2 = Agendamento.query.get(2)
    print(f"Ag 1: {ag1.data_agendamento}")
    print(f"Ag 2: {ag2.data_agendamento}")
    print("\n--- Test 1: Move Ag 2 to 10:30 ---")
    try:
        dados = AgendamentoUpdateSchema(data_agendamento=datetime(2026, 4, 15, 10, 30))
        AgendamentoService.editar_agendamento(ag2.id, dados, "admin", 1)
        print("FAIL: Permitiu conflito!")
    except Exception as e:
        print(f"SUCCESS (caught expected error): {e}")
