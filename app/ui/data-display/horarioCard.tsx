//Componente para renderizar os horarios
import Card from "@/app/ui/card";


interface Props {
    horario: string;
    onSelect: (horario: string) => void;
    isSelected: boolean;
}

export default function HorarioCard({ horario, onSelect, isSelected }: Props) {
    return (
        /*Deve ter um tamanho fixo para não quebrar o layout */
        <Card
            className="py-3 px-8 w-32 h-16"
            isSelected={isSelected}
            onClick={() => onSelect(horario)}
        >
            <span className="p-16-semibold">{horario}</span>
        </Card>
    )
}
