import type { Metadata } from "next";
import { PublicLayout } from "@/components/public-layout";

export const metadata: Metadata = { title: "FAQ", description: "Frequently asked questions about Smart ICT and the LMS." };
const faqs = [
  ["Who can create a Smart ICT LMS account?", "Any student can register using a valid Sri Lankan mobile number and password. Free resources can be accessed after registration."],
  ["Why does my account show as pending?", "Every new account is reviewed manually. Pending users can still use free content, but paid and exclusive content remains locked until verification."],
  ["How do paid monthly modules unlock?", "Send the payment receipt through WhatsApp. Once the administrator marks the relevant month as paid, content for your program and batch becomes available."],
  ["Are Sinhala and English Medium supported?", "Yes. Programs, resources and assessments can be prepared for Sinhala Medium, English Medium or both."],
  ["Can one quiz be shared with multiple programs?", "Yes. An assessment can belong to one primary program and still be assigned to additional programs, batches or individual students."],
  ["Are all examinations online?", "No. Online assessments run inside the LMS, while marks from physical papers and school examinations can also be uploaded and shown in analytics."],
  ["Can I change my registration details?", "Registration details are locked to protect student records. A missing NIC can be added once; other corrections must be requested through support."],
  ["Is this platform only for O/L classes?", "No. The system is designed to support dynamically added O/L, A/L and future ICT programs."],
];
export default function FaqPage() { return <PublicLayout><main className="public-page inner-public-page"><section className="inner-hero"><div className="site-shell"><span className="section-kicker">FREQUENTLY ASKED QUESTIONS</span><h1>Everything important, answered clearly.</h1><p>Account access, payments, programs, resources and assessments.</p></div></section><section className="section"><div className="site-shell faq-page-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}</summary><p>{answer}</p></details>)}</div></section></main></PublicLayout>; }
