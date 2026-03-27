/*Componente para selecionar o serviço que o cliente deseja agendar, a lista virá de uma API e os serviços serão renderizados baseado
na ordem que vem da API, cada serviço terá um botão para selecionar, por enquanto, usará dados mockados
*/
import { ServiceProps } from "@/app/types/service";
import ServiceCard from "@/app/ui/data-display/serviceCard";
/*Seguirá o padrão do serviceProps */

interface Props {
    selectedServices: { id: number, name: string }[]
    onToggle: (newServices: { id: number, name: string }[]) => void
}

const services: ServiceProps = {
    data: [
        {
            id: 1,
            name: "Corte de cabelo",
            price: 25.00,
            duration: 30,
        },
        {
            id: 2,
            name: "Barba",
            price: 20.00,
            duration: 20,
        },
        {
            id: 3,
            name: "Corte e barba",
            price: 40.00,
            duration: 50,
        },
    ],
    isLoading: false,
    errorMensage: null
}

export default function StepService({ selectedServices, onToggle }: Props) {
    /*Função para selecionar os serviços, recebe como parametro um objeto com o id e o nome do serviço*/
    /*Se o serviço já existir na lista, não permita inseri-lo novamente, se já estiver selecionado, remova-o*/
    const handleSelectService = (service: { id: number, name: string }) => {
        {/*Utiliza some inves de include para verificar se o serviço existe pelo ID */ }
        if (selectedServices.some(s => s.id === service.id)) {
            onToggle(selectedServices.filter(s => s.id !== service.id));
        } else {
            onToggle([...selectedServices, service]);
        }
    }

    return (
        <div>
            <h1>Selecione o seu serviço</h1>
            {/*Lista de serviços, cada item será um card de serviço, ordenados em grid*/}
            <ul className="w-full h-full flex flex-row gap-8">
                {services.isLoading && <p>Carregando serviços...</p>}
                {services.errorMensage && <p>{services.errorMensage}</p>}
                {services.data.map((service) => (
                    /*Background do li será transparente, pois o card já tem um background */
                    <li key={service.id} className={"flex-center cursor-pointer p-16-semibold w-full whitespace-nowrap transparent"}>
                        <ServiceCard isSelected={selectedServices.some(s => s.id === service.id)}
                            service={service}
                            onSelect={service => handleSelectService(service)} />
                    </li>
                ))}
            </ul>
        </div>
    )
}