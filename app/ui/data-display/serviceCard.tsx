/*
    Card de molde para exibir os serviços, usa o card como base e recebe ServiceCardProps 
    ele é um card selecionavel, ou seja, ao clicar nele, ele mudará de cor e chamará uma função onSelect
*/
'use client';

import Card from "@/app/ui/card";
import { ServiceCardProps } from "@/app/types/service"

const ServiceCard = ({ service, onSelect, isSelected }: ServiceCardProps) => {
    return (
        /*Usa a variavel isSelected para trocar o background ao selecionado, se estiver selecionado, o background será verde, caso contrário será branco */
        <Card isSelected={isSelected} onClick={() => {
            onSelect(service);
        }}>
            <div className="card p-4">
                <div className="category"> {service.name} </div>
                <div className="heading"> R$ {service.price}
                    <div className="author"> Duração: <span className="name">{service.duration} min</span></div>
                </div>
            </div>
        </Card>
    );
}

export default ServiceCard;