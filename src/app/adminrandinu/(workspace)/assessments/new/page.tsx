import { AssessmentBuilder } from "@/components/admin/assessment-builder";
import { getAdminData } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
export default async function NewAssessmentPage(){const data=await getAdminData();return <AssessmentBuilder batches={data.batches} modules={data.modules} demoMode={!isSupabaseConfigured()}/>}
