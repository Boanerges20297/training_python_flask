# Vinicius - 19/04/2026
# Script para gerar chaves RSA

"""
O que são chaves RSA (Criptografia Assimétrica)?
O algoritmo RSA trabalha com um par de chaves conjugadas (matematicamente interligadas).

1. Chave Privada (private_key.pem):
   A "Caneta Oficial" do sistema. É altamente secreta e serve única e exclusivamente para ASSINAR (criar)
   os tokens JWT originais. Se vazar, seu sistema é comprometido. Apenas o servidor raiz de Autenticação
   precisa conhecê-la.

2. Chave Pública (public_key.pem):
   O "Leitor". Pode ser distribuída por outras partes do seu ecossistema, pois ela só tem poder para VERIFICAR
   se um JWT foi gerado pela sua Chave Privada legítima. A matemática impede que a Pública forje novos tokens.

Como usar:
Após a geração, copie o texto interno com atenção para não quebrar a ordem.
Recomendamos salvar isso no `.env` do servidor (substituindo as quebras de linha por um `\\n` literal).
"""

import os
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

# Caminho baseado no local deste script
BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def generate_keys():
    print("Gerando par de chaves RSA-2048...")

    # Gerar a chave privada
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    # Gerar a chave pública a partir da privada
    public_key = private_key.public_key()

    # Serializar chave privada
    pem_private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    # Serializar chave pública
    pem_public = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    # Escrever os arquivos
    priv_path = os.path.join(BASE_DIR, "private_key.pem")
    pub_path = os.path.join(BASE_DIR, "public_key.pem")

    with open(priv_path, "wb") as f:
        f.write(pem_private)

    with open(pub_path, "wb") as f:
        f.write(pem_public)

    print(f"Sucesso! \nChave Privada salva em: {priv_path}")
    print(f"Chave Pública salva em: {pub_path}")


if __name__ == "__main__":
    generate_keys()
