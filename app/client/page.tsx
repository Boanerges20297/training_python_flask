'use client'

import StepService from "@/app/ui/client/stepService";
import Button from "@/app/ui/button";
import useAgendamentoStep from "@/app/hooks/useAgendamentoStep";
import StepBarber from "@/app/ui/client/stepBarber";
import StepDateTime from "@/app/ui/client/stepDatetime";
import StepConfirmation from "@/app/ui/client/stepConfirmation";

export default function ClientPage() {
    /*Variaveis para guardar o estado da aplicação */

    const { data, step, updateData, nextStep, previousStep, isStepValid } = useAgendamentoStep();
    /* 
    O componente ClientPage é onde o cliente irá realizar seus agendamentos e consultar seus historicos.
    Baseado na interação da sidebar, deverá ser renderizado componentes especificos.
    Ex: ao clicar na opção "Agendamentos" da sidebar, deverá ser renderizado o componente Agendamentos.
    
    */

    return (
        <div className="flex flex-col gap-8">
            {/*Area para os cards */}
            <div>
                {/* Area que será renderizado os componentes baseado na interação da sidebar */}
                {/* Renderiza os componentes baseado na interação da sidebar */}
                {step === 1 && (
                    <StepService
                        selectedServices={data.selectedService}
                        onToggle={(services) => {
                            updateData({ ...data, selectedService: services });
                        }} />
                )}
                {step === 2 && (
                    <StepBarber
                        selectedBarber={data.selectedBarber}
                        onToggle={(barber) => {
                            updateData({
                                ...data,
                                selectedBarber: barber
                            });
                        }} />
                )}
                {step === 3 && (
                    <StepDateTime
                        selectedDate={data.selectedDate}
                        selectedTime={data.selectedTime}
                        onToggle={(date, time) => {
                            updateData({
                                ...data,
                                selectedDate: date,
                                selectedTime: time,
                            });
                        }} />
                )}
                {step === 4 && (
                    <StepConfirmation data={data} />
                )}
            </div>
            {/*Area para os botões de navegação */}
            {/*Se a step for 1, os botões deverão ficar no final, caso contrário, deverão ficar justificados */}
            <nav className={`flex flex-row gap-4 ${step === 1 ? "justify-end" : "justify-between"}`}>
                {/*Se a etapa for 4, tire o botão de voltar, caso ela seja 1, tire o botão de proximo, caso contrário, mostre ambos */}
                {step > 1 && (
                    <Button onClick={() => { previousStep(); }}>
                        <span>Voltar</span>
                    </Button>
                )}
                {/*Se não haver dados da etapa atual, o botão de proximo deverá ficar desabilitado */}
                <Button
                    onClick={
                        step === 4 ? () => { console.log(data) } : () => { nextStep(); }
                    }
                    disabled={!isStepValid()}>
                    {step === 4 ? <span>Finalizar</span> : <span>Proximo</span>}
                </Button>
            </nav>
        </div>
    );
}