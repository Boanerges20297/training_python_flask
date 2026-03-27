//Arquivo de tipagem de serviço

export interface Service {
    id: number;
    name: string;
    price: number;
    duration: number;
}

export interface ServiceProps {
    data: Service[]
    isLoading: boolean
    errorMensage: string | null
}

export interface ServiceCardProps {
    service: Service
    onSelect: (service: Service) => void
    isSelected: boolean
}   