def obter_layout_agendamento(
    nome_usuario, data, hora, servico, barbeiro, status="Confirmado"
):
    """
    Retorna uma string HTML formatada e estilizada para o e-mail.
    """
    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5; color: #333; }}
            .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }}
            .header {{ background-color: #1a1a1a; padding: 30px 20px; text-align: center; }}
            .header h1 {{ margin: 0; color: #d4af37; font-size: 24px; letter-spacing: 1px; }}
            .content {{ padding: 30px 40px; text-align: center; }}
            .details-box {{ background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 6px; padding: 20px; margin: 25px 0; text-align: left; }}
            .detail-row {{ margin-bottom: 12px; font-size: 16px; }}
            .detail-label {{ font-weight: bold; color: #1a1a1a; display: inline-block; width: 90px; }}
            .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }}
            .badge {{ display: inline-block; background-color: #d4edda; color: #155724; padding: 5px 12px; border-radius: 12px; font-weight: bold; margin-bottom: 15px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>BARBA & BYTE</h1>
            </div>
            <div class="content">
                <span class="badge">Agendamento {status}</span>
                <h2>Tudo certo, {nome_usuario}!</h2>
                <p>Sua cadeira já está reservada. Confira os detalhes do seu horário:</p>
                
                <div class="details-box">
                    <div class="detail-row"><span class="detail-label">Data:</span> <strong>{data}</strong></div>
                    <div class="detail-row"><span class="detail-label">Hora:</span> <strong>{hora}</strong></div>
                    <div class="detail-row"><span class="detail-label">Serviço:</span> {servico}</div>
                    <div class="detail-row"><span class="detail-label">Barbeiro:</span> {barbeiro}</div>
                </div>
                
                <p style="font-size: 14px;">Chegue com 5 minutos de antecedência.</p>
            </div>
            <div class="footer">
                <p>Barba & Byte - Estilo e Tecnologia</p>
            </div>
        </div>
    </body>
    </html>
    """


def obter_layout_boas_vindas(nome_usuario):
    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #1a1a1a;">Olá, {nome_usuario}! Bem-vindo ao Barba & Byte.</h2>
            <p style="color: #555;">Sua conta foi criada com sucesso. Agora você pode agendar seus horários de forma rápida.</p>
            <a href="https://seusite.com" style="display: inline-block; background-color: #d4af37; color: #1a1a1a; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Acessar Sistema</a>
        </div>
    </body>
    </html>
    """


def obter_layout_recuperacao_senha(nome_usuario, link_recuperacao):
    """
    Retorna o layout do e-mail de recuperação de senha.
    """
    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5; color: #333; }}
            .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }}
            .header {{ background-color: #1a1a1a; padding: 30px 20px; text-align: center; }}
            .header h1 {{ margin: 0; color: #d4af37; font-size: 24px; letter-spacing: 1px; }}
            .content {{ padding: 30px 40px; text-align: center; }}
            .btn-reset {{ display: inline-block; background-color: #d4af37; color: #1a1a1a; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }}
            .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>BARBA & BYTE</h1>
            </div>
            <div class="content">
                <h2>Recuperação de Senha</h2>
                <p>Olá, {nome_usuario}!</p>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta. Se você não solicitou, pode ignorar este e-mail.</p>
                <p>Para criar uma nova senha, clique no botão abaixo:</p>
                
                <a href="{link_recuperacao}" class="btn-reset">Redefinir Senha Agora</a>
                
                <p style="font-size: 14px; color: #666;">Este link expirará em 30 minutos.</p>
            </div>
            <div class="footer">
                <p>Barba & Byte - Estilo e Tecnologia</p>
            </div>
        </div>
    </body>
    </html>
    """
