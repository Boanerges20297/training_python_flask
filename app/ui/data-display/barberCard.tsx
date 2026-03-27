/*Componente para exibir os dados do barbeiro, seguindo o padrão do barberProps */

import { BarberData } from "@/app/types/barber";
import Card from "@/app/ui/card";

export default function BarberCard({ barber, onSelect, isSelected }: { barber: BarberData, onSelect: (barber: BarberData) => void, isSelected: boolean }) {
    return (
        <Card isSelected={isSelected} onClick={() => onSelect(barber)}>
            <div className="card p-4">
                <div className="category"> {barber.name} </div>
                <div className="heading"> {barber.description}</div>
            </div>
        </Card>
    )
}