from app import create_app, db
from app.models.agendamento import Agendamento
from app.models.barbeiro import Barbeiro
from app.schemas.agendamento_schema import AgendamentoUpdateSchema
from app.services.agendamento_service import AgendamentoService
from datetime import datetime, timedelta

app = create_app()

with app.app_context():
    ag1 = Agendamento.query.get(1)
    ag2 = Agendamento.query.get(2)
    print(f"Ag 1: barbeiro {ag1.barbeiro_id} at {ag1.data_agendamento}")
    print(f"Ag 2: barbeiro {ag2.barbeiro_id} at {ag2.data_agendamento}")
    
    # create third agendamento for another barbeiro at the EXACT SAME TIME as ag1
    barbeiro2 = Barbeiro.query.get(2)
    if not barbeiro2:
        print("Creating Barber 2")
        barbeiro2 = Barbeiro(nome="Teste2", email="t22@t.com", senha_hash="123", telefone="12345")
        db.session.add(barbeiro2)
        db.session.commit()
        
    # We edit ag2 (currently at 10:30 for barbeiro 1). We will move it to barbeiro 1 at 10:00
    print("\n--- Move Ag 2 to 10:00, keeping barbeiro (Conflict with Ag1) ---")
    try:
        dados = AgendamentoUpdateSchema(data_agendamento=ag1.data_agendamento)
        AgendamentoService.editar_agendamento(ag2.id, dados, "admin", 1)
        print("FAIL: Permitiu conflito!")
    except Exception as e:
        print(f"SUCCESS (caught expected error): {e}")

    try:
        dados = AgendamentoUpdateSchema(barbeiro_id=ag1.barbeiro_id, data_agendamento=ag1.data_agendamento)
        AgendamentoService.editar_agendamento(ag2.id, dados, "admin", 1)
        print("FAIL: Permitiu conflito no teste 2!")
    except Exception as e:
        print(f"SUCCESS (caught expected error): {e}")
