#!/usr/bin/env python
"""Script para criar dados de teste - VERSÃO SIMPLES"""

from app import create_app, db
from app.models import Cliente

print("📝 Iniciando criação de dados...")

app = create_app()

with app.app_context():
    print("✓ Contexto de app ativado")
    
    # Limpar dados antigos (opcional)
    # db.drop_all()
    # db.create_all()
    
    try:
        # Criar cliente
        print("📌 Criando cliente...")
        cliente = Cliente(
            nome='João Silva',
            telefone='11999999999',
            email='joao@barbabyte.com'
        )
        db.session.add(cliente)
        db.session.commit()
        print(f"✓ Cliente criado com ID: {cliente.id}")
        
        # Criar cliente 2
        print("📌 Criando cliente 2...")
        cliente2 = Cliente(
            nome='Maria Oliveira',
            telefone='11988888888',
            email='maria@barbabyte.com'
        )
        db.session.add(cliente2)
        db.session.commit()
        print(f"✓ Cliente 2 criado com ID: {cliente2.id}")

        
        # Verificar
        total = Cliente.query.count()
        print(f"\n✅ SUCESSO! Total de clientes: {total}")
        
    except Exception as e:
        print(f"❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
