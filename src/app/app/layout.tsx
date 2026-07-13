import type { Metadata } from "next";
import { LmsShell } from "@/components/lms-shell";
import { getCurrentStudent } from "@/lib/data";
export const metadata: Metadata={title:"Student LMS",robots:{index:false,follow:false,nocache:true}};
export const dynamic = "force-dynamic";
export default async function StudentAppLayout({children}:{children:React.ReactNode}){const student=await getCurrentStudent();return <LmsShell student={student}>{children}</LmsShell>}
