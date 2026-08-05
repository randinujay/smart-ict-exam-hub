import { PageHeading } from "@/components/page-heading";
import { AssessmentBrowser } from "@/components/student/assessment-browser";
import { getStudentDashboardData } from "@/lib/data";

export default async function AssessmentsPage(){const data=await getStudentDashboardData();return <div><PageHeading eyebrow="PRACTISE & PERFORM" title="Exams & Quizzes"/><AssessmentBrowser data={data}/></div>}
