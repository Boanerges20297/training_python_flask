#!/usr/bin/env python
"""Script para criar dados de teste - VERSÃO SIMPLES"""

from app import create_app, db
from app.models import Barbeiro, Servico

print("📝 Iniciando criação de dados...")

app = create_app()

with app.app_context():
    print("✓ Contexto de app ativado")
    
    # Limpar dados antigos (opcional)
    # db.drop_all()
    # db.create_all()
    
    try:
        # Criar barbeiro
        print("📌 Criando barbeiro...")
        barbeiro = Barbeiro(
            nome='João Silva',
            especialidade='Corte clássico',
            email='joao@barbabyte.com',
            telefone='11999999999'
        )
        db.session.add(barbeiro)
        db.session.commit()
        print(f"✓ Barbeiro criado com ID: {barbeiro.id}")
        
        # Criar serviço 1
        print("📌 Criando serviço 1...")
        servico1 = Servico(
            nome='Corte de Cabelo',
            descricao='Corte clássico completo',
            preco=50.0,
            duracao_minutos=30,
            barbeiro_id=barbeiro.id
        )
        db.session.add(servico1)
        db.session.commit()
        print(f"✓ Serviço 1 criado com ID: {servico1.id}")
        
        # Criar serviço 2
        print("📌 Criando serviço 2...")
        servico2 = Servico(
            nome='Barba Completa',
            descricao='Aparação + navalhado',
            preco=40.0,
            duracao_minutos=25,
            barbeiro_id=barbeiro.id
        )
        db.session.add(servico2)
        db.session.commit()
        print(f"✓ Serviço 2 criado com ID: {servico2.id}")
        
        # Verificar
        total = Servico.query.count()
        print(f"\n✅ SUCESSO! Total de serviços: {total}")
        
    except Exception as e:
        print(f"❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
