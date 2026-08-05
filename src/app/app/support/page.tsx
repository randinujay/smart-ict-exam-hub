import { MessageCircle } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { SupportForm } from "@/components/support-form";
import { BRAND } from "@/lib/config";

export default function SupportPage() {
  return <div><PageHeading eyebrow="HELP" title="Support" description="Send a support request or contact us on WhatsApp."/><section className="support-page-grid support-page-simple"><article className="dashboard-card support-request-card"><SupportForm/></article><aside className="whatsapp-support-card support-whatsapp-action"><MessageCircle size={28}/><h2>WhatsApp</h2><a href={BRAND.socials.whatsapp} target="_blank" rel="noopener noreferrer" className="button button-light button-full">Message {BRAND.phoneDisplay}</a></aside></section></div>;
}
