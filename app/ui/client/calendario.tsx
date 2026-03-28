import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { useState } from "react";

interface CalendarioProps {
    selectedDate: Date | undefined;
    onSelectDate: (date: Date | undefined) => void;
}

export default function Calendario({ selectedDate, onSelectDate }: CalendarioProps) {
    const handleSelectDate = (date: Date | undefined) => {
        onSelectDate(date)
    }

    return (
        <div>
            {/*Os dias que já passaram deverão ficar desabilitados */}
            {/*Ao selecionar a data deve chamar a função onSelectDate */}
            {/*Voltar no mês selecionado */}
            <DayPicker
                defaultMonth={selectedDate ? new Date(selectedDate) : new Date()}
                animate
                locale={ptBR}
                mode="single"
                disabled={{
                    before: new Date(),
                }}
                selected={selectedDate}
                onSelect={handleSelectDate}
                required
            />
        </div>
    )
}
