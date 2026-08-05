import { Database, KeyRound, Settings, ShieldCheck } from "lucide-react";
import { changeAdminPasswordAction } from "@/app/actions/admin";
import { PageHeading } from "@/components/page-heading";
import { PasswordInput } from "@/components/password-input";
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

  return <div><PageHeading eyebrow="PLATFORM CONFIGURATION" title="Settings"/><section className="settings-grid"><article className="admin-card"><span className="settings-icon"><Database/></span><h2>Supabase</h2><div className={`settings-status ${configured ? "ready" : "warning"}`}><ShieldCheck size={17}/>{configured ? "Connected" : "Connection missing"}</div></article><article className="admin-card"><span className="settings-icon"><KeyRound/></span><h2>Student login</h2><div className="settings-status ready"><ShieldCheck size={17}/>Mobile number + password</div></article><article className="admin-card"><span className="settings-icon"><Settings/></span><h2>Paid access</h2><div className="settings-status ready"><ShieldCheck size={17}/>Verification + enrolment + payment</div></article></section><section className="admin-card password-settings-card"><div><span className="section-kicker">TEACHER SECURITY</span><h2>Change teacher password</h2></div><form action={changeAdminPasswordAction} className="auth-form"><PasswordInput name="currentPassword" label="Current password" autoComplete="current-password" minLength={8} required/><PasswordInput name="newPassword" label="New password" autoComplete="new-password" minLength={10} required/><PasswordInput name="confirmPassword" label="Confirm new password" autoComplete="new-password" minLength={10} required/>{passwordMessage && <p className={`form-message ${passwordMessage.tone}`} role="status">{passwordMessage.text}</p>}<button className="button button-dark" type="submit"><KeyRound size={17}/>Update password</button></form></section><section className="admin-card deployment-checklist"><span className="section-kicker">PRODUCTION CHECKLIST</span><h2>Platform status</h2><div><label><input type="checkbox" checked readOnly/>Supabase schema installed</label><label><input type="checkbox" checked={configured} readOnly/>Vercel environment connected</label><label><input type="checkbox" checked readOnly/>Private admin route</label><label><input type="checkbox"/>Publish bank details and social links</label><label><input type="checkbox"/>Complete student acceptance testing</label></div></section></div>;
}
