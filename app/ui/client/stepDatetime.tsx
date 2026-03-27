import Calendario from "@/app/ui/client/calendario";

interface Props {
    selectedDate: string;
    selectedTime: string;
    onToggle: (date: string, time: string) => void;
}

export default function StepDateTime({ selectedDate, selectedTime, onToggle }: Props) {
    return (
        <Calendario
            selectedDate={selectedDate}
            onSelectDate={(date) => onToggle(date, selectedTime)}
        />
    )
}