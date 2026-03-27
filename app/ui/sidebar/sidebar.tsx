import ProfileCard from "@/app/ui/data-display/profileCard";
import TopLogo from "@/app/ui/topLogo";
import ButtonSidebar from "@/app/ui/sidebar/buttonSidebar";
import { navigation } from "@/app/config/navigation";
import { UserRole } from "@/app/types/auth";

/*Componente Sidebar que contem o logo, os botões de navegação, que são renderizados baseado em uma lista de objetos, e o perfil do usuário */

/*Variavel para guardar o usuario recebido pela API, por enquanto será mockado */
const user = {
  name: "wihtyzu",
  role: "CLIENT"
}

/*Variavel para saber qual a role do usuario logado */
const userRole: UserRole = user?.role as UserRole;

/*Variavel para guardar os itens do menu, baseado no arquivo navigation */
const menuItems = navigation.filter((item) => item.roles.includes(userRole));

const SideBar = () => {
  return (
    <aside className="w-72 h-screen bg-white p-5 shadow-md shadow-purple-200/50 rounded-md">
      <TopLogo />
      <hr className="w-full border-gray-600 mb-6" />
      {/*Adicionado o nav para ficar semanticamente correto*/}
      <nav className="w-full h-full flex flex-col gap-2">
        <ul className="w-full h-full flex flex-col gap-2">
          {/* Renderiza os botões de navegação baseado em uma lista de objetos */}
          {menuItems.map((item) => (
            <li key={item.id} className="flex-center cursor-pointer p-16-semibold w-full whitespace-nowrap">
              <ButtonSidebar icon={item.icon} href={item.href}>{item.label}</ButtonSidebar>
            </li>
          ))}
          {/* Somente o ProfileCard deve ficar no final da sidebar */}
          {/* ProfileCard que recebe o nome de usuario e sua role da API para exibir */}
          <li className="flex-center cursor-pointer p-16-semibold w-full whitespace-nowrap mt-auto">
            <ProfileCard />
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default SideBar;
