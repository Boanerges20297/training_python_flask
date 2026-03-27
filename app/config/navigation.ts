//Arquivo que irá conter todas as rotas do software, ela será divida por roles (ADMIN, BARBER, CLIENT)
import { UserRole } from "@/app/types/auth";

type NavItem = {
    id: number;
    icon: string;
    href: string;
    roles: UserRole[];
    label: string;
}

export const navigation: NavItem[] = [
    /*CLIENT */
    {
        id: 1,
        icon: "fa-solid fa-calendar-days",
        href: "/client/new-appointment",
        roles: ["CLIENT"],
        label: "Novo agendamento"
    },
    {
        id: 2,
        icon: "fa-solid fa-calendar-check",
        href: "/client/history",
        roles: ["CLIENT"],
        label: "Histórico de Agendamentos"
    },
    /*BARBER */
    /*ADMIN */
]