import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
export const metadata:Metadata={title:"Administration",robots:{index:false,follow:false,nocache:true}};
export const dynamic = "force-dynamic";
export default function AdminWorkspaceLayout({children}:{children:React.ReactNode}){return <AdminShell>{children}</AdminShell>}
