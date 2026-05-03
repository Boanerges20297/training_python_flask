# Modelos de banco de dados
from .cliente import Cliente
from .barbeiro import Barbeiro
from .servico import Servico
from .agendamento import Agendamento
from .admin import Admin
from .barbeiro_servico import BarbeiroServico
from .token_blocklist import TokenBlocklist

# Vinicius - 19/04/2026
# Adicionado BarbeiroServico na lista de exportação
__all__ = ["Cliente", "Barbeiro", "Servico", "Agendamento", "Admin", "BarbeiroServico", "TokenBlocklist"]
