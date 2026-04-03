import sys
from pathlib import Path

# Adiciona a pasta raiz ao path do Python
sys.path.insert(0, str(Path(__file__).parent.parent))

# Agora pode importar app
from app import create_app, db
from app.models import Barbeiro, Servico

app = create_app()

with app.app_context():
    # Criar barbeiro (serviço precisa de barbeiro)
    # Instancia do modelo Barbeiro, preenchendo os campos obrigatórios
    barbeiro = Barbeiro(
        nome='João Silva', 
        especialidade='Corte clássico', 
        email='joao@barba.com', 
        telefone='11999999999')
    # Abaixo, adicionamos o barbeiro ao banco de dados
    # 'session' é a sessão de banco de dados atual
    # 'commit' salva as mudanças no banco
    db.session.add(barbeiro)
    db.session.commit()
    
    # Criar 2 serviços para esse barbeiro
    servico1 = Servico(
        nome='Corte de cabelo', 
        preco=30.0, 
        duracao_minutos=30, 
        barbeiro_id=barbeiro.id  # Relaciona com o barbeiro criado
    )
    db.session.add(servico1)
    db.session.commit()
    
    servico2 = Servico(
        nome='Barba', 
        preco=20.0, 
        duracao_minutos=20,
        barbeiro_id=barbeiro.id  # Relaciona com o barbeiro criado
    )
    db.session.add(servico2)
    db.session.commit()
    # emoji e frase de sucesso
    print('✅ Dados de teste criados com sucesso!')

    # ✅ CORRETO - dentro do contexto
    total = Servico.query.count()
    print(total)