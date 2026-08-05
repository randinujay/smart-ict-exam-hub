import { CheckCircle2, Clock3, MessageCircleMore, Trash2 } from "lucide-react";
import { deleteSupportRequestAction, updateSupportStatusAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { displayPhone } from "@/lib/auth";
import { getAdminData, getAdminSupportRequests } from "@/lib/data";

export default async function AdminSupportPage() {
  const [data, requests] = await Promise.all([getAdminData(), getAdminSupportRequests()]);
  return <div><PageHeading eyebrow="STUDENT ASSISTANCE" title="Support Requests" /><section className="support-admin-list">
    {requests.length ? requests.map((request) => { const student = data.students.find((item) => item.id === request.studentId); return <article key={request.id}>
      <header><span className="support-request-icon"><MessageCircleMore /></span><div><div className="student-title-row"><h3>{request.subject}</h3><StatusBadge tone={request.status === "resolved" ? "success" : request.status === "in_progress" ? "brand" : "warning"}>{request.status.replace("_", " ")}</StatusBadge></div><p>{student?.fullName ?? request.contactNumber ?? "Unmatched request"}{student && ` / ${displayPhone(student.phone)}`}</p><small><Clock3 size={14} />{new Date(request.createdAt).toLocaleString("en-LK")}</small></div></header>
      <div className="support-request-message">{request.message}</div>
      <div className="support-actions"><form action={updateSupportStatusAction} className="support-resolution-form"><input type="hidden" name="requestId" value={request.id} /><select name="status" defaultValue={request.status}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><input name="adminNotes" defaultValue={request.adminNotes || ""} placeholder="Admin note" /><button className="button button-dark button-small"><CheckCircle2 size={15} />Save</button></form><form action={deleteSupportRequestAction}><input type="hidden" name="requestId" value={request.id} /><ConfirmSubmitButton className="icon-danger-button" aria-label="Delete request" message="Delete this support request?"><Trash2 size={16} /></ConfirmSubmitButton></form></div>
    </article>; }) : <div className="empty-state">No support requests.</div>}
  </section></div>;
}
