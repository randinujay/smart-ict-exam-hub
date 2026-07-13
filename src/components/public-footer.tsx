import Link from "next/link";
import { MessageCircle, PlayCircle, Users } from "lucide-react";
import { BRAND, PUBLIC_NAV } from "@/lib/config";
import { Logo } from "@/components/logo";
import { getSiteSettings } from "@/lib/data";

export async function PublicFooter() {
  const settings = await getSiteSettings();
  const socialItems = [
    { label: "WhatsApp", href: BRAND.socials.whatsapp, icon: MessageCircle },
    { label: "WhatsApp Channel", href: settings.whatsapp_channel_url || BRAND.socials.whatsappChannel, icon: MessageCircle },
    { label: "Facebook", href: settings.facebook_url || BRAND.socials.facebook, icon: Users },
    { label: "YouTube", href: settings.youtube_url || BRAND.socials.youtube, icon: PlayCircle },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="public-footer">
      <div className="site-shell footer-grid">
        <div className="footer-brand">
          <Logo inverse />
          <p>A modern learning and examination platform built around clear teaching, smart practice and measurable progress.</p>
          <div className="footer-socials">
            {socialItems.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href ?? "#"} target="_blank" rel="noreferrer" aria-label={label} title={label}>
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3>Explore</h3>
          <div className="footer-links">
            {PUBLIC_NAV.slice(0, 6).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </div>
        </div>
        <div>
          <h3>Student</h3>
          <div className="footer-links">
            <Link href="/login">Student Login</Link>
            <Link href="/register">Create Account</Link>
            <Link href="/smart-lms">Explore the LMS</Link>
            <Link href="/contact">Get Support</Link>
          </div>
        </div>
        <div>
          <h3>Contact</h3>
          <div className="footer-contact">
            <a href={BRAND.socials.whatsapp} target="_blank" rel="noreferrer">{BRAND.phoneDisplay}</a>
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            <span>{BRAND.location}</span>
          </div>
        </div>
      </div>
      <div className="site-shell footer-bottom">
        <span>© {new Date().getFullYear()} {BRAND.fullName}. All rights reserved.</span>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
    </footer>
  );
}
