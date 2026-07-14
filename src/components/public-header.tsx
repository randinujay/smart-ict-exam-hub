"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { PUBLIC_NAV } from "@/lib/config";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(pathname === "/" ? "home" : "");

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const sectionIds = PUBLIC_NAV.map((item) => item.sectionId);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;

    const updateFromPosition = () => {
      const marker = 112;
      const current = [...sections].reverse().find((section) => section.getBoundingClientRect().top <= marker);
      setActiveSection(current?.id ?? sections[0].id);
    };

    const observer = new IntersectionObserver(updateFromPosition, {
      rootMargin: "-92px 0px -55% 0px",
      threshold: [0, 0.15, 0.4],
    });
    sections.forEach((section) => observer.observe(section));
    window.addEventListener("hashchange", updateFromPosition);
    const frame = window.requestAnimationFrame(updateFromPosition);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("hashchange", updateFromPosition);
    };
  }, [pathname]);

  return (
    <header className="public-header">
      <div className="site-shell public-header-inner">
        <Logo />
        <nav className={`public-nav ${open ? "is-open" : ""}`} aria-label="Public navigation">
          {PUBLIC_NAV.map((item) => {
            const active = pathname === "/" && activeSection === item.sectionId;
            return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : ""}
              aria-current={active ? "location" : undefined}
              onClick={() => {
                setActiveSection(item.sectionId);
                setOpen(false);
              }}
            >
              {item.label}
            </Link>
          )})}
          <Link href="/login" className="button button-primary nav-login" onClick={() => setOpen(false)}>
            Student Login
          </Link>
        </nav>
        <button className="mobile-menu-button" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
