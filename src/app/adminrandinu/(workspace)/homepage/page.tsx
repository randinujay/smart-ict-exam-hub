import { Save } from "lucide-react";
import { updateHomepageContentAction, updateSiteSettingsAction } from "@/app/actions/admin";
import { PublicImageField } from "@/components/admin/public-image-field";
import { PageHeading } from "@/components/page-heading";
import { getPublicSiteContent, getSiteSettings } from "@/lib/data";
import { PUBLIC_CONTENT_DEFAULTS, type PublicContentKey } from "@/lib/site-content";

const groups: Array<{ title: string; fields: Array<{ key: PublicContentKey; label: string; area?: boolean }> }> = [
  { title: "Hero", fields: [{ key: "hero_eyebrow", label: "Small heading" }, { key: "hero_title", label: "Main heading" }, { key: "hero_highlight", label: "Highlighted heading" }] },
  { title: "Classes", fields: [{ key: "programs_kicker", label: "Small heading" }, { key: "programs_title", label: "Heading" }] },
  { title: "About", fields: [{ key: "about_kicker", label: "Small heading" }, { key: "about_title", label: "Heading" }, { key: "about_lead", label: "Lead paragraph", area: true }, { key: "about_body", label: "Body paragraph", area: true }] },
  { title: "Why Smart ICT", fields: [{ key: "why_kicker", label: "Small heading" }, { key: "why_title", label: "Heading" }] },
  { title: "LMS", fields: [{ key: "lms_kicker", label: "Small heading" }, { key: "lms_title", label: "Heading" }, { key: "lms_description", label: "Introduction", area: true }] },
  { title: "Reviews", fields: [{ key: "reviews_kicker", label: "Small heading" }, { key: "reviews_title", label: "Heading" }] },
  { title: "FAQ", fields: [{ key: "faq_kicker", label: "Small heading" }, { key: "faq_title", label: "Heading" }] },
  { title: "Contact", fields: [{ key: "contact_kicker", label: "Small heading" }, { key: "contact_title", label: "Heading" }] },
];

export default async function AdminHomepagePage() {
  const [settings, publicContent] = await Promise.all([getSiteSettings(), getPublicSiteContent()]);
  const content = { ...PUBLIC_CONTENT_DEFAULTS, ...publicContent };
  return <div>
    <PageHeading eyebrow="PUBLIC WEBSITE" title="Website editor" />
    <form action={updateHomepageContentAction} className="site-editor-form">
      <input type="hidden" name="hero_description" value={content.hero_description}/><input type="hidden" name="hero_image_url" value={content.hero_image_url}/><input type="hidden" name="programs_description" value={content.programs_description}/><input type="hidden" name="why_description" value={content.why_description}/><input type="hidden" name="reviews_description" value={content.reviews_description}/><input type="hidden" name="faq_description" value={content.faq_description}/>
      <details className="admin-create-panel" open><summary>Hero</summary><div className="admin-form-grid">
        {groups[0].fields.map((field) => <label key={field.key} className={`field ${field.area ? "full" : ""}`}><span>{field.label}</span>{field.area ? <textarea name={field.key} rows={4} defaultValue={content[field.key]} /> : <input name={field.key} defaultValue={content[field.key]} />}</label>)}
      </div></details>
      <details className="admin-create-panel"><summary>About</summary><div className="admin-form-grid">
        {groups[2].fields.map((field) => <label key={field.key} className={`field ${field.area ? "full" : ""}`}><span>{field.label}</span>{field.area ? <textarea name={field.key} rows={4} defaultValue={content[field.key]} /> : <input name={field.key} defaultValue={content[field.key]} />}</label>)}
        <PublicImageField name="about_image_url" label="About image" defaultValue={content.about_image_url} />
      </div></details>
      {groups.filter((_, index) => ![0, 2].includes(index)).map((group) => <details key={group.title} className="admin-create-panel"><summary>{group.title}</summary><div className="admin-form-grid">{group.fields.map((field) => <label key={field.key} className={`field ${field.area ? "full" : ""}`}><span>{field.label}</span>{field.area ? <textarea name={field.key} rows={4} defaultValue={content[field.key]} /> : <input name={field.key} defaultValue={content[field.key]} />}</label>)}</div></details>)}
      <button className="button button-primary sticky-save-button"><Save size={17} />Publish homepage changes</button>
    </form>

    <section className="admin-card settings-section">
      <h2>Contact and payment details</h2>
      <form action={updateSiteSettingsAction} className="admin-form-grid">
        <label className="field"><span>WhatsApp channel URL</span><input name="whatsapp_channel_url" type="url" defaultValue={settings.whatsapp_channel_url || ""} /></label>
        <label className="field"><span>Facebook URL</span><input name="facebook_url" type="url" defaultValue={settings.facebook_url || ""} /></label>
        <label className="field"><span>YouTube URL</span><input name="youtube_url" type="url" defaultValue={settings.youtube_url || ""} /></label>
        <label className="field"><span>Bank</span><input name="bank_name" defaultValue={settings.bank_name || ""} /></label>
        <label className="field"><span>Branch</span><input name="bank_branch" defaultValue={settings.bank_branch || ""} /></label>
        <label className="field"><span>Account holder</span><input name="bank_account_name" defaultValue={settings.bank_account_name || ""} /></label>
        <label className="field"><span>Account number</span><input name="bank_account_number" defaultValue={settings.bank_account_number || ""} /></label>
        <button className="button button-primary"><Save size={17} />Save details</button>
      </form>
    </section>
  </div>;
}
