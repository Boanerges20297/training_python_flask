import type { Metadata } from "next";
import SideBar from "@/app/ui/sidebar/sidebar";

export const metadata: Metadata = {
    title: "Client",
    description: "Client page",
};

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-row">
            <SideBar />
            {/* Area que será renderizado os componentes baseado na interação da sidebar, ocupará todo o espaço restante e alinhará no centro */}
            <main className="flex-1 flex items-center justify-center">
                {children}
            </main>
        </div>

    )
}
