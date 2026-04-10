#josue inicio

from app import db
from sqlalchemy import text
class GerenciadorDeTabelas:

#aqui fazemos o delete de um registro especifico pelo id
    @staticmethod
    def deletar_por_id(modelo,id):
        try:
            registro = modelo.query.get(id)
            if registro:
                db.session.delete(registro)
                db.session.commit()
                print(f'Registro {id} da tabela {modelo.__name__} deletado com sucesso')
            else:
                db.session.rollback()
                print(f'Ops! O registro com ID {id} não foi encontrado na tabela {modelo.__name__}.')
        except Exception as e:
            db.session.rollback()
            print(f'Erro ao tentar deletar registro {id}: {e}')

#josue fim