import Calendario from "@/app/ui/client/calendario";
import HorarioCard from "@/app/ui/data-display/horarioCard";

interface Props {
    selectedDate: Date | undefined;
    selectedTime: string;
    onToggle: (date: Date | undefined, time: string) => void;
}

export default function StepDateTime({ selectedDate, selectedTime, onToggle }: Props) {
    const horarios = [
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "18:00",
        "19:00",
        "20:00",
    ]
    const handleSelectDate = (date: Date | undefined) => {
        onToggle(date, selectedTime);
    }

    const handleSelectTime = (time: string) => {
        if (selectedTime === time) {
            onToggle(selectedDate, "");
            console.log("Desselecionado")
        } else {
            onToggle(selectedDate, time);
            console.log("Selecionado")
        }
    }

    return (
        /*Colocar no onToggle deverá ser acionada para atualizar a data e o horario */
        <div className="flex flex-row gap-8">
            <Calendario
                selectedDate={selectedDate}
                onSelectDate={(date) => handleSelectDate(date)}
            />
            {/*Local para o componente de horarios */}
            {/* Deve ser uma lista organizada em grid com no maximo 4 colunas e numeros infinitos de linhas */}
            <ul className="w-full h-full grid grid-cols-4 gap-8">
                {horarios.map((horario) => (
                    <li key={horario} className={"flex-center cursor-pointer whitespace-nowrap transparent"}>
                        <HorarioCard
                            horario={horario}
                            onSelect={(horario) => handleSelectTime(horario)}
                            isSelected={selectedTime === horario}
                        />
                    </li>
                ))}
            </ul>
        </div>
    )
}