import { redirect } from "next/navigation";
export default async function LegacyExam({params}:{params:Promise<{examId:string}>}){const{examId}=await params;redirect(`/app/assessments/${examId}`)}
