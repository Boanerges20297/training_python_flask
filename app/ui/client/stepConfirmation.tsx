import { AgendamentoData } from "@/app/types/agendamento";
import Card from "@/app/ui/card";

interface Props {
    data: AgendamentoData;
}

export default function StepConfirmation({ data }: Props) {
    return (
        <Card>
            <h1>Confirmação</h1>
            <p>Serviço: {data.selectedService.map((service) => service.name).join(", ")}</p>
            <p>Barbeiro: {data.selectedBarber}</p>
            <p>Data: {data.selectedDate?.toLocaleDateString()}</p>
            <p>Horário: {data.selectedTime}</p>
        </Card>
    )
}