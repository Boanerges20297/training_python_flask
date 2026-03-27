/* Tipos de dados para o barbeiro */

export interface BarberProps {
    data: BarberData[];
    isLoading: boolean;
    errorMensage: string | null;
}

export interface BarberData {
    id: number;
    name: string;
    description: string;
}