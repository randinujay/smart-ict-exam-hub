import { PageHeading } from "@/components/page-heading";
import { ModuleBrowser } from "@/components/student/module-browser";
import { getStudentDashboardData } from "@/lib/data";

export default async function ModulesPage(){const data=await getStudentDashboardData();return <div><PageHeading eyebrow="MONTHLY LEARNING" title="Modules" description="Recordings, resources and assessments organised by month for your assigned program and batch."/><ModuleBrowser data={data}/></div>}
