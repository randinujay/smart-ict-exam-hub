import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Randinu Jayaratne | Smart ICT",
    template: "%s | Smart ICT",
  },
  description: "The official Smart ICT tuition and learning platform by Randinu Jayaratne.",
  applicationName: "Smart ICT LMS",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Randinu Jayaratne | Smart ICT",
    description: "Learn ICT clearly, practise intelligently and track real progress through the Smart ICT LMS.",
    type: "website",
    images: ["/rapid-revision-poster.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
