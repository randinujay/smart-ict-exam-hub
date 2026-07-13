import { redirect } from "next/navigation";
export default async function LegacyResult({params}:{params:Promise<{attemptId:string}>}){const{attemptId}=await params;redirect(`/app/results/${attemptId}`)}
