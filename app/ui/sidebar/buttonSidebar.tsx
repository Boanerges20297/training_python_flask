/*Botão da sidebar que contem um icone do fontawesome, um texto e um href de parametro */
import Link from "next/link";

export default function ButtonSidebar({ children, icon, href }: { children: React.ReactNode, icon: string, href: string }) {
    return <Link href={href} className="p-16-semibold flex size-full gap-4 p-4 group font-semibold rounded-full bg-cover hover:bg-purple-100 hover:shadow-inner focus:bg-gradient-to-r from-purple-400 to-purple-600 focus:text-white text-gray-700 transition-all ease-linear">
        <i className={`${icon}`}></i>
        {children}
    </Link>
}