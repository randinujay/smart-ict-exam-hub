import { PageHeading } from "@/components/page-heading";
import { ModuleBrowser } from "@/components/student/module-browser";
import { getStudentDashboardData } from "@/lib/data";

export default async function ModulesPage(){const data=await getStudentDashboardData();return <div><PageHeading eyebrow="MONTHLY LEARNING" title="Modules"/><ModuleBrowser data={data}/></div>}
