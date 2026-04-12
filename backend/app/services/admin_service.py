from app import db
from app.models.admin import Admin
from app.schemas.admin_schema import AdminCreate, AdminUpdate


class AdminService:
    """
    Centraliza a lógica de negócios para Administradores e Gerentes.
    Garante a integridade de dados (e-mails únicos) e delega a criptografia
    de senhas para o HashSenhaMixin de forma transparente.
    """

    @staticmethod
    def criar_admin(dados: AdminCreate) -> Admin:
        """
        Entrada: Schema AdminCreate validado.
        Processo: Valida unicidade de e-mail e persiste o admin (com hash automático).
        """
        # 1. Validação de Unicidade
        if Admin.query.filter_by(email=dados.email).first():
            raise ValueError("Já existe um usuário cadastrado com este e-mail.")

        # 2. Persistência (O Mixin fará o hash automático da senha aqui)
        novo_admin = Admin(**dados.model_dump())

        db.session.add(novo_admin)
        db.session.commit()

        return novo_admin

    @staticmethod
    def listar_admins(page: int, per_page: int):
        """
        Retorna o objeto de paginação do SQLAlchemy.
        """
        return Admin.query.order_by(Admin.data_criacao.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    @staticmethod
    def editar_admin(admin_id: int, dados: AdminUpdate) -> Admin:
        """
        Edição Parcial (PATCH). Atualiza apenas os campos enviados.
        Garante que mudanças de e-mail não gerem duplicidade.
        """
        admin = Admin.query.get_or_404(admin_id)

        # exclude_unset=True ignora campos que não foram enviados no JSON
        dados_para_atualizar = dados.model_dump(exclude_unset=True)

        # 1. Validação de Unicidade de E-mail (Ignorando a si mesmo)
        novo_email = dados_para_atualizar.get("email")
        if novo_email and novo_email != admin.email:
            conflito = Admin.query.filter_by(email=novo_email).first()
            if conflito:
                raise ValueError("Este e-mail já está em uso por outro administrador.")

        # 2. Atualização Dinâmica (O Mixin fará o hash se a 'senha' estiver nos dados)
        for campo, valor in dados_para_atualizar.items():
            setattr(admin, campo, valor)

        db.session.commit()
        return admin

    @staticmethod
    def alternar_status(admin_id: int) -> Admin:
        """
        Soft Delete / Bloqueio de Acesso.
        Inverte o status ativo/inativo do administrador.
        """
        admin = Admin.query.get_or_404(admin_id)

        admin.ativo = not admin.ativo  # Se True vira False, se False vira True
        db.session.commit()

        return admin
