import os
import time
import logging
from logging.handlers import RotatingFileHandler
from pythonjsonlogger.jsonlogger import JsonFormatter
from flask import request


def setup_logger(app, logger_instance):
    """
    Configura o logger da aplicação injetando o formato JSON e rotação de logs.
    Também adiciona middlewares globais para logar cada requisição HTTP.
    """
    # 1. Configurar nível de log
    log_level = logging.DEBUG if app.config.get("DEBUG") else logging.INFO
    logger_instance.setLevel(log_level)

    # 2. Impedir que o logger propague para o root (que poderia duplicar logs no console)
    logger_instance.propagate = False

    # 3. Garantir a existência do diretório de logs
    logs_dir = os.path.join(app.root_path, "..", "logs")
    os.makedirs(logs_dir, exist_ok=True)
    log_file_path = os.path.join(logs_dir, "app.log")

    # 4. Criar o FileHandler com Rotação (Máximo 5MB, mantém até 5 arquivos backups)
    file_handler = RotatingFileHandler(
        log_file_path, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setLevel(log_level)

    # 5. Configurar o formatador JSON
    # 'timestamp' já vem do padrão, mas injetamos asctime, levelname, e message
    formatter = JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(module)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )
    file_handler.setFormatter(formatter)
    
    # Se já houver handlers (pelo reload do debug), remova-os para não duplicar
    if logger_instance.hasHandlers():
        logger_instance.handlers.clear()
        
    logger_instance.addHandler(file_handler)

    # Opcional: Adicionar Console Handler para ver os logs JSON no terminal (útil em dev)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    logger_instance.addHandler(console_handler)

    # 6. Registrar Middlewares (Hooks do Flask)
    @app.before_request
    def start_timer():
        # Salvamos o tempo exato em que a request chegou no escopo da requisição (g)
        # O g é um objeto global disponível apenas durante a requisição atual
        request.start_time = time.time()

    @app.after_request
    def log_request(response):
        """Loga automaticamente cada requisição recebida."""
        # Se start_time não existir (ex: exceção no before_request), setamos como 0
        start_time = getattr(request, "start_time", time.time())
        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Evitamos poluir o log com a rota / estática de status que é chamada toda hora por health checks
        if request.path == "/":
            return response

        # Preparamos os dados extras que viram chaves no JSON
        log_data = {
            "method": request.method,
            "path": request.path,
            "ip": request.remote_addr,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        }

        # Separar por nível para ficar mais claro o que deu erro (Server Error vs Client Error vs Ok)
        if response.status_code >= 500:
            logger_instance.error(f"Erro Interno no endpoint {request.path}", extra=log_data)
        elif response.status_code >= 400:
            logger_instance.warning(f"Rejeição no endpoint {request.path}", extra=log_data)
        else:
            logger_instance.info(f"Requisição no endpoint {request.path}", extra=log_data)

        return response
