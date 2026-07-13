import { PageHeading } from "@/components/page-heading";
import { ResourceBrowser } from "@/components/student/resource-browser";
import { getStudentDashboardData } from "@/lib/data";

export default async function ResourcesPage(){const data=await getStudentDashboardData();return <div><PageHeading eyebrow="DOWNLOAD LIBRARY" title="Resources" description="Tutes, worksheets, revision notes and papers available to your Smart ICT account."/><ResourceBrowser data={data}/></div>}
