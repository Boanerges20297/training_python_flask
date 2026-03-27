/*Hook para buscar os serviços da API */
import { useState, useEffect } from "react";
import { Service } from "@/app/types/service";

const useServices = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMensage, setErrorMensage] = useState<string | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                /*Adicionado o metodo e o headers para satisfazer a API */
                const response = await fetch("http://localhost:8000/services", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
                const data = await response.json();
                setServices(data);
            } catch (error) {
                setErrorMensage("Erro ao buscar serviços");
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);

    return { services, isLoading, errorMensage };
}