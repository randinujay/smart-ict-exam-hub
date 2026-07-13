export const BRAND = {
  name: "Randinu Jayaratne",
  product: "Smart ICT",
  fullName: "Randinu Jayaratne | Smart ICT",
  lmsName: "Smart ICT LMS",
  phoneDisplay: "076 770 8978",
  phoneInternational: "94767708978",
  email: "randinujayaratne15@gmail.com",
  location: "Minuwangoda, Sri Lanka",
  qualifications: ["Dip. in Law (Reading)", "Expecting University Entrance"],
  socials: {
    whatsapp: "https://wa.me/94767708978",
    whatsappChannel: process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || null,
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || null,
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || null,
  },
};

export const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/#programs" },
  { label: "About", href: "/#about" },
  { label: "Smart ICT LMS", href: "/#smart-lms" },
  { label: "Reviews", href: "/#reviews" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

export const STUDENT_NAV = [
  { label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard" },
  { label: "Modules", href: "/app/modules", icon: "Layers3" },
  { label: "Resources", href: "/app/resources", icon: "Files" },
  { label: "Exams & Quizzes", href: "/app/assessments", icon: "ClipboardCheck" },
  { label: "Results", href: "/app/results", icon: "ChartNoAxesCombined" },
  { label: "Payments", href: "/app/payments", icon: "Landmark" },
  { label: "Profile", href: "/app/profile", icon: "UserRound" },
  { label: "Support", href: "/app/support", icon: "LifeBuoy" },
];

export const ADMIN_NAV = [
  { label: "Dashboard", href: "/adminrandinu/dashboard", icon: "LayoutDashboard" },
  { label: "Programs", href: "/adminrandinu/programs", icon: "GraduationCap" },
  { label: "Batches", href: "/adminrandinu/batches", icon: "UsersRound" },
  { label: "Students", href: "/adminrandinu/students", icon: "UserRoundCheck" },
  { label: "Modules", href: "/adminrandinu/modules", icon: "Layers3" },
  { label: "Recordings", href: "/adminrandinu/recordings", icon: "Video" },
  { label: "Resources", href: "/adminrandinu/resources", icon: "Files" },
  { label: "Exams & Quizzes", href: "/adminrandinu/assessments", icon: "ClipboardCheck" },
  { label: "Results", href: "/adminrandinu/results", icon: "ChartNoAxesCombined" },
  { label: "Payments", href: "/adminrandinu/payments", icon: "BadgeDollarSign" },
  { label: "Testimonials", href: "/adminrandinu/testimonials", icon: "MessageSquareQuote" },
  { label: "Homepage Content", href: "/adminrandinu/homepage", icon: "PanelsTopLeft" },
  { label: "Support Requests", href: "/adminrandinu/support", icon: "LifeBuoy" },
  { label: "Settings", href: "/adminrandinu/settings", icon: "Settings" },
];

export function monthName(month: number) {
  return new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2026, month - 1, 1));
}
