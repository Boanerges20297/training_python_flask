/*
    Componente para selecionar o barbeiro que o cliente deseja agendar, a lista virá de uma API e os barbeiros serão renderizados baseado
    na ordem que vem da API, cada barbeiro terá um botão para selecionar, por enquanto, usará dados mockados
*/
import { BarberProps } from "@/app/types/barber";
import BarberCard from "@/app/ui/data-display/barberCard";
/*Seguirá o padrão do barberProps */

interface Props {
    selectedBarber: number | null;
    onToggle: (barber: number | null) => void;
}

const barbers: BarberProps = {
    data: [
        {
            id: 1,
            name: "Barbeiro 1",
            description: "Especialista em cortes modernos",
        },
        {
            id: 2,
            name: "Barbeiro 2",
            description: "Especialista em cortes clássicos",
        },
        {
            id: 3,
            name: "Barbeiro 3",
            description: "Especialista em cortes clássicos",
        },
    ],
    isLoading: false,
    errorMensage: null
}

export default function StepBarber({ selectedBarber, onToggle }: Props) {
    /*Só deverá permitir selecionar um barbeiro por vez, ou seja, ao selecionar um barbeiro, os outros deverão ser deselecionados */

    const handleSelectBarber = (barber: { id: number, name: string }) => {
        if (selectedBarber === barber.id) {
            onToggle(null);
        } else {
            onToggle(barber.id);
        }
    }

    return (
        <div>
            <h1>Selecione o profissional</h1>
            <ul className="w-full h-full flex flex-row gap-8">
                {barbers.isLoading && <p>Carregando barbeiros...</p>}
                {barbers.errorMensage && <p>{barbers.errorMensage}</p>}
                {barbers.data.map((barber) => (
                    /*Background do li será transparente, pois o card já tem um background */
                    <li key={barber.id} className={"flex-center cursor-pointer p-16-semibold w-full whitespace-nowrap transparent"}>
                        <BarberCard
                            barber={barber}
                            onSelect={(barber) => handleSelectBarber({ id: barber.id, name: barber.name })}
                            isSelected={selectedBarber === barber.id}
                        />
                    </li>
                ))}
            </ul>
        </div>
    )
}