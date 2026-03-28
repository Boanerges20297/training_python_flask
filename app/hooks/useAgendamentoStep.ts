/*Hook para controlar os steps do agendamento */

import { useState } from "react";
import { AgendamentoData } from "@/app/types/agendamento";

export default function useAgendamentoStep() {
    const [data, setData] = useState<AgendamentoData>({
        selectedService: [],
        selectedDate: undefined,
        selectedTime: "",
        selectedBarber: null
    });
    const [step, setStep] = useState<number>(1);
    const isStepValid = () => {
        switch (step) {
            case 1:
                return data.selectedService.length > 0;
            case 2:
                return data.selectedBarber !== null;
            case 3:
                return data.selectedDate !== undefined && data.selectedTime !== "";
            case 4:
                return true;
            default:
                return false;
        }
    }

    const updateData = (data: AgendamentoData) => setData(data);

    const nextStep = () => setStep(step + 1);
    const previousStep = () => setStep(step - 1);

    return { data, step, updateData, nextStep, previousStep, isStepValid }
}