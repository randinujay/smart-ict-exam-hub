import { Landmark, MessageCircle, WalletCards } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { BRAND } from "@/lib/config";
import { getSiteSettings, getStudentDashboardData } from "@/lib/data";

export default async function PaymentsPage() {
  const [data, settings] = await Promise.all([getStudentDashboardData(), getSiteSettings()]);
  const bank = { name: settings.bank_name || "Not published", branch: settings.bank_branch || "Not published", accountName: settings.bank_account_name || "Randinu Jayaratne", accountNumber: settings.bank_account_number || "Not published" };
  return <div><PageHeading eyebrow="MONTHLY ACCESS" title="Payments" />
    <section className="payment-page-grid"><article className="bank-details-card"><div className="bank-card-header"><span><Landmark size={25} /></span><h2>{bank.name}</h2></div><div className="bank-details-list"><span><small>Account holder</small><strong>{bank.accountName}</strong></span><span><small>Account number</small><strong>{bank.accountNumber}</strong></span><span><small>Branch</small><strong>{bank.branch}</strong></span></div><a href={BRAND.socials.whatsapp} target="_blank" rel="noreferrer" className="button button-light button-full"><MessageCircle size={18} />Send receipt on WhatsApp</a></article>
      <article className="payment-process-card"><h2>How access is confirmed</h2><div className="payment-steps"><span><b>1</b><strong>Make the bank transfer</strong></span><span><b>2</b><strong>Send the receipt on WhatsApp</strong></span><span><b>3</b><strong>Access is enabled after review</strong></span></div></article>
    </section>
    <section className="results-table-card admin-table-card">{data.payments.length ? <div className="responsive-table"><table><thead><tr><th>Month</th><th>Program</th><th>Amount</th><th>Status</th><th>Confirmed</th></tr></thead><tbody>{data.payments.map((payment) => { const program = data.programs.find((item) => item.id === payment.programId); return <tr key={payment.id}><td><strong>{new Date(payment.billingMonth).toLocaleDateString("en-LK", { month: "long", year: "numeric" })}</strong></td><td>{program?.shortName ?? "Smart ICT"}</td><td>LKR {payment.amount.toLocaleString()}</td><td><StatusBadge tone={payment.status === "paid" || payment.status === "waived" ? "success" : "warning"}>{payment.status}</StatusBadge></td><td>{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td></tr>; })}</tbody></table></div> : <div className="empty-state"><WalletCards size={24} /><strong>No payment history yet.</strong></div>}</section>
  </div>;
}
