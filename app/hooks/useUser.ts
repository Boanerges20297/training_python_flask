/*Hook para pegar o usuario na API baseado no seu token de autenticação */

import { User, UserProps } from "@/app/types/auth";
import { useState, useEffect } from "react";

export default function useUser(): UserProps {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMensage, setErrorMensage] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:8000/user", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        }).then((response) => response.json())
            //Caso o data venha vazio, retorna um erro e o usuario
            .then((data) => {
                if (data.length === 0) {
                    setErrorMensage("Nenhum usuário encontrado");
                } else {
                    setUser(data);
                }
            })
            .catch((error) => {
                setErrorMensage("Erro ao buscar usuário");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    return { data: user!, isLoading, errorMensage };
}