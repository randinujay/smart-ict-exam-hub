import Link from "next/link";
import { BRAND, PUBLIC_NAV } from "@/lib/config";
import { Logo } from "@/components/logo";
import { SocialIcon } from "@/components/social-icon";
import { getSiteSettings } from "@/lib/data";

export async function PublicFooter() {
  const settings = await getSiteSettings();
  const socialItems = [
    { label: "WhatsApp", href: BRAND.socials.whatsapp, icon: "whatsapp" as const },
    { label: "WhatsApp Channel", href: settings.whatsapp_channel_url || BRAND.socials.whatsappChannel, icon: "whatsapp-channel" as const },
    { label: "Facebook", href: settings.facebook_url || BRAND.socials.facebook, icon: "facebook" as const },
    { label: "YouTube", href: settings.youtube_url || BRAND.socials.youtube, icon: "youtube" as const },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="public-footer">
      <div className="site-shell footer-grid">
        <div className="footer-brand">
          <Logo inverse />
          <div className="footer-socials">
            {socialItems.map(({ label, href, icon }) => (
              <a key={label} href={href ?? undefined} target="_blank" rel="noopener noreferrer" aria-label={`Open Smart ICT on ${label}`} title={label}>
                <SocialIcon name={icon} width={18} height={18} />
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
