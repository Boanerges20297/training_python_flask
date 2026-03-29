from app import create_app

# Cria a aplicação usando o factory pattern
# O registro de Blueprints e a configuração do BD agora são feitos internamente no create_app
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
