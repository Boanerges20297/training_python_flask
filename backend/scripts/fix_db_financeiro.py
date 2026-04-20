import sqlite3


def fix_banco_financeiro():
    conn = sqlite3.connect("instances/barba_byte.db")

    print("--- Corrigindo tabela Clientes ---")
    try:
        conn.execute(
            "ALTER TABLE clientes ADD COLUMN status VARCHAR(20) DEFAULT 'ativo';"
        )
        print("Coluna status criada")
    except Exception as e:
        print(e)

    try:
        conn.execute("ALTER TABLE clientes ADD COLUMN divida_total FLOAT DEFAULT 0.0;")
        print("Coluna divida_total criada")
    except Exception as e:
        print(e)

    try:
        conn.execute("ALTER TABLE clientes ADD COLUMN ultima_visita DATETIME;")
        print("Coluna ultima_visita criada")
    except Exception as e:
        print(f"Aviso ultima_visita: {e}")

    print("\n--- Corrigindo tabela Agendamentos ---")
    try:
        conn.execute("ALTER TABLE agendamentos ADD COLUMN pago BOOLEAN DEFAULT 0;")
        print("Coluna 'pago' criada em agendamentos")
    except Exception as e:
        print(f"Aviso pago: {e}")

    conn.commit()
    conn.close()
    print("Correções aplicadas no banco de desenvolvedor!")


if __name__ == "__main__":
    fix_banco_financeiro()
