import { Database, KeyRound, Settings, ShieldCheck } from "lucide-react";
import { changeAdminPasswordAction } from "@/app/actions/admin";
import { PageHeading } from "@/components/page-heading";
import { isSupabaseConfigured } from "@/lib/env";

const passwordMessages: Record<string, { tone: "success" | "error"; text: string }> = {
  changed: { tone: "success", text: "Teacher password changed successfully." },
  weak: { tone: "error", text: "Use a new password with at least 10 characters." },
  mismatch: { tone: "error", text: "The new passwords do not match." },
  "invalid-current": { tone: "error", text: "The current password is incorrect." },
  error: { tone: "error", text: "The password could not be changed. Please try again." },
};

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const configured = isSupabaseConfigured();
  const { password } = await searchParams;
  const passwordMessage = password ? passwordMessages[password] : null;

  return (
    <div>
      <PageHeading eyebrow="PLATFORM CONFIGURATION" title="Settings" description="Review production readiness, database connectivity and security-sensitive configuration." />
      <section className="settings-grid">
        <article className="admin-card"><span className="settings-icon"><Database /></span><h2>Supabase connection</h2><p>Authentication, PostgreSQL, Row Level Security and private resource storage.</p><div className={`settings-status ${configured ? "ready" : "warning"}`}><ShieldCheck size={17} />{configured ? "Production database connected" : "Database connection missing"}</div></article>
        <article className="admin-card"><span className="settings-icon"><KeyRound /></span><h2>Student login method</h2><p>Students sign in using their mobile number and password. A private email alias is generated internally for Supabase Auth.</p><div className="settings-status ready"><ShieldCheck size={17} />No public student email required</div></article>
        <article className="admin-card"><span className="settings-icon"><Settings /></span><h2>Access model</h2><p>Pending users can use free content. Paid access requires verification, enrolment and monthly payment—or an explicit admin override.</p><div className="settings-status ready"><ShieldCheck size={17} />Designed for cross-program sharing</div></article>
      </section>

      <section className="admin-card password-settings-card">
        <div><span className="section-kicker">TEACHER SECURITY</span><h2>Change teacher password</h2><p>Replace the initial password after your first login. Use a unique password that is not shared with students.</p></div>
        <form action={changeAdminPasswordAction} className="auth-form">
          <label className="field"><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" minLength={8} required /></label>
          <label className="field"><span>New password</span><input name="newPassword" type="password" autoComplete="new-password" minLength={10} required /></label>
          <label className="field"><span>Confirm new password</span><input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required /></label>
          {passwordMessage && <p className={`form-message ${passwordMessage.tone}`}>{passwordMessage.text}</p>}
          <button className="button button-dark" type="submit"><KeyRound size={17} />Update teacher password</button>
        </form>
      </section>

      <section className="admin-card deployment-checklist">
        <span className="section-kicker">PRODUCTION CHECKLIST</span><h2>Platform status</h2>
        <div>
          <label><input type="checkbox" checked readOnly />Supabase production schema installed</label>
          <label><input type="checkbox" checked={configured} readOnly />Supabase environment variables added in Vercel</label>
          <label><input type="checkbox" checked readOnly />Teacher administration route is private and unlisted</label>
          <label><input type="checkbox" />Publish bank details and social links</label>
          <label><input type="checkbox" />Complete final student acceptance testing</label>
        </div>
      </section>
    </div>
  );
}
