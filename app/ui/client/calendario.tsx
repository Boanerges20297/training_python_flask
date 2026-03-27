import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useState } from "react";

interface CalendarioProps {
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
}

export default function Calendario({ selectedDate, onSelectDate }: CalendarioProps) {
    const [selected, setSelected] = useState<Date>();

    return (
        <div>
            <DayPicker
                animate
                mode="single"
                selected={selected}
                onSelect={setSelected}
                footer={
                    selected ? `Selected: ${selected.toLocaleDateString()}` : "Pick a day."
                }
            />
        </div>
    )
}
