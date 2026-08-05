import { MessageSquareQuote, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { createTestimonialAction, deleteTestimonialAction, updateTestimonialAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminData } from "@/lib/data";

export default async function AdminTestimonialsPage() {
  const data = await getAdminData();
  return <div>
    <PageHeading eyebrow="PUBLIC WEBSITE" title="Reviews" />
    <details className="admin-create-panel"><summary><Plus size={17} />Add review</summary><form action={createTestimonialAction} className="admin-form-grid">
      <label className="field"><span>Name</span><input name="studentName" required /></label><label className="field"><span>Program</span><input name="programName" required /></label><label className="field"><span>Outcome</span><input name="resultLabel" /></label><label className="field full"><span>Review</span><textarea name="quote" rows={5} required /></label><label className="toggle-field"><input name="isPublished" type="checkbox" defaultChecked />Published</label><button className="button button-primary"><MessageSquareQuote size={17} />Add review</button>
    </form></details>
    <section className="testimonial-grid admin-testimonial-grid">{data.testimonials.map((item) => <article key={item.id} className="testimonial-card admin-manage-card">
      <p>{item.quote}</p><footer><div><strong>{item.studentName}</strong><span>{item.programName}</span></div><StatusBadge tone={item.isPublished ? "success" : "neutral"}>{item.isPublished ? "Published" : "Hidden"}</StatusBadge></footer>
      <div className="card-action-row"><details className="inline-editor"><summary><Pencil size={15} />Edit</summary><form action={updateTestimonialAction} className="admin-form-grid compact-form">
        <input type="hidden" name="testimonialId" value={item.id} /><label className="field"><span>Name</span><input name="studentName" defaultValue={item.studentName} required /></label><label className="field"><span>Program</span><input name="programName" defaultValue={item.programName} required /></label><label className="field"><span>Outcome</span><input name="resultLabel" defaultValue={item.resultLabel} /></label><label className="field full"><span>Review</span><textarea name="quote" rows={5} defaultValue={item.quote} required /></label><label className="toggle-field"><input name="isPublished" type="checkbox" defaultChecked={item.isPublished} />Published</label><button className="button button-primary"><Save size={15} />Save</button>
      </form></details><form action={deleteTestimonialAction}><input type="hidden" name="testimonialId" value={item.id} /><ConfirmSubmitButton className="button button-danger button-small" message={`Delete the review from ${item.studentName}?`}><Trash2 size={15} />Delete</ConfirmSubmitButton></form></div>
    </article>)}</section>
  </div>;
}
